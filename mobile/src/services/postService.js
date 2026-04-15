import api from '../api/client';

export const postService = {
  timeline: () => api.get('/posts/timeline?limit=30&page=1').then((r) => r.data),
  like: (postId) => api.put(`/posts/${postId}/like`).then((r) => r.data),
  comment: (postId, text) => api.post(`/posts/${postId}/comment`, { text }).then((r) => r.data),
  create: (formData) => api.post('/posts', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then((r) => r.data),
  delete: (postId) => api.delete(`/posts/${postId}`).then((r) => r.data),
  getUserPosts: (userId) => api.get(`/posts/profile/${userId}`).then((r) => r.data)
};
