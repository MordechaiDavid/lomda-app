// Sample course content in CourseStep format — used by the "seed samples" button in /courses
import type { CourseStep } from '../types/course';

export interface SampleLomda {
  title: string;
  description: string;
  passing_score: number;
  content: CourseStep[];
}

// Replace these with your own verified YouTube video IDs before going live
const VIDEO_SEC  = 'https://www.youtube.com/watch?v=bPVaOlJ6ln0'; // CrashCourse: Cybersecurity
const VIDEO_HAR  = 'https://www.youtube.com/watch?v=v7iNaKhg0y4'; // UN Women: workplace safety

const IMG_CYBER  = 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80';
const IMG_LOCK   = 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&q=80';
const IMG_OFFICE = 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&q=80';
const IMG_TEAM   = 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&q=80';

const secHe: SampleLomda = {
  title: 'אבטחת מידע',
  description: 'לומדה לעובדי הארגון בנושא אבטחת מידע, זיהוי איומי סייבר ושמירה על נכסי הארגון.',
  passing_score: 70,
  content: [
    {
      id: 'sh-s1', title: 'מבוא לאבטחת מידע', order: 0, minTimeSeconds: 0,
      blocks: [
        { id: 'sh-s1-b1', type: 'heading', level: 1, text: 'מבוא לאבטחת מידע', align: 'right', order: 0 },
        { id: 'sh-s1-v1', type: 'video', url: VIDEO_SEC, caption: 'צפה בסרטון ולאחר מכן המשך', autoplay: false, order: 1 },
        { id: 'sh-s1-b2', type: 'text', order: 2,
          html: '<p>אבטחת מידע היא מכלול הפעולות, הנהלים והטכנולוגיות שמטרתן להגן על המידע הארגוני מפני גישה לא מורשית, שימוש לרעה, חשיפה, שינוי, מחיקה או שיבוש.</p><p>כל עובד בארגון הוא שחקן מפתח בשמירה על אבטחת המידע — גם אם אינו איש טכנולוגיה.</p>' }
      ]
    },
    {
      id: 'sh-s2', title: 'איומים נפוצים', order: 1, minTimeSeconds: 45,
      blocks: [
        { id: 'sh-s2-b1', type: 'heading', level: 2, text: 'איומים נפוצים בעולם הסייבר', align: 'right', order: 0 },
        { id: 'sh-s2-i1', type: 'image', url: IMG_CYBER, alt: 'איומי סייבר', caption: 'עולם הסייבר מלא באיומים — הכר אותם', width: 'full', order: 1 },
        { id: 'sh-s2-b2', type: 'text', order: 2,
          html: '<ul><li><strong>פישינג (Phishing)</strong> — הודעות דואר אלקטרוני או SMS מזויפות שמנסות לגרום לך ללחוץ על קישור זדוני.</li><li><strong>תוכנות כופר (Ransomware)</strong> — תוכנה שמצפינה את קבציך ותובעת תשלום לשחרורם.</li><li><strong>הנדסה חברתית</strong> — ניסיון לגרום לאדם לחשוף מידע רגיש על ידי התחזות.</li><li><strong>סיסמאות חלשות</strong> — שימוש בסיסמאות פשוטות שקל לנחש.</li></ul>' }
      ]
    },
    {
      id: 'sh-s3', title: 'הגנה על מידע', order: 2, minTimeSeconds: 45,
      blocks: [
        { id: 'sh-s3-b1', type: 'heading', level: 2, text: 'כיצד מגנים על מידע?', align: 'right', order: 0 },
        { id: 'sh-s3-b2', type: 'text', order: 1,
          html: '<ul><li><strong>סיסמאות חזקות</strong> — לפחות 12 תווים, שילוב של אותיות, מספרים ותווים מיוחדים.</li><li><strong>אימות דו-שלבי (2FA)</strong> — הוסף שכבת אבטחה נוספת לכל חשבון.</li><li><strong>עדכוני תוכנה</strong> — עדכן מערכת הפעלה ותוכנות באופן קבוע.</li><li><strong>גיבוי נתונים</strong> — גבה קבצים חשובים לאחסון מאובטח.</li></ul>' },
        { id: 'sh-s3-i1', type: 'image', url: IMG_LOCK, alt: 'אבטחת סיסמאות', caption: 'סיסמה חזקה + 2FA = הגנה אמיתית', width: 'medium', order: 2 }
      ]
    },
    {
      id: 'sh-s4', title: 'כללי זהב לעובד', order: 3, minTimeSeconds: 30,
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
          ] as unknown[] } as unknown
      ] as unknown[]
    }
  ] as unknown as CourseStep[]
};

const secEn: SampleLomda = {
  title: 'Information Security',
  description: 'A training course for employees on information security, identifying cyber threats, and protecting company assets.',
  passing_score: 70,
  content: [
    {
      id: 'se-s1', title: 'Introduction', order: 0, minTimeSeconds: 0,
      blocks: [
        { id: 'se-s1-b1', type: 'heading', level: 1, text: 'Introduction to Information Security', align: 'left', order: 0 },
        { id: 'se-s1-v1', type: 'video', url: VIDEO_SEC, caption: 'Watch the video, then continue', autoplay: false, order: 1 },
        { id: 'se-s1-b2', type: 'text', order: 2,
          html: '<p>Information security encompasses the processes, policies, and technologies designed to protect organizational data from unauthorized access, misuse, disclosure, modification, or destruction.</p><p>Every employee plays a key role in keeping information secure — even if you are not in IT.</p>' }
      ]
    },
    {
      id: 'se-s2', title: 'Common Cyber Threats', order: 1, minTimeSeconds: 45,
      blocks: [
        { id: 'se-s2-b1', type: 'heading', level: 2, text: 'Common Cyber Threats', align: 'left', order: 0 },
        { id: 'se-s2-i1', type: 'image', url: IMG_CYBER, alt: 'Cyber threats visualization', caption: 'The cyber landscape is full of threats — know them', width: 'full', order: 1 },
        { id: 'se-s2-b2', type: 'text', order: 2,
          html: '<ul><li><strong>Phishing</strong> — Fake emails or SMS messages that trick you into clicking a malicious link.</li><li><strong>Ransomware</strong> — Malware that encrypts your files and demands payment.</li><li><strong>Social Engineering</strong> — Manipulating people into revealing sensitive information.</li><li><strong>Weak Passwords</strong> — Simple passwords that are easy to guess or brute-force.</li></ul>' }
      ]
    },
    {
      id: 'se-s3', title: 'Protecting Your Data', order: 2, minTimeSeconds: 45,
      blocks: [
        { id: 'se-s3-b1', type: 'heading', level: 2, text: 'How to Protect Information', align: 'left', order: 0 },
        { id: 'se-s3-b2', type: 'text', order: 1,
          html: '<ul><li><strong>Strong Passwords</strong> — At least 12 characters, mixing letters, numbers, and symbols.</li><li><strong>Two-Factor Authentication (2FA)</strong> — Add an extra layer of security to every account.</li><li><strong>Software Updates</strong> — Keep your OS and applications up to date.</li><li><strong>Data Backups</strong> — Back up important files to secure storage regularly.</li></ul>' },
        { id: 'se-s3-i1', type: 'image', url: IMG_LOCK, alt: 'Password security', caption: 'Strong password + 2FA = real protection', width: 'medium', order: 2 }
      ]
    },
    {
      id: 'se-s4', title: 'Golden Rules', order: 3, minTimeSeconds: 30,
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
            { id: 'se-q3', text: 'You receive a suspicious email. What do you do?', type: 'multiple_choice',
              options: [
                { id: 'se-q3-a', text: 'Click the link carefully' },
                { id: 'se-q3-b', text: 'Delete it and stay silent' },
                { id: 'se-q3-c', text: "Don't open it and report to IT" }
              ], correctOptionId: 'se-q3-c' }
          ] as unknown[] } as unknown
      ] as unknown[]
    }
  ] as unknown as CourseStep[]
};

const harHe: SampleLomda = {
  title: 'מניעת הטרדה מינית במקום העבודה',
  description: 'לומדה לעובדים ומנהלים בנושא מניעת הטרדה מינית, זיהוי מצבים פוגעניים ונהלי הגשת תלונה.',
  passing_score: 70,
  content: [
    {
      id: 'hh-s1', title: 'מהי הטרדה מינית?', order: 0, minTimeSeconds: 0,
      blocks: [
        { id: 'hh-s1-b1', type: 'heading', level: 1, text: 'מהי הטרדה מינית?', align: 'right', order: 0 },
        { id: 'hh-s1-v1', type: 'video', url: VIDEO_HAR, caption: 'צפה בסרטון ולאחר מכן המשך', autoplay: false, order: 1 },
        { id: 'hh-s1-b2', type: 'text', order: 2,
          html: '<p>חוק למניעת הטרדה מינית, התשנ"ח–1998, מגדיר הטרדה מינית כהתנהגות בעלת אופי מיני שנעשית ללא הסכמה.</p><p>הטרדה מינית פוגעת בכבוד האדם, בזכויות העובד ובסביבת העבודה כולה. היא אסורה על פי חוק וגוררת אחריות אישית.</p>' }
      ]
    },
    {
      id: 'hh-s2', title: 'סוגי הטרדה', order: 1, minTimeSeconds: 45,
      blocks: [
        { id: 'hh-s2-b1', type: 'heading', level: 2, text: 'סוגי הטרדה מינית', align: 'right', order: 0 },
        { id: 'hh-s2-i1', type: 'image', url: IMG_OFFICE, alt: 'סביבת עבודה מכבדת', caption: 'כל אחד זכאי לסביבת עבודה מכבדת ובטוחה', width: 'full', order: 1 },
        { id: 'hh-s2-b2', type: 'text', order: 2,
          html: '<ul><li>הצעות מיניות חוזרות לאחר שהן נדחו.</li><li>הערות, בדיחות או ביטויים בעלי אופי מיני פוגעני.</li><li>מגע פיזי שלא ניתנה לו הסכמה.</li><li>שיתוף חומרים מיניים — תמונות, סרטונים, הודעות.</li></ul>' }
      ]
    },
    {
      id: 'hh-s3', title: 'מה לעשות אם נפגעת?', order: 2, minTimeSeconds: 45,
      blocks: [
        { id: 'hh-s3-b1', type: 'heading', level: 2, text: 'צעדים לנפגע/ת הטרדה', align: 'right', order: 0 },
        { id: 'hh-s3-b2', type: 'text', order: 1,
          html: '<ol><li><strong>תעד</strong> — רשום תאריכים, שעות ותיאור מה קרה.</li><li><strong>פנה לאחראי/ת</strong> — בכל ארגון חייב להיות אחראי למניעת הטרדה מינית.</li><li><strong>הגש תלונה</strong> — אפשרי לפנות גם למשרד העבודה או לוועדת שוויון הזדמנויות.</li><li><strong>קבל תמיכה</strong> — אין צורך להתמודד לבד. פסיכולוג, עו"ד, גוף תמיכה.</li></ol>' },
        { id: 'hh-s3-i1', type: 'image', url: IMG_TEAM, alt: 'תמיכה ועזרה', caption: 'אתה לא לבד — פנה לעזרה', width: 'medium', order: 2 }
      ]
    },
    {
      id: 'hh-s4', title: 'חובת הארגון', order: 3, minTimeSeconds: 30,
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
          ] as unknown[] } as unknown
      ] as unknown[]
    }
  ] as unknown as CourseStep[]
};

const harEn: SampleLomda = {
  title: 'Prevention of Sexual Harassment in the Workplace',
  description: 'A training course for employees and managers on recognizing, preventing, and reporting sexual harassment.',
  passing_score: 70,
  content: [
    {
      id: 'he-s1', title: 'What Is Sexual Harassment?', order: 0, minTimeSeconds: 0,
      blocks: [
        { id: 'he-s1-b1', type: 'heading', level: 1, text: 'What Is Sexual Harassment?', align: 'left', order: 0 },
        { id: 'he-s1-v1', type: 'video', url: VIDEO_HAR, caption: 'Watch the video, then continue', autoplay: false, order: 1 },
        { id: 'he-s1-b2', type: 'text', order: 2,
          html: "<p>Sexual harassment is any unwanted conduct of a sexual nature that violates a person's dignity or creates an intimidating, hostile, or offensive work environment.</p><p>It is prohibited by law and carries personal legal liability.</p>" }
      ]
    },
    {
      id: 'he-s2', title: 'Types of Harassment', order: 1, minTimeSeconds: 45,
      blocks: [
        { id: 'he-s2-b1', type: 'heading', level: 2, text: 'Types of Sexual Harassment', align: 'left', order: 0 },
        { id: 'he-s2-i1', type: 'image', url: IMG_OFFICE, alt: 'Respectful workplace', caption: 'Everyone deserves a respectful and safe workplace', width: 'full', order: 1 },
        { id: 'he-s2-b2', type: 'text', order: 2,
          html: '<ul><li>Repeated sexual propositions after they have been rejected.</li><li>Offensive remarks, jokes, or expressions of a sexual nature.</li><li>Unwanted physical contact.</li><li>Sharing sexual materials — images, videos, or messages.</li></ul>' }
      ]
    },
    {
      id: 'he-s3', title: 'What To Do If Harassed', order: 2, minTimeSeconds: 45,
      blocks: [
        { id: 'he-s3-b1', type: 'heading', level: 2, text: 'Steps for a Victim of Harassment', align: 'left', order: 0 },
        { id: 'he-s3-b2', type: 'text', order: 1,
          html: "<ol><li><strong>Document</strong> — Write down dates, times, and descriptions of what happened.</li><li><strong>Report</strong> — Contact your organization's harassment prevention officer.</li><li><strong>File a complaint</strong> — You may also report to the relevant labor authority.</li><li><strong>Seek support</strong> — A counselor, lawyer, or support organization can help.</li></ol>" },
        { id: 'he-s3-i1', type: 'image', url: IMG_TEAM, alt: 'Support and help', caption: "You don't have to face this alone", width: 'medium', order: 2 }
      ]
    },
    {
      id: 'he-s4', title: 'Employer Obligations', order: 3, minTimeSeconds: 30,
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
            { id: 'he-q2', text: 'If you feel harassed, what is the first recommended step?', type: 'multiple_choice',
              options: [
                { id: 'he-q2-a', text: 'Stay silent to avoid making trouble' },
                { id: 'he-q2-b', text: 'Document the incident and report to the designated officer' },
                { id: 'he-q2-c', text: 'Resign immediately' }
              ], correctOptionId: 'he-q2-b' },
            { id: 'he-q3', text: 'Who is responsible for preventing sexual harassment?', type: 'multiple_choice',
              options: [
                { id: 'he-q3-a', text: 'Managers only' },
                { id: 'he-q3-b', text: 'The HR department only' },
                { id: 'he-q3-c', text: 'Every employee in the organization' }
              ], correctOptionId: 'he-q3-c' }
          ] as unknown[] } as unknown
      ] as unknown[]
    }
  ] as unknown as CourseStep[]
};

export const SAMPLE_LOMDOT: SampleLomda[] = [secHe, secEn, harHe, harEn];
