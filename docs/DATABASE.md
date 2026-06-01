# Lomda App - Database Schema

## Overview
This document describes the PostgreSQL database schema for Lomda App, designed with multi-tenancy, security, and performance in mind.

## Core Tables

### organizations
Represents each customer organization in the multi-tenant system.

```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  domain VARCHAR(255),
  logo_url VARCHAR(1024),
  encryption_key VARCHAR(255),
  subscription_tier VARCHAR(50) DEFAULT 'starter',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);
```

### users
Employees and admins with accounts in the system.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'employee',
  department VARCHAR(255),
  team VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  UNIQUE(organization_id, email)
);

CREATE INDEX idx_users_org_email ON users(organization_id, email);
CREATE INDEX idx_users_org_role ON users(organization_id, role);
```

### magic_tokens
Secure tokens for passwordless authentication.

```sql
CREATE TABLE magic_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  user_id UUID,
  email VARCHAR(255) NOT NULL,
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_magic_tokens_org_email ON magic_tokens(organization_id, email);
CREATE INDEX idx_magic_tokens_expires ON magic_tokens(expires_at);
```

### courses
Learning content managed by trainers.

```sql
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  created_by UUID NOT NULL,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP,
  thumbnail_url VARCHAR(1024),
  estimated_duration_minutes INT DEFAULT 5,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_courses_org_published ON courses(organization_id, is_published);
CREATE INDEX idx_courses_created_by ON courses(created_by);
```

### course_content
Individual slides/sections in a course.

```sql
CREATE TABLE course_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL,
  type VARCHAR(50),
  content TEXT,
  order_index INT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE INDEX idx_course_content_course_order ON course_content(course_id, order_index);
```

### quizzes
Assessment questions within courses.

```sql
CREATE TABLE quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL,
  question VARCHAR(1024) NOT NULL,
  type VARCHAR(50),
  correct_answer VARCHAR(1024) NOT NULL,
  order_index INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE INDEX idx_quizzes_course_order ON quizzes(course_id, order_index);
```

### quiz_options
Multiple choice options for quizzes.

```sql
CREATE TABLE quiz_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL,
  text VARCHAR(1024) NOT NULL,
  order_index INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);

CREATE INDEX idx_quiz_options_quiz_order ON quiz_options(quiz_id, order_index);
```

### enrollments
User progress tracking.

```sql
CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  course_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  status VARCHAR(50) DEFAULT 'not_started',
  progress_percentage INT DEFAULT 0,
  current_step INT DEFAULT 0,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  UNIQUE(user_id, course_id)
);

CREATE INDEX idx_enrollments_org_status ON enrollments(organization_id, status);
CREATE INDEX idx_enrollments_user_course ON enrollments(user_id, course_id);
```

### quiz_responses
User answers to quiz questions.

```sql
CREATE TABLE quiz_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL,
  quiz_id UUID NOT NULL,
  answer VARCHAR(1024) NOT NULL,
  is_correct BOOLEAN,
  answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);

CREATE INDEX idx_quiz_responses_enrollment ON quiz_responses(enrollment_id);
```

### campaigns
Email distribution campaigns.

```sql
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  course_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'draft',
  created_by UUID NOT NULL,
  scheduled_at TIMESTAMP,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_campaigns_org_status ON campaigns(organization_id, status);
```

### campaign_recipients
Users targeted by a campaign.

```sql
CREATE TABLE campaign_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL,
  user_id UUID NOT NULL,
  email_sent_at TIMESTAMP,
  opened_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(campaign_id, user_id)
);

CREATE INDEX idx_campaign_recipients_campaign ON campaign_recipients(campaign_id);
```

### campaign_reminders
Automated reminder configuration.

```sql
CREATE TABLE campaign_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL,
  type VARCHAR(50),
  delay_hours INT NOT NULL,
  sent_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);
```

### analytics_events
User interaction tracking.

```sql
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  user_id UUID,
  course_id UUID,
  event_type VARCHAR(50) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL
);

CREATE INDEX idx_analytics_events_org_date ON analytics_events(organization_id, created_at);
CREATE INDEX idx_analytics_events_event_type ON analytics_events(event_type);
```

## Key Features

### Multi-Tenancy
- Organization-level data isolation
- All tables include `organization_id` for filtering
- Encryption keys stored per organization

### Security
- Hashed magic tokens
- Time-limited tokens
- User roles and permissions
- Audit logging through `created_at` and `updated_at`

### Performance
- Strategic indexes on commonly filtered columns
- Denormalized progress percentages for faster analytics
- JSONB for flexible metadata storage

### Data Retention
- Soft deletes possible with `is_active` flags
- Timestamp-based cleanup of expired tokens
- Archiving of old enrollments and events

## Migrations

Database migrations should be versioned and executed sequentially. Use a migration tool like Knex.js or TypeORM.

## Backup & Recovery

- Daily automated backups
- Point-in-time recovery enabled
- Encrypted backup storage
- Test recovery procedures quarterly
