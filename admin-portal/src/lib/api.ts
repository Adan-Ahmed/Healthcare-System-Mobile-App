import axios from 'axios';
import {getAuth, clearAuth} from './auth';

const baseURL = import.meta.env.VITE_API_BASE_URL as string | undefined;

export const api = axios.create({
  baseURL: baseURL?.replace(/\/$/, '') || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(config => {
  const auth = getAuth();
  if (auth?.token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${auth.token}`;
  }
  return config;
});

api.interceptors.response.use(
  r => r,
  err => {
    if (err?.response?.status === 401) {
      clearAuth();
    }
    return Promise.reject(err);
  },
);

