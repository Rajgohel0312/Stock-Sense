import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Warehouse, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { inventoryService } from '../../services/inventory.service';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ROUTES } from '../../constants/routes';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';

export default function WarehouseListPage() {
  const { isManagerOrAdmin } = useAuth();
  const toast = useToast();

  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', code: '', address: '' });

  const fetchWarehouses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await inventoryService.getWarehouses();
      setWarehouses(res.data?.warehouses || res.data || []);
    } catch (err) {
      toast.error('Failed to load warehouses');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchWarehouses();
  }, [fetchWarehouses]);

  const handleCreateWarehouse = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      await inventoryService.createWarehouse(formData);
      toast.success('Warehouse created successfully!');
      setIsModalOpen(false);
      setFormData({ name: '', code: '', address: '' });
      fetchWarehouses();
    } catch (err) {
      toast.error(err.userMessage || 'Failed to create warehouse');
    } finally {
      setModalLoading(false);
    }
  };

  const columns = [
    {
      header: 'Code',
      render: (w) => <span className="font-mono font-semibold text-slate-800">{w.code}</span>,
    },
    {
      header: 'Facility Name',
      render: (w) => (
        <div className="flex items-center gap-2">
          <Warehouse className="w-4 h-4 text-indigo-500" />
          <span className="font-semibold text-slate-900">{w.name}</span>
        </div>
      ),
    },
    {
      header: 'Address',
      render: (w) => <span className="text-slate-500 text-xs">{w.address || 'No address specified'}</span>,
    },
    {
      header: 'Status',
      render: (w) => (
        <Badge variant={w.is_active === false ? 'inactive' : 'active'}>
          {w.is_active === false ? 'Inactive' : 'Active'}
        </Badge>
      ),
    },
    {
      header: 'Locations',
      className: 'text-right',
      render: (w) => (
        <Link
          to={`${ROUTES.LOCATIONS}?warehouseId=${w.id}`}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
        >
          <MapPin className="w-3.5 h-3.5" /> View Locations &rarr;
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Warehouses</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage physical logistics facilities, fulfillment hubs, and distribution centers
          </p>
        </div>
        {isManagerOrAdmin && (
          <Button variant="primary" icon={Plus} onClick={() => setIsModalOpen(true)}>
            Add Warehouse
          </Button>
        )}
      </div>

      <Table columns={columns} data={warehouses} loading={loading} emptyMessage="No warehouses found" />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register New Warehouse"
        subtitle="Specify warehouse code, name, and street address"
      >
        <form onSubmit={handleCreateWarehouse} className="space-y-4">
          <Input
            label="Warehouse Code"
            required
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            placeholder="WH-MAIN"
          />
          <Input
            label="Warehouse Name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Main Central Logistics Center"
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Physical Address</label>
            <textarea
              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              rows={3}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="100 Logistics Blvd, Dock 4..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={modalLoading}>
              Save Warehouse
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
