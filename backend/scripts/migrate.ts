import { query, pool } from '../src/db/index.js';

async function migrate() {
  console.log('Running migrations...');

  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email      TEXT UNIQUE NOT NULL,
      password   TEXT NOT NULL,
      role       TEXT NOT NULL DEFAULT 'student',
      name       TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  console.log('✓ users table');

  await query(`ALTER TABLE users ALTER COLUMN role SET DEFAULT 'employee'`);
  console.log('✓ users.role default updated to employee');

  await query(`
    CREATE TABLE IF NOT EXISTS courses (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title       TEXT NOT NULL,
      description TEXT,
      content     JSONB NOT NULL DEFAULT '[]',
      quizzes     JSONB NOT NULL DEFAULT '[]',
      created_at  TIMESTAMPTZ DEFAULT NOW(),
      updated_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  console.log('✓ courses table');

  await query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='courses' AND column_name='is_active'
      ) THEN
        ALTER TABLE courses ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
      END IF;
    END $$
  `);
  console.log('✓ courses.is_active column');

  // users.is_active
  await query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='users' AND column_name='is_active'
      ) THEN
        ALTER TABLE users ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
      END IF;
    END $$
  `);
  console.log('✓ users.is_active column');

  // Extended course fields
  await query(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='courses' AND column_name='passing_score') THEN
        ALTER TABLE courses ADD COLUMN passing_score INTEGER NOT NULL DEFAULT 70;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='courses' AND column_name='thumbnail_url') THEN
        ALTER TABLE courses ADD COLUMN thumbnail_url TEXT;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='courses' AND column_name='background_music_url') THEN
        ALTER TABLE courses ADD COLUMN background_music_url TEXT;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='courses' AND column_name='is_published') THEN
        ALTER TABLE courses ADD COLUMN is_published BOOLEAN NOT NULL DEFAULT false;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='courses' AND column_name='estimated_minutes') THEN
        ALTER TABLE courses ADD COLUMN estimated_minutes INTEGER;
      END IF;
    END $$
  `);
  console.log('✓ courses extended columns');

  // files
  await query(`
    CREATE TABLE IF NOT EXISTS files (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      filename    TEXT NOT NULL,
      url         TEXT NOT NULL,
      mime_type   TEXT NOT NULL,
      size_bytes  INTEGER NOT NULL,
      uploaded_by UUID REFERENCES users(id),
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  console.log('✓ files table');

  // enrollments
  await query(`
    CREATE TABLE IF NOT EXISTS enrollments (
      id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id        UUID NOT NULL REFERENCES users(id),
      course_id      UUID NOT NULL REFERENCES courses(id),
      status         TEXT NOT NULL DEFAULT 'pending',
      current_step   INTEGER NOT NULL DEFAULT 0,
      time_spent_sec INTEGER NOT NULL DEFAULT 0,
      started_at     TIMESTAMPTZ,
      completed_at   TIMESTAMPTZ,
      created_at     TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, course_id)
    )
  `);
  console.log('✓ enrollments table');

  // quiz_submissions
  await query(`
    CREATE TABLE IF NOT EXISTS quiz_submissions (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      enrollment_id UUID NOT NULL REFERENCES enrollments(id),
      user_id       UUID NOT NULL REFERENCES users(id),
      course_id     UUID NOT NULL REFERENCES courses(id),
      answers       JSONB NOT NULL DEFAULT '{}',
      score         INTEGER NOT NULL,
      passed        BOOLEAN NOT NULL,
      attempt_no    INTEGER NOT NULL DEFAULT 1,
      submitted_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  console.log('✓ quiz_submissions table');

  // campaigns
  await query(`
    CREATE TABLE IF NOT EXISTS campaigns (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title         TEXT NOT NULL,
      course_id     UUID NOT NULL REFERENCES courses(id),
      created_by    UUID NOT NULL REFERENCES users(id),
      status        TEXT NOT NULL DEFAULT 'draft',
      due_date      TIMESTAMPTZ,
      passing_score INTEGER NOT NULL DEFAULT 70,
      created_at    TIMESTAMPTZ DEFAULT NOW(),
      sent_at       TIMESTAMPTZ
    )
  `);
  console.log('✓ campaigns table');

  // campaign_recipients
  await query(`
    CREATE TABLE IF NOT EXISTS campaign_recipients (
      id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      campaign_id    UUID NOT NULL REFERENCES campaigns(id),
      user_id        UUID REFERENCES users(id),
      email          TEXT NOT NULL,
      token          TEXT NOT NULL UNIQUE,
      email_sent_at  TIMESTAMPTZ,
      started_at     TIMESTAMPTZ,
      completed_at   TIMESTAMPTZ,
      score          INTEGER,
      status         TEXT NOT NULL DEFAULT 'pending',
      UNIQUE(campaign_id, email)
    )
  `);
  console.log('✓ campaign_recipients table');

  await pool.end();
  console.log('Migrations complete.');
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
