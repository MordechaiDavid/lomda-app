'use client';

import { useState, useRef, useEffect } from 'react';
import type { CourseStep } from '../../types/course';
import { apiService } from '../../lib/apiService';

export type ApplyMode = 'replace' | 'append';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface Proposal {
  mode: ApplyMode;
  summary: string;
  steps: unknown[];
}

interface Props {
  currentSteps: CourseStep[];
  onApplyProposal: (rawSteps: unknown[], mode: ApplyMode) => void;
  onClose: () => void;
}

const SUGGESTIONS = [
  'צור לומדה על בטיחות אש עם 3 שלבים ושאלון בסוף',
  'הוסף שלב על מטפי כיבוי',
  'צור לומדה על אבטחת מידע והגנה מפני פישינג'
];

export function AiChatPanel({ currentSteps, onApplyProposal, onClose }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading, proposal]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: trimmed }];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);
    setError('');
    setProposal(null);

    try {
      const res = await apiService.lomdaChat(nextMessages, currentSteps);
      const data = res.data.data as { reply: string; proposal: Proposal | null };
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      if (data.proposal) setProposal(data.proposal);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { error?: { message?: string } } } };
      setError(apiErr.response?.data?.error?.message || 'אירעה שגיאה בפנייה לעוזר ה-AI.');
    } finally {
      setLoading(false);
    }
  };

  const apply = (mode: ApplyMode) => {
    if (!proposal) return;
    onApplyProposal(proposal.steps, mode);
    setProposal(null);
    setMessages((prev) => [
      ...prev,
      { role: 'assistant', content: mode === 'replace' ? 'הוחל על הלומדה ✓' : 'נוסף ללומדה ✓' }
    ]);
  };

  const stepCount = proposal?.steps.length ?? 0;
  const blockCount = (proposal?.steps ?? []).reduce<number>((n, s) => {
    const blocks = (s as { blocks?: unknown[] }).blocks;
    return n + (Array.isArray(blocks) ? blocks.length : 0);
  }, 0);

  return (
    <aside className="w-80 flex-shrink-0 bg-gray-50 border-r border-gray-200 flex flex-col overflow-hidden" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg">✨</span>
          <h2 className="text-sm font-semibold text-gray-800">עוזר AI</h2>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none" title="סגור">
          ✕
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-xs text-gray-500 space-y-2">
            <p>תאר במילים שלך את הלומדה שתרצה לבנות, ואני אכין הצעה שתיכנס לעורך.</p>
            <div className="space-y-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="block w-full text-right px-3 py-2 rounded-lg bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-600 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
            <div
              className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-sm'
                  : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-end">
            <div className="px-3 py-2 rounded-2xl bg-white border border-gray-200 text-gray-400 text-sm">
              חושב…
            </div>
          </div>
        )}

        {error && (
          <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs">{error}</div>
        )}

        {/* Proposal card */}
        {proposal && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 space-y-2">
            <p className="text-sm font-medium text-blue-900">{proposal.summary}</p>
            <p className="text-xs text-blue-700">
              {stepCount} שלבים · {blockCount} רכיבים
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <button
                onClick={() => apply('replace')}
                className="px-3 py-1.5 text-xs rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                החלף הכל
              </button>
              <button
                onClick={() => apply('append')}
                className="px-3 py-1.5 text-xs rounded-lg border border-blue-300 text-blue-700 hover:bg-blue-100 transition-colors"
              >
                הוסף ללומדה
              </button>
              <button
                onClick={() => setProposal(null)}
                className="px-3 py-1.5 text-xs rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
              >
                בטל
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="p-3 border-t border-gray-200 bg-white flex-shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            rows={2}
            placeholder="כתוב הודעה… (Enter לשליחה)"
            disabled={loading}
            className="flex-1 resize-none text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-400 disabled:opacity-50"
          />
          <button
            onClick={() => send(input)}
            disabled={loading || !input.trim()}
            className="px-3 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 transition-colors flex-shrink-0"
          >
            שלח
          </button>
        </div>
      </div>
    </aside>
  );
}
