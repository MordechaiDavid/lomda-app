import { describe, it, expect } from 'vitest';
import { hydrateAiSteps } from './utils';
import type { QuizBlock } from '../../types/course';

describe('hydrateAiSteps', () => {
  it('maps a quiz block so correctOptionId matches the option flagged isCorrect', () => {
    const steps = hydrateAiSteps([
      {
        title: 'שלב בדיקה',
        blocks: [
          {
            type: 'quiz',
            questions: [
              {
                text: 'מהי הבירה של צרפת?',
                type: 'multiple_choice',
                options: [
                  { text: 'לונדון', isCorrect: false },
                  { text: 'פריז', isCorrect: true },
                  { text: 'רומא', isCorrect: false }
                ]
              }
            ]
          }
        ]
      }
    ]);

    expect(steps).toHaveLength(1);
    const quiz = steps[0].blocks[0] as QuizBlock;
    expect(quiz.type).toBe('quiz');
    const q = quiz.questions[0];
    const correct = q.options.find((o) => o.id === q.correctOptionId);
    expect(correct?.text).toBe('פריז');
  });

  it('assigns unique ids across steps, blocks, questions, and options', () => {
    const steps = hydrateAiSteps([
      {
        title: 'א',
        blocks: [
          { type: 'heading', text: 'כותרת', level: 1 },
          {
            type: 'quiz',
            questions: [
              { text: 'ש1', options: [{ text: 'א', isCorrect: true }, { text: 'ב', isCorrect: false }] }
            ]
          }
        ]
      },
      { title: 'ב', blocks: [{ type: 'text', html: '<p>שלום</p>' }] }
    ]);

    const ids: string[] = [];
    for (const s of steps) {
      ids.push(s.id);
      for (const b of s.blocks) {
        ids.push(b.id);
        if (b.type === 'quiz') {
          for (const q of b.questions) {
            ids.push(q.id);
            for (const o of q.options) ids.push(o.id);
          }
        }
      }
    }
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('skips unknown block types and defaults a quiz with no correct flag to the first option', () => {
    const steps = hydrateAiSteps([
      {
        title: 'בדיקה',
        blocks: [
          { type: 'bogus' as unknown as string },
          {
            type: 'quiz',
            questions: [{ text: 'ש', options: [{ text: 'ראשון' }, { text: 'שני' }] }]
          }
        ]
      }
    ]);

    expect(steps[0].blocks).toHaveLength(1); // bogus dropped
    const quiz = steps[0].blocks[0] as QuizBlock;
    expect(quiz.questions[0].correctOptionId).toBe(quiz.questions[0].options[0].id);
  });
});
