import api from '../api/client';

export const messageService = {
  conversations: () => api.get('/messages/conversations').then((r) => r.data),
  unreadCount: () => api.get('/messages/unread-count').then((r) => r.data),
  getByMatch: (matchId) => api.get(`/messages/${matchId}?limit=50&page=1`).then((r) => r.data),
  markRead: (matchId) => api.put(`/messages/${matchId}/read`).then((r) => r.data),
  send: (matchId, payload) => api.post(`/messages/${matchId}`, payload).then((r) => r.data)
};
