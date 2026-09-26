import api from './api';

export const profileService = {
  async getProfile() {
    const res = await api.get('/profile');
    return res.data;
  },

  async updateProfile(data) {
    const res = await api.put('/profile', data);
    return res.data;
  },

  async updatePassword(data) {
    const res = await api.put('/profile/password', data);
    return res.data;
  },

  async logoutAll() {
    const res = await api.post('/profile/logout-all');
    return res.data;
  },
};
