import type { CourseStep, ContentBlock } from '../../types/course';

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
