import { query, pool } from '../src/db/index.js';

// Fixed UUIDs so the seed is idempotent
const ADMIN_ID    = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const EMPLOYEE_ID = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const COURSE_1_ID = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const COURSE_2_ID = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12';

// bcrypt hash of "Admin1234!"
const ADMIN_PASSWORD_HASH = '$2a$10$1eevHUIy1MwphHwo4z6z2u/WB54q2IXISZslrPmIEpeD87EMfPhFW';
// bcrypt hash of "Employee123!"
const EMPLOYEE_PASSWORD_HASH = '$2a$10$qBbgD57ohVPX5uOKDKjoa.0zW0stUUGmYZhW8q3R5n3Ur/ty7SWwy';

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
    `INSERT INTO users (id, email, password, role, name, is_active)
     VALUES ($1, $2, $3, 'admin', 'Lomda Admin', true)
     ON CONFLICT (email) DO NOTHING`,
    [ADMIN_ID, 'admin@lomda.app', ADMIN_PASSWORD_HASH]
  );

  await query(
    `INSERT INTO users (id, email, password, role, name, is_active)
     VALUES ($1, $2, $3, 'employee', 'Test Employee', true)
     ON CONFLICT (email) DO NOTHING`,
    [EMPLOYEE_ID, 'employee@lomda.app', EMPLOYEE_PASSWORD_HASH]
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

  await seedSampleLomdot();

  await pool.end();
  console.log('Seeding complete.');
}

// ── Sample lomdot (new CourseStep format) ────────────────────────────────────
const SEC_HE_ID = 'a1eebc99-9c0b-4ef8-bb6d-6bb9bd380b01';
const SEC_EN_ID = 'a1eebc99-9c0b-4ef8-bb6d-6bb9bd380b02';
const HAR_HE_ID = 'a1eebc99-9c0b-4ef8-bb6d-6bb9bd380b03';
const HAR_EN_ID = 'a1eebc99-9c0b-4ef8-bb6d-6bb9bd380b04';

const sampleLomdot = [
  // ── 1. אבטחת מידע — עברית ─────────────────────────────────────────────────
  {
    id: SEC_HE_ID,
    title: 'אבטחת מידע',
    description: 'לומדה לעובדי הארגון בנושא אבטחת מידע, זיהוי איומי סייבר ושמירה על נכסי הארגון.',
    passing_score: 70,
    content: [
      {
        id: 'sh-s1', title: 'מבוא לאבטחת מידע', order: 0,
        blocks: [
          { id: 'sh-s1-b1', type: 'heading', level: 1, text: 'מבוא לאבטחת מידע', align: 'right', order: 0 },
          { id: 'sh-s1-b2', type: 'text', order: 1,
            html: '<p>אבטחת מידע היא מכלול הפעולות, הנהלים והטכנולוגיות שמטרתן להגן על המידע הארגוני מפני גישה לא מורשית, שימוש לרעה, חשיפה, שינוי, מחיקה או שיבוש.</p><p>כל עובד בארגון הוא שחקן מפתח בשמירה על אבטחת המידע — גם אם אינו איש טכנולוגיה.</p>' }
        ]
      },
      {
        id: 'sh-s2', title: 'איומים נפוצים', order: 1,
        blocks: [
          { id: 'sh-s2-b1', type: 'heading', level: 2, text: 'איומים נפוצים בעולם הסייבר', align: 'right', order: 0 },
          { id: 'sh-s2-b2', type: 'text', order: 1,
            html: '<ul><li><strong>פישינג (Phishing)</strong> — הודעות דואר אלקטרוני או SMS מזויפות שמנסות לגרום לך ללחוץ על קישור זדוני.</li><li><strong>תוכנות כופר (Ransomware)</strong> — תוכנה שמצפינה את קבציך ותובעת תשלום לשחרורם.</li><li><strong>הנדסה חברתית</strong> — ניסיון לגרום לאדם לחשוף מידע רגיש על ידי התחזות.</li><li><strong>סיסמאות חלשות</strong> — שימוש בסיסמאות פשוטות שקל לנחש.</li></ul>' }
        ]
      },
      {
        id: 'sh-s3', title: 'הגנה על מידע אישי', order: 2,
        blocks: [
          { id: 'sh-s3-b1', type: 'heading', level: 2, text: 'כיצד מגנים על מידע?', align: 'right', order: 0 },
          { id: 'sh-s3-b2', type: 'text', order: 1,
            html: '<ul><li><strong>סיסמאות חזקות</strong> — לפחות 12 תווים, שילוב של אותיות, מספרים ותווים מיוחדים.</li><li><strong>אימות דו-שלבי (2FA)</strong> — הוסף שכבת אבטחה נוספת לכל חשבון.</li><li><strong>עדכוני תוכנה</strong> — עדכן מערכת הפעלה ותוכנות באופן קבוע.</li><li><strong>גיבוי נתונים</strong> — גבה קבצים חשובים לאחסון מאובטח.</li></ul>' }
        ]
      },
      {
        id: 'sh-s4', title: 'כללי זהב לעובד', order: 3,
        blocks: [
          { id: 'sh-s4-b1', type: 'heading', level: 2, text: 'כללי הזהב של העובד המודע', align: 'right', order: 0 },
          { id: 'sh-s4-b2', type: 'text', order: 1,
            html: '<ol><li>אל תפתח קישורים ממיילים לא מוכרים.</li><li>נעל את המחשב בכל פעם שאתה עוזב את השולחן.</li><li>אל תכניס התקני USB שאינם שלך.</li><li>דווח לIT על כל חשד לאירוע סייבר — מהר יותר זה טוב יותר.</li><li>אל תשתף סיסמאות עם אף אחד, כולל הבוס שלך.</li></ol>' }
        ]
      },
      {
        id: 'sh-quiz', title: 'שאלון', order: 4,
        blocks: [
          { id: 'sh-qb1', type: 'quiz', order: 0, passingScore: 70,
            questions: [
              { id: 'sh-q1', text: 'מהו פישינג?', type: 'multiple_choice',
                options: [
                  { id: 'sh-q1-a', text: 'ניסיון לגנוב פרטים באמצעות הודעה מזויפת' },
                  { id: 'sh-q1-b', text: 'סוג של וירוס מחשב' },
                  { id: 'sh-q1-c', text: 'תקלת תוכנה נפוצה' }
                ], correctOptionId: 'sh-q1-a' },
              { id: 'sh-q2', text: 'מהי סיסמה חזקה?', type: 'multiple_choice',
                options: [
                  { id: 'sh-q2-a', text: 'שם הילד ושנת הלידה' },
                  { id: 'sh-q2-b', text: 'לפחות 12 תווים עם אותיות, מספרים ותווים מיוחדים' },
                  { id: 'sh-q2-c', text: 'רצף מספרים 1234' }
                ], correctOptionId: 'sh-q2-b' },
              { id: 'sh-q3', text: 'קיבלת מייל חשוד עם קישור — מה עושים?', type: 'multiple_choice',
                options: [
                  { id: 'sh-q3-a', text: 'לוחצים בזהירות' },
                  { id: 'sh-q3-b', text: 'מוחקים ושותקים' },
                  { id: 'sh-q3-c', text: 'לא פותחים ומדווחים לIT' }
                ], correctOptionId: 'sh-q3-c' }
            ] }
        ]
      }
    ]
  },

  // ── 2. Information Security — English ────────────────────────────────────────
  {
    id: SEC_EN_ID,
    title: 'Information Security',
    description: 'A training course for employees on information security, identifying cyber threats, and protecting company assets.',
    passing_score: 70,
    content: [
      {
        id: 'se-s1', title: 'Introduction to Information Security', order: 0,
        blocks: [
          { id: 'se-s1-b1', type: 'heading', level: 1, text: 'Introduction to Information Security', align: 'left', order: 0 },
          { id: 'se-s1-b2', type: 'text', order: 1,
            html: '<p>Information security encompasses the processes, policies, and technologies designed to protect organizational data from unauthorized access, misuse, disclosure, modification, or destruction.</p><p>Every employee plays a key role in keeping information secure — even if you are not in IT.</p>' }
        ]
      },
      {
        id: 'se-s2', title: 'Common Cyber Threats', order: 1,
        blocks: [
          { id: 'se-s2-b1', type: 'heading', level: 2, text: 'Common Cyber Threats', align: 'left', order: 0 },
          { id: 'se-s2-b2', type: 'text', order: 1,
            html: '<ul><li><strong>Phishing</strong> — Fake emails or SMS messages that trick you into clicking a malicious link.</li><li><strong>Ransomware</strong> — Malware that encrypts your files and demands payment.</li><li><strong>Social Engineering</strong> — Manipulating people into revealing sensitive information.</li><li><strong>Weak Passwords</strong> — Simple passwords that are easy to guess or brute-force.</li></ul>' }
        ]
      },
      {
        id: 'se-s3', title: 'Protecting Your Data', order: 2,
        blocks: [
          { id: 'se-s3-b1', type: 'heading', level: 2, text: 'How to Protect Information', align: 'left', order: 0 },
          { id: 'se-s3-b2', type: 'text', order: 1,
            html: '<ul><li><strong>Strong Passwords</strong> — At least 12 characters, mixing letters, numbers, and symbols.</li><li><strong>Two-Factor Authentication (2FA)</strong> — Add an extra layer of security to every account.</li><li><strong>Software Updates</strong> — Keep your OS and applications up to date.</li><li><strong>Data Backups</strong> — Back up important files to secure storage regularly.</li></ul>' }
        ]
      },
      {
        id: 'se-s4', title: 'Golden Rules', order: 3,
        blocks: [
          { id: 'se-s4-b1', type: 'heading', level: 2, text: 'Golden Rules for Every Employee', align: 'left', order: 0 },
          { id: 'se-s4-b2', type: 'text', order: 1,
            html: '<ol><li>Never click links in emails from unknown senders.</li><li>Lock your screen whenever you step away from your desk.</li><li>Do not plug in USB devices you did not receive from IT.</li><li>Report any suspected security incident to IT immediately.</li><li>Never share your password with anyone — including your manager.</li></ol>' }
        ]
      },
      {
        id: 'se-quiz', title: 'Quiz', order: 4,
        blocks: [
          { id: 'se-qb1', type: 'quiz', order: 0, passingScore: 70,
            questions: [
              { id: 'se-q1', text: 'What is phishing?', type: 'multiple_choice',
                options: [
                  { id: 'se-q1-a', text: 'An attempt to steal credentials via a fake message' },
                  { id: 'se-q1-b', text: 'A type of computer virus' },
                  { id: 'se-q1-c', text: 'A common software bug' }
                ], correctOptionId: 'se-q1-a' },
              { id: 'se-q2', text: 'What makes a password strong?', type: 'multiple_choice',
                options: [
                  { id: 'se-q2-a', text: "Your child's name and birth year" },
                  { id: 'se-q2-b', text: 'At least 12 chars with letters, numbers and symbols' },
                  { id: 'se-q2-c', text: 'The sequence 1234' }
                ], correctOptionId: 'se-q2-b' },
              { id: 'se-q3', text: 'You receive a suspicious email with a link. What do you do?', type: 'multiple_choice',
                options: [
                  { id: 'se-q3-a', text: 'Click it carefully' },
                  { id: 'se-q3-b', text: 'Delete it and stay silent' },
                  { id: 'se-q3-c', text: "Don't open it and report to IT" }
                ], correctOptionId: 'se-q3-c' }
            ] }
        ]
      }
    ]
  },

  // ── 3. מניעת הטרדה מינית — עברית ─────────────────────────────────────────────
  {
    id: HAR_HE_ID,
    title: 'מניעת הטרדה מינית במקום העבודה',
    description: 'לומדה לעובדים ומנהלים בנושא מניעת הטרדה מינית, זיהוי מצבים פוגעניים ונהלי הגשת תלונה.',
    passing_score: 70,
    content: [
      {
        id: 'hh-s1', title: 'מהי הטרדה מינית?', order: 0,
        blocks: [
          { id: 'hh-s1-b1', type: 'heading', level: 1, text: 'מהי הטרדה מינית?', align: 'right', order: 0 },
          { id: 'hh-s1-b2', type: 'text', order: 1,
            html: '<p>חוק למניעת הטרדה מינית, התשנ"ח–1998, מגדיר הטרדה מינית כהתנהגות בעלת אופי מיני שנעשית ללא הסכמה.</p><p>הטרדה מינית פוגעת בכבוד האדם, בזכויות העובד ובסביבת העבודה כולה. היא אסורה על פי חוק וגוררת אחריות אישית.</p>' }
        ]
      },
      {
        id: 'hh-s2', title: 'סוגי הטרדה', order: 1,
        blocks: [
          { id: 'hh-s2-b1', type: 'heading', level: 2, text: 'סוגי הטרדה מינית', align: 'right', order: 0 },
          { id: 'hh-s2-b2', type: 'text', order: 1,
            html: '<ul><li>הצעות מיניות חוזרות לאחר שהן נדחו.</li><li>הערות, בדיחות או ביטויים בעלי אופי מיני פוגעני.</li><li>מגע פיזי שלא ניתנה לו הסכמה.</li><li>שיתוף חומרים מיניים — תמונות, סרטונים, הודעות.</li><li>הצגת עצמו בפני אדם אחר בצורה מגונה.</li></ul>' }
        ]
      },
      {
        id: 'hh-s3', title: 'מה לעשות אם נפגעת?', order: 2,
        blocks: [
          { id: 'hh-s3-b1', type: 'heading', level: 2, text: 'צעדים לנפגע/ת הטרדה', align: 'right', order: 0 },
          { id: 'hh-s3-b2', type: 'text', order: 1,
            html: '<ol><li><strong>תעד</strong> — רשום תאריכים, שעות ותיאור מה קרה.</li><li><strong>פנה לאחראי/ת</strong> — בכל ארגון חייב להיות אחראי למניעת הטרדה מינית.</li><li><strong>הגש תלונה</strong> — אפשרי לפנות גם למשרד העבודה או לוועדת שוויון הזדמנויות.</li><li><strong>קבל תמיכה</strong> — אין צורך להתמודד לבד. פסיכולוג, עו"ד, גוף תמיכה.</li></ol>' }
        ]
      },
      {
        id: 'hh-s4', title: 'חובת הארגון', order: 3,
        blocks: [
          { id: 'hh-s4-b1', type: 'heading', level: 2, text: 'חובות הארגון לפי החוק', align: 'right', order: 0 },
          { id: 'hh-s4-b2', type: 'text', order: 1,
            html: '<ul><li>פרסום תקנון מניעת הטרדה מינית במקום בולט.</li><li>מינוי אחראי/ת מוסמך/ת לטיפול בתלונות.</li><li>עריכת הדרכות לכלל העובדים.</li><li>בדיקת תלונות בתוך 7 ימים ומתן מענה הולם.</li><li>הגנה על המתלונן מפני פגיעה תעסוקתית.</li></ul>' }
        ]
      },
      {
        id: 'hh-quiz', title: 'שאלון', order: 4,
        blocks: [
          { id: 'hh-qb1', type: 'quiz', order: 0, passingScore: 70,
            questions: [
              { id: 'hh-q1', text: 'האם הצעה מינית חוזרת לאחר שנדחתה נחשבת להטרדה מינית?', type: 'true_false',
                options: [
                  { id: 'hh-q1-a', text: 'כן' },
                  { id: 'hh-q1-b', text: 'לא' }
                ], correctOptionId: 'hh-q1-a' },
              { id: 'hh-q2', text: 'אם הרגשת שהוטרדת מינית, מה הצעד הראשון המומלץ?', type: 'multiple_choice',
                options: [
                  { id: 'hh-q2-a', text: 'לשתוק ולא לדווח כדי לא ליצור בעיות' },
                  { id: 'hh-q2-b', text: 'לתעד את האירוע ולפנות לאחראי/ת' },
                  { id: 'hh-q2-c', text: 'לעזוב את העבודה' }
                ], correctOptionId: 'hh-q2-b' },
              { id: 'hh-q3', text: 'על מי מוטלת האחריות למנוע הטרדה מינית בארגון?', type: 'multiple_choice',
                options: [
                  { id: 'hh-q3-a', text: 'רק על המנהלים' },
                  { id: 'hh-q3-b', text: 'רק על מחלקת משאבי אנוש' },
                  { id: 'hh-q3-c', text: 'על כל עובד ועובדת בארגון' }
                ], correctOptionId: 'hh-q3-c' }
            ] }
        ]
      }
    ]
  },

  // ── 4. Prevention of Sexual Harassment — English ──────────────────────────────
  {
    id: HAR_EN_ID,
    title: 'Prevention of Sexual Harassment in the Workplace',
    description: 'A training course for employees and managers on recognizing, preventing, and reporting sexual harassment.',
    passing_score: 70,
    content: [
      {
        id: 'he-s1', title: 'What Is Sexual Harassment?', order: 0,
        blocks: [
          { id: 'he-s1-b1', type: 'heading', level: 1, text: 'What Is Sexual Harassment?', align: 'left', order: 0 },
          { id: 'he-s1-b2', type: 'text', order: 1,
            html: '<p>Sexual harassment is any unwanted conduct of a sexual nature that violates a person\'s dignity or creates an intimidating, hostile, or offensive work environment.</p><p>It is prohibited by law, can happen to anyone regardless of gender or role, and carries personal legal liability.</p>' }
        ]
      },
      {
        id: 'he-s2', title: 'Types of Harassment', order: 1,
        blocks: [
          { id: 'he-s2-b1', type: 'heading', level: 2, text: 'Types of Sexual Harassment', align: 'left', order: 0 },
          { id: 'he-s2-b2', type: 'text', order: 1,
            html: '<ul><li>Repeated sexual propositions after they have been rejected.</li><li>Offensive remarks, jokes, or expressions of a sexual nature.</li><li>Unwanted physical contact.</li><li>Sharing sexual materials — images, videos, or messages.</li><li>Indecent exposure.</li></ul>' }
        ]
      },
      {
        id: 'he-s3', title: 'What To Do If Harassed', order: 2,
        blocks: [
          { id: 'he-s3-b1', type: 'heading', level: 2, text: 'Steps for a Victim of Harassment', align: 'left', order: 0 },
          { id: 'he-s3-b2', type: 'text', order: 1,
            html: '<ol><li><strong>Document</strong> — Write down dates, times, and descriptions of what happened.</li><li><strong>Report</strong> — Contact your organization\'s designated harassment prevention officer.</li><li><strong>File a complaint</strong> — You may also report to the relevant labor authority.</li><li><strong>Seek support</strong> — A counselor, lawyer, or support organization can help.</li></ol>' }
        ]
      },
      {
        id: 'he-s4', title: 'Organizational Obligations', order: 3,
        blocks: [
          { id: 'he-s4-b1', type: 'heading', level: 2, text: 'Employer Obligations Under the Law', align: 'left', order: 0 },
          { id: 'he-s4-b2', type: 'text', order: 1,
            html: '<ul><li>Publish a clear anti-harassment policy in a visible location.</li><li>Appoint a qualified officer to handle complaints.</li><li>Conduct training for all employees.</li><li>Investigate complaints within 7 days and respond appropriately.</li><li>Protect complainants from retaliation.</li></ul>' }
        ]
      },
      {
        id: 'he-quiz', title: 'Quiz', order: 4,
        blocks: [
          { id: 'he-qb1', type: 'quiz', order: 0, passingScore: 70,
            questions: [
              { id: 'he-q1', text: 'Is a repeated sexual proposition after being rejected considered sexual harassment?', type: 'true_false',
                options: [
                  { id: 'he-q1-a', text: 'Yes' },
                  { id: 'he-q1-b', text: 'No' }
                ], correctOptionId: 'he-q1-a' },
              { id: 'he-q2', text: 'If you feel you have been sexually harassed, what is the first recommended step?', type: 'multiple_choice',
                options: [
                  { id: 'he-q2-a', text: 'Stay silent to avoid making trouble' },
                  { id: 'he-q2-b', text: 'Document the incident and report to the designated officer' },
                  { id: 'he-q2-c', text: 'Resign immediately' }
                ], correctOptionId: 'he-q2-b' },
              { id: 'he-q3', text: 'Who is responsible for preventing sexual harassment in the organization?', type: 'multiple_choice',
                options: [
                  { id: 'he-q3-a', text: 'Managers only' },
                  { id: 'he-q3-b', text: 'The HR department only' },
                  { id: 'he-q3-c', text: 'Every employee in the organization' }
                ], correctOptionId: 'he-q3-c' }
            ] }
        ]
      }
    ]
  }
];

async function seedSampleLomdot() {
  for (const lomda of sampleLomdot) {
    await query(
      `INSERT INTO courses (id, title, description, content, quizzes, passing_score, is_published, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, true, true)
       ON CONFLICT (id) DO NOTHING`,
      [lomda.id, lomda.title, lomda.description, JSON.stringify(lomda.content), '[]', lomda.passing_score]
    );
  }
  console.log('✓ sample lomdot seeded');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
