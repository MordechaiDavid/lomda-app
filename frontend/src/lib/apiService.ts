// API service for making requests
import axios, { AxiosInstance } from 'axios';

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
      timeout: 10000,
      withCredentials: true,
    });

    // Handle API auth failures
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        const status = error.response?.status;
        const requestUrl = error.config?.url || '';

        const authBypassPaths = ['/auth/login', '/auth/magic-link', '/auth/verify-token', '/auth/logout'];
        const shouldBypassRedirect = authBypassPaths.some((path) => requestUrl.includes(path));

        if (status === 401 && !shouldBypassRedirect) {
          window.location.href = '/login';
        }

        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  sendMagicLink(email: string) {
    return this.client.post('/auth/magic-link', { email });
  }

  login(email: string, password: string) {
    return this.client.post('/auth/login', { email, password });
  }

  verifyToken(token: string) {
    return this.client.post('/auth/verify-token', { token });
  }

  logout() {
    return this.client.post('/auth/logout');
  }

  getCurrentUser() {
    return this.client.get('/auth/me');
  }

  // Courses endpoints
  getCourses(page = 1, pageSize = 20) {
    return this.client.get('/courses', { params: { page, pageSize } });
  }

  getCourse(id: string) {
    return this.client.get(`/courses/${id}`);
  }

  createCourse(data: any) {
    return this.client.post('/courses', data);
  }

  // Enrollments endpoints
  getMyProgress() {
    return this.client.get('/enrollments/my-progress');
  }

  updateProgress(courseId: string, data: any) {
    return this.client.post(`/enrollments/${courseId}/progress`, data);
  }

  submitQuiz(courseId: string, answers: any) {
    return this.client.post(`/enrollments/${courseId}/quiz`, { answers });
  }

  // Campaigns endpoints
  createCampaign(data: any) {
    return this.client.post('/campaigns', data);
  }

  getCampaignAnalytics(campaignId: string) {
    return this.client.get(`/campaigns/${campaignId}/analytics`);
  }

  // Analytics endpoints
  getDashboard() {
    return this.client.get('/analytics/dashboard');
  }

  bulkUploadUsers(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.client.post('/users/bulk-upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }

  // Users (admin)
  getUsers(page = 1, pageSize = 20, search?: string) {
    return this.client.get('/users', { params: { page, pageSize, ...(search ? { search } : {}) } });
  }

  getUser(id: string) {
    return this.client.get(`/users/${id}`);
  }

  createUser(data: { name: string; email: string; password: string; role: string }) {
    return this.client.post('/users', data);
  }

  updateUser(id: string, data: { name?: string; email?: string; role?: string; password?: string; is_active?: boolean }) {
    return this.client.put(`/users/${id}`, data);
  }

  deleteUser(id: string) {
    return this.client.delete(`/users/${id}`);
  }
}

export const apiService = new ApiService();
