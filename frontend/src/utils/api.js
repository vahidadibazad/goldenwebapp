// frontend/src/utils/api.js
import axios from 'axios';

// =============================================
// ✅ تشخیص خودکار آدرس API
// =============================================
const getBaseURL = () => {
  const hostname = window.location.hostname;
  const port = 3000;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `http://localhost:${port}/api`;
  }
  
  return `http://${hostname}:${port}/api`;
};

const API_URL = getBaseURL();
console.log('📡 API URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;