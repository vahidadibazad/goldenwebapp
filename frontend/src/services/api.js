// src/services/api.js
import axios from 'axios';
import { getApiBaseUrl } from '../config';

// =============================================
// تنظیمات Axios
// =============================================
const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

// =============================================
// Interceptor برای اضافه کردن توکن
// =============================================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    if (!config.baseURL) {
      config.baseURL = getApiBaseUrl();
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// =============================================
// Interceptor برای مدیریت خطاها
// =============================================
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') {
      console.error('❌ اتصال به سرور برقرار نیست.');
    }
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('permissions');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    if (error.response?.status === 403) {
      console.error('❌ شما دسترسی به این عملیات را ندارید.');
    }
    
    return Promise.reject(error);
  }
);

export default api;