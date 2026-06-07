import axios, { AxiosInstance } from 'axios';
import type { ContentBlock } from '../types/course';

function resolveApiBaseUrl() {
  const envUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const normalizedUrl = envUrl.replace(/\/+$/, '');
  return normalizedUrl.endsWith('/api/v1') ? normalizedUrl : `${normalizedUrl}/api/v1`;
}

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: resolveApiBaseUrl(),
      timeout: 15000,
      withCredentials: true
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        const status = error.response?.status;
        const requestUrl = error.config?.url || '';
        const authBypassPaths = ['/auth/login', '/auth/magic-link', '/auth/verify-token', '/auth/logout'];
        if (status === 401 && !authBypassPaths.some((p) => requestUrl.includes(p))) {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // ─── Auth ───────────────────────────────────────────────────────────────
  sendMagicLink = (email: string) => this.client.post('/auth/magic-link', { email });
  login = (email: string, password: string) => this.client.post('/auth/login', { email, password });
  verifyToken = (token: string) => this.client.post('/auth/verify-token', { token });
  logout = () => this.client.post('/auth/logout');
  getCurrentUser = () => this.client.get('/auth/me');

  // ─── Courses ─────────────────────────────────────────────────────────────
  getCourses = (page = 1, pageSize = 20) =>
    this.client.get('/courses', { params: { page, pageSize } });

  getCourse = (id: string) => this.client.get(`/courses/${id}`);

  createCourse = (data: {
    title: string;
    description?: string;
    content?: ContentBlock[];
    quizzes?: unknown[];
    passing_score?: number;
    thumbnail_url?: string;
    background_music_url?: string;
    estimated_minutes?: number;
  }) => this.client.post('/courses', data);

  updateCourse = (id: string, data: {
    title?: string;
    description?: string;
    content?: ContentBlock[];
    quizzes?: unknown[];
    passing_score?: number;
    thumbnail_url?: string | null;
    background_music_url?: string | null;
    estimated_minutes?: number | null;
  }) => this.client.put(`/courses/${id}`, data);

  publishCourse = (id: string) => this.client.post(`/courses/${id}/publish`);

  deleteCourse = (id: string) => this.client.delete(`/courses/${id}`);

  // ─── Enrollments ─────────────────────────────────────────────────────────
  enrollInCourse = (course_id: string) => this.client.post('/enrollments', { course_id });

  getMyEnrollments = () => this.client.get('/enrollments/my');

  getEnrollment = (id: string) => this.client.get(`/enrollments/${id}`);

  updateProgress = (enrollmentId: string, data: { current_step?: number; time_spent_sec?: number }) =>
    this.client.put(`/enrollments/${enrollmentId}/progress`, data);

  submitQuiz = (
    enrollmentId: string,
    answers: Record<string, string>,
    campaignToken?: string
  ) =>
    this.client.post(
      `/enrollments/${enrollmentId}/quiz`,
      { answers },
      campaignToken ? { headers: { 'x-campaign-token': campaignToken } } : undefined
    );

  // ─── Learn (public token resolution) ────────────────────────────────────
  resolveLearnToken = (token: string) => this.client.get(`/learn/${token}`);

  // ─── Campaigns ───────────────────────────────────────────────────────────
  getCampaigns = () => this.client.get('/campaigns');

  createCampaign = (data: {
    title: string;
    course_id: string;
    due_date?: string;
    passing_score?: number;
  }) => this.client.post('/campaigns', data);

  updateCampaign = (id: string, data: { title?: string; due_date?: string; passing_score?: number }) =>
    this.client.put(`/campaigns/${id}`, data);

  deleteCampaign = (id: string) => this.client.delete(`/campaigns/${id}`);

  getCampaign = (id: string) => this.client.get(`/campaigns/${id}`);

  addCampaignRecipients = (id: string, emails: string[]) =>
    this.client.post(`/campaigns/${id}/recipients`, { emails });

  sendCampaign = (id: string) => this.client.post(`/campaigns/${id}/send`);

  getCampaignAnalytics = (id: string) => this.client.get(`/campaigns/${id}/analytics`);

  // ─── Reports ─────────────────────────────────────────────────────────────
  getComplianceReport = (params?: { courseId?: string; from?: string; to?: string; format?: 'csv' | 'json' }) =>
    this.client.get('/campaigns/reports/compliance', {
      params,
      responseType: params?.format === 'csv' ? 'blob' : 'json'
    });

  // ─── Files ───────────────────────────────────────────────────────────────
  uploadFile = (file: File, onProgress?: (pct: number) => void) => {
    const formData = new FormData();
    formData.append('file', file);
    return this.client.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total));
      }
    });
  };

  // ─── Analytics ───────────────────────────────────────────────────────────
  getDashboard = () => this.client.get('/analytics/dashboard');

  // ─── Users (admin) ───────────────────────────────────────────────────────
  getUsers = (page = 1, pageSize = 20, search?: string) =>
    this.client.get('/users', { params: { page, pageSize, ...(search ? { search } : {}) } });

  getUser = (id: string) => this.client.get(`/users/${id}`);

  createUser = (data: { name: string; email: string; password: string; role: string }) =>
    this.client.post('/users', data);

  updateUser = (id: string, data: { name?: string; email?: string; role?: string; password?: string; is_active?: boolean }) =>
    this.client.put(`/users/${id}`, data);

  deleteUser = (id: string) => this.client.delete(`/users/${id}`);

  bulkUploadUsers = (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return this.client.post('/users/bulk-upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  };
}

export const apiService = new ApiService();
