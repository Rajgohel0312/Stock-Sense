import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileStack, Search, ArrowDownLeft, ArrowUpRight, ArrowLeftRight } from 'lucide-react';
import { inventoryService } from '../../services/inventory.service';
import { useToast } from '../../context/ToastContext';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';

export default function DocumentListPage() {
  const toast = useToast();
  const navigate = useNavigate();

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await inventoryService.getDocuments({
        search: search || undefined,
        type: selectedType || undefined,
        status: selectedStatus || undefined,
      });
      setDocuments(res.data?.documents || res.data || []);
    } catch (err) {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [search, selectedType, selectedStatus, toast]);

  useEffect(() => {
    const timer = setTimeout(fetchDocuments, 300);
    return () => clearTimeout(timer);
  }, [fetchDocuments]);

  const getDocPath = (doc) => {
    if (doc.type === 'receipt') return `/receipts/${doc.id}`;
    if (doc.type === 'delivery') return `/deliveries/${doc.id}`;
    if (doc.type === 'transfer') return `/transfers/${doc.id}`;
    return '#';
  };

  const columns = [
    {
      header: 'Document #',
      render: (d) => {
        let Icon = FileStack;
        let color = 'text-slate-600';
        if (d.type === 'receipt') {
          Icon = ArrowDownLeft;
          color = 'text-emerald-600';
        } else if (d.type === 'delivery') {
          Icon = ArrowUpRight;
          color = 'text-purple-600';
        } else if (d.type === 'transfer') {
          Icon = ArrowLeftRight;
          color = 'text-cyan-600';
        }
        return (
          <div className="flex items-center gap-2">
            <Icon className={`w-4 h-4 ${color}`} />
            <span className="font-mono font-bold text-slate-900">{d.document_number || d.number}</span>
          </div>
        );
      },
    },
    {
      header: 'Type',
      render: (d) => (
        <span className="capitalize text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
          {d.type}
        </span>
      ),
    },
    {
      header: 'Counterparty / Context',
      render: (d) => (
        <span className="text-sm font-medium text-slate-800">
          {d.partner_name || d.supplier_name || d.customer_name || d.source_warehouse_name || '--'}
        </span>
      ),
    },
    {
      header: 'Warehouse',
      render: (d) => d.warehouse_name || '--',
    },
    {
      header: 'Status',
      render: (d) => <Badge variant={d.status}>{d.status}</Badge>,
    },
    {
      header: 'Date',
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Unified Documents</h1>
          <p className="text-sm text-slate-500 mt-1">
            Centralized hub tracking all operational documents (Receipts, Deliveries, Transfers)
          </p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search by document number or counterparty..."
            icon={Search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-48">
          <Select
            placeholder="All Document Types"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            options={[
              { value: 'receipt', label: 'Receipts' },
              { value: 'delivery', label: 'Deliveries' },
              { value: 'transfer', label: 'Transfers' },
            ]}
          />
        </div>
        <div className="w-48">
          <Select
            placeholder="All Statuses"
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
      </div>

      <Table
        columns={columns}
        data={documents}
        loading={loading}
        emptyMessage="No documents found."
        onRowClick={(d) => navigate(getDocPath(d))}
      />
    </div>
  );
}
