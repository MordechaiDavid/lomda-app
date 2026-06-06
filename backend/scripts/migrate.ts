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

  await pool.end();
  console.log('Migrations complete.');
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
