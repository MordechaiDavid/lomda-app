// API service for making requests
import axios, { AxiosInstance } from 'axios';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
      timeout: 10000,
    });

    // Add token to requests
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/auth';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  sendMagicLink(email: string) {
    return this.client.post('/auth/magic-link', { email });
  }

  verifyToken(token: string) {
    return this.client.post('/auth/verify-token', { token });
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

  // Users endpoints
  getCurrentUser() {
    return this.client.get('/users/me');
  }

  bulkUploadUsers(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.client.post('/users/bulk-upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }
}

export const apiService = new ApiService();
