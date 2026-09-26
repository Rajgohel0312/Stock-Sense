import api from './api';

export const deliveryService = {
  async getDeliveries(params = {}) {
    const res = await api.get('/deliveries', { params });
    return res.data;
  },

  async getDeliveryById(id) {
    const res = await api.get(`/deliveries/${id}`);
    return res.data;
  },

  async createDelivery(data) {
    const res = await api.post('/deliveries', data);
    return res.data;
  },

  async addItem(deliveryId, itemData) {
    const res = await api.post(`/deliveries/${deliveryId}/items`, itemData);
    return res.data;
  },

  async markReady(deliveryId) {
    const res = await api.post(`/deliveries/${deliveryId}/mark-ready`);
    return res.data;
  },

  async pick(deliveryId) {
    const res = await api.post(`/deliveries/${deliveryId}/pick`);
    return res.data;
  },

  async pack(deliveryId) {
    const res = await api.post(`/deliveries/${deliveryId}/pack`);
    return res.data;
  },

  async validateDelivery(deliveryId) {
    const res = await api.post(`/deliveries/${deliveryId}/validate`);
    return res.data;
  },

  async cancelDelivery(deliveryId) {
    const res = await api.post(`/deliveries/${deliveryId}/cancel`);
    return res.data;
  },
};
