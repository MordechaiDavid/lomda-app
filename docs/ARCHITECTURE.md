# Lomda App - Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       Client Layer                              │
├─────────────────────────────────────────────────────────────────┤
│  Browser (Mobile-First) │ Web App (Next.js)                     │
│  - React Components     │ - Server-side rendering              │
│  - State Management     │ - API Integration                    │
└──────────────┬──────────────────────────────────────────────────┘
               │ HTTPS + TLS 1.3
               │
┌──────────────▼──────────────────────────────────────────────────┐
│                    API Gateway Layer                            │
├─────────────────────────────────────────────────────────────────┤
│  Nginx / Load Balancer                                          │
│  - Rate limiting                                                │
│  - SSL termination                                              │
│  - Request routing                                              │
└──────────────┬──────────────────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────────────────┐
│                  Application Layer (Backend)                    │
├─────────────────────────────────────────────────────────────────┤
│  Node.js / Express.js API Server                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  API Routes & Controllers                                │  │
│  │  - /api/v1/auth      - Authentication                    │  │
│  │  - /api/v1/courses   - Course Management                 │  │
│  │  - /api/v1/campaigns - Campaign Distribution             │  │
│  │  - /api/v1/analytics - Reporting & Metrics               │  │
│  │  - /api/v1/users     - User Management                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                         │                                       │
│  ┌──────────────────────┼──────────────────────────────────┐  │
│  │                      │                                  │  │
│  ▼                      ▼                                  ▼  │
│ ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐    │  │
│ │ Auth Service│  │Course Service│  │ Email Service    │    │  │
│ │             │  │              │  │                  │    │  │
│ │- Magic Link │  │- CRUD Ops    │  │- SendGrid        │    │  │
│ │- JWT Tokens │  │- Publishing  │  │- AWS SES         │    │  │
│ │- Sessions   │  │- Analytics   │  │- Rate Limiting   │    │  │
│ └─────────────┘  └──────────────┘  └──────────────────┘    │  │
│                                                              │  │
│  ┌──────────────────────────────────────────────────────┐  │  │
│  │ Queue Service (Bull + Redis)                         │  │  │
│  │ - Email sending                                      │  │  │
│  │ - Report generation                                  │  │  │
│  │ - Analytics aggregation                              │  │  │
│  │ - Reminder scheduling                                │  │  │
│  └──────────────────────────────────────────────────────┘  │  │
└──────────┬─────────────┬────────────────┬──────────────────┘
           │             │                │
    ┌──────▼─┐    ┌──────▼────┐   ┌──────▼────────┐
    │ PostgreSQL  │   Redis    │   │ SendGrid/SES   │
    │ Database    │   Cache    │   │ Email Service  │
    │            │   Queue    │   │                │
    └────────────┘   └────────┘   └────────────────┘
```

## Multi-Tenancy Architecture

Each organization has complete data isolation:

```
┌─────────────────────────────────────────┐
│        Shared Infrastructure            │
│  (Servers, Load Balancers, CDN)        │
└─────────────────────────────────────────┘
         │         │         │
    ┌────▼────┐ ┌──▼───┐ ┌──▼────┐
    │Org A    │ │Org B │ │Org C  │
    │────────┐│ │─────┐│ │──────┐│
    │ Schemas││ │Schemas │ │Schemas││
    │ Data   ││ │ Data  │ │ Data  ││
    │Isolation││ │Isolation │ │Isolation│
    └────────┘│ │─────┘│ │──────┘│
             └────▼────┘ └──▼───┘ └──▼────┘
              Database Rows (organization_id)
```

**Key Features:**
- Row-level security via `organization_id`
- Separate encryption keys per organization
- Logical isolation (can scale to physical later)
- Supports 100+ concurrent organizations

## Authentication Flow

```
User Email → Magic Link Generation → Email Delivery
                ↓
            Token Validation
                ↓
        JWT Token Issued
                ↓
        User Logged In & Redirected to Course
```

## Course Learning Flow

```
1. User receives magic link email
   ↓
2. Click link → Automatic login
   ↓
3. Enrollment created/resumed
   ↓
4. Course content displayed (mobile-responsive)
   ↓
5. Progress auto-saved every 30 seconds
   ↓
6. Quiz at end (optional)
   ↓
7. Completion recorded
   ↓
8. Analytics event tracked
```

## Campaign Distribution Flow

```
Admin Creates Campaign
      ↓
Select Course + Recipients
      ↓
Schedule or Send Immediately
      ↓
Job Queue: Generate Magic Links
      ↓
Job Queue: Send Emails (via SendGrid/SES)
      ↓
Track Open Rate (pixel + user login)
      ↓
Track Completion Rate (enrollment status)
      ↓
Auto-reminders (optional, scheduled jobs)
      ↓
Analytics Dashboard Updated Real-time
```

## Data Flow for Analytics

```
User Interactions
├── Course viewed
├── Content scrolled
├── Quiz answered
├── Course completed
└── Email opened

    ↓ (Real-time event tracking)

Analytics Events Table
(stored in PostgreSQL + Redis for caching)

    ↓ (Aggregated nightly)

Campaign Analytics
├── Open Rate
├── Engagement Rate
├── Completion Rate
└── Average Quiz Score

    ↓ (Exposed via API)

Admin Dashboard
```

## Scalability Considerations

### Horizontal Scaling
- **Stateless API servers** - add more Node.js instances
- **Read replicas** - PostgreSQL replicas for analytics queries
- **CDN** - static assets and compiled Next.js files
- **Job queue** - Bull with Redis clustering

### Vertical Scaling
- PostgreSQL connection pooling (PgBouncer)
- Redis memory optimization
- Database query optimization with indexes

### Caching Strategy
- **Redis Cache**: User sessions, organization config, course content
- **CDN Cache**: Static assets, compiled pages
- **Application Cache**: Course data (ttl: 1 hour)

## Error Handling & Monitoring

```
Error Occurs
    ↓
Structured Logging (Pino)
    ↓
Error Aggregation (Sentry)
    ↓
Alerting (if critical)
    ↓
Admin Notification
```

## Security Layers

1. **Network**: TLS 1.3, DDoS protection
2. **API**: Rate limiting, CORS, CSRF tokens
3. **Authentication**: Magic links, JWT, refresh tokens
4. **Authorization**: Role-based access control
5. **Data**: Encryption at rest (AES-256), encrypted in transit
6. **Audit**: Logging of all admin actions

## Deployment Architecture

```
┌─────────────────────────────────────────┐
│         Production Environment          │
├─────────────────────────────────────────┤
│  Docker Container Orchestration         │
│  (Kubernetes or Docker Swarm)          │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │ Lomda Backend (Multiple replicas)│  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │ Lomda Frontend (CDN + Replicas)  │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │ PostgreSQL (Primary + Replicas)  │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │ Redis Cluster (Cache + Queue)    │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

## Technology Stack Rationale

- **Next.js** - SSR for SEO, mobile-responsive, TypeScript
- **Express.js** - Lightweight, scalable REST API
- **PostgreSQL** - ACID compliance, JSON support, full-text search
- **Redis** - In-memory caching, job queue, real-time updates
- **SendGrid/SES** - Reliable email delivery, reputation management
- **Docker** - Consistent development and production environments
