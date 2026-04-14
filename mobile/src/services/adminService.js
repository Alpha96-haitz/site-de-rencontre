import api from '../api/client';

export const adminService = {
  getStats: () => api.get('/admin/stats').then((r) => r.data),
  getUsers: () => api.get('/admin/users').then((r) => r.data),
  getReports: () => api.get('/admin/reports').then((r) => r.data),
  banUser: (userId, duration = 30) => api.put(`/admin/users/${userId}/ban`, { duration }).then((r) => r.data),
  unbanUser: (userId) => api.put(`/admin/users/${userId}/unban`).then((r) => r.data),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`).then((r) => r.data),
  handleReport: (reportId, action, banUser = false) =>
    api.put(`/admin/reports/${reportId}`, { action, banUser }).then((r) => r.data),
  notifyReportedUser: (reportId, message) =>
    api.post(`/admin/reports/${reportId}/notify`, { message }).then((r) => r.data)
};
