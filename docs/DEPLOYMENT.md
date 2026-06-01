# Lomda App - Deployment Guide

## Pre-Deployment Checklist

### Environment Setup
- [ ] Domain name registered and DNS configured
- [ ] SSL certificate obtained (Let's Encrypt)
- [ ] CDN configured (CloudFront, Cloudflare)
- [ ] Database backup strategy configured
- [ ] Monitoring tools setup (Sentry, DataDog)

### Credentials & Secrets
- [ ] JWT_SECRET configured (minimum 32 characters, random)
- [ ] MAGIC_LINK_SECRET configured
- [ ] ENCRYPTION_KEY configured (rotate quarterly)
- [ ] SendGrid/AWS SES API keys configured
- [ ] Database password changed from default
- [ ] Redis password configured

### Infrastructure
- [ ] Load balancer configured
- [ ] Auto-scaling policies set
- [ ] Database connection pooling configured (pgBouncer)
- [ ] Redis persistence enabled
- [ ] Backup server allocated

## Deployment Methods

### Option 1: Docker Compose (Small to Medium)

Suitable for organizations with < 1000 users

```bash
# 1. Clone repository
git clone <repo>
cd lomda-app

# 2. Configure environment
cp docker/.env.example .env
# Edit .env with production values

# 3. Build images
docker-compose -f docker/docker-compose.prod.yml build

# 4. Start services
docker-compose -f docker/docker-compose.prod.yml up -d --profile prod

# 5. Run migrations
docker-compose -f docker/docker-compose.prod.yml exec backend npm run db:migrate

# 6. Verify services
docker-compose -f docker/docker-compose.prod.yml ps
```

### Option 2: Kubernetes (Enterprise)

Suitable for organizations with 1000+ users

**Prerequisites:**
- Kubernetes cluster (EKS, GKE, or self-hosted)
- kubectl configured
- Helm 3.0+

**Deployment:**

```bash
# 1. Create namespace
kubectl create namespace lomda

# 2. Create secrets
kubectl create secret generic lomda-secrets \
  --from-literal=JWT_SECRET=$(openssl rand -base64 32) \
  --from-literal=ENCRYPTION_KEY=$(openssl rand -base64 32) \
  -n lomda

# 3. Add Helm repository (if using)
helm repo add lomda https://charts.lomda-app.com
helm repo update

# 4. Deploy using Helm
helm install lomda lomda/lomda-app \
  --namespace lomda \
  --values values-production.yaml

# 5. Verify deployment
kubectl get pods -n lomda
kubectl get svc -n lomda

# 6. Check logs
kubectl logs -n lomda -l app=backend
```

### Option 3: Cloud Platform (AWS, Google Cloud, Azure)

**AWS Deployment:**

```bash
# 1. Create ECS cluster
aws ecs create-cluster --cluster-name lomda-prod

# 2. Push images to ECR
aws ecr get-login-password --region us-east-1 | docker login \
  --username AWS --password-stdin [account-id].dkr.ecr.us-east-1.amazonaws.com

docker tag lomda/backend:latest [account-id].dkr.ecr.us-east-1.amazonaws.com/lomda/backend:latest
docker push [account-id].dkr.ecr.us-east-1.amazonaws.com/lomda/backend:latest

# 3. Update ECS task definitions (automated via CI/CD)

# 4. Deploy services
aws ecs update-service --cluster lomda-prod --service lomda-backend --force-new-deployment
```

## Production Configuration

### Database Setup

```sql
-- Create database with proper settings
CREATE DATABASE lomda_prod
  WITH ENCODING 'UTF8'
  LOCALE 'en_US.UTF-8'
  TEMPLATE template0;

-- Enable extensions
\c lomda_prod

CREATE EXTENSION pgcrypto;
CREATE EXTENSION pg_stat_statements;

-- Run migrations
\i migrations/001_initial_schema.sql
```

### Redis Configuration

```conf
# /etc/redis/redis-prod.conf

port 6379
bind 127.0.0.1 ::1

# Persistence
save 900 1
save 300 10
save 60 10000
appendonly yes
appendfsync everysec

# Memory
maxmemory 4gb
maxmemory-policy allkeys-lru

# Logging
loglevel notice
logfile /var/log/redis/redis-server.log
```

### Nginx Configuration

```nginx
upstream backend {
    server backend1:3001;
    server backend2:3001;
    server backend3:3001;
}

server {
    listen 80;
    server_name api.lomda-app.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.lomda-app.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/api.lomda-app.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.lomda-app.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Content-Security-Policy "default-src 'self'" always;

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req zone=api_limit burst=20 nodelay;

    # Proxy Configuration
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    location / {
        proxy_pass http://backend;
        proxy_read_timeout 30s;
        proxy_connect_timeout 5s;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        proxy_cache_valid 200 30d;
        proxy_cache_key "$scheme$host$request_uri";
    }
}
```

### SSL/TLS Certificate Setup

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Generate certificate
sudo certbot certonly --nginx -d api.lomda-app.com -d app.lomda-app.com

# Auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Test renewal
sudo certbot renew --dry-run
```

## Monitoring & Logging

### Application Monitoring

**Sentry Setup:**

```typescript
// backend/src/config/sentry.ts
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
```

### Logging Strategy

```bash
# Centralized logging with ELK Stack
# Filebeat → Logstash → Elasticsearch → Kibana

# Or use CloudWatch (AWS)
aws logs create-log-group --log-group-name /lomda/backend
aws logs create-log-stream --log-group-name /lomda/backend --log-stream-name prod
```

### Metrics to Monitor

- **API Response Time**: Alert if > 500ms (p95)
- **Error Rate**: Alert if > 1%
- **Database Connections**: Alert if > 80% of pool
- **Redis Memory**: Alert if > 80% capacity
- **Disk Space**: Alert if < 20% available
- **CPU Usage**: Alert if > 75%
- **Memory Usage**: Alert if > 85%

## Backup & Recovery

### Automated Backups

```bash
#!/bin/bash
# /usr/local/bin/backup-db.sh

BACKUP_DIR="/backups/daily"
DB_NAME="lomda_db"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Backup database
pg_dump -h localhost -U postgres $DB_NAME | \
  gzip > $BACKUP_DIR/db_$TIMESTAMP.sql.gz

# Backup Redis
redis-cli --rdb /backups/redis_$TIMESTAMP.rdb

# Upload to S3
aws s3 cp $BACKUP_DIR/db_$TIMESTAMP.sql.gz s3://lomda-backups/
aws s3 cp /backups/redis_$TIMESTAMP.rdb s3://lomda-backups/

# Keep only last 30 days
find $BACKUP_DIR -mtime +30 -delete
```

### Recovery Procedure

```bash
# Restore database
gunzip < /backups/db_20240101_120000.sql.gz | \
  psql -h localhost -U postgres -d lomda_db

# Restore Redis
redis-cli shutdown
cp /backups/redis_20240101_120000.rdb /var/lib/redis/dump.rdb
redis-server
```

## CI/CD Pipeline

### GitHub Actions Example

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Build Docker images
        run: |
          docker-compose -f docker-compose.prod.yml build

      - name: Push to registry
        run: |
          echo ${{ secrets.REGISTRY_PASSWORD }} | \
            docker login -u ${{ secrets.REGISTRY_USER }} --password-stdin
          docker push lomda/backend:latest
          docker push lomda/frontend:latest

      - name: Deploy to production
        run: |
          ssh -i ${{ secrets.DEPLOY_KEY }} user@prod.server \
            'cd /opt/lomda && docker-compose pull && docker-compose up -d'
```

## Post-Deployment

### Verification Checklist

- [ ] Health checks passing
- [ ] SSL certificate valid
- [ ] API responding with correct CORS headers
- [ ] Database accessible and migrated
- [ ] Redis cache working
- [ ] Email service functional (test magic link)
- [ ] Monitoring alerts configured
- [ ] Backups running

### Performance Tuning

```sql
-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM enrollments WHERE organization_id = $1;

-- Create indexes for slow queries
CREATE INDEX idx_enrollments_org_status_date 
  ON enrollments(organization_id, status, created_at DESC);

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan 
FROM pg_stat_user_indexes 
ORDER BY idx_scan DESC;
```

## Rollback Procedure

```bash
# If deployment fails:

# 1. Revert to previous version
docker-compose -f docker-compose.prod.yml down
git checkout previous-tag
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# 2. Check health
curl https://api.lomda-app.com/health

# 3. Verify functionality
npm run test:smoke

# 4. Restore database if needed
# (see Recovery Procedure above)
```

## Support & Troubleshooting

**Common Issues:**

1. **High Memory Usage**
   - Check for memory leaks: `node --inspect`
   - Restart services: `docker-compose restart`
   - Increase memory limits

2. **Database Connection Failures**
   - Check pgBouncer stats: `psql -p 6432 pgbouncer -c "show stats"`
   - Verify firewall rules
   - Check database logs

3. **Email Delivery Issues**
   - Check SendGrid dashboard for bounces
   - Verify SPF/DKIM records: `dig txt example.com`
   - Check email logs: `docker-compose logs sendgrid-service`

For support: support@lomda-app.com
