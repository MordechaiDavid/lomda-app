# Lomda App - Enterprise Learning Management System

A modern, mobile-first learning management platform designed for organizations to distribute training content, track employee learning progress, and ensure compliance with zero friction.

## Overview

Lomda App is a **B2B SaaS platform** that enables organizations to:
- Create and distribute micro-learning courses
- Authenticate employees with passwordless magic links
- Track learning progress with automatic resume functionality
- Validate understanding through interactive quizzes
- Generate compliance reports and analytics
- Multi-tenant support for enterprise scalability

## Key Features

### 🎓 End-User Experience (Mobile-First)
- **Passwordless Authentication**: Magic link via email - instant access without registration
- **Mobile-Responsive Design**: Native mobile app-like experience (stories/card format)
- **Auto-Save Progress**: Resume exactly where you left off
- **Interactive Quizzes**: Multiple-choice and true/false questions with instant feedback

### 🛠️ Admin Dashboard
- **No-Code Course Authoring**: Drag-and-drop course builder
- **AI Course Assistant**: Build a lomda from a natural-language prompt — Claude proposes steps & blocks straight into the drag-and-drop canvas (requires `ANTHROPIC_API_KEY`, see below)
- **User Management**: Bulk upload employees (Excel/CSV)
- **Email Campaign Manager**: Schedule and distribute courses
- **Auto-Reminders**: Automated follow-ups for non-engagement
- **Public Link Generator**: Share courses via WhatsApp or corporate portals

### 📊 Analytics & Reporting
- **Campaign Dashboard**: Real-time metrics (open rate, engagement, completion)
- **User Statistics**: Per-employee performance tracking
- **Compliance Alerts**: Non-completion warnings
- **Data Export**: Excel and PDF reports for audits

### 🔒 Enterprise Security
- **GDPR/ISO 27001 Compliant**: Full data encryption at rest and in transit
- **Multi-Tenancy**: Complete data isolation between organizations
- **Professional Email Integration**: SendGrid/AWS SES for reliable delivery
- **Secure Token Authentication**: Time-limited, encrypted magic links

### 🌍 Multi-Language Support
- Hebrew, English, and extensible i18n framework
- RTL (Right-to-Left) layout support

## Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js / NestJS
- **Database**: PostgreSQL with encryption
- **Queue System**: Bull (Redis)
- **Email**: SendGrid/AWS SES
- **Authentication**: JWT with secure tokens

### Frontend
- **Framework**: Next.js 14+
- **UI Library**: React 18+
- **Styling**: Tailwind CSS
- **State Management**: React Query + Zustand
- **Mobile**: Responsive design (no native app required)
- **i18n**: next-i18next

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Database**: PostgreSQL
- **Caching**: Redis
- **Message Queue**: Redis-based Bull
- **Email Service**: SendGrid or AWS SES

## Project Structure

```
lomda-app/
├── backend/                    # Node.js API
│   ├── src/
│   │   ├── api/               # API routes/controllers
│   │   ├── auth/              # Authentication & magic links
│   │   ├── courses/           # Course management
│   │   ├── users/             # User management
│   │   ├── campaigns/         # Campaign distribution
│   │   ├── analytics/         # Reporting & metrics
│   │   ├── emails/            # Email service integration
│   │   ├── middleware/        # Custom middleware
│   │   ├── database/          # Database schemas
│   │   ├── config/            # Configuration
│   │   └── utils/             # Utilities
│   ├── tests/
│   ├── docker/
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                   # Next.js Web App
│   ├── src/
│   │   ├── app/               # App router pages
│   │   ├── components/        # Reusable components
│   │   ├── features/          # Feature modules
│   │   │   ├── auth/          # Auth screens
│   │   │   ├── courses/       # Course viewer
│   │   │   ├── admin/         # Admin dashboard
│   │   │   ├── quiz/          # Quiz component
│   │   │   └── analytics/     # Analytics dashboard
│   │   ├── hooks/             # Custom React hooks
│   │   ├── lib/               # Utilities & helpers
│   │   ├── styles/            # Global styles
│   │   └── public/            # Static assets
│   ├── i18n/                  # Translations (EN, HE)
│   ├── tests/
│   ├── package.json
│   └── next.config.js
│
├── shared/                     # Shared types & constants
│   ├── types/
│   ├── constants/
│   ├── utils/
│   └── package.json
│
├── docker/
│   ├── docker-compose.yml
│   ├── docker-compose.prod.yml
│   └── .env.example
│
├── docs/                       # Documentation
│   ├── API.md
│   ├── DATABASE.md
│   ├── ARCHITECTURE.md
│   ├── SECURITY.md
│   └── DEPLOYMENT.md
│
├── scripts/                    # Utility scripts
│   ├── seed-db.js
│   ├── migrate-db.js
│   └── setup-env.sh
│
└── package.json               # Monorepo root
```

## Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 14+
- Redis 7+

### Development Setup

1. **Clone the repository**
```bash
git clone <repo>
cd lomda-app
```

2. **Install dependencies**
```bash
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..
```

3. **Set up environment variables**
```bash
cp docker/.env.example .env
# Edit .env with your configuration
```

4. **Start services with Docker**
```bash
docker-compose up -d
```

5. **Run database migrations**
```bash
npm run db:migrate
```

#### AI Course Assistant environment variables

The in-builder AI assistant (✨ עוזר AI) calls the Anthropic API server-side. Set these on the
**backend** service only — the key is never exposed to the frontend.

| Variable | Required | Default | Notes |
|----------|----------|---------|-------|
| `ANTHROPIC_API_KEY` | Yes (for the assistant) | — | Your Claude API key (`sk-ant-...`). Without it the panel shows a clean "AI not configured" message. |
| `AI_MODEL` | No | `claude-haiku-4-5` | Set to `claude-sonnet-4-6` for higher-quality drafts. |
| `AI_MAX_TOKENS` | No | `4096` | Max output tokens per generation. |

Locally: add `ANTHROPIC_API_KEY` to `backend/.env`.
On Railway: add it to the `lomda-app-mms` service → **Variables**, then redeploy.

6. **Start development servers**
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev
```

Access:
- Frontend: http://localhost:3000
- API: http://localhost:3001
- Admin: http://localhost:3000/admin

## Database Schema

Key tables:
- `organizations` - Multi-tenant isolation
- `users` - Employee/admin users
- `courses` - Learning content
- `enrollments` - User course progress
- `quiz_responses` - User quiz answers
- `campaigns` - Email distribution campaigns
- `magic_tokens` - Passwordless authentication
- `analytics_events` - User interaction tracking

## API Endpoints

### Authentication
- `POST /api/auth/magic-link` - Generate magic link
- `POST /api/auth/verify-token` - Verify and login

### Courses
- `GET /api/courses` - List courses
- `GET /api/courses/:id` - Get course details
- `POST /api/courses` - Create course (admin)

### Enrollments
- `GET /api/enrollments/my-progress` - Get user progress
- `POST /api/enrollments/:courseId/progress` - Update progress

### Campaigns
- `POST /api/campaigns` - Create campaign
- `GET /api/campaigns/:id/analytics` - Campaign metrics

### Admin
- `POST /api/admin/users/bulk-upload` - Upload employee list
- `GET /api/admin/dashboard/stats` - Dashboard metrics

## Security Features

✅ **GDPR Compliant**
- Data encryption at rest (AES-256)
- Encrypted in transit (TLS 1.3)
- User data can be exported/deleted

✅ **Authentication**
- Magic link tokens (time-limited, one-time use)
- JWT tokens with refresh rotation
- Rate limiting on token generation

✅ **Data Protection**
- Role-based access control (RBAC)
- Organization isolation at database level
- Audit logging for compliance

✅ **Email Security**
- SPF/DKIM/DMARC configuration
- Unsubscribe links
- SMTP credentials encryption

## Deployment

### Production Checklist
- [ ] Environment variables configured (incl. `ANTHROPIC_API_KEY` on the backend for the AI assistant)
- [ ] SSL certificates installed
- [ ] Database backed up
- [ ] Redis persistence enabled
- [ ] Email service keys configured
- [ ] Rate limiting configured
- [ ] Monitoring setup (Sentry/DataDog)
- [ ] CDN for static assets
- [ ] Database migrations run

### Docker Production
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Documentation

- [API Documentation](./docs/API.md)
- [Database Schema](./docs/DATABASE.md)
- [Architecture Overview](./docs/ARCHITECTURE.md)
- [Security & Compliance](./docs/SECURITY.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)

## Development

### Testing
```bash
npm run test              # All tests
npm run test:unit         # Unit tests
npm run test:integration  # Integration tests
npm run test:e2e          # End-to-end tests
```

### Code Quality
```bash
npm run lint
npm run format
npm run type-check
```

## Contributing

1. Create feature branch (`git checkout -b feature/amazing-feature`)
2. Commit changes (`git commit -m 'Add amazing feature'`)
3. Push to branch (`git push origin feature/amazing-feature`)
4. Open Pull Request

## Support

- 📧 Email: support@lomda-app.com
- 🐛 Issues: GitHub Issues
- 💬 Discussions: GitHub Discussions

## License

MIT License - See LICENSE file for details

## Roadmap

- [ ] v1.0 - MVP (Core learning + basic admin)
- [ ] v1.1 - Advanced quiz types + analytics
- [ ] v1.2 - Mobile app (React Native)
- [ ] v2.0 - LTI integration + enterprise features
- [ ] v2.1 - AI-powered learning paths

---

**Made with ❤️ for enterprise learning**