import api from './api';

export const transferService = {
  async getTransfers(params = {}) {
    const res = await api.get('/transfers', { params });
    return res.data;
  },

  async getTransferById(id) {
    const res = await api.get(`/transfers/${id}`);
    return res.data;
  },

  async createTransfer(data) {
    const res = await api.post('/transfers', data);
    return res.data;
  },

  async addItem(transferId, itemData) {
    const res = await api.post(`/transfers/${transferId}/items`, itemData);
    return res.data;
  },

  async markReady(transferId) {
    const res = await api.post(`/transfers/${transferId}/mark-ready`);
    return res.data;
  },

  async validateTransfer(transferId) {
    const res = await api.post(`/transfers/${transferId}/validate`);
    return res.data;
  },

  async cancelTransfer(transferId) {
    const res = await api.post(`/transfers/${transferId}/cancel`);
    return res.data;
  },
};
