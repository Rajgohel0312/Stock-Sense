import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, CheckCircle, XCircle, Sliders, MapPin } from 'lucide-react';
import { adjustmentService } from '../../services/adjustment.service';
import { catalogService } from '../../services/catalog.service';
import { inventoryService } from '../../services/inventory.service';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ROUTES } from '../../constants/routes';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';

export default function AdjustmentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { isManagerOrAdmin } = useAuth();

  const [adjustment, setAdjustment] = useState(null);
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Add Item Modal
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [itemFormLoading, setItemFormLoading] = useState(false);
  const [itemFormData, setItemFormData] = useState({
    productId: '',
    locationId: '',
    countedQuantity: 0,
  });

  const fetchAdjustmentDetails = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adjustmentService.getAdjustmentById(id);
      const data = res.data?.adjustment || res.data;
      setAdjustment(data);

      if (data.status === 'draft') {
        const [prodRes, locRes] = await Promise.all([
          catalogService.getProducts(),
          inventoryService.getLocations({ warehouseId: data.warehouse_id }),
        ]);
        setProducts(prodRes.data?.products || prodRes.data || []);
        setLocations(locRes.data?.locations || locRes.data || []);
      }
    } catch (err) {
      toast.error('Failed to load adjustment details');
      navigate(ROUTES.ADJUSTMENTS);
    } finally {
      setLoading(false);
    }
  }, [id, navigate, toast]);

  useEffect(() => {
    fetchAdjustmentDetails();
  }, [fetchAdjustmentDetails]);

  const handleAddItem = async (e) => {
    e.preventDefault();
    setItemFormLoading(true);
    try {
      await adjustmentService.addItem(id, {
        productId: itemFormData.productId,
        locationId: itemFormData.locationId,
        countedQuantity: Number(itemFormData.countedQuantity),
      });
      toast.success('Counted item added to adjustment!');
      setIsItemModalOpen(false);
      setItemFormData({ productId: '', locationId: '', countedQuantity: 0 });
      fetchAdjustmentDetails();
    } catch (err) {
      toast.error(err.userMessage || 'Failed to add item to adjustment');
    } finally {
      setItemFormLoading(false);
    }
  };

  const handleValidate = async () => {
    if (!window.confirm('Validate this adjustment? Stock balances will be reconciled to counted quantities.')) return;
    setActionLoading(true);
    try {
      await adjustmentService.validateAdjustment(id);
      toast.success('Adjustment validated and stock ledger updated!');
      fetchAdjustmentDetails();
    } catch (err) {
      toast.error(err.userMessage || 'Failed to validate adjustment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Cancel this adjustment session?')) return;
    setActionLoading(true);
    try {
      await adjustmentService.cancelAdjustment(id);
      toast.success('Adjustment canceled');
      fetchAdjustmentDetails();
    } catch (err) {
      toast.error(err.userMessage || 'Failed to cancel adjustment');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !adjustment) {
    return (
      <div className="py-20 text-center">
        <Spinner size="xl" className="text-indigo-600 mb-2" />
        <p className="text-sm text-slate-500 font-medium">Loading adjustment document...</p>
      </div>
    );
  }

  const isDraft = adjustment.status === 'draft';
  const isDone = adjustment.status === 'done';
  const isCanceled = adjustment.status === 'canceled';

  const itemColumns = [
    {
      header: 'Product',
      render: (item) => (
        <div>
          <span className="font-semibold text-slate-900">{item.product_name}</span>
          <span className="block font-mono text-xs text-slate-400">{item.sku}</span>
        </div>
      ),
    },
    {
      header: 'Location',
      render: (item) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-700">
          <MapPin className="w-3.5 h-3.5 text-slate-400" />
          <span>{item.location_name || item.location_barcode || '--'}</span>
        </div>
      ),
    },
    {
      header: 'System Stock',
      render: (item) => <span className="font-mono text-slate-600">{item.system_quantity ?? item.previous_quantity ?? 0}</span>,
    },
    {
      header: 'Physical Counted',
      render: (item) => <span className="font-bold text-slate-900">{item.counted_quantity}</span>,
    },
    {
      header: 'Discrepancy',
      render: (item) => {
        const disc =
          item.discrepancy !== undefined
            ? Number(item.discrepancy)
            : Number(item.counted_quantity) - Number(item.system_quantity || 0);
        return (
          <span
            className={`font-mono font-bold text-sm ${
              disc === 0
                ? 'text-slate-500'
                : disc > 0
                ? 'text-emerald-600'
                : 'text-rose-600'
            }`}
          >
            {disc > 0 ? `+${disc}` : disc}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Bar Navigation and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Button variant="secondary" size="sm" icon={ArrowLeft} onClick={() => navigate(ROUTES.ADJUSTMENTS)}>
          Back to Adjustments
        </Button>

        <div className="flex items-center gap-3">
          {isDraft && (
            <Button
              variant="secondary"
              icon={Plus}
              onClick={() => {
                setItemFormData({
                  productId: products[0]?.id || '',
                  locationId: locations[0]?.id || '',
                  countedQuantity: 0,
                });
                setIsItemModalOpen(true);
              }}
            >
              Add Counted Item
            </Button>
          )}

          {isDraft && isManagerOrAdmin && (
            <>
              <Button
                variant="danger"
                icon={XCircle}
                loading={actionLoading}
                onClick={handleCancel}
              >
                Cancel Session
              </Button>
              <Button
                variant="success"
                icon={CheckCircle}
                loading={actionLoading}
                disabled={!adjustment.items || adjustment.items.length === 0}
                onClick={handleValidate}
              >
                Validate & Adjust Stock
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Document Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
            <Sliders className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-900 font-mono">
                {adjustment.adjustment_number}
              </h1>
              <Badge variant={adjustment.status}>{adjustment.status}</Badge>
            </div>
            <p className="text-sm text-slate-700 mt-1">
              Warehouse: <strong className="text-slate-900">{adjustment.warehouse_name || '--'}</strong>
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Reason: <span>{adjustment.reason || 'Cycle count audit'}</span>
            </p>
          </div>
        </div>

        <div className="border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-8 text-xs text-slate-500 space-y-1">
          <p>
            Created At:{' '}
            <span className="font-medium text-slate-700">
              {adjustment.created_at ? new Date(adjustment.created_at).toLocaleString() : '--'}
            </span>
          </p>
          {adjustment.validated_at && (
            <p>
              Validated At:{' '}
              <span className="font-medium text-emerald-700">
                {new Date(adjustment.validated_at).toLocaleString()}
              </span>
            </p>
          )}
        </div>
      </div>

      {/* Items Table */}
      <Card
        title="Cycle Count Audit Line Items"
        subtitle={
          isDraft
            ? 'Record physical counts per SKU and location'
            : 'Reconciled count records with system discrepancies'
        }
      >
        <Table
          columns={itemColumns}
          data={adjustment.items || []}
          emptyMessage="No items have been counted in this adjustment session yet."
        />
      </Card>

      {/* Add Item Modal */}
      <Modal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        title="Record Physical Count"
        subtitle="Specify product, rack location, and verified count"
      >
        <form onSubmit={handleAddItem} className="space-y-4">
          <Select
            label="Product"
            required
            value={itemFormData.productId}
            onChange={(e) => setItemFormData({ ...itemFormData, productId: e.target.value })}
            options={products.map((p) => ({ value: p.id, label: `${p.name} (${p.sku})` }))}
          />

          <Select
            label="Storage Location"
            required
            value={itemFormData.locationId}
            onChange={(e) => setItemFormData({ ...itemFormData, locationId: e.target.value })}
            options={locations.map((l) => ({
              value: l.id,
              label: `${l.name} ${l.barcode ? `(${l.barcode})` : ''}`,
            }))}
          />

          <Input
            label="Physically Counted Quantity"
            type="number"
            min="0"
            required
            value={itemFormData.countedQuantity}
            onChange={(e) =>
              setItemFormData({ ...itemFormData, countedQuantity: Number(e.target.value) })
            }
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setIsItemModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={itemFormLoading}>
              Add Item
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
