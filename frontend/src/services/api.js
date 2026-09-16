import axios from 'axios';

// Smart resolution for API Base URL across Local Dev, Docker, and Render Cloud Deployments
const getApiBaseUrl = () => {
  let envUrl = import.meta.env.VITE_API_BASE_URL;

  // 1. Explicitly configured environment variable
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    envUrl = envUrl.trim();
    if (!envUrl.startsWith('http://') && !envUrl.startsWith('https://') && !envUrl.startsWith('/')) {
      envUrl = `https://${envUrl}`;
    }
    envUrl = envUrl.replace(/\/+$/, '');
    if (!envUrl.endsWith('/api/v1')) {
      envUrl = `${envUrl}/api/v1`;
    }
    return envUrl;
  }

  // 2. Dynamic Auto-detection for Render Deployment (e.g., gramsetu-frontend-xxxx.onrender.com -> gramsetu-backend-xxxx.onrender.com)
  if (typeof window !== 'undefined' && window.location && window.location.hostname.includes('.onrender.com')) {
    const backendHost = window.location.hostname.replace('frontend', 'backend');
    return `https://${backendHost}/api/v1`;
  }

  // 3. Default fallback for local dev proxy
  return '/api/v1';
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
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
