import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Truck, Phone, Mail, Clock } from 'lucide-react';
import { inventoryService } from '../../services/inventory.service';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';

export default function SupplierListPage() {
  const { isManagerOrAdmin } = useAuth();
  const toast = useToast();

  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    email: '',
    phone: '',
    leadTimeDays: 7,
  });

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await inventoryService.getSuppliers();
      setSuppliers(res.data?.suppliers || res.data || []);
    } catch (err) {
      toast.error('Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const handleCreateSupplier = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      await inventoryService.createSupplier(formData);
      toast.success('Supplier added successfully!');
      setIsModalOpen(false);
      setFormData({ code: '', name: '', email: '', phone: '', leadTimeDays: 7 });
      fetchSuppliers();
    } catch (err) {
      toast.error(err.userMessage || 'Failed to create supplier');
    } finally {
      setModalLoading(false);
    }
  };

  const columns = [
    {
      header: 'Supplier Code',
      render: (s) => <span className="font-mono font-semibold text-slate-800">{s.code}</span>,
    },
    {
      header: 'Supplier Name',
      render: (s) => (
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-indigo-500" />
          <span className="font-semibold text-slate-900">{s.name}</span>
        </div>
      ),
    },
    {
      header: 'Contact Email',
      render: (s) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <Mail className="w-3.5 h-3.5 text-slate-400" />
          <span>{s.email || 'N/A'}</span>
        </div>
      ),
    },
    {
      header: 'Phone',
      render: (s) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <Phone className="w-3.5 h-3.5 text-slate-400" />
          <span>{s.phone || 'N/A'}</span>
        </div>
      ),
    },
    {
      header: 'Lead Time',
      render: (s) => (
        <div className="flex items-center gap-1 text-xs text-slate-600 font-medium">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{s.lead_time_days ?? 7} days</span>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Suppliers</h1>
          <p className="text-sm text-slate-500 mt-1">
            Vendor accounts supplying stock and purchase goods
          </p>
        </div>
        {isManagerOrAdmin && (
          <Button variant="primary" icon={Plus} onClick={() => setIsModalOpen(true)}>
            Add Supplier
          </Button>
        )}
      </div>

      <Table columns={columns} data={suppliers} loading={loading} emptyMessage="No suppliers found" />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Supplier"
        subtitle="Record vendor contact details and procurement lead time"
      >
        <form onSubmit={handleCreateSupplier} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Supplier Code"
              required
              placeholder="SUPP-001"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            />
            <Input
              label="Supplier Name"
              required
              placeholder="Acme Industrial Ltd."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Email"
              type="email"
              placeholder="sales@acme.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <Input
              label="Phone"
              placeholder="+1-555-0199"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <Input
            label="Estimated Lead Time (Days)"
            type="number"
            min="1"
            required
            value={formData.leadTimeDays}
            onChange={(e) => setFormData({ ...formData, leadTimeDays: Number(e.target.value) })}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={modalLoading}>
              Save Supplier
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
