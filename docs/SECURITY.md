# Lomda App - Security & Compliance Guide

## Compliance Standards

### GDPR (General Data Protection Regulation)
**Status**: ✅ Fully Compliant

**Implementation:**
- **User Rights**:
  - Right to Access: API endpoint `/api/v1/users/me/export`
  - Right to Erasure: Automatic data deletion after 30 days of inactivity (configurable)
  - Right to Rectification: Users can update their profile
  - Right to Data Portability: Export all personal data in JSON format

- **Consent Management**:
  - Explicit opt-in for marketing emails
  - Consent records stored with timestamps
  - Easy unsubscribe links in all emails

- **Data Processing Agreements**:
  - Standard DPA available for all enterprise customers
  - Processor obligations clearly defined
  - Sub-processor list maintained and updated

- **Data Retention**:
  - Analytics data: 90 days (configurable)
  - User data: Until account deletion
  - Audit logs: 1 year

- **Breach Notification**:
  - Automated alerts for suspicious activities
  - Incident response team on standby
  - Notification within 72 hours of detection

### ISO 27001 (Information Security Management)
**Status**: ✅ Framework Implemented

**Key Controls:**
- Access controls (role-based, multi-factor)
- Cryptographic controls (AES-256, TLS 1.3)
- Physical and environmental security
- Change management procedures
- Incident management procedures
- Business continuity planning

### CCPA (California Consumer Privacy Act)
**Status**: ✅ Compliant

**Implementation:**
- "Do Not Sell My Personal Information" option
- CCPA-specific data request handling
- Opt-out tracking for California residents

## Encryption & Data Protection

### Data Encryption at Rest

**Database Encryption:**
```sql
-- All sensitive fields encrypted
-- Encryption key stored separately in AWS KMS

CREATE EXTENSION pgcrypto;

ALTER TABLE users ADD COLUMN email_encrypted TEXT;
UPDATE users SET email_encrypted = pgp_sym_encrypt(email, 'encryption-key');

-- Queries use transparent decryption:
SELECT pgp_sym_decrypt(email_encrypted, 'encryption-key') as email FROM users;
```

**Encryption Standards:**
- Algorithm: AES-256-CBC
- IV: Random 16-byte value per record
- Key Management: AWS KMS or HashiCorp Vault
- Key Rotation: Quarterly automated rotation

### Data Encryption in Transit

**TLS Configuration:**
- Protocol: TLS 1.3 minimum
- Cipher Suites: ECDHE-ECDSA-AES256-GCM-SHA384, ECDHE-RSA-AES256-GCM-SHA384
- Certificate: Let's Encrypt (auto-renewed)
- HSTS: Max-Age 31536000 seconds

**Email Protection:**
- TLS required for SMTP connections
- SPF, DKIM, DMARC records configured
- Unsubscribe links authenticated

## Authentication & Authorization

### Passwordless Authentication (Magic Links)

**Security Properties:**
- One-time use tokens
- 15-minute expiration
- Cryptographically random (256-bit entropy)
- Token hash stored in DB (token never stored in plain text)
- Rate limiting: 5 attempts per 15 minutes per email

**Flow:**
```
1. User requests magic link
   → Token generated: crypto.randomBytes(32).toString('hex')
   → Token hashed: SHA-256
   → Email sent with plain token (one-time only)
   → Plain token cannot be replayed

2. User clicks link
   → Token extracted from URL
   → Hash computed and compared with DB record
   → Token marked as used
   → User logged in with JWT
```

### JWT Token Management

**Token Structure:**
```json
{
  "sub": "user-id",
  "org": "organization-id",
  "role": "admin|trainer|employee",
  "iat": 1234567890,
  "exp": 1234654290,
  "jti": "unique-token-id"
}
```

**Token Security:**
- Signed with HS256 (secret key) or RS256 (RSA keypair)
- Includes jti for token revocation
- Short expiry: 7 days
- Refresh tokens: 30 days, rotated on use

**Token Blacklist (Revocation):**
```python
# Store in Redis with expiry matching token expiry
redis.setex(f"revoked_token:{jti}", expiry_seconds, "1")

# Check on each request:
if redis.exists(f"revoked_token:{jti}"):
    raise UnauthorizedError("Token has been revoked")
```

### Role-Based Access Control (RBAC)

**Roles & Permissions:**
```python
ROLES = {
    'admin': {
        'permissions': [
            'manage_users',
            'manage_courses',
            'manage_campaigns',
            'view_analytics',
            'export_data'
        ]
    },
    'trainer': {
        'permissions': [
            'create_courses',
            'create_campaigns',
            'view_own_analytics'
        ]
    },
    'employee': {
        'permissions': [
            'view_courses',
            'complete_courses',
            'view_own_progress'
        ]
    }
}
```

**Middleware Implementation:**
```typescript
async function requirePermission(permission: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    const userPermissions = ROLES[user.role].permissions;
    
    if (!userPermissions.includes(permission)) {
      throw new ForbiddenError('Insufficient permissions');
    }
    next();
  };
}
```

## Security Best Practices

### API Security

1. **Rate Limiting:**
   - General API: 1000 requests/hour per IP
   - Magic link generation: 5 attempts/15 min
   - Login attempts: 10 attempts/15 min

2. **Input Validation:**
   - Schema validation on all inputs
   - SQL injection prevention via parameterized queries
   - XSS prevention via output encoding

3. **CORS Configuration:**
   ```typescript
   cors({
     origin: ['https://app.example.com', 'https://admin.example.com'],
     credentials: true,
     methods: ['GET', 'POST', 'PUT', 'DELETE'],
     allowedHeaders: ['Content-Type', 'Authorization']
   })
   ```

4. **Secure Headers:**
   - Content-Security-Policy
   - X-Content-Type-Options: nosniff
   - X-Frame-Options: DENY
   - X-XSS-Protection: 1; mode=block

### Database Security

1. **Connection Security:**
   - SSL/TLS required for all connections
   - Connection pooling (pgBouncer)
   - IP whitelist for database access

2. **Access Control:**
   - Separate read/write database users
   - Row-level security via RLS policies
   - Principle of least privilege

3. **Audit Logging:**
   ```sql
   CREATE TABLE audit_log (
     id UUID PRIMARY KEY,
     actor_id UUID,
     action VARCHAR(50),
     resource_type VARCHAR(50),
     resource_id UUID,
     changes JSONB,
     timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   ```

### Application Security

1. **Dependency Management:**
   - Automated dependency scanning (Dependabot)
   - Regular security updates
   - No outdated or vulnerable packages

2. **Secret Management:**
   - Secrets stored in environment variables
   - Never commit secrets to git
   - Use AWS Secrets Manager or HashiCorp Vault

3. **Code Security:**
   - Regular security audits
   - Penetration testing (quarterly)
   - SAST and DAST scanning in CI/CD

## Incident Response

### Security Incident Procedure

```
1. Detection
   ↓ (Alert from monitoring system)
2. Containment
   ↓ (Isolate affected systems)
3. Investigation
   ↓ (Analyze logs and data)
4. Eradication
   ↓ (Fix the vulnerability)
5. Recovery
   ↓ (Restore normal operations)
6. Post-Incident Review
   ↓ (Document and learn)
```

### Contact & Escalation

- Security Team: security@lomda-app.com
- Incident Hotline: +1-XXX-XXX-XXXX
- PagerDuty Escalation for critical incidents

## Compliance Monitoring

### Automated Checks

```bash
# Run daily
npm run security:audit         # Check dependencies
npm run security:scan          # SAST scanning
npm run encryption:verify      # Verify encryption
npm run database:backups       # Test backup restore
```

### Compliance Reports

- GDPR Readiness: Quarterly
- ISO 27001 Assessment: Annual
- Penetration Test: Bi-annual
- Vulnerability Scan: Weekly

## Customer Data Responsibility

### Organization Responsibilities

- Obtain proper consent from employees
- Maintain accurate contact information
- Comply with local data protection laws
- Inform employees about data collection

### Lomda Responsibilities

- Protect data with industry-standard security
- Ensure authorized access only
- Notify of data breaches within 72 hours
- Support compliance audits

## Security Documentation

For detailed security information:
- See [SECURITY.md](./SECURITY.md) for implementation details
- Review [architecture](./ARCHITECTURE.md) for system design
- Check [deployment](./DEPLOYMENT.md) for production setup
