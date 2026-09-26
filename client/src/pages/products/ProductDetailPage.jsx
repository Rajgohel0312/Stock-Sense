import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Boxes, Warehouse, MapPin, Layers, History } from 'lucide-react';
import { catalogService } from '../../services/catalog.service';
import { inventoryService } from '../../services/inventory.service';
import { useToast } from '../../context/ToastContext';
import { ROUTES } from '../../constants/routes';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [product, setProduct] = useState(null);
  const [stockLocations, setStockLocations] = useState([]);
  const [ledgerMovements, setLedgerMovements] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDetails = useCallback(async () => {
    setLoading(true);
    try {
      const [prodRes, stockRes, ledgerRes] = await Promise.all([
        catalogService.getProductById(id),
        inventoryService.getStock({ productId: id }),
        inventoryService.getLedger({ productId: id, limit: 10 }),
      ]);
      setProduct(prodRes?.data?.product || prodRes?.data);
      const stockList = Array.isArray(stockRes?.data?.stock)
        ? stockRes.data.stock
        : Array.isArray(stockRes?.data)
        ? stockRes.data
        : [];
      setStockLocations(stockList);

      const ledgerList = Array.isArray(ledgerRes?.data)
        ? ledgerRes.data
        : Array.isArray(ledgerRes?.data?.entries)
        ? ledgerRes.data.entries
        : Array.isArray(ledgerRes)
        ? ledgerRes
        : [];
      setLedgerMovements(ledgerList);
    } catch (err) {
      toast.error('Failed to load product details');
      navigate(ROUTES.PRODUCTS);
    } finally {
      setLoading(false);
    }
  }, [id, navigate, toast]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  if (loading || !product) {
    return (
      <div className="py-20 text-center">
        <Spinner size="xl" className="text-indigo-600 mb-2" />
        <p className="text-sm text-slate-500 font-medium">Loading product profile...</p>
      </div>
    );
  }

  const totalOnHand = stockLocations.reduce((acc, row) => acc + Number(row.quantity || 0), 0);
  const totalReserved = stockLocations.reduce((acc, row) => acc + Number(row.reserved_quantity || 0), 0);
  const totalAvailable = stockLocations.reduce((acc, row) => acc + Number(row.available_quantity || 0), 0);

  const stockColumns = [
    {
      header: 'Warehouse',
      render: (s) => (
        <span className="font-semibold text-slate-800">
          {s.warehouse_name || 'Main Warehouse'}
        </span>
      ),
    },
    {
      header: 'Location / Rack',
      render: (s) => (
        <div className="flex items-center gap-1 text-slate-600">
          <MapPin className="w-3.5 h-3.5 text-slate-400" />
          <span>{s.location_name || s.location_barcode || '--'}</span>
        </div>
      ),
    },
    {
      header: 'On Hand Quantity',
      render: (s) => <span className="font-bold text-slate-900">{s.quantity}</span>,
    },
    {
      header: 'Reserved Quantity',
      render: (s) => (
        <span className="font-medium text-amber-600">{s.reserved_quantity ?? 0}</span>
      ),
    },
    {
      header: 'Available for Sale',
      render: (s) => (
        <span className="font-bold text-emerald-600">{s.available_quantity ?? s.quantity}</span>
      ),
    },
  ];

  const ledgerColumns = [
    {
      header: 'Movement Type',
      render: (m) => (
        <Badge variant="default" size="sm">
          {m.reference_type?.replace('_', ' ') || 'movement'}
        </Badge>
      ),
    },
    {
      header: 'Change',
      render: (m) => {
        const change = Number(m.quantity_change);
        return (
          <span className={`font-bold ${change > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {change > 0 ? `+${change}` : change}
          </span>
        );
      },
    },
    {
      header: 'Balance After',
      render: (m) => <span className="font-mono text-slate-700">{m.balance_after}</span>,
    },
    {
      header: 'Timestamp',
      render: (m) => (
        <span className="text-xs text-slate-500">
          {new Date(m.created_at).toLocaleString()}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top breadcrumb navigation */}
      <div className="flex items-center gap-4">
        <Button variant="secondary" size="sm" icon={ArrowLeft} onClick={() => navigate(ROUTES.PRODUCTS)}>
          Back to Catalog
        </Button>
      </div>

      {/* Product Summary Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl">
            <Boxes className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-900">{product.name}</h1>
              <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                {product.sku}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1 max-w-xl">
              {product.description || 'No description provided'}
            </p>
            <div className="flex items-center gap-4 mt-3 text-xs text-slate-500 font-medium">
              <span>Category: <strong className="text-slate-700">{product.category_name || '--'}</strong></span>
              <span>UOM: <strong className="text-slate-700">{product.uom_name || 'Units'}</strong></span>
              <span>Min Stock: <strong className="text-slate-700">{product.min_stock ?? 0}</strong></span>
              <span>Reorder Point: <strong className="text-slate-700">{product.reorder_point ?? 0}</strong></span>
            </div>
          </div>
        </div>

        {/* Global Stock Stats */}
        <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-8">
          <div className="text-center">
            <p className="text-xs text-slate-400 font-semibold uppercase">On Hand</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{totalOnHand}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-400 font-semibold uppercase">Reserved</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{totalReserved}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-400 font-semibold uppercase">Available</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{totalAvailable}</p>
          </div>
        </div>
      </div>

      {/* Stock By Warehouse Location Table */}
      <Card
        title="Stock Balances by Location"
        subtitle="Real-time multi-warehouse inventory breakdown"
      >
        <Table
          columns={stockColumns}
          data={stockLocations}
          emptyMessage="No stock recorded in any location for this product"
        />
      </Card>

      {/* Product Ledger Movement History */}
      <Card
        title="Recent Audit Ledger Activity"
        subtitle="Immutable transaction log for this SKU"
      >
        <Table
          columns={ledgerColumns}
          data={ledgerMovements}
          emptyMessage="No audit ledger activity recorded for this product yet"
        />
      </Card>
    </div>
  );
}
