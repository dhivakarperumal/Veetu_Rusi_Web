import axios from "axios";

const api = axios.create({
  // baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api"
  baseURL: import.meta.env.VITE_API_URL || "https://veeturusi.qtechx.com/api"
});

// Automatically inject JWT token into requests
api.interceptors.request.use(
  (config) => {
    // Prefer token from localStorage, fall back to sessionStorage
    const rawToken = localStorage.getItem("token") || sessionStorage.getItem("token") || "";
    const token = typeof rawToken === 'string' ? rawToken.trim() : "";
    if (token && token !== 'undefined' && token !== 'null') {
      config.headers = config.headers || {};
      config.headers["Authorization"] = `Bearer ${token}`;
      // Some backend consumers also check this header
      config.headers['x-access-token'] = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const storedToken = localStorage.getItem('token') || sessionStorage.getItem('token');
      const hasToken = typeof storedToken === 'string' && storedToken.trim() !== '';

      console.error('API request unauthorized:', error.config?.url, 'token present:', hasToken);
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');

      // Public pages may make optional authenticated requests, so do not
      // redirect visitors to login when no session exists.
      try {
        const currentRoute = `${window.location.pathname}${window.location.hash}`;
        if (hasToken && !currentRoute.includes('/login')) {
          window.location.hash = '/login';
        }
      } catch {
        // ignore navigation errors in non-browser environments
      }
    }
    return Promise.reject(error);
  }
);

export default api;