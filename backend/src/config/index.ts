// Configuration for the backend application
import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  apiUrl: process.env.API_URL || 'http://localhost:3001',

  // Database
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'lomda_db'
  },

  // Redis
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  },

  // JWT & Auth
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRY || '7d'
  },

  // Magic Link
  magicLink: {
    secret: process.env.MAGIC_LINK_SECRET || 'magic-link-secret',
    expiryMinutes: parseInt(process.env.MAGIC_LINK_EXPIRY || '15', 10)
  },

  // Email Service
  email: {
    provider: (process.env.EMAIL_PROVIDER || 'sendgrid') as 'sendgrid' | 'aws_ses',
    sendgrid: {
      apiKey: process.env.SENDGRID_API_KEY || ''
    },
    awsSes: {
      region: process.env.AWS_SES_REGION || 'us-east-1',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
    },
    from: process.env.SENDGRID_FROM_EMAIL || '',
    fromName: process.env.SENDGRID_FROM_NAME || 'Lomda App'
  },

  // Microsoft Entra ID (Azure AD) — single-org POC values, read from .env.
  // Long-term these live per-organization in the `organizations` table.
  entra: {
    tenantId: process.env.ENTRA_TENANT_ID || '',
    clientId: process.env.ENTRA_CLIENT_ID || '',
    clientSecret: process.env.ENTRA_CLIENT_SECRET || '',
    // DEV ONLY: when 'true', sync returns sample employees without calling Microsoft Graph,
    // so you can exercise the whole feature before a real Entra tenant is wired up.
    // Remove ENTRA_MOCK (or set it to anything but 'true') once real credentials are in place.
    mock: process.env.ENTRA_MOCK === 'true'
  },

  // AI (Anthropic Claude) — powers the in-builder lomda chatbot.
  ai: {
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
    // Cheap default that fits the small stack; set AI_MODEL=claude-sonnet-4-6 for higher-quality drafts.
    model: process.env.AI_MODEL || 'claude-haiku-4-5',
    maxTokens: parseInt(process.env.AI_MAX_TOKENS || '4096', 10)
  },

  // Security
  security: {
    encryptionKey: process.env.ENCRYPTION_KEY || 'default-encryption-key',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000'
  },

  // Legacy top-level helpers
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',

  // Data Retention
  dataRetention: {
    magicTokenExpiryDays: parseInt(process.env.MAGIC_TOKEN_EXPIRY_DAYS || '1', 10),
    analyticsRetentionDays: parseInt(process.env.ANALYTICS_RETENTION_DAYS || '90', 10)
  },

  // Feature Flags
  features: {
    enableAnalytics: process.env.ENABLE_ANALYTICS === 'true',
    enableExport: process.env.ENABLE_EXPORT === 'true',
    enableAutoReminders: process.env.ENABLE_AUTO_REMINDERS === 'true'
  },

  // Pagination
  pagination: {
    defaultPageSize: parseInt(process.env.DEFAULT_PAGE_SIZE || '20', 10),
    maxPageSize: parseInt(process.env.MAX_PAGE_SIZE || '100', 10)
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10)
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  }
};

// Validation
export function validateConfig(): void {
  const requiredVars = [
    'JWT_SECRET',
    'MAGIC_LINK_SECRET',
    'DB_HOST',
    'DB_USER',
    'DB_PASSWORD'
  ];

  const missing = requiredVars.filter((v) => !process.env[v]);
  if (missing.length > 0) {
    console.warn(`⚠️  Missing environment variables: ${missing.join(', ')}`);
    // if (config.nodeEnv === 'production') {
    //   throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    // }
  }
}
