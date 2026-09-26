import React, { useState, useEffect, useCallback } from 'react';
import { History, Search, Filter, ShieldCheck, ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Sliders } from 'lucide-react';
import { inventoryService } from '../../services/inventory.service';
import { useToast } from '../../context/ToastContext';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';

export default function LedgerListPage() {
  const toast = useToast();

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('');

  const fetchLedger = useCallback(async () => {
    setLoading(true);
    try {
      const res = await inventoryService.getLedger({
        search: search || undefined,
        referenceType: selectedType || undefined,
        limit: 50,
      });
      const list = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.entries)
        ? res.data.entries
        : Array.isArray(res)
        ? res
        : [];
      setEntries(list);
    } catch (err) {
      toast.error('Failed to load stock ledger');
    } finally {
      setLoading(false);
    }
  }, [search, selectedType, toast]);

  useEffect(() => {
    const timer = setTimeout(fetchLedger, 300);
    return () => clearTimeout(timer);
  }, [fetchLedger]);

  const columns = [
    {
      header: 'Product / SKU',
      render: (m) => (
        <div>
          <span className="font-semibold text-slate-900">{m.product_name}</span>
          <span className="block font-mono text-xs text-slate-400">{m.sku}</span>
        </div>
      ),
    },
    {
      header: 'Location / Warehouse',
      render: (m) => (
        <div>
          <span className="text-slate-800 text-sm font-medium">{m.warehouse_name || 'Main Hub'}</span>
          <span className="block text-xs text-slate-400">{m.location_name || '--'}</span>
        </div>
      ),
    },
    {
      header: 'Operation Type',
      render: (m) => {
        const type = m.reference_type || '';
        return (
          <Badge variant="default" size="sm">
            {type.replace('_', ' ')}
          </Badge>
        );
      },
    },
    {
      header: 'Quantity Change',
      render: (m) => {
        const change = Number(m.quantity_change);
        const isPos = change > 0;
        return (
          <span
            className={`font-mono font-bold text-sm ${
              isPos ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {isPos ? `+${change}` : change}
          </span>
        );
      },
    },
    {
      header: 'Balance After',
      render: (m) => <span className="font-mono font-semibold text-slate-800">{m.balance_after}</span>,
    },
    {
      header: 'Timestamp',
      render: (m) => (
        <span className="text-xs text-slate-500">
          {m.created_at ? new Date(m.created_at).toLocaleString() : '--'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Stock Ledger</h1>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5" /> Immutable Audit Log
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Tamper-proof append-only ledger tracking all physical and allocated inventory movements
          </p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by SKU, product name, or reference ID..."
            icon={Search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="sm:w-60">
          <Select
            placeholder="All Movement Types"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            options={[
              { value: 'receipt', label: 'Receipts (+)' },
              { value: 'delivery', label: 'Deliveries (-)' },
              { value: 'transfer_out', label: 'Transfer Out (-)' },
              { value: 'transfer_in', label: 'Transfer In (+)' },
              { value: 'adjustment', label: 'Adjustment (Reconciled)' },
            ]}
          />
        </div>
      </div>

      <Table
        columns={columns}
        data={entries}
        loading={loading}
        emptyMessage="No ledger records found matching your filters."
      />
    </div>
  );
}
