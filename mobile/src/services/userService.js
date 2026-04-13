import api from '../api/client';

export const userService = {
  suggestions: (limit = 20) => api.get(`/users/suggestions?limit=${limit}`).then((r) => r.data),
  search: (q) => api.get(`/users/search?q=${encodeURIComponent(q)}&limit=30`).then((r) => r.data),
  getProfile: (idOrUsername) => api.get(`/users/${idOrUsername}`).then((r) => r.data),
  updateProfile: (payload) => api.put('/users/profile', payload).then((r) => r.data),
  uploadPhoto: (formData) => api.post('/users/photos', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data),
  uploadCover: (formData) => api.post('/users/cover', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`).then((r) => r.data)
};
