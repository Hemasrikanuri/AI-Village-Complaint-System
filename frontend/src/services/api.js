import axios from 'axios';

const formatUrl = (url) => {
  let cleaned = url.trim();
  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://') && !cleaned.startsWith('/')) {
    cleaned = `https://${cleaned}`;
  }
  cleaned = cleaned.replace(/\/+$/, '');
  if (!cleaned.endsWith('/api/v1')) {
    cleaned = `${cleaned}/api/v1`;
  }
  return cleaned;
};

// Smart resolution for API Base URL across Local Dev, Docker, and Render Cloud Deployments
export const getApiBaseUrl = () => {
  // 0. Check localStorage override (allows setting custom backend URL directly in browser)
  if (typeof localStorage !== 'undefined') {
    const localOverride = localStorage.getItem('GRAMSETU_BACKEND_URL') || localStorage.getItem('VITE_API_BASE_URL');
    if (localOverride && localOverride.trim() !== '') {
      return formatUrl(localOverride);
    }
  }

  // 1. Explicitly configured environment variable from Vite build
  let envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    return formatUrl(envUrl);
  }

  // 2. Dynamic Auto-detection for Render Deployment
  if (typeof window !== 'undefined' && window.location && window.location.hostname.includes('.onrender.com')) {
    const hostname = window.location.hostname;
    // Replace 'frontend' or 'frontend-XXXX' with 'backend'
    const backendHost = hostname.replace(/frontend[a-z0-9-]*/i, 'backend');
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
  // Ensure baseURL is dynamically updated if localStorage changed
  config.baseURL = getApiBaseUrl();
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
