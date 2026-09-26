import React, { useState, useEffect, useCallback } from 'react';
import { Plus, BookmarkCheck, Unlock, AlertTriangle } from 'lucide-react';
import { inventoryService } from '../../services/inventory.service';
import { catalogService } from '../../services/catalog.service';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';

export default function ReservationListPage() {
  const { isManagerOrAdmin } = useAuth();
  const toast = useToast();

  const [reservations, setReservations] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [formData, setFormData] = useState({
    productId: '',
    warehouseId: '',
    quantity: 1,
    referenceType: 'sales_order',
    referenceId: '',
  });

  const fetchReservations = useCallback(async () => {
    setLoading(true);
    try {
      const [resRes, prodRes, whRes] = await Promise.all([
        inventoryService.getReservations(),
        catalogService.getProducts(),
        inventoryService.getWarehouses(),
      ]);
      setReservations(resRes.data?.reservations || resRes.data || []);
      setProducts(prodRes.data?.products || prodRes.data || []);
      setWarehouses(whRes.data?.warehouses || whRes.data || []);
    } catch (err) {
      toast.error('Failed to load reservations');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  const handleCreateReservation = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      await inventoryService.createReservation({
        ...formData,
        quantity: Number(formData.quantity),
      });
      toast.success('Stock reservation created!');
      setIsModalOpen(false);
      fetchReservations();
    } catch (err) {
      toast.error(err.userMessage || 'Failed to create reservation');
    } finally {
      setModalLoading(false);
    }
  };

  const handleRelease = async (id) => {
    if (!window.confirm('Release this reservation back to available stock?')) return;
    try {
      await inventoryService.releaseReservation(id);
      toast.success('Reservation released back to available stock');
      fetchReservations();
    } catch (err) {
      toast.error(err.userMessage || 'Failed to release reservation');
    }
  };

  const columns = [
    {
      header: 'Product / SKU',
      render: (r) => (
        <div>
          <span className="font-semibold text-slate-900">{r.product_name}</span>
          <span className="block font-mono text-xs text-slate-400">{r.sku}</span>
        </div>
      ),
    },
    {
      header: 'Warehouse',
      render: (r) => <span className="font-medium text-slate-800">{r.warehouse_name || '--'}</span>,
    },
    {
      header: 'Reserved Quantity',
      render: (r) => (
        <span className="font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-sm font-mono">
          {r.quantity}
        </span>
      ),
    },
    {
      header: 'Ref Type',
      render: (r) => <span className="text-xs uppercase text-slate-500 font-medium">{r.reference_type || 'order'}</span>,
    },
    {
      header: 'Status',
      render: (r) => <Badge variant={r.status === 'active' ? 'ready' : 'inactive'}>{r.status}</Badge>,
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (r) => (
        <div className="flex items-center justify-end gap-2">
          {r.status === 'active' && isManagerOrAdmin && (
            <Button
              variant="secondary"
              size="sm"
              icon={Unlock}
              onClick={() => handleRelease(r.id)}
            >
              Release Stock
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Stock Reservations</h1>
          <p className="text-sm text-slate-500 mt-1">
            Soft-lock inventory for planned customer orders to prevent overselling
          </p>
        </div>
        {isManagerOrAdmin && (
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => {
              setFormData({
                productId: products[0]?.id || '',
                warehouseId: warehouses[0]?.id || '',
                quantity: 5,
                referenceType: 'sales_order',
                referenceId: `ORD-${Date.now().toString().slice(-4)}`,
              });
              setIsModalOpen(true);
            }}
          >
            Create Reservation
          </Button>
        )}
      </div>

      <Table
        columns={columns}
        data={reservations}
        loading={loading}
        emptyMessage="No stock reservations currently active."
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Reserve Inventory Stock"
        subtitle="Lock specified quantity from available pool"
      >
        <form onSubmit={handleCreateReservation} className="space-y-4">
          <Select
            label="Product"
            required
            value={formData.productId}
            onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
            options={products.map((p) => ({ value: p.id, label: `${p.name} (${p.sku})` }))}
          />
          <Select
            label="Warehouse"
            required
            value={formData.warehouseId}
            onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
            options={warehouses.map((w) => ({ value: w.id, label: `${w.name} (${w.code})` }))}
          />
          <Input
            label="Quantity to Reserve"
            type="number"
            min="1"
            required
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
          />
          <Input
            label="Reference Order Number"
            placeholder="ORD-9842"
            value={formData.referenceId}
            onChange={(e) => setFormData({ ...formData, referenceId: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={modalLoading}>
              Reserve Stock
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
