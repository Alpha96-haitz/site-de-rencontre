import api from '../api/client';

export const matchService = {
  like: (userId) => api.post(`/matches/like/${userId}`).then((r) => r.data),
  dislike: (userId) => api.post(`/matches/dislike/${userId}`).then((r) => r.data),
  list: () => api.get('/matches').then((r) => r.data),
  status: (userId) => api.get(`/matches/status/${userId}`).then((r) => r.data)
};
