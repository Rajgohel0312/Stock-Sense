import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, PackageSearch, AlertTriangle, MapPin, RefreshCw } from 'lucide-react';
import { inventoryService } from '../../services/inventory.service';
import { catalogService } from '../../services/catalog.service';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';

export default function StockListPage() {
  const toast = useToast();
  const navigate = useNavigate();

  const [stockList, setStockList] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  const fetchStock = useCallback(async () => {
    setLoading(true);
    try {
      const [stockRes, whRes, catRes] = await Promise.all([
        inventoryService.getStock({
          search: search || undefined,
          warehouseId: selectedWarehouse || undefined,
          categoryId: selectedCategory || undefined,
          lowStockOnly: lowStockOnly ? 'true' : undefined,
        }),
        inventoryService.getWarehouses(),
        catalogService.getCategories(),
      ]);

      setStockList(stockRes.data?.stock || stockRes.data || []);
      setWarehouses(whRes.data?.warehouses || whRes.data || []);
      setCategories(catRes.data?.categories || catRes.data || []);
    } catch (err) {
      toast.error('Failed to load stock balances');
    } finally {
      setLoading(false);
    }
  }, [search, selectedWarehouse, selectedCategory, lowStockOnly, toast]);

  useEffect(() => {
    const timer = setTimeout(fetchStock, 300);
    return () => clearTimeout(timer);
  }, [fetchStock]);

  const columns = [
    {
      header: 'Product / SKU',
      render: (s) => (
        <div>
          <span className="font-semibold text-slate-900">{s.product_name}</span>
          <span className="block font-mono text-xs text-slate-400">{s.sku}</span>
        </div>
      ),
    },
    {
      header: 'Warehouse',
      render: (s) => <span className="font-medium text-slate-800">{s.warehouse_name || '--'}</span>,
    },
    {
      header: 'Location / Rack',
      render: (s) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <MapPin className="w-3.5 h-3.5 text-slate-400" />
          <span>{s.location_name || s.location_barcode || '--'}</span>
        </div>
      ),
    },
    {
      header: 'On Hand',
      render: (s) => (
        <span className="font-bold text-slate-900 text-sm">
          {s.quantity} <span className="text-xs text-slate-400 font-normal">{s.uom_code || ''}</span>
        </span>
      ),
    },
    {
      header: 'Reserved',
      render: (s) => (
        <span className="font-medium text-amber-600">
          {s.reserved_quantity ?? 0}
        </span>
      ),
    },
    {
      header: 'Available for Dispatch',
      render: (s) => (
        <span className="font-bold text-emerald-600 text-sm">
          {s.available_quantity ?? s.quantity}
        </span>
      ),
    },
    {
      header: 'Status',
      render: (s) => {
        const isOut = Number(s.quantity) === 0;
        const isLow = s.min_stock !== undefined && Number(s.quantity) <= Number(s.min_stock);

        if (isOut) return <Badge variant="critical">Out of Stock</Badge>;
        if (isLow) return <Badge variant="low">Low Stock</Badge>;
        return <Badge variant="active">In Stock</Badge>;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Live Stock Balances</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time physical quantities, active reservations, and dispatchable balances
          </p>
        </div>
        <Button variant="secondary" icon={RefreshCw} onClick={fetchStock} loading={loading}>
          Refresh
        </Button>
      </div>

      {/* Smart Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search by SKU, product name, or location..."
            icon={Search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-56">
          <Select
            placeholder="All Warehouses"
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
            options={warehouses.map((w) => ({ value: w.id, label: w.name }))}
          />
        </div>
        <div className="w-56">
          <Select
            placeholder="All Categories"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
          />
        </div>
        <button
          type="button"
          onClick={() => setLowStockOnly(!lowStockOnly)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors cursor-pointer ${
            lowStockOnly
              ? 'bg-amber-50 text-amber-900 border-amber-300'
              : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
          }`}
        >
          <AlertTriangle className={`w-4 h-4 ${lowStockOnly ? 'text-amber-600' : 'text-slate-400'}`} />
          <span>Low Stock Only</span>
        </button>
      </div>

      <Table
        columns={columns}
        data={stockList}
        loading={loading}
        emptyMessage="No stock balances found matching the filters."
        onRowClick={(s) => navigate(`/products/${s.product_id}`)}
      />
    </div>
  );
}
