export const sampleCourses = [
  {
    id: 'course-1',
    title: 'Introduction to Compliance',
    description: 'Learn the basics of corporate compliance, policies, and safe practices.',
    content: [
      {
        id: 'content-1',
        type: 'heading',
        content: 'Welcome to Compliance',
        order: 1
      },
      {
        id: 'content-2',
        type: 'text',
        content: 'This course covers key compliance principles every employee should know.',
        order: 2
      },
      {
        id: 'content-3',
        type: 'image',
        content: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80',
        order: 3
      }
    ],
    quizzes: [
      {
        id: 'quiz-1',
        courseId: 'course-1',
        question: 'What does compliance help protect?',
        type: 'multiple-choice',
        options: [
          { id: 'opt-1', text: 'Company reputation', order: 1 },
          { id: 'opt-2', text: 'User data only', order: 2 },
          { id: 'opt-3', text: 'Office furniture', order: 3 }
        ],
        correctAnswer: 'Company reputation',
        order: 1
      }
    ]
  },
  {
    id: 'course-2',
    title: 'Data Privacy Essentials',
    description: 'Understand privacy rules, GDPR fundamentals, and how to secure sensitive information.',
    content: [
      {
        id: 'content-4',
        type: 'heading',
        content: 'Data Privacy Matters',
        order: 1
      },
      {
        id: 'content-5',
        type: 'text',
        content: 'Employees must understand how to handle personal and corporate information safely.',
        order: 2
      }
    ],
    quizzes: [
      {
        id: 'quiz-2',
        courseId: 'course-2',
        question: 'Which regulation governs personal data in the EU?',
        type: 'multiple-choice',
        options: [
          { id: 'opt-4', text: 'SOC 2', order: 1 },
          { id: 'opt-5', text: 'GDPR', order: 2 },
          { id: 'opt-6', text: 'HIPAA', order: 3 }
        ],
        correctAnswer: 'GDPR',
        order: 1
      }
    ]
  }
];

export default sampleCourses;
