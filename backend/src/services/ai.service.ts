import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config/index.js';
import { ApiError, ValidationError } from '../middleware/error.handler.js';

// ── Types exchanged with the frontend ────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/** Lean, id-less block as produced by the model. The frontend hydrates this into
 *  a real ContentBlock (assigning ids/order) via hydrateAiSteps(). */
export interface AiBlock {
  type: 'heading' | 'text' | 'image' | 'video' | 'quiz' | 'divider';
  // heading
  level?: 1 | 2 | 3;
  text?: string;
  align?: 'left' | 'center' | 'right';
  // text
  html?: string;
  // image / video share url + caption
  url?: string;
  alt?: string;
  caption?: string;
  width?: 'full' | 'large' | 'medium';
  provider?: 'youtube' | 'vimeo' | 'upload';
  requiredWatchPercent?: number;
  // quiz
  questions?: AiQuizQuestion[];
  // divider
  style?: 'solid' | 'dashed' | 'dotted';
}

export interface AiQuizQuestion {
  text: string;
  type?: 'multiple_choice' | 'true_false';
  options: { text: string; isCorrect: boolean }[];
  explanation?: string;
}

export interface AiStep {
  title: string;
  blocks: AiBlock[];
}

export interface LomdaProposal {
  mode: 'replace' | 'append';
  summary: string;
  steps: AiStep[];
}

export interface LomdaTurnResult {
  reply: string;
  proposal: LomdaProposal | null;
}

// ── System prompt (stable → cached) ───────────────────────────────────────────
// Kept byte-stable across requests so prompt caching can kick in. Anything
// per-request (the current builder state) is injected into the messages instead.

const SYSTEM_PROMPT = `אתה עוזר ליצירת "לומדות" (מודולי למידה) במערכת LMS בעברית. המשתמש הוא מדריך/מנהל הדרכה.

לומדה בנויה משלבים (steps). כל שלב הוא "שקופית" עם כותרת ורשימת רכיבים (blocks). סוגי הרכיבים:
- heading: כותרת. שדות: level (1/2/3), text, align (כברירת מחדל 'right' כי הממשק בעברית RTL).
- text: פסקת טקסט. שדה html — HTML פשוט (<p>, <strong>, <ul>/<li>). אל תכלול תגיות script/style.
- image: תמונה. שדות: url, alt, caption, width ('full'/'large'/'medium').
- video: וידאו. שדות: url, provider ('youtube'/'vimeo'/'upload'), caption, requiredWatchPercent (0-100, ברירת מחדל 90).
- quiz: שאלון. שדה questions — מערך שאלות. כל שאלה: text, type ('multiple_choice'/'true_false'),
  options (מערך של {text, isCorrect}), ו-explanation אופציונלי. סמן בדיוק אפשרות אחת נכונה לכל שאלה.
- divider: קו מפריד. שדה style ('solid'/'dashed'/'dotted').

הנחיות:
- כל התוכן שאתה מחבר חייב להיות בעברית, ברור ומקצועי.
- העדף כמה שלבים קצרים על פני שלב אחד ארוך. בדרך כלל 2-5 רכיבים לכל שלב.
- כשהמשתמש מבקש לבנות/ליצור לומדה מלאה, השתמש ב-mode "replace".
- כשהמשתמש מבקש להוסיף/להרחיב על לומדה קיימת, השתמש ב-mode "append" והחזר רק את השלבים החדשים.
- לסיום לומדה רצוי לכלול שלב עם שאלון (quiz) לבדיקת הבנה.
- כדי להחזיר מבנה לומדה — קרא לכלי propose_lomda. אם המשתמש רק שואל שאלה כללית (בלי בקשה לייצר תוכן) — ענה בטקסט בלבד, בלי לקרוא לכלי.
- אל תמציא קישורי תמונה/וידאו אמיתיים; השאר url ריק אם אין כתובת אמיתית, והמשתמש ימלא אותו בעצמו.`;

// ── Tool (forced structured output) ───────────────────────────────────────────

const PROPOSE_TOOL: Anthropic.Tool = {
  name: 'propose_lomda',
  description:
    'מחזיר הצעת מבנה לומדה (שלבים ורכיבים) שתיכנס לעורך הויזואלי. השתמש בכלי זה בכל פעם שצריך לייצר או לעדכן תוכן לומדה.',
  input_schema: {
    type: 'object',
    properties: {
      mode: {
        type: 'string',
        enum: ['replace', 'append'],
        description: "replace = להחליף את כל הלומדה; append = להוסיף את השלבים החדשים לקיימים"
      },
      summary: { type: 'string', description: 'משפט אחד בעברית שמסכם מה נוצר/השתנה' },
      steps: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            blocks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string', enum: ['heading', 'text', 'image', 'video', 'quiz', 'divider'] },
                  level: { type: 'integer', enum: [1, 2, 3] },
                  text: { type: 'string' },
                  align: { type: 'string', enum: ['left', 'center', 'right'] },
                  html: { type: 'string' },
                  url: { type: 'string' },
                  alt: { type: 'string' },
                  caption: { type: 'string' },
                  width: { type: 'string', enum: ['full', 'large', 'medium'] },
                  provider: { type: 'string', enum: ['youtube', 'vimeo', 'upload'] },
                  requiredWatchPercent: { type: 'number' },
                  style: { type: 'string', enum: ['solid', 'dashed', 'dotted'] },
                  questions: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        text: { type: 'string' },
                        type: { type: 'string', enum: ['multiple_choice', 'true_false'] },
                        explanation: { type: 'string' },
                        options: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              text: { type: 'string' },
                              isCorrect: { type: 'boolean' }
                            },
                            required: ['text', 'isCorrect']
                          }
                        }
                      },
                      required: ['text', 'options']
                    }
                  }
                },
                required: ['type']
              }
            }
          },
          required: ['title', 'blocks']
        }
      }
    },
    required: ['mode', 'summary', 'steps']
  }
};

// ── Client (lazy, so a missing key fails per-request, not at boot) ─────────────

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!config.ai.anthropicApiKey) {
    throw new ValidationError(
      'AI is not configured. Set ANTHROPIC_API_KEY in the backend environment to use the lomda assistant.'
    );
  }
  if (!client) {
    client = new Anthropic({ apiKey: config.ai.anthropicApiKey });
  }
  return client;
}

const MAX_HISTORY = 20;

/**
 * Run one chat turn: send the conversation + current builder state to Claude and
 * return its text reply plus an optional structured lomda proposal.
 */
export async function generateLomdaTurn(params: {
  messages: ChatMessage[];
  currentSteps: unknown[];
}): Promise<LomdaTurnResult> {
  const anthropic = getClient();

  const history = params.messages
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-MAX_HISTORY);

  if (history.length === 0 || history[history.length - 1].role !== 'user') {
    throw new ValidationError('The last message must be from the user.');
  }

  // Inject the current builder state into the final user turn so iterative edits
  // have full context — kept out of the (cached) system prompt because it varies.
  const apiMessages: Anthropic.MessageParam[] = history.map((m) => ({
    role: m.role,
    content: m.content
  }));

  const stateJson = JSON.stringify(params.currentSteps ?? []);
  const last = apiMessages[apiMessages.length - 1];
  last.content =
    `<current_lomda>\n${stateJson}\n</current_lomda>\n\n` +
    `(המבנה הנוכחי של הלומדה למעלה — קח אותו בחשבון לעריכות. בקשת המשתמש:)\n` +
    (typeof last.content === 'string' ? last.content : '');

  let response: Anthropic.Message;
  try {
    response = await anthropic.messages.create({
      model: config.ai.model,
      max_tokens: config.ai.maxTokens,
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      tools: [PROPOSE_TOOL],
      tool_choice: { type: 'auto' },
      messages: apiMessages
    });
  } catch (err) {
    if (err instanceof Anthropic.APIError) {
      throw new ApiError(502, 'AI_UPSTREAM_ERROR', `AI request failed: ${err.message}`);
    }
    throw err;
  }

  let reply = '';
  let proposal: LomdaProposal | null = null;

  for (const block of response.content) {
    if (block.type === 'text') {
      reply += block.text;
    } else if (block.type === 'tool_use' && block.name === 'propose_lomda') {
      proposal = normalizeProposal(block.input);
    }
  }

  if (!reply.trim()) {
    reply = proposal ? proposal.summary : 'לא הצלחתי להפיק תוכן. נסה לנסח את הבקשה מחדש.';
  }

  return { reply: reply.trim(), proposal };
}

/** Defensive normalization of the tool input — never trust the shape blindly. */
function normalizeProposal(input: unknown): LomdaProposal | null {
  if (!input || typeof input !== 'object') return null;
  const obj = input as Record<string, unknown>;
  const steps = Array.isArray(obj.steps) ? (obj.steps as AiStep[]) : [];
  if (steps.length === 0) return null;
  return {
    mode: obj.mode === 'append' ? 'append' : 'replace',
    summary: typeof obj.summary === 'string' ? obj.summary : 'הוצע מבנה לומדה.',
    steps
  };
}
