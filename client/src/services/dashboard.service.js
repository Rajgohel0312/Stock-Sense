import api from './api';

export const dashboardService = {
  async getSummary() {
    const res = await api.get('/dashboard/summary');
    return res.data;
  },

  async getLowStock(params = {}) {
    const res = await api.get('/dashboard/low-stock', { params });
    return res.data;
  },

  async getRecentMovements() {
    const res = await api.get('/dashboard/recent-movements');
    return res.data;
  },

  async getPendingDocuments() {
    const res = await api.get('/dashboard/pending-documents');
    return res.data;
  },
};
