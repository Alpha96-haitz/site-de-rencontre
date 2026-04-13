import api from '../api/client';

export const authService = {
  signup: (payload) => api.post('/auth/signup', payload).then((r) => r.data),
  login: (payload) => api.post('/auth/login', payload).then((r) => r.data),
  google: (credential) => api.post('/auth/google', { credential }).then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
  logout: () => api.post('/auth/logout').then((r) => r.data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }).then((r) => r.data),
  verifyResetCode: (email, code) => api.post('/auth/verify-reset-code', { email, code }).then((r) => r.data),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }).then((r) => r.data),
  verifyEmail: (code) => api.post('/auth/verify-email', { code }).then((r) => r.data)
};
