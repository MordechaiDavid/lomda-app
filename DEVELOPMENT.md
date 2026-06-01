# Lomda App - Development Guide

## Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 14+
- Redis 7+

### Setup

```bash
# Clone repository
git clone <repo>
cd lomda-app

# Run setup script
bash scripts/setup-env.sh

# Or manual setup:
npm install
cp docker/.env.example .env
docker-compose up -d
npm run db:migrate
npm run dev
```

## Development Commands

```bash
# Start all services
npm run dev

# Backend only
npm run dev:backend

# Frontend only
npm run dev:frontend

# Database migrations
npm run db:migrate
npm run db:seed

# Testing
npm run test
npm run test:unit
npm run test:e2e

# Code quality
npm run lint
npm run format
npm run type-check

# Docker
npm run docker:up
npm run docker:down
npm run docker:build
npm run docker:logs
```

## Project Structure

- **backend/**: Express.js REST API
  - `src/api/`: Route handlers
  - `src/auth/`: Authentication logic
  - `src/courses/`: Course management
  - `src/campaigns/`: Campaign distribution
  - `src/analytics/`: Reporting
  - `src/emails/`: Email service

- **frontend/**: Next.js web app
  - `src/app/`: Page routes
  - `src/features/`: Feature modules
  - `src/components/`: Reusable components
  - `src/hooks/`: Custom React hooks
  - `src/lib/`: Utilities

- **shared/**: Monorepo shared code
  - `types/`: TypeScript interfaces
  - `constants/`: Shared constants
  - `utils/`: Utility functions

## Database Management

### Connect to database

```bash
# Via Docker
docker-compose exec postgres psql -U lomda_user -d lomda_db

# Via local connection
psql -h localhost -U lomda_user -d lomda_db
```

### View logs

```bash
# Backend
docker-compose logs -f backend

# Frontend
docker-compose logs -f frontend

# Database
docker-compose logs -f postgres

# All services
docker-compose logs -f
```

## API Testing

### Using curl

```bash
# Send magic link
curl -X POST http://localhost:3001/api/v1/auth/magic-link \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Get courses
curl -X GET http://localhost:3001/api/v1/courses \
  -H "Authorization: Bearer <token>"
```

### Using Postman

- Import: `postman-collection.json` (add to project)
- Environment: `development`
- Base URL: `http://localhost:3001/api/v1`

## Component Development

### Creating a new feature component

```typescript
// src/features/myFeature/MyComponent.tsx

import React from 'react';
import { useApi } from '@/hooks/useApi';

interface MyComponentProps {
  id: string;
}

export function MyComponent({ id }: MyComponentProps) {
  const { data, loading, error, get } = useApi();

  React.useEffect(() => {
    get(`/my-endpoint/${id}`);
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return <div>{/* Your component JSX */}</div>;
}

export default MyComponent;
```

## Testing

### Writing unit tests

```typescript
// __tests__/myFunction.test.ts
import { describe, it, expect } from 'vitest';
import { myFunction } from '../myFunction';

describe('myFunction', () => {
  it('should do something', () => {
    const result = myFunction('input');
    expect(result).toBe('expected output');
  });
});
```

### Running tests

```bash
npm run test                    # Watch mode
npm run test:unit -- --run      # Single run
npm run test:coverage           # With coverage
```

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes and commit
git add .
git commit -m "feat: add my feature"

# Push to remote
git push origin feature/my-feature

# Create pull request on GitHub
```

## Debugging

### Backend debugging

```bash
# Start with inspector
node --inspect-brk dist/index.js

# In Chrome: chrome://inspect
```

### Frontend debugging

- Use React Developer Tools browser extension
- DevTools in Next.js dev server
- Console for logs

## Environment Variables

See `docker/.env.example` for all available options.

Key variables for development:
- `NODE_ENV=development`
- `JWT_SECRET=dev-secret-change-in-prod`
- `DATABASE_URL=postgresql://user:password@localhost/lomda_db`
- `REDIS_URL=redis://localhost:6379`

## Performance Tips

- Use `useCallback` for event handlers
- Memoize expensive computations
- Lazy load heavy components
- Optimize database queries with indexes
- Cache API responses in Redis

## Security Checklist

- [ ] Never commit `.env` or secrets
- [ ] Use HTTPS in production
- [ ] Validate all user inputs
- [ ] Use parameterized queries
- [ ] Keep dependencies updated
- [ ] Enable rate limiting
- [ ] Use secure cookies for tokens

## Useful Resources

- [Express.js Docs](https://expressjs.com/)
- [Next.js Docs](https://nextjs.org/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Redis Docs](https://redis.io/docs/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## Getting Help

- Check [CONTRIBUTING.md](./CONTRIBUTING.md)
- Create an issue on GitHub
- Join community discussions
- Email: dev@lomda-app.com
