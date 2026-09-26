import api from './api';

export const alertService = {
  async getAlerts(params = {}) {
    const res = await api.get('/alerts', { params });
    return res.data;
  },

  async resolveAlert(id) {
    const res = await api.post(`/alerts/${id}/resolve`);
    return res.data;
  },
};
