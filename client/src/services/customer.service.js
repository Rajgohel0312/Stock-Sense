import api from './api';

export const customerService = {
  async getCustomers(params = {}) {
    const res = await api.get('/customers', { params });
    return res.data;
  },

  async getCustomerById(id) {
    const res = await api.get(`/customers/${id}`);
    return res.data;
  },

  async createCustomer(data) {
    const res = await api.post('/customers', data);
    return res.data;
  },

  async updateCustomer(id, data) {
    const res = await api.put(`/customers/${id}`, data);
    return res.data;
  },

  async deleteCustomer(id) {
    const res = await api.delete(`/customers/${id}`);
    return res.data;
  },
};
