// Greenpack Pro — API Client
// Centralized Axios instance with JWT auth + error handling

import axios, { AxiosError } from 'axios';

const BASE_URL = (window as any).electronAPI?.apiUrl || 'https://greenpack-backend.onrender.com';
export const api = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  timeout: 120_000, // 120s for OCR processing
});

// ── Request interceptor: attach JWT token ────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: handle 401, show errors ───────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Try refresh token
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken && !error.config?.url?.includes('/auth/refresh')) {
        try {
          const resp = await axios.post(
            `${BASE_URL}/api/v1/auth/refresh`,
            null,
            { params: { refresh_token: refreshToken } }
          );
          const newToken = resp.data.access_token;
          localStorage.setItem('access_token', newToken);
          if (error.config) {
            error.config.headers.Authorization = `Bearer ${newToken}`;
            return api.request(error.config);
          }
        } catch {
          // Refresh failed — redirect to login
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      } else {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
  api.post('/auth/login', null, { params: { email, password } }).then(r => r.data),
  me: () => api.get('/auth/me').then(r => r.data),
  refresh: (token: string) =>
    api.post('/auth/refresh', null, { params: { refresh_token: token } }).then(r => r.data),
};

// ── Jobs ─────────────────────────────────────────────────────────────────────
export const jobsApi = {
  list: (params?: { status?: string; client?: string; limit?: number; offset?: number }) =>
    api.get('/jobs', { params }).then(r => r.data),

  create: (formData: FormData) =>
    api.post('/jobs', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then(r => r.data),

  get: (jobId: string) => api.get(`/jobs/${jobId}`).then(r => r.data),

  getResult: (jobId: string) => api.get(`/jobs/${jobId}/result`).then(r => r.data),

  downloadReport: (jobId: string) =>
    api.get(`/jobs/${jobId}/report`, { responseType: 'blob' }).then(r => r.data),

  downloadExcel: (jobId: string) =>
    api.get(`/jobs/${jobId}/export/excel`, { responseType: 'blob' }).then(r => r.data),

  print: (jobId: string) => api.post(`/jobs/${jobId}/print`).then(r => r.data),
};

// ── Multi-Up Jobs (v2.0) ─────────────────────────────────────────────────────
export const multiUpApi = {
  create: (formData: FormData) =>
    api.post('/jobs/multi-up', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data),

  getResult: (jobId: string) => api.get(`/jobs/${jobId}/multi-up`).then(r => r.data),

  getLabelDetail: (jobId: string, labelId: string) =>
    api.get(`/jobs/${jobId}/labels/${labelId}`).then(r => r.data),

  downloadSheetImage: (jobId: string) =>
    api.get(`/jobs/${jobId}/sheet-image`, { responseType: 'blob' }).then(r => r.data),
};

// ── Prepress / Pantone (v3.0) ────────────────────────────────────────────────
export const prepressApi = {
  identifyColors: (formData: FormData) =>
    api.post('/prepress/identify-colors', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data),

  trialComparison: (formData: FormData) =>
    api.post('/prepress/trial-comparison', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data),

  getJob: (jobId: string) => api.get(`/prepress/${jobId}`).then(r => r.data),

  getPantoneLibrary: (params?: { system?: string; finish?: string; limit?: number }) =>
    api.get('/prepress/pantone-library', { params }).then(r => r.data),

  importPantoneCsv: (formData: FormData) =>
    api.post('/prepress/import-pantone-csv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data),
};

// ── Templates ─────────────────────────────────────────────────────────────────
export const templatesApi = {
  list: (params?: { client?: string; search?: string }) =>
    api.get('/templates', { params }).then(r => r.data),

  create: (formData: FormData) =>
    api.post('/templates', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then(r => r.data),

  get: (id: string) => api.get(`/templates/${id}`).then(r => r.data),

  delete: (id: string) => api.delete(`/templates/${id}`).then(r => r.data),
};

// ── Scanners ─────────────────────────────────────────────────────────────────
export const scannersApi = {
  list: () => api.get('/scanners').then(r => r.data),

  capture: (deviceId: string, resolution = 300) =>
    api.post('/scanners/capture', { device_id: deviceId, resolution }).then(r => r.data),

  getPreview: (deviceId: string) =>
    api.get(`/scanners/${deviceId}/preview`).then(r => r.data),
};

// ── Batch ─────────────────────────────────────────────────────────────────────
export const batchApi = {
  create: (data: { name: string; items: any[]; notify_email?: string }) =>
    api.post('/batch', data).then(r => r.data),

  get: (batchId: string) => api.get(`/batch/${batchId}`).then(r => r.data),

  getJobs: (batchId: string) => api.get(`/batch/${batchId}/jobs`).then(r => r.data),
};

// ── Dashboard & Reports ───────────────────────────────────────────────────────
export const dashboardApi = {
  stats: () => api.get('/dashboard/stats').then(r => r.data),
};

export const reportsApi = {
  list: (params?: { limit?: number; offset?: number }) =>
    api.get('/reports', { params }).then(r => r.data),
};

// ── Settings ─────────────────────────────────────────────────────────────────
export const settingsApi = {
  get: () => api.get('/settings').then(r => r.data),
  getBackups: () => api.get('/settings/backups').then(r => r.data),
  createBackup: () => api.post('/settings/backups').then(r => r.data),
  runCleanup: () => api.post('/settings/cleanup').then(r => r.data),
  getDisk: () => api.get('/settings/disk').then(r => r.data),
};

// ── Users ─────────────────────────────────────────────────────────────────────
export const usersApi = {
  list: () => api.get('/users').then(r => r.data),
  create: (data: any) => api.post('/users', data).then(r => r.data),
  update: (id: string, data: any) => api.patch(`/users/${id}`, data).then(r => r.data),
};

// ── Health ────────────────────────────────────────────────────────────────────
export const healthApi = {
  check: () => axios.get(`${BASE_URL}/api/health`, { timeout: 5000 }).then(r => r.data),
};

// Helper: download blob as file
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
