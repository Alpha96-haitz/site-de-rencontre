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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si on n'a pas de réponse du tout (problème réseau ou serveur éteint)
    if (!error.response) {
      error.message = "Connexion impossible. Vérifiez votre connexion internet ou réessayez plus tard.";
      if (error.data) error.data.message = error.message;
      else error.data = { message: error.message };
    }
    return Promise.reject(error);
  }
);

export default api;
