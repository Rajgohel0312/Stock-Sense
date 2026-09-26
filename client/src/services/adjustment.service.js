import api from './api';

export const adjustmentService = {
  async getAdjustments(params = {}) {
    const res = await api.get('/adjustments', { params });
    return res.data;
  },

  async getAdjustmentById(id) {
    const res = await api.get(`/adjustments/${id}`);
    return res.data;
  },

  async createAdjustment(data) {
    const res = await api.post('/adjustments', data);
    return res.data;
  },

  async addItem(adjustmentId, itemData) {
    const res = await api.post(`/adjustments/${adjustmentId}/items`, itemData);
    return res.data;
  },

  async validateAdjustment(adjustmentId) {
    const res = await api.post(`/adjustments/${adjustmentId}/validate`);
    return res.data;
  },

  async cancelAdjustment(adjustmentId) {
    const res = await api.post(`/adjustments/${adjustmentId}/cancel`);
    return res.data;
  },
};
