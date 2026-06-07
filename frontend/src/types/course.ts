// ─── Content block types ───────────────────────────────────────────────────

export type BlockType = 'heading' | 'text' | 'image' | 'video' | 'quiz' | 'divider';

export interface BaseBlock {
  id: string;
  type: BlockType;
  order: number;
  /** Minimum seconds the learner must spend on this block before advancing */
  minTimeSeconds?: number;
}

export interface HeadingBlock extends BaseBlock {
  type: 'heading';
  level: 1 | 2 | 3;
  text: string;
  align?: 'left' | 'center' | 'right';
}

export interface TextBlock extends BaseBlock {
  type: 'text';
  /** Quill delta HTML output */
  html: string;
}

export interface ImageBlock extends BaseBlock {
  type: 'image';
  url: string;
  alt?: string;
  caption?: string;
  width?: 'full' | 'large' | 'medium';
}

export interface VideoBlock extends BaseBlock {
  type: 'video';
  url: string;
  provider: 'upload' | 'youtube' | 'vimeo';
  caption?: string;
  autoplay?: boolean;
  /** Learner must reach this % of the video before advancing (0-100) */
  requiredWatchPercent?: number;
}

export interface QuizOption {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  text: string;
  type: 'multiple_choice' | 'true_false';
  options: QuizOption[];
  correctOptionId: string;
  explanation?: string;
}

export interface QuizBlock extends BaseBlock {
  type: 'quiz';
  questions: QuizQuestion[];
  /** Override course-level passing score for this specific quiz block */
  passingScore?: number;
  maxAttempts?: number;
  showCorrectAnswers?: boolean;
}

export interface DividerBlock extends BaseBlock {
  type: 'divider';
  style?: 'solid' | 'dashed' | 'dotted';
}

export type ContentBlock =
  | HeadingBlock
  | TextBlock
  | ImageBlock
  | VideoBlock
  | QuizBlock
  | DividerBlock;

// ─── Step (slide) model ───────────────────────────────────────────────────

export interface CourseStep {
  id: string;
  title: string;
  order: number;
  blocks: ContentBlock[];
  /** Minimum seconds the learner must spend on this step before advancing */
  minTimeSeconds?: number;
}

// ─── Course model ──────────────────────────────────────────────────────────

export interface Course {
  id: string;
  title: string;
  description: string;
  content: ContentBlock[];
  /** Legacy flat quizzes array — new courses use QuizBlock inside content */
  quizzes: QuizQuestion[];
  passing_score: number;
  thumbnail_url: string | null;
  background_music_url: string | null;
  is_published: boolean;
  is_active: boolean;
  estimated_minutes: number | null;
  created_at: string;
  updated_at: string;
}

// ─── Enrollment model ─────────────────────────────────────────────────────

export type EnrollmentStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  status: EnrollmentStatus;
  current_step: number;
  time_spent_sec: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  /** Joined from courses table */
  course?: Pick<Course, 'id' | 'title' | 'description' | 'thumbnail_url' | 'estimated_minutes' | 'passing_score'>;
  /** Latest quiz submission score (joined) */
  latest_score?: number | null;
}

// ─── Quiz submission ───────────────────────────────────────────────────────

export interface QuizSubmission {
  id: string;
  enrollment_id: string;
  user_id: string;
  course_id: string;
  answers: Record<string, string>; // questionId → selectedOptionId
  score: number;
  passed: boolean;
  attempt_no: number;
  submitted_at: string;
}

// ─── Campaign models ───────────────────────────────────────────────────────

export type CampaignStatus = 'draft' | 'sent' | 'completed';
export type RecipientStatus = 'pending' | 'sent' | 'started' | 'completed' | 'failed' | 'expired';

export interface Campaign {
  id: string;
  title: string;
  course_id: string;
  created_by: string;
  status: CampaignStatus;
  due_date: string | null;
  passing_score: number;
  created_at: string;
  sent_at: string | null;
  /** Joined */
  course?: Pick<Course, 'id' | 'title'>;
}

export interface CampaignRecipient {
  id: string;
  campaign_id: string;
  user_id: string | null;
  email: string;
  token: string;
  email_sent_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  score: number | null;
  status: RecipientStatus;
}
