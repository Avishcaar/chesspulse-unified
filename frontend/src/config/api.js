import axios from 'axios';

// When running in unified production (served by Express on Render), default to same-origin relative path '/api'.
// In development, default to 'http://localhost:5001/api' or custom VITE_API_URL.
export const API_BASE_URL = import.meta.env.VITE_API_URL || 
    (import.meta.env.PROD ? '/api' : 'http://localhost:5001/api');

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;