import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, CheckCircle, XCircle, ArrowLeftRight, CheckSquare, MapPin } from 'lucide-react';
import { transferService } from '../../services/transfer.service';
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

export default function TransferDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { isManagerOrAdmin } = useAuth();

  const [transfer, setTransfer] = useState(null);
  const [products, setProducts] = useState([]);
  const [sourceLocations, setSourceLocations] = useState([]);
  const [destLocations, setDestLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Add Item Modal
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [itemFormLoading, setItemFormLoading] = useState(false);
  const [itemFormData, setItemFormData] = useState({
    productId: '',
    sourceLocationId: '',
    destLocationId: '',
    quantity: 1,
  });

  const fetchTransferDetails = useCallback(async () => {
    setLoading(true);
    try {
      const res = await transferService.getTransferById(id);
      const data = res.data?.transfer || res.data;
      setTransfer(data);

      if (data.status === 'draft') {
        const [prodRes, srcLocRes, dstLocRes] = await Promise.all([
          catalogService.getProducts(),
          inventoryService.getLocations({ warehouseId: data.source_warehouse_id }),
          inventoryService.getLocations({ warehouseId: data.destination_warehouse_id || data.dest_warehouse_id }),
        ]);
        setProducts(prodRes.data?.products || prodRes.data || []);
        setSourceLocations(srcLocRes.data?.locations || srcLocRes.data || []);
        setDestLocations(dstLocRes.data?.locations || dstLocRes.data || []);
      }
    } catch (err) {
      toast.error('Failed to load transfer details');
      navigate(ROUTES.TRANSFERS);
    } finally {
      setLoading(false);
    }
  }, [id, navigate, toast]);

  useEffect(() => {
    fetchTransferDetails();
  }, [fetchTransferDetails]);

  const handleAddItem = async (e) => {
    e.preventDefault();
    setItemFormLoading(true);
    try {
      await transferService.addItem(id, {
        productId: itemFormData.productId,
        sourceLocationId: itemFormData.sourceLocationId,
        destinationLocationId: itemFormData.destLocationId || itemFormData.destinationLocationId,
        quantity: Number(itemFormData.quantity),
      });
      toast.success('Item added to transfer order!');
      setIsItemModalOpen(false);
      setItemFormData({
        productId: '',
        sourceLocationId: '',
        destLocationId: '',
        quantity: 1,
      });
      fetchTransferDetails();
    } catch (err) {
      toast.error(err.userMessage || 'Failed to add item to transfer');
    } finally {
      setItemFormLoading(false);
    }
  };

  const handleMarkReady = async () => {
    setActionLoading(true);
    try {
      await transferService.markReady(id);
      toast.success('Transfer marked ready for movement');
      fetchTransferDetails();
    } catch (err) {
      toast.error(err.userMessage || 'Failed to mark transfer ready');
    } finally {
      setActionLoading(false);
    }
  };

  const handleValidate = async () => {
    if (!window.confirm('Validate this transfer? Stock will be debited from source and credited to destination.')) return;
    setActionLoading(true);
    try {
      await transferService.validateTransfer(id);
      toast.success('Transfer successfully completed and stock updated!');
      fetchTransferDetails();
    } catch (err) {
      toast.error(err.userMessage || 'Failed to validate transfer');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Cancel this transfer?')) return;
    setActionLoading(true);
    try {
      await transferService.cancelTransfer(id);
      toast.success('Transfer canceled');
      fetchTransferDetails();
    } catch (err) {
      toast.error(err.userMessage || 'Failed to cancel transfer');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !transfer) {
    return (
      <div className="py-20 text-center">
        <Spinner size="xl" className="text-indigo-600 mb-2" />
        <p className="text-sm text-slate-500 font-medium">Loading transfer document...</p>
      </div>
    );
  }

  const isDraft = transfer.status === 'draft';
  const isReady = transfer.status === 'ready';
  const isDone = transfer.status === 'done';
  const isCanceled = transfer.status === 'canceled';

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
      header: 'Source Location',
      render: (item) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-700">
          <MapPin className="w-3.5 h-3.5 text-slate-400" />
          <span>{item.source_location_name || '--'}</span>
        </div>
      ),
    },
    {
      header: 'Destination Location',
      render: (item) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-700">
          <MapPin className="w-3.5 h-3.5 text-indigo-400" />
          <span>{item.dest_location_name || '--'}</span>
        </div>
      ),
    },
    {
      header: 'Transfer Quantity',
      render: (item) => (
        <span className="font-bold text-slate-900 text-sm">
          {item.quantity} {item.uom_code || ''}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Bar Navigation and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Button variant="secondary" size="sm" icon={ArrowLeft} onClick={() => navigate(ROUTES.TRANSFERS)}>
          Back to Transfers
        </Button>

        <div className="flex items-center gap-3">
          {isDraft && (
            <Button
              variant="secondary"
              icon={Plus}
              onClick={() => {
                setItemFormData({
                  productId: products[0]?.id || '',
                  sourceLocationId: sourceLocations[0]?.id || '',
                  destLocationId: destLocations[0]?.id || '',
                  quantity: 1,
                });
                setIsItemModalOpen(true);
              }}
            >
              Add Item
            </Button>
          )}

          {isDraft && (
            <Button
              variant="primary"
              icon={CheckSquare}
              loading={actionLoading}
              disabled={!transfer.items || transfer.items.length === 0}
              onClick={handleMarkReady}
            >
              Mark Ready
            </Button>
          )}

          {isReady && isManagerOrAdmin && (
            <Button
              variant="success"
              icon={CheckCircle}
              loading={actionLoading}
              onClick={handleValidate}
            >
              Validate & Move Stock
            </Button>
          )}

          {!isDone && !isCanceled && isManagerOrAdmin && (
            <Button
              variant="danger"
              icon={XCircle}
              loading={actionLoading}
              onClick={handleCancel}
            >
              Cancel Transfer
            </Button>
          )}
        </div>
      </div>

      {/* Document Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-cyan-50 text-cyan-700 rounded-xl">
            <ArrowLeftRight className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-900 font-mono">
                {transfer.transfer_number}
              </h1>
              <Badge variant={transfer.status}>{transfer.status}</Badge>
            </div>
            <p className="text-sm text-slate-700 mt-1">
              From: <strong className="text-slate-900">{transfer.source_warehouse_name || '--'}</strong> &rarr; To:{' '}
              <strong className="text-slate-900">{transfer.dest_warehouse_name || '--'}</strong>
            </p>
          </div>
        </div>

        <div className="border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-8 text-xs text-slate-500 space-y-1">
          <p>
            Created At:{' '}
            <span className="font-medium text-slate-700">
              {transfer.created_at ? new Date(transfer.created_at).toLocaleString() : '--'}
            </span>
          </p>
          {transfer.validated_at && (
            <p>
              Validated At:{' '}
              <span className="font-medium text-emerald-700">
                {new Date(transfer.validated_at).toLocaleString()}
              </span>
            </p>
          )}
        </div>
      </div>

      {/* Items Table */}
      <Card
        title="Items To Transfer"
        subtitle={
          isDraft
            ? 'Specify products, origin bins, and target bins'
            : 'Validated items transferred between facilities'
        }
      >
        <Table
          columns={itemColumns}
          data={transfer.items || []}
          emptyMessage="No items have been added to this transfer yet."
        />
      </Card>

      {/* Add Item Modal */}
      <Modal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        title="Add Transfer Item"
        subtitle="Select product, source location, and destination location"
      >
        <form onSubmit={handleAddItem} className="space-y-4">
          <Select
            label="Product"
            required
            value={itemFormData.productId}
            onChange={(e) => setItemFormData({ ...itemFormData, productId: e.target.value })}
            options={products.map((p) => ({ value: p.id, label: `${p.name} (${p.sku})` }))}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label={`Source Location (${transfer.source_warehouse_name || 'Origin'})`}
              required
              value={itemFormData.sourceLocationId}
              onChange={(e) =>
                setItemFormData({ ...itemFormData, sourceLocationId: e.target.value })
              }
              options={sourceLocations.map((l) => ({
                value: l.id,
                label: `${l.name} ${l.barcode ? `(${l.barcode})` : ''}`,
              }))}
            />

            <Select
              label={`Destination Location (${transfer.dest_warehouse_name || 'Target'})`}
              required
              value={itemFormData.destLocationId}
              onChange={(e) =>
                setItemFormData({ ...itemFormData, destLocationId: e.target.value })
              }
              options={destLocations.map((l) => ({
                value: l.id,
                label: `${l.name} ${l.barcode ? `(${l.barcode})` : ''}`,
              }))}
            />
          </div>

          <Input
            label="Quantity to Move"
            type="number"
            min="1"
            required
            value={itemFormData.quantity}
            onChange={(e) => setItemFormData({ ...itemFormData, quantity: Number(e.target.value) })}
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
