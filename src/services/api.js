import axios from "axios";

const api = axios.create({
  baseURL: '/api',
  headers: {
    "Content-Type": "application/json",
    "Cache-Control": "no-cache", // ✅ ADD THIS
    "Pragma": "no-cache",         // ✅ ADD THIS
  },
  timeout: 30000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) { 
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // ✅ ADD THIS - Force no cache on all requests
    config.headers['If-None-Match'] = undefined;
    config.headers['If-Modified-Since'] = undefined;
    
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
