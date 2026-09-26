import React, { useState, useEffect, useCallback } from 'react';
import { Bell, CheckCircle2, AlertTriangle, AlertCircle, Info, RefreshCw } from 'lucide-react';
import { alertService } from '../../services/alert.service';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';

export default function AlertListPage() {
  const { isManagerOrAdmin } = useAuth();
  const toast = useToast();

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await alertService.getAlerts();
      setAlerts(res.data?.alerts || res.data || []);
    } catch (err) {
      toast.error('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleResolveAlert = async (id) => {
    try {
      await alertService.resolveAlert(id);
      toast.success('Alert marked as resolved');
      fetchAlerts();
    } catch (err) {
      toast.error(err.userMessage || 'Failed to resolve alert');
    }
  };

  const columns = [
    {
      header: 'Severity',
      render: (a) => {
        const sev = (a.severity || 'info').toLowerCase();
        let Icon = Info;
        let color = 'text-sky-500';
        if (sev === 'critical') {
          Icon = AlertCircle;
          color = 'text-rose-500';
        } else if (sev === 'warning' || sev === 'low') {
          Icon = AlertTriangle;
          color = 'text-amber-500';
        }
        return (
          <div className="flex items-center gap-1.5 font-semibold text-xs capitalize">
            <Icon className={`w-4 h-4 ${color}`} />
            <span>{sev}</span>
          </div>
        );
      },
    },
    {
      header: 'Alert Title & Details',
      render: (a) => (
        <div>
          <span className="font-semibold text-slate-900 text-sm">{a.title}</span>
          <p className="text-xs text-slate-500 mt-0.5 max-w-lg">{a.message}</p>
        </div>
      ),
    },
    {
      header: 'Status',
      render: (a) => (
        <Badge variant={a.is_resolved ? 'active' : 'low'}>
          {a.is_resolved ? 'Resolved' : 'Active'}
        </Badge>
      ),
    },
    {
      header: 'Triggered At',
      render: (a) => (
        <span className="text-xs text-slate-400">
          {a.created_at ? new Date(a.created_at).toLocaleString() : '--'}
        </span>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (a) => (
        <div className="flex items-center justify-end gap-2">
          {!a.is_resolved && isManagerOrAdmin && (
            <Button
              variant="secondary"
              size="sm"
              icon={CheckCircle2}
              onClick={() => handleResolveAlert(a.id)}
            >
              Resolve
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">System Alerts</h1>
          <p className="text-sm text-slate-500 mt-1">
            Notifications triggered for low inventory levels, safety thresholds, and stock anomalies
          </p>
        </div>
        <Button variant="secondary" icon={RefreshCw} onClick={fetchAlerts} loading={loading}>
          Refresh
        </Button>
      </div>

      <Table
        columns={columns}
        data={alerts}
        loading={loading}
        emptyMessage="No alerts recorded in the system."
      />
    </div>
  );
}
