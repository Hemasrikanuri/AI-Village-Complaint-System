import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Inject JWT token into requests automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('gramsetu_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Global response error handler
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token on unauthorized if not on login page
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('gramsetu_token');
        localStorage.removeItem('gramsetu_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
