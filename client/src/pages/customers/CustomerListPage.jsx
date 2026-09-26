import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Users, Search, Edit, Mail, DollarSign } from 'lucide-react';
import { customerService } from '../../services/customer.service';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { CUSTOMER_TIERS } from '../../constants/statuses';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';

export default function CustomerListPage() {
  const { isManagerOrAdmin } = useAuth();
  const toast = useToast();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedTier, setSelectedTier] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    tier: CUSTOMER_TIERS.BRONZE,
    currency: 'USD',
  });

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await customerService.getCustomers({
        search: search || undefined,
        tier: selectedTier || undefined,
      });
      setCustomers(res.data?.customers || res.data || []);
    } catch (err) {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [search, selectedTier, toast]);

  useEffect(() => {
    const timer = setTimeout(fetchCustomers, 300);
    return () => clearTimeout(timer);
  }, [fetchCustomers]);

  const handleOpenCreateModal = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      tier: CUSTOMER_TIERS.BRONZE,
      currency: 'USD',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (c) => {
    setEditingCustomer(c);
    setFormData({
      name: c.name || '',
      email: c.email || '',
      phone: c.phone || '',
      tier: c.tier || CUSTOMER_TIERS.BRONZE,
      currency: c.currency || 'USD',
    });
    setIsModalOpen(true);
  };

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      if (editingCustomer) {
        await customerService.updateCustomer(editingCustomer.id, formData);
        toast.success('Customer updated successfully!');
      } else {
        await customerService.createCustomer(formData);
        toast.success('Customer added successfully!');
      }
      setIsModalOpen(false);
      fetchCustomers();
    } catch (err) {
      toast.error(err.userMessage || 'Failed to save customer');
    } finally {
      setModalLoading(false);
    }
  };

  const columns = [
    {
      header: 'Customer Name',
      render: (c) => (
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-indigo-500" />
          <span className="font-semibold text-slate-900">{c.name}</span>
        </div>
      ),
    },
    {
      header: 'Email',
      render: (c) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <Mail className="w-3.5 h-3.5 text-slate-400" />
          <span>{c.email || 'N/A'}</span>
        </div>
      ),
    },
    {
      header: 'Tier',
      render: (c) => <Badge tier={c.tier}>{c.tier}</Badge>,
    },
    {
      header: 'Currency',
      render: (c) => (
        <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
          {c.currency || 'USD'}
        </span>
      ),
    },
    {
      header: 'Status',
      render: (c) => (
        <Badge variant={c.is_active === false ? 'inactive' : 'active'}>
          {c.is_active === false ? 'Inactive' : 'Active'}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (c) => (
        <div className="flex items-center justify-end gap-2">
          {isManagerOrAdmin && (
            <Button
              variant="secondary"
              size="sm"
              icon={Edit}
              onClick={() => handleOpenEditModal(c)}
            >
              Edit
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Customers</h1>
          <p className="text-sm text-slate-500 mt-1">
            Accounts receiving customer order deliveries and sales shipments
          </p>
        </div>
        {isManagerOrAdmin && (
          <Button variant="primary" icon={Plus} onClick={handleOpenCreateModal}>
            Add Customer
          </Button>
        )}
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by customer name or email..."
            icon={Search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="sm:w-60">
          <Select
            placeholder="All Customer Tiers"
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value)}
            options={[
              { value: 'bronze', label: 'Bronze' },
              { value: 'silver', label: 'Silver' },
              { value: 'gold', label: 'Gold' },
              { value: 'platinum', label: 'Platinum' },
            ]}
          />
        </div>
      </div>

      <Table columns={columns} data={customers} loading={loading} emptyMessage="No customers found" />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCustomer ? 'Edit Customer' : 'Add New Customer'}
        subtitle="Manage customer account tier and currency details"
      >
        <form onSubmit={handleSaveCustomer} className="space-y-4">
          <Input
            label="Customer Name"
            required
            placeholder="Global Retail Partners Inc."
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Contact Email"
              type="email"
              placeholder="billing@globalretail.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <Input
              label="Contact Phone"
              placeholder="+1-800-555-0144"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Customer Tier"
              required
              value={formData.tier}
              onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
              options={[
                { value: 'bronze', label: 'Bronze' },
                { value: 'silver', label: 'Silver' },
                { value: 'gold', label: 'Gold' },
                { value: 'platinum', label: 'Platinum' },
              ]}
            />
            <Select
              label="Billing Currency"
              required
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              options={[
                { value: 'USD', label: 'USD ($)' },
                { value: 'EUR', label: 'EUR (€)' },
                { value: 'GBP', label: 'GBP (£)' },
                { value: 'CAD', label: 'CAD ($)' },
              ]}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={modalLoading}>
              {editingCustomer ? 'Save Changes' : 'Create Customer'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
