import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowLeftRight } from 'lucide-react';
import { transferService } from '../../services/transfer.service';
import { inventoryService } from '../../services/inventory.service';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';

export default function TransferListPage() {
  const toast = useToast();
  const navigate = useNavigate();

  const [transfers, setTransfers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedStatus, setSelectedStatus] = useState('');

  // Create Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [formData, setFormData] = useState({
    sourceWarehouseId: '',
    destWarehouseId: '',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [transRes, whRes] = await Promise.all([
        transferService.getTransfers({ status: selectedStatus || undefined }),
        inventoryService.getWarehouses(),
      ]);
      setTransfers(transRes.data?.transfers || transRes.data || []);
      setWarehouses(whRes.data?.warehouses || whRes.data || []);
    } catch (err) {
      toast.error('Failed to load transfers');
    } finally {
      setLoading(false);
    }
  }, [selectedStatus, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateTransfer = async (e) => {
    e.preventDefault();
    const destWhId = formData.destinationWarehouseId || formData.destWarehouseId;
    if (formData.sourceWarehouseId === destWhId) {
      toast.error('Source and destination warehouses must be different');
      return;
    }

    setModalLoading(true);
    try {
      const res = await transferService.createTransfer({
        sourceWarehouseId: formData.sourceWarehouseId,
        destinationWarehouseId: destWhId,
      });
      const newTransfer = res.data?.transfer || res.data;
      toast.success('Internal transfer created successfully!');
      setIsModalOpen(false);
      navigate(`/transfers/${newTransfer.id}`);
    } catch (err) {
      toast.error(err.userMessage || 'Failed to create transfer');
    } finally {
      setModalLoading(false);
    }
  };

  const columns = [
    {
      header: 'Transfer #',
      render: (t) => (
        <div className="flex items-center gap-2">
          <ArrowLeftRight className="w-4 h-4 text-cyan-600" />
          <span className="font-mono font-bold text-slate-900">{t.transfer_number}</span>
        </div>
      ),
    },
    {
      header: 'Source Warehouse',
      render: (t) => <span className="font-medium text-slate-800">{t.source_warehouse_name || '--'}</span>,
    },
    {
      header: 'Destination Warehouse',
      render: (t) => (
        <span className="font-medium text-slate-800">{t.dest_warehouse_name || '--'}</span>
      ),
    },
    {
      header: 'Items Count',
      render: (t) => (
        <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
          {t.item_count ?? t.items?.length ?? 0} items
        </span>
      ),
    },
    {
      header: 'Status',
      render: (t) => <Badge variant={t.status}>{t.status}</Badge>,
    },
    {
      header: 'Date Created',
      render: (t) => (
        <span className="text-xs text-slate-400">
          {t.created_at ? new Date(t.created_at).toLocaleDateString() : '--'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Internal Transfers</h1>
          <p className="text-sm text-slate-500 mt-1">
            Relocate stock across different warehouse facilities and staging zones
          </p>
        </div>
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => {
            setFormData({
              sourceWarehouseId: warehouses[0]?.id || '',
              destWarehouseId: warehouses[1]?.id || warehouses[0]?.id || '',
            });
            setIsModalOpen(true);
          }}
        >
          New Transfer
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
            { value: 'done', label: 'Done' },
            { value: 'canceled', label: 'Canceled' },
          ]}
        />
      </div>

      <Table
        columns={columns}
        data={transfers}
        loading={loading}
        emptyMessage="No transfers found"
        onRowClick={(t) => navigate(`/transfers/${t.id}`)}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Initiate Internal Transfer"
        subtitle="Specify sending and receiving warehouse facilities"
      >
        <form onSubmit={handleCreateTransfer} className="space-y-4">
          <Select
            label="Source Warehouse"
            required
            value={formData.sourceWarehouseId}
            onChange={(e) => setFormData({ ...formData, sourceWarehouseId: e.target.value })}
            options={warehouses.map((w) => ({ value: w.id, label: `${w.name} (${w.code})` }))}
          />
          <Select
            label="Destination Warehouse"
            required
            value={formData.destWarehouseId}
            onChange={(e) => setFormData({ ...formData, destWarehouseId: e.target.value })}
            options={warehouses.map((w) => ({ value: w.id, label: `${w.name} (${w.code})` }))}
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={modalLoading}>
              Create Transfer
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
