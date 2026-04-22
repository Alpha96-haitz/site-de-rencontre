import api from '../api/client';

export const userService = {
  suggestions: (limit = 20, recycle = false) => 
    api.get(`/users/suggestions?limit=${limit}${recycle ? '&recycle=true' : ''}`).then((r) => r.data),
  search: (q) => api.get(`/users/search?q=${encodeURIComponent(q)}&limit=30`).then((r) => r.data),
  getProfile: (idOrUsername) => api.get(`/users/${idOrUsername}`).then((r) => r.data),
  follow: (userId) => api.put(`/users/${userId}/follow`).then((r) => r.data),
  unfollow: (userId) => api.put(`/users/${userId}/unfollow`).then((r) => r.data),
  updateProfile: (payload) => api.put('/users/profile', payload).then((r) => r.data),
  uploadPhoto: (formData) => api.post('/users/photos', formData, { timeout: 60000, headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data),
  uploadCover: (formData) => api.post('/users/cover', formData, { timeout: 60000, headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data),
  setPrimaryPhoto: (publicId) => api.put(`/users/photos/${encodeURIComponent(publicId)}/primary`).then((r) => r.data),
  deletePhoto: (publicId) => api.delete(`/users/photos/${encodeURIComponent(publicId)}`).then((r) => r.data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`).then((r) => r.data)
};
