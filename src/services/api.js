import axios from "axios";

// Simplified base URL configuration
// In dev: Vite proxy handles /api → http://localhost:3001/api
// In prod: /api goes to same domain (Vercel serverless)
const api = axios.create({
  baseURL: '/api', // Always use /api - proxy handles routing
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 seconds
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) { 
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Debug logging in development only
    if (import.meta.env.DEV) {
      console.log('🔹 API Request:', config.method?.toUpperCase(), config.baseURL + config.url);
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log('✅ API Response:', response.config.url, response.status);
    }
    return response;
  },
  (error) => {
    console.error('❌ API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.dispatchEvent(new Event('storage'));
      
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/auth/login')) {
        window.location.href = "/auth/login";
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
