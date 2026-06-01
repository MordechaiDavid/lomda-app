// Constants for the entire application

// Roles & Permissions
export const USER_ROLES = {
  ADMIN: 'admin',
  TRAINER: 'trainer',
  EMPLOYEE: 'employee',
  VIEWER: 'viewer'
} as const;

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ['manage_users', 'manage_courses', 'manage_campaigns', 'view_analytics', 'manage_org'],
  trainer: ['manage_courses', 'manage_campaigns', 'view_analytics'],
  employee: ['view_courses', 'complete_courses'],
  viewer: ['view_analytics']
};

// Enrollment Status
export const ENROLLMENT_STATUSES = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  ARCHIVED: 'archived'
} as const;

// Campaign Status
export const CAMPAIGN_STATUSES = {
  DRAFT: 'draft',
  SCHEDULED: 'scheduled',
  SENT: 'sent',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
} as const;

// Event Types
export const EVENT_TYPES = {
  COURSE_OPENED: 'course_opened',
  CONTENT_VIEWED: 'content_viewed',
  QUIZ_ANSWERED: 'quiz_answered',
  COURSE_COMPLETED: 'course_completed',
  EMAIL_OPENED: 'email_opened',
  LINK_CLICKED: 'link_clicked'
} as const;

// Time Constants
export const TOKEN_EXPIRY = {
  MAGIC_LINK: 15 * 60 * 1000, // 15 minutes
  JWT: 7 * 24 * 60 * 60 * 1000, // 7 days
  REFRESH: 30 * 24 * 60 * 60 * 1000 // 30 days
} as const;

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Validation
export const PASSWORD_MIN_LENGTH = 8;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// File Upload
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'video/mp4'];

// Email Templates
export const EMAIL_TEMPLATES = {
  MAGIC_LINK: 'magic_link',
  CAMPAIGN_SENT: 'campaign_sent',
  COMPLETION: 'course_completion',
  QUIZ_FAILURE: 'quiz_failure',
  REMINDER: 'reminder'
} as const;

// Quiz Constants
export const QUIZ_TYPES = {
  MULTIPLE_CHOICE: 'multiple-choice',
  TRUE_FALSE: 'true-false'
} as const;

export const PASSING_SCORE = 70; // percentage

// Rate Limiting
export const RATE_LIMITS = {
  MAGIC_LINK: {
    window: 15 * 60 * 1000, // 15 minutes
    max: 5 // 5 attempts
  },
  API: {
    window: 60 * 60 * 1000, // 1 hour
    max: 1000 // 1000 requests
  }
} as const;

// Error Codes
export const ERROR_CODES = {
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  COURSE_NOT_FOUND: 'COURSE_NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  EMAIL_SEND_ERROR: 'EMAIL_SEND_ERROR',
  DUPLICATE_EMAIL: 'DUPLICATE_EMAIL'
} as const;

// API Versions
export const API_VERSION = 'v1';
export const API_BASE_PATH = '/api/v1';

// Supported Languages
export const SUPPORTED_LANGUAGES = ['en', 'he'] as const;
export const DEFAULT_LANGUAGE = 'en';

// Feature Flags
export const FEATURE_FLAGS = {
  ENABLE_ANALYTICS: true,
  ENABLE_EXPORT: true,
  ENABLE_AUTO_REMINDERS: true,
  ENABLE_PUBLIC_LINKS: true,
  ENABLE_QUIZ: true
} as const;
