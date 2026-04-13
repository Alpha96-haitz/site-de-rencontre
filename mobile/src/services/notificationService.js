import api from '../api/client';

export const notificationService = {
  list: () => api.get('/notifications').then((r) => r.data),
  unreadCount: () => api.get('/notifications/unread-count').then((r) => r.data),
  markAllRead: () => api.put('/notifications/mark-all-read').then((r) => r.data),
  markRead: (id) => api.put(`/notifications/${id}`).then((r) => r.data)
};
