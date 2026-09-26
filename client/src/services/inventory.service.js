import api from './api';

export const inventoryService = {
  // Warehouses
  async getWarehouses() {
    const res = await api.get('/inventory/warehouses');
    return res.data;
  },

  async createWarehouse(data) {
    const res = await api.post('/inventory/warehouses', data);
    return res.data;
  },

  // Locations
  async getLocations(params = {}) {
    const res = await api.get('/inventory/locations', { params });
    return res.data;
  },

  async createLocation(data) {
    const res = await api.post('/inventory/locations', data);
    return res.data;
  },

  // Stock balances
  async getStock(params = {}) {
    const res = await api.get('/inventory/stock', { params });
    return res.data;
  },

  // Stock Ledger
  async getLedger(params = {}) {
    const res = await api.get('/inventory/ledger', { params });
    return res.data;
  },

  // Reservations
  async getReservations(params = {}) {
    const res = await api.get('/inventory/reservations', { params });
    return res.data;
  },

  async createReservation(data) {
    const res = await api.post('/inventory/reservations', data);
    return res.data;
  },

  async releaseReservation(id) {
    const res = await api.delete(`/inventory/reservations/${id}`);
    return res.data;
  },

  // Suppliers
  async getSuppliers(params = {}) {
    const res = await api.get('/inventory/suppliers', { params });
    return res.data;
  },

  async createSupplier(data) {
    const res = await api.post('/inventory/suppliers', data);
    return res.data;
  },

  // Unified Documents
  async getDocuments(params = {}) {
    const res = await api.get('/inventory/documents', { params });
    return res.data;
  },
};
