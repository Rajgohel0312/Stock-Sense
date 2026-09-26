import api from './api';

export const receiptService = {
  async getReceipts(params = {}) {
    const res = await api.get('/receipts', { params });
    return res.data;
  },

  async getReceiptById(id) {
    const res = await api.get(`/receipts/${id}`);
    return res.data;
  },

  async createReceipt(data) {
    const res = await api.post('/receipts', data);
    return res.data;
  },

  async addItem(receiptId, itemData) {
    const res = await api.post(`/receipts/${receiptId}/items`, itemData);
    return res.data;
  },

  async removeItem(receiptId, itemId) {
    const res = await api.delete(`/receipts/${receiptId}/items/${itemId}`);
    return res.data;
  },

  async validateReceipt(receiptId) {
    const res = await api.post(`/receipts/${receiptId}/validate`);
    return res.data;
  },

  async cancelReceipt(receiptId) {
    const res = await api.post(`/receipts/${receiptId}/cancel`);
    return res.data;
  },
};
