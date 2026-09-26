import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Sliders } from 'lucide-react';
import { adjustmentService } from '../../services/adjustment.service';
import { inventoryService } from '../../services/inventory.service';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';

export default function AdjustmentListPage() {
  const { isManagerOrAdmin } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [adjustments, setAdjustments] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedStatus, setSelectedStatus] = useState('');

  // Create Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [formData, setFormData] = useState({
    warehouseId: '',
    reason: 'Annual cycle count audit',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [adjRes, whRes] = await Promise.all([
        adjustmentService.getAdjustments({ status: selectedStatus || undefined }),
        inventoryService.getWarehouses(),
      ]);
      setAdjustments(adjRes.data?.adjustments || adjRes.data || []);
      setWarehouses(whRes.data?.warehouses || whRes.data || []);
    } catch (err) {
      toast.error('Failed to load adjustments');
    } finally {
      setLoading(false);
    }
  }, [selectedStatus, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateAdjustment = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      const res = await adjustmentService.createAdjustment(formData);
      const newAdj = res.data?.adjustment || res.data;
      toast.success('Stock adjustment session initiated!');
      setIsModalOpen(false);
      navigate(`/adjustments/${newAdj.id}`);
    } catch (err) {
      toast.error(err.userMessage || 'Failed to create adjustment');
    } finally {
      setModalLoading(false);
    }
  };

  const columns = [
    {
      header: 'Adjustment #',
      render: (a) => (
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-amber-600" />
          <span className="font-mono font-bold text-slate-900">{a.adjustment_number}</span>
        </div>
      ),
    },
    {
      header: 'Warehouse',
      render: (a) => <span className="font-medium text-slate-800">{a.warehouse_name || '--'}</span>,
    },
    {
      header: 'Reason',
      render: (a) => <span className="text-slate-600 text-xs">{a.reason || 'Cycle count'}</span>,
    },
    {
      header: 'Items Count',
      render: (a) => (
        <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
          {a.item_count ?? a.items?.length ?? 0} items
        </span>
      ),
    },
    {
      header: 'Status',
      render: (a) => <Badge variant={a.status}>{a.status}</Badge>,
    },
    {
      header: 'Date Created',
      render: (a) => (
        <span className="text-xs text-slate-400">
          {a.created_at ? new Date(a.created_at).toLocaleDateString() : '--'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Stock Adjustments</h1>
          <p className="text-sm text-slate-500 mt-1">
            Physical stock reconciliation, discrepancy adjustments, and cycle counting
          </p>
        </div>
        {isManagerOrAdmin && (
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => {
              setFormData({
                warehouseId: warehouses[0]?.id || '',
                reason: 'Physical inventory cycle count',
              });
              setIsModalOpen(true);
            }}
          >
            New Adjustment
          </Button>
        )}
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
        data={adjustments}
        loading={loading}
        emptyMessage="No adjustments found"
        onRowClick={(a) => navigate(`/adjustments/${a.id}`)}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Start Stock Adjustment Session"
        subtitle="Specify audit warehouse and reconciliation rationale"
      >
        <form onSubmit={handleCreateAdjustment} className="space-y-4">
          <Select
            label="Warehouse"
            required
            value={formData.warehouseId}
            onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
            options={warehouses.map((w) => ({ value: w.id, label: `${w.name} (${w.code})` }))}
          />
          <Input
            label="Audit Reason"
            required
            placeholder="Routine cycle count / Damaged goods reconciliation"
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={modalLoading}>
              Create Session
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
