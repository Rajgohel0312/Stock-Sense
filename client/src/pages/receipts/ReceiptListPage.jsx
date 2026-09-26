import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowDownLeft, Search } from 'lucide-react';
import { receiptService } from '../../services/receipt.service';
import { inventoryService } from '../../services/inventory.service';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';

export default function ReceiptListPage() {
  const { isManagerOrAdmin } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [receipts, setReceipts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedStatus, setSelectedStatus] = useState('');

  // Create Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [formData, setFormData] = useState({
    supplierId: '',
    warehouseId: '',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [recRes, supRes, whRes] = await Promise.all([
        receiptService.getReceipts({ status: selectedStatus || undefined }),
        inventoryService.getSuppliers(),
        inventoryService.getWarehouses(),
      ]);
      setReceipts(recRes.data?.receipts || recRes.data || []);
      setSuppliers(supRes.data?.suppliers || supRes.data || []);
      setWarehouses(whRes.data?.warehouses || whRes.data || []);
    } catch (err) {
      toast.error('Failed to load receipts');
    } finally {
      setLoading(false);
    }
  }, [selectedStatus, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateReceipt = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      const res = await receiptService.createReceipt(formData);
      const newReceipt = res.data?.receipt || res.data;
      toast.success('Receipt created successfully!');
      setIsModalOpen(false);
      navigate(`/receipts/${newReceipt.id}`);
    } catch (err) {
      toast.error(err.userMessage || 'Failed to create receipt');
    } finally {
      setModalLoading(false);
    }
  };

  const columns = [
    {
      header: 'Receipt #',
      render: (r) => (
        <div className="flex items-center gap-2">
          <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
          <span className="font-mono font-bold text-slate-900">{r.receipt_number}</span>
        </div>
      ),
    },
    {
      header: 'Supplier',
      render: (r) => <span className="font-medium text-slate-800">{r.supplier_name || '--'}</span>,
    },
    {
      header: 'Destination Warehouse',
      render: (r) => r.warehouse_name || '--',
    },
    {
      header: 'Items Count',
      render: (r) => (
        <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
          {r.item_count ?? r.items?.length ?? 0} items
        </span>
      ),
    },
    {
      header: 'Status',
      render: (r) => <Badge variant={r.status}>{r.status}</Badge>,
    },
    {
      header: 'Date Created',
      render: (r) => (
        <span className="text-xs text-slate-400">
          {r.created_at ? new Date(r.created_at).toLocaleDateString() : '--'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Purchase Receipts</h1>
          <p className="text-sm text-slate-500 mt-1">
            Inbound vendor stock receiving, inspection, and inventory replenishment
          </p>
        </div>
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => {
            setFormData({
              supplierId: suppliers[0]?.id || '',
              warehouseId: warehouses[0]?.id || '',
            });
            setIsModalOpen(true);
          }}
        >
          New Receipt
        </Button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 sm:w-64">
        <Select
          placeholder="Filter by Status (All)"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          options={[
            { value: 'draft', label: 'Draft' },
            { value: 'done', label: 'Done' },
            { value: 'canceled', label: 'Canceled' },
          ]}
        />
      </div>

      <Table
        columns={columns}
        data={receipts}
        loading={loading}
        emptyMessage="No receipts found"
        onRowClick={(r) => navigate(`/receipts/${r.id}`)}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Purchase Receipt"
        subtitle="Initiate inbound shipment tracking from vendor"
      >
        <form onSubmit={handleCreateReceipt} className="space-y-4">
          <Select
            label="Supplier"
            required
            value={formData.supplierId}
            onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
            options={suppliers.map((s) => ({ value: s.id, label: s.name }))}
          />
          <Select
            label="Destination Warehouse"
            required
            value={formData.warehouseId}
            onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
            options={warehouses.map((w) => ({ value: w.id, label: `${w.name} (${w.code})` }))}
          />
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
