import { query, pool } from '../src/db/index.js';

// Fixed UUIDs so the seed is idempotent
const TEACHER_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const COURSE_1_ID = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const COURSE_2_ID = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12';

// bcrypt hash of "password123"
const TEACHER_PASSWORD_HASH = '$2a$10$y1/97jtwomJ1l8KzWuwnUeuYhGdvFR.59LAbHIidJH2QRwNvtpUrm';

const courses = [
  {
    id: COURSE_1_ID,
    title: 'Introduction to Compliance',
    description: 'Learn the basics of corporate compliance, policies, and safe practices.',
    content: [
      { id: 'content-1', type: 'heading', content: 'Welcome to Compliance', order: 1 },
      {
        id: 'content-2',
        type: 'text',
        content: 'This course covers key compliance principles every employee should know.',
        order: 2
      },
      {
        id: 'content-3',
        type: 'image',
        content:
          'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80',
        order: 3
      }
    ],
    quizzes: [
      {
        id: 'quiz-1',
        courseId: COURSE_1_ID,
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
    id: COURSE_2_ID,
    title: 'Data Privacy Essentials',
    description:
      'Understand privacy rules, GDPR fundamentals, and how to secure sensitive information.',
    content: [
      { id: 'content-4', type: 'heading', content: 'Data Privacy Matters', order: 1 },
      {
        id: 'content-5',
        type: 'text',
        content:
          'Employees must understand how to handle personal and corporate information safely.',
        order: 2
      }
    ],
    quizzes: [
      {
        id: 'quiz-2',
        courseId: COURSE_2_ID,
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

async function seed() {
  console.log('Seeding database...');

  await query(
    `INSERT INTO users (id, email, password, role, name)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (email) DO NOTHING`,
    [TEACHER_ID, 'teacher@lms.com', TEACHER_PASSWORD_HASH, 'teacher', 'Lomda Teacher']
  );
  console.log('✓ users seeded');

  for (const course of courses) {
    await query(
      `INSERT INTO courses (id, title, description, content, quizzes)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO NOTHING`,
      [
        course.id,
        course.title,
        course.description,
        JSON.stringify(course.content),
        JSON.stringify(course.quizzes)
      ]
    );
  }
  console.log('✓ courses seeded');

  await pool.end();
  console.log('Seeding complete.');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
