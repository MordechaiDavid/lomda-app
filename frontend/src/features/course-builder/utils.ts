export function randomId(): string {
  return Math.random().toString(36).slice(2, 10);
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
