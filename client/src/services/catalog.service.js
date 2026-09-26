import api from './api';

export const catalogService = {
  // Products
  async getProducts(params = {}) {
    const res = await api.get('/products', { params });
    return res.data;
  },

  async getProductById(id) {
    const res = await api.get(`/products/${id}`);
    return res.data;
  },

  async createProduct(data) {
    const res = await api.post('/products', data);
    return res.data;
  },

  async updateProduct(id, data) {
    const res = await api.put(`/products/${id}`, data);
    return res.data;
  },

  async deleteProduct(id) {
    const res = await api.delete(`/products/${id}`);
    return res.data;
  },

  // Categories
  async getCategories() {
    const res = await api.get('/categories');
    return res.data;
  },

  async createCategory(data) {
    const res = await api.post('/categories', data);
    return res.data;
  },

  // UOM
  async getUOMs() {
    const res = await api.get('/uom');
    return res.data;
  },
};
