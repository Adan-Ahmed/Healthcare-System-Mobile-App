import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {API_BASE_URL} from './config';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  async config => {
    const rawToken = await AsyncStorage.getItem('token');
    const token = rawToken?.trim();
    if (token) {
      // Normalize tokens that may already include the scheme.
      config.headers.Authorization = token.toLowerCase().startsWith('bearer ') ? token : `Bearer ${token}`;
    } else if (__DEV__) {
      console.warn('[api] Missing token for request', {
        baseURL: config.baseURL,
        url: config.url,
        method: config.method,
      });
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export default api;
