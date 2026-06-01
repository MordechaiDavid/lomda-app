// Shared types for the entire application

// Authentication & User Types
export interface User {
  id: string;
  organizationId: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string;
  team?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

export enum UserRole {
  ADMIN = 'admin',
  TRAINER = 'trainer',
  EMPLOYEE = 'employee',
  VIEWER = 'viewer'
}

export interface MagicToken {
  id: string;
  organizationId: string;
  userId?: string;
  email: string;
  token: string;
  expiresAt: Date;
  usedAt?: Date;
  createdAt: Date;
}

// Course Types
export interface Course {
  id: string;
  organizationId: string;
  title: string;
  description: string;
  content: CourseContent[];
  quizzes: Quiz[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  isPublished: boolean;
  thumbnail?: string;
  estimatedDuration: number; // minutes
}

export interface CourseContent {
  id: string;
  type: 'text' | 'image' | 'video' | 'heading';
  content: string;
  order: number;
  metadata?: Record<string, any>;
}

export interface Quiz {
  id: string;
  courseId: string;
  question: string;
  type: 'multiple-choice' | 'true-false';
  options: QuizOption[];
  correctAnswer: string;
  order: number;
}

export interface QuizOption {
  id: string;
  text: string;
  order: number;
}

// Enrollment & Progress Types
export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  organizationId: string;
  startedAt: Date;
  completedAt?: Date;
  progress: number; // 0-100
  currentStep: number;
  status: EnrollmentStatus;
}

export enum EnrollmentStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ARCHIVED = 'archived'
}

export interface QuizResponse {
  id: string;
  enrollmentId: string;
  quizId: string;
  answer: string;
  isCorrect: boolean;
  answeredAt: Date;
}

// Campaign Types
export interface Campaign {
  id: string;
  organizationId: string;
  courseId: string;
  name: string;
  description?: string;
  status: CampaignStatus;
  userGroups: string[]; // user IDs or groups
  scheduledAt?: Date;
  sentAt?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum CampaignStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  SENT = 'sent',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface CampaignReminder {
  id: string;
  campaignId: string;
  type: ReminderType;
  delayHours: number;
  sentAt?: Date;
}

export enum ReminderType {
  FIRST_OPEN = 'first_open',
  COMPLETION = 'completion',
  QUIZ_FAILURE = 'quiz_failure'
}

// Analytics Types
export interface AnalyticsEvent {
  id: string;
  organizationId: string;
  userId: string;
  courseId: string;
  eventType: EventType;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export enum EventType {
  COURSE_OPENED = 'course_opened',
  CONTENT_VIEWED = 'content_viewed',
  QUIZ_ANSWERED = 'quiz_answered',
  COURSE_COMPLETED = 'course_completed',
  EMAIL_OPENED = 'email_opened',
  LINK_CLICKED = 'link_clicked'
}

export interface CampaignAnalytics {
  campaignId: string;
  totalSent: number;
  totalOpened: number;
  totalEngaged: number;
  totalCompleted: number;
  openRate: number;
  engagementRate: number;
  completionRate: number;
  averageQuizScore: number;
}

// Organization Types
export interface Organization {
  id: string;
  name: string;
  email: string;
  domain?: string;
  logo?: string;
  encryptionKey: string;
  createdAt: Date;
  updatedAt: Date;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Request/Response DTOs
export interface MagicLinkRequest {
  email: string;
  organizationId?: string;
}

export interface VerifyTokenRequest {
  token: string;
  organizationId?: string;
}

export interface CreateCourseRequest {
  title: string;
  description: string;
  content: CourseContent[];
  quizzes?: Quiz[];
  thumbnail?: string;
}

export interface UpdateProgressRequest {
  currentStep: number;
  progress: number;
}

export interface CreateCampaignRequest {
  courseId: string;
  name: string;
  description?: string;
  userIds: string[];
  scheduledAt?: Date;
  reminders?: Array<{
    type: ReminderType;
    delayHours: number;
  }>;
}

export interface BulkUploadUsersRequest {
  users: Array<{
    email: string;
    name: string;
    department?: string;
    team?: string;
  }>;
}
