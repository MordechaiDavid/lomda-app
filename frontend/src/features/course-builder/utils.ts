import type { CourseStep, ContentBlock, BlockType, QuizQuestion } from '../../types/course';

export function randomId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function createDefaultStep(order: number): CourseStep {
  return { id: randomId(), title: `שלב ${order + 1}`, order, blocks: [] };
}

/**
 * Backward-compatible conversion: old flat ContentBlock[] → CourseStep[].
 * New courses already store CourseStep[]; old ones stored flat blocks.
 */
export function normalizeToSteps(content: unknown[]): CourseStep[] {
  if (!content || content.length === 0) return [createDefaultStep(0)];
  const first = content[0] as Record<string, unknown>;
  if ('blocks' in first && Array.isArray(first.blocks)) {
    // Already steps format
    return (content as CourseStep[]).map((s, i) => ({ ...s, order: i }));
  }
  // Old flat format: wrap everything in a single step
  return [{ id: randomId(), title: 'שלב 1', order: 0, blocks: content as ContentBlock[] }];
}

export function createDefaultBlock(type: import('../../types/course').BlockType): import('../../types/course').ContentBlock {
  const base = { id: randomId(), order: 0 };
  switch (type) {
    case 'heading':  return { ...base, type: 'heading', level: 2, text: '', align: 'right' };
    case 'text':     return { ...base, type: 'text', html: '' };
    case 'image':    return { ...base, type: 'image', url: '', width: 'full' };
    case 'video':    return { ...base, type: 'video', url: '', provider: 'youtube', requiredWatchPercent: 90 };
    case 'quiz':     return {
      ...base, type: 'quiz', passingScore: undefined, maxAttempts: 3, showCorrectAnswers: true,
      questions: [{
        id: randomId(), text: '', type: 'multiple_choice',
        options: [{ id: randomId(), text: '' }, { id: randomId(), text: '' }],
        correctOptionId: ''
      }]
    };
    case 'divider':  return { ...base, type: 'divider', style: 'solid' };
  }
}

// ─── AI proposal hydration ────────────────────────────────────────────────────
// The AI returns "lean" id-less steps/blocks (see backend ai.service.ts). Turn
// them into valid CourseStep[] with fresh ids and correct order, reusing the same
// shapes the manual builder produces. Defensive throughout: a malformed block is
// skipped rather than allowed to crash the builder.

const VALID_BLOCK_TYPES: BlockType[] = ['heading', 'text', 'image', 'video', 'quiz', 'divider'];

interface AiBlock {
  type?: string;
  level?: number;
  text?: string;
  align?: 'left' | 'center' | 'right';
  html?: string;
  url?: string;
  alt?: string;
  caption?: string;
  width?: 'full' | 'large' | 'medium';
  provider?: 'youtube' | 'vimeo' | 'upload';
  requiredWatchPercent?: number;
  style?: 'solid' | 'dashed' | 'dotted';
  questions?: {
    text?: string;
    type?: 'multiple_choice' | 'true_false';
    explanation?: string;
    options?: { text?: string; isCorrect?: boolean }[];
  }[];
}

interface AiStep {
  title?: string;
  blocks?: AiBlock[];
}

function hydrateBlock(raw: AiBlock, order: number): ContentBlock | null {
  const type = raw.type as BlockType;
  if (!VALID_BLOCK_TYPES.includes(type)) return null;

  const block = createDefaultBlock(type);
  block.order = order;

  switch (block.type) {
    case 'heading':
      block.level = raw.level === 1 || raw.level === 3 ? raw.level : 2;
      block.text = raw.text ?? '';
      block.align = raw.align ?? 'right';
      break;
    case 'text':
      block.html = raw.html ?? (raw.text ? `<p>${raw.text}</p>` : '');
      break;
    case 'image':
      block.url = raw.url ?? '';
      if (raw.alt) block.alt = raw.alt;
      if (raw.caption) block.caption = raw.caption;
      block.width = raw.width ?? 'full';
      break;
    case 'video':
      block.url = raw.url ?? '';
      block.provider = raw.provider ?? 'youtube';
      if (raw.caption) block.caption = raw.caption;
      block.requiredWatchPercent =
        typeof raw.requiredWatchPercent === 'number' ? raw.requiredWatchPercent : 90;
      break;
    case 'quiz':
      block.questions = (raw.questions ?? []).map((q): QuizQuestion => {
        const options = (q.options ?? []).map((o) => ({ id: randomId(), text: o.text ?? '' }));
        if (options.length === 0) {
          options.push({ id: randomId(), text: '' }, { id: randomId(), text: '' });
        }
        const correctIdx = (q.options ?? []).findIndex((o) => o.isCorrect);
        return {
          id: randomId(),
          text: q.text ?? '',
          type: q.type === 'true_false' ? 'true_false' : 'multiple_choice',
          options,
          correctOptionId: options[correctIdx >= 0 ? correctIdx : 0].id,
          ...(q.explanation ? { explanation: q.explanation } : {})
        };
      });
      break;
    case 'divider':
      block.style = raw.style ?? 'solid';
      break;
  }

  return block;
}

export function hydrateAiSteps(rawSteps: unknown[]): CourseStep[] {
  if (!Array.isArray(rawSteps)) return [];
  return rawSteps.map((rawStep, i) => {
    const step = (rawStep ?? {}) as AiStep;
    const blocks = (Array.isArray(step.blocks) ? step.blocks : [])
      .map((b, j) => hydrateBlock(b, j))
      .filter((b): b is ContentBlock => b !== null)
      .map((b, j) => ({ ...b, order: j }));
    return { id: randomId(), title: step.title || `שלב ${i + 1}`, order: i, blocks };
  });
}
