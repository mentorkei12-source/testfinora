import axios from 'axios';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  adminLogin: (data) => api.post('/auth/admin/login', data),
  me: () => api.get('/auth/me'),
};

// User
export const userAPI = {
  dashboard: () => api.get('/user/dashboard'),
  transactions: () => api.get('/user/transactions'),
  referrals: () => api.get('/user/referrals'),
  vipActive: () => api.get('/user/vip/active'),
  purchaseVip: (plan_id) => api.post('/user/vip/purchase', { plan_id }),
  createDeposit: (formData) => api.post('/user/deposits', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deposits: () => api.get('/user/deposits'),
  createWithdrawal: (data) => api.post('/user/withdrawals', data),
  withdrawals: () => api.get('/user/withdrawals'),
  notifications: () => api.get('/user/notifications'),
  markNotificationRead: (id) => api.put(`/user/notifications/${id}/read`),
};

// Public
export const publicAPI = {
  vipPlans: () => api.get('/vip-plans'),
  settings: () => api.get('/settings'),
  announcements: () => api.get('/announcements'),
};

// Admin
export const adminAPI = {
  stats: () => api.get('/admin/stats'),
  users: (params) => api.get('/admin/users', { params }),
  getUser: (id) => api.get(`/admin/users/${id}`),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  adjustBalance: (id, data) => api.post(`/admin/users/${id}/adjust-balance`, data),
  resetUserPassword: (id, data) => api.post(`/admin/users/${id}/reset-password`, data),
  vipPlans: () => api.get('/admin/vip-plans'),
  createVip: (data) => api.post('/admin/vip-plans', data),
  updateVip: (id, data) => api.put(`/admin/vip-plans/${id}`, data),
  deleteVip: (id) => api.delete(`/admin/vip-plans/${id}`),
  deposits: (params) => api.get('/admin/deposits', { params }),
  processDeposit: (id, data) => api.put(`/admin/deposits/${id}`, data),
  withdrawals: (params) => api.get('/admin/withdrawals', { params }),
  processWithdrawal: (id, data) => api.put(`/admin/withdrawals/${id}`, data),
  settings: () => api.get('/admin/settings'),
  updateSettings: (data) => api.put('/admin/settings', data),
  createAnnouncement: (data) => api.post('/admin/announcements', data),
  updateAnnouncement: (id, data) => api.put(`/admin/announcements/${id}`, data),
  deleteAnnouncement: (id) => api.delete(`/admin/announcements/${id}`),
  auditLogs: (params) => api.get('/admin/audit-logs', { params }),
};
