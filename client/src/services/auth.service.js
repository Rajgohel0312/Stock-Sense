import api from './api';

export const authService = {
  async signup(data) {
    const res = await api.post('/auth/signup', data);
    return res.data;
  },

  async login(credentials) {
    const res = await api.post('/auth/login', credentials);
    return res.data;
  },

  async logout() {
    const res = await api.post('/auth/logout');
    return res.data;
  },

  async getCurrentUser() {
    const res = await api.get('/auth/me');
    return res.data;
  },

  async forgotPassword(email) {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data;
  },

  async verifyOtp(data) {
    const res = await api.post('/auth/verify-otp', data);
    return res.data;
  },

  async resetPassword(data) {
    const res = await api.post('/auth/reset-password', data);
    return res.data;
  },
};
