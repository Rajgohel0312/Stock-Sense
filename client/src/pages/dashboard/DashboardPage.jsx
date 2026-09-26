import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Boxes,
  Layers,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Sliders,
  TrendingDown,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { dashboardService } from '../../services/dashboard.service';
import { ROUTES } from '../../constants/routes';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Table from '../../components/ui/Table';

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [recentMovements, setRecentMovements] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, lowRes, movRes] = await Promise.all([
        dashboardService.getSummary(),
        dashboardService.getLowStock(),
        dashboardService.getRecentMovements(),
      ]);
      setSummary(sumRes.data || sumRes);
      setLowStock(lowRes.data?.items || lowRes.data || []);
      setRecentMovements(movRes.data?.movements || movRes.data || []);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const kpiCards = [
    {
      title: 'Total Products',
      value: summary?.totalProducts ?? '--',
      icon: Boxes,
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      link: ROUTES.PRODUCTS,
    },
    {
      title: 'Total Stock In Hand',
      value: summary?.totalStock ?? '--',
      icon: Layers,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      link: ROUTES.STOCK,
    },
    {
      title: 'Low Stock Alerts',
      value: summary?.lowStockProducts ?? '--',
      icon: AlertTriangle,
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      link: ROUTES.ALERTS,
      highlight: (summary?.lowStockProducts || 0) > 0,
    },
    {
      title: 'Pending Receipts',
      value: summary?.pendingReceipts ?? '--',
      icon: ArrowDownLeft,
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      link: ROUTES.RECEIPTS,
    },
    {
      title: 'Pending Deliveries',
      value: summary?.pendingDeliveries ?? '--',
      icon: ArrowUpRight,
      color: 'bg-purple-50 text-purple-700 border-purple-200',
      link: ROUTES.DELIVERIES,
    },
    {
      title: 'Pending Transfers',
      value: summary?.pendingTransfers ?? '--',
      icon: ArrowLeftRight,
      color: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      link: ROUTES.TRANSFERS,
    },
  ];

  const lowStockColumns = [
    {
      header: 'SKU / Product',
      render: (item) => (
        <div>
          <p className="font-semibold text-slate-800">{item.name || item.product_name}</p>
          <p className="text-xs font-mono text-slate-400">{item.sku}</p>
        </div>
      ),
    },
    {
      header: 'Warehouse',
      render: (item) => item.warehouse_name || 'All Warehouses',
    },
    {
      header: 'Current Stock',
      render: (item) => (
        <span className="font-bold text-rose-600">
          {item.quantity ?? item.total_stock ?? 0}
        </span>
      ),
    },
    {
      header: 'Reorder Point',
      render: (item) => item.reorder_point ?? item.min_stock ?? '--',
    },
    {
      header: 'Status',
      render: (item) => (
        <Badge variant={(item.quantity || item.total_stock || 0) === 0 ? 'critical' : 'low'}>
          {(item.quantity || item.total_stock || 0) === 0 ? 'Out of Stock' : 'Low Stock'}
        </Badge>
      ),
    },
  ];

  const movementColumns = [
    {
      header: 'Product',
      render: (m) => (
        <div>
          <span className="font-medium text-slate-800">{m.product_name || m.sku}</span>
          <span className="block text-xs font-mono text-slate-400">{m.sku}</span>
        </div>
      ),
    },
    {
      header: 'Type',
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
        const isPos = change > 0;
        return (
          <span
            className={`font-semibold text-sm ${
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
      render: (m) => <span className="font-mono text-slate-700">{m.balance_after ?? '--'}</span>,
    },
    {
      header: 'Date & Time',
      render: (m) => (
        <span className="text-xs text-slate-400">
          {m.created_at ? new Date(m.created_at).toLocaleString() : '--'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header and Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Operations Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time inventory levels, pending workflows, and stock movements
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" icon={RefreshCw} onClick={fetchData} loading={loading}>
            Refresh
          </Button>
          <Link to={ROUTES.RECEIPTS}>
            <Button variant="primary" icon={ArrowDownLeft}>
              New Receipt
            </Button>
          </Link>
          <Link to={ROUTES.DELIVERIES}>
            <Button variant="primary" icon={ArrowUpRight} className="bg-indigo-700">
              New Delivery
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpiCards.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <Link
              key={idx}
              to={kpi.link}
              className="block group transition-transform hover:-translate-y-0.5"
            >
              <div
                className={`p-4 rounded-xl border bg-white shadow-xs flex flex-col justify-between h-32 transition-shadow hover:shadow-md ${
                  kpi.highlight ? 'border-amber-300 ring-2 ring-amber-100' : 'border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">{kpi.title}</span>
                  <div className={`p-2 rounded-lg ${kpi.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-2xl font-bold text-slate-900 tracking-tight">
                    {kpi.value}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 transition-colors" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Two Column Layout: Low Stock Items & Recent Movements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Low Stock Alerts */}
        <Card
          title="Items Below Reorder Threshold"
          subtitle="Immediate replenishment or purchase order recommended"
          action={
            <Link to={ROUTES.STOCK}>
              <span className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
                View Stock Table &rarr;
              </span>
            </Link>
          }
        >
          <Table
            columns={lowStockColumns}
            data={lowStock.slice(0, 5)}
            loading={loading}
            emptyMessage="All items are comfortably above safety thresholds."
          />
        </Card>

        {/* Recent Movements */}
        <Card
          title="Recent Stock Ledger Movements"
          subtitle="Live append-only audit trail of recent transactions"
          action={
            <Link to={ROUTES.LEDGER}>
              <span className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
                Audit Trail &rarr;
              </span>
            </Link>
          }
        >
          <Table
            columns={movementColumns}
            data={recentMovements.slice(0, 5)}
            loading={loading}
            emptyMessage="No recent stock movements recorded."
          />
        </Card>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to={ROUTES.TRANSFERS}
          className="p-4 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 transition-colors flex items-center gap-3"
        >
          <div className="p-3 bg-cyan-50 text-cyan-700 rounded-lg">
            <ArrowLeftRight className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900">Internal Transfers</h4>
            <p className="text-xs text-slate-500">Move stock between locations</p>
          </div>
        </Link>

        <Link
          to={ROUTES.ADJUSTMENTS}
          className="p-4 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 transition-colors flex items-center gap-3"
        >
          <div className="p-3 bg-amber-50 text-amber-700 rounded-lg">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900">Stock Adjustments</h4>
            <p className="text-xs text-slate-500">Physical audit and cycle counts</p>
          </div>
        </Link>

        <Link
          to={ROUTES.RESERVATIONS}
          className="p-4 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 transition-colors flex items-center gap-3"
        >
          <div className="p-3 bg-purple-50 text-purple-700 rounded-lg">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900">Stock Reservations</h4>
            <p className="text-xs text-slate-500">Lock stock for customer orders</p>
          </div>
        </Link>

        <Link
          to={ROUTES.DOCUMENTS}
          className="p-4 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 transition-colors flex items-center gap-3"
        >
          <div className="p-3 bg-blue-50 text-blue-700 rounded-lg">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900">Unified Documents</h4>
            <p className="text-xs text-slate-500">Cross-document tracking hub</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
