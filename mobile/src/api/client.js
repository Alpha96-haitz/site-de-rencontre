import axios from 'axios';
import { API_URL } from '../config/env';

let authToken = null;

export const setApiToken = (token) => {
  authToken = token || null;
};

const api = axios.create({
  baseURL: API_URL,
  timeout: 20000
});

api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

export default api;
