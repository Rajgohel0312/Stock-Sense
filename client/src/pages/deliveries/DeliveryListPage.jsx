import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowUpRight, Search } from 'lucide-react';
import { deliveryService } from '../../services/delivery.service';
import { customerService } from '../../services/customer.service';
import { inventoryService } from '../../services/inventory.service';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';

export default function DeliveryListPage() {
  const toast = useToast();
  const navigate = useNavigate();

  const [deliveries, setDeliveries] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedStatus, setSelectedStatus] = useState('');

  // Create Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [locations, setLocations] = useState([]);
  const [formData, setFormData] = useState({
    customerId: '',
    warehouseId: '',
    locationId: '',
  });

  const handleWarehouseChange = async (whId) => {
    setFormData((prev) => ({ ...prev, warehouseId: whId, locationId: '' }));
    if (whId) {
      try {
        const res = await inventoryService.getLocations({ warehouseId: whId });
        const locs = res.data?.locations || res.data || [];
        setLocations(locs);
        if (locs.length > 0) {
          setFormData((prev) => ({ ...prev, warehouseId: whId, locationId: locs[0].id }));
        }
      } catch (err) {
        setLocations([]);
      }
    } else {
      setLocations([]);
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [delRes, cusRes, whRes] = await Promise.all([
        deliveryService.getDeliveries({ status: selectedStatus || undefined }),
        customerService.getCustomers({ is_active: true }),
        inventoryService.getWarehouses(),
      ]);
      setDeliveries(delRes.data?.deliveries || delRes.data || []);
      setCustomers(cusRes.data?.customers || cusRes.data || []);
      setWarehouses(whRes.data?.warehouses || whRes.data || []);
    } catch (err) {
      toast.error('Failed to load deliveries');
    } finally {
      setLoading(false);
    }
  }, [selectedStatus, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateDelivery = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      const res = await deliveryService.createDelivery({
        customerId: formData.customerId,
        warehouseId: formData.warehouseId,
        locationId: formData.locationId || undefined,
      });
      const newDelivery = res.data?.delivery || res.data;
      toast.success('Delivery order initiated successfully!');
      setIsModalOpen(false);
      navigate(`/deliveries/${newDelivery.id}`);
    } catch (err) {
      toast.error(err.userMessage || 'Failed to create delivery');
    } finally {
      setModalLoading(false);
    }
  };

  const columns = [
    {
      header: 'Delivery #',
      render: (d) => (
        <div className="flex items-center gap-2">
          <ArrowUpRight className="w-4 h-4 text-purple-600" />
          <span className="font-mono font-bold text-slate-900">{d.delivery_number}</span>
        </div>
      ),
    },
    {
      header: 'Customer',
      render: (d) => <span className="font-semibold text-slate-800">{d.customer_name || '--'}</span>,
    },
    {
      header: 'Origin Warehouse',
      render: (d) => d.warehouse_name || '--',
    },
    {
      header: 'Items Count',
      render: (d) => (
        <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
          {d.item_count ?? d.items?.length ?? 0} items
        </span>
      ),
    },
    {
      header: 'Status',
      render: (d) => <Badge variant={d.status}>{d.status}</Badge>,
    },
    {
      header: 'Date Created',
      render: (d) => (
        <span className="text-xs text-slate-400">
          {d.created_at ? new Date(d.created_at).toLocaleDateString() : '--'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Delivery Orders</h1>
          <p className="text-sm text-slate-500 mt-1">
            Outbound customer fulfillment pipeline: Ready &rarr; Pick &rarr; Pack &rarr; Validate
          </p>
        </div>
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => {
            setFormData({
              customerId: customers[0]?.id || '',
              warehouseId: warehouses[0]?.id || '',
            });
            setIsModalOpen(true);
          }}
        >
          New Delivery
        </Button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 sm:w-64">
        <Select
          placeholder="Filter by Status (All)"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          options={[
            { value: 'draft', label: 'Draft' },
            { value: 'ready', label: 'Ready' },
            { value: 'picked', label: 'Picked' },
            { value: 'packed', label: 'Packed' },
            { value: 'done', label: 'Done' },
            { value: 'canceled', label: 'Canceled' },
          ]}
        />
      </div>

      <Table
        columns={columns}
        data={deliveries}
        loading={loading}
        emptyMessage="No deliveries found"
        onRowClick={(d) => navigate(`/deliveries/${d.id}`)}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Initiate Customer Delivery"
        subtitle="Select customer account and dispatch warehouse"
      >
        <form onSubmit={handleCreateDelivery} className="space-y-4">
          <Select
            label="Customer"
            required
            value={formData.customerId}
            onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
            options={customers.map((c) => ({ value: c.id, label: `${c.name} (${c.tier})` }))}
          />
          <Select
            label="Origin Warehouse"
            required
            value={formData.warehouseId}
            onChange={(e) => handleWarehouseChange(e.target.value)}
            options={warehouses.map((w) => ({ value: w.id, label: `${w.name} (${w.code})` }))}
          />
          {locations.length > 0 && (
            <Select
              label="Dispatch Location"
              required
              value={formData.locationId}
              onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
              options={locations.map((loc) => ({ value: loc.id, label: `${loc.name} (${loc.code})` }))}
            />
          )}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={modalLoading}>
              Create Draft
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
