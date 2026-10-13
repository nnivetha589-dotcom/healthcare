import axios from 'axios';

const API_BASE = 'http://127.0.0.1:5005/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: (userId) => api.get(`/profile/${userId}`),
  updateProfile: (userId, data) => api.put(`/profile/${userId}`, data),
  deleteAccount: (userId) => api.delete(`/profile/${userId}`)
};

export const chatAPI = {
  sendMessage: (userId, message, language, includeReports) => 
    api.post('/chat', { user_id: userId, message, language, include_reports: includeReports }),
  getHistory: (userId) => api.get(`/chat/history/${userId}`),
  clearHistory: (userId) => api.delete(`/chat/history/${userId}`)
};

export const reportsAPI = {
  uploadReport: (formData) => api.post('/reports/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getReports: (userId) => api.get(`/reports/${userId}`),
  deleteReport: (reportId) => api.delete(`/reports/detail/${reportId}`),
  compareReports: (userId, rep1, rep2) => 
    api.get(`/reports/compare?user_id=${userId}&rep1=${rep1}&rep2=${rep2}`)
};

export const healthTwinAPI = {
  getLogs: (userId) => api.get(`/health-logs/${userId}`),
  addLog: (userId, logData) => api.post(`/health-logs/${userId}`, logData),
  updateLog: (logId, data) => api.put(`/health-logs/entry/${logId}`, data),
  deleteLog: (logId) => api.delete(`/health-logs/entry/${logId}`)
};

export const plannerAPI = {
  getReminders: (userId) => api.get(`/reminders/${userId}`),
  addReminder: (userId, data) => api.post(`/reminders/${userId}`, data),
  updateStatus: (reminderId, status) => api.patch(`/reminders/status/${reminderId}`, { status }),
  deleteReminder: (reminderId) => api.delete(`/reminders/status/${reminderId}`)
};

export const familyCareAPI = {
  getDoctorSummaries: (userId) => api.get(`/doctor-summaries/${userId}`),
  createDoctorSummary: (userId, data) => api.post(`/doctor-summaries/${userId}`, data),
  getFamilyShares: (userId) => api.get(`/family-shares/${userId}`),
  grantShare: (userId, data) => api.post(`/family-shares/${userId}`, data),
  revokeShare: (shareId) => api.delete(`/family-shares/revoke/${shareId}`),
  getSharedRecords: (token) => api.get(`/shared-records/${token}`)
};

export const systemAPI = {
  healthCheck: () => api.get('/health-check'),
  initSampleData: () => api.post('/init-sample-data')
};

export default api;
