import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If unauthorized and not already on login/signup, let the auth state handle it
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred';
    
    // Normalize error message for callers
    error.userMessage = message;
    return Promise.reject(error);
  }
);

export default api;
