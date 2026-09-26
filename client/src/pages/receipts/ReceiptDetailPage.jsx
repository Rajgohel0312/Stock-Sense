import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, CheckCircle, XCircle, Trash2, ArrowDownLeft, MapPin } from 'lucide-react';
import { receiptService } from '../../services/receipt.service';
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

export default function ReceiptDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { isManagerOrAdmin } = useAuth();

  const [receipt, setReceipt] = useState(null);
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
    quantity: 1,
  });

  const fetchReceiptDetails = useCallback(async () => {
    setLoading(true);
    try {
      const res = await receiptService.getReceiptById(id);
      const data = res.data?.receipt || res.data;
      setReceipt(data);

      if (data.status === 'draft') {
        const [prodRes, locRes] = await Promise.all([
          catalogService.getProducts(),
          inventoryService.getLocations({ warehouseId: data.warehouse_id }),
        ]);
        setProducts(prodRes.data?.products || prodRes.data || []);
        setLocations(locRes.data?.locations || locRes.data || []);
      }
    } catch (err) {
      toast.error('Failed to load receipt details');
      navigate(ROUTES.RECEIPTS);
    } finally {
      setLoading(false);
    }
  }, [id, navigate, toast]);

  useEffect(() => {
    fetchReceiptDetails();
  }, [fetchReceiptDetails]);

  const handleAddItem = async (e) => {
    e.preventDefault();
    setItemFormLoading(true);
    try {
      await receiptService.addItem(id, {
        productId: itemFormData.productId,
        locationId: itemFormData.locationId,
        quantity: Number(itemFormData.quantity),
      });
      toast.success('Item added to receipt!');
      setIsItemModalOpen(false);
      setItemFormData({ productId: '', locationId: '', quantity: 1 });
      fetchReceiptDetails();
    } catch (err) {
      toast.error(err.userMessage || 'Failed to add item');
    } finally {
      setItemFormLoading(false);
    }
  };

  const handleRemoveItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to remove this item?')) return;
    try {
      await receiptService.removeItem(id, itemId);
      toast.success('Item removed');
      fetchReceiptDetails();
    } catch (err) {
      toast.error(err.userMessage || 'Failed to remove item');
    }
  };

  const handleValidate = async () => {
    if (!window.confirm('Validate this receipt? Inventory balances will be incremented.')) return;
    setActionLoading(true);
    try {
      await receiptService.validateReceipt(id);
      toast.success('Receipt validated and inventory updated successfully!');
      fetchReceiptDetails();
    } catch (err) {
      toast.error(err.userMessage || 'Failed to validate receipt');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Cancel this receipt order?')) return;
    setActionLoading(true);
    try {
      await receiptService.cancelReceipt(id);
      toast.success('Receipt canceled');
      fetchReceiptDetails();
    } catch (err) {
      toast.error(err.userMessage || 'Failed to cancel receipt');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !receipt) {
    return (
      <div className="py-20 text-center">
        <Spinner size="xl" className="text-indigo-600 mb-2" />
        <p className="text-sm text-slate-500 font-medium">Loading receipt document...</p>
      </div>
    );
  }

  const isDraft = receipt.status === 'draft';

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
      header: 'Target Location',
      render: (item) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-700">
          <MapPin className="w-3.5 h-3.5 text-slate-400" />
          <span>{item.location_name || item.location_barcode || '--'}</span>
        </div>
      ),
    },
    {
      header: 'Received Quantity',
      render: (item) => (
        <span className="font-bold text-slate-900 text-sm">
          {item.quantity_received ?? item.quantity} {item.uom_code || ''}
        </span>
      ),
    },
    ...(isDraft
      ? [
          {
            header: '',
            className: 'text-right',
            render: (item) => (
              <button
                onClick={() => handleRemoveItem(item.id)}
                className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                title="Remove item"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      {/* Top Bar Navigation and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Button variant="secondary" size="sm" icon={ArrowLeft} onClick={() => navigate(ROUTES.RECEIPTS)}>
          Back to Receipts
        </Button>

        {isDraft && (
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              icon={Plus}
              onClick={() => {
                setItemFormData({
                  productId: products[0]?.id || '',
                  locationId: locations[0]?.id || '',
                  quantity: 10,
                });
                setIsItemModalOpen(true);
              }}
            >
              Add Item
            </Button>
            {isManagerOrAdmin && (
              <>
                <Button
                  variant="danger"
                  icon={XCircle}
                  loading={actionLoading}
                  onClick={handleCancel}
                >
                  Cancel Receipt
                </Button>
                <Button
                  variant="success"
                  icon={CheckCircle}
                  loading={actionLoading}
                  disabled={!receipt.items || receipt.items.length === 0}
                  onClick={handleValidate}
                >
                  Validate & Receive Stock
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Document Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
            <ArrowDownLeft className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-900 font-mono">
                {receipt.receipt_number}
              </h1>
              <Badge variant={receipt.status}>{receipt.status}</Badge>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Supplier: <strong className="text-slate-700">{receipt.supplier_name || '--'}</strong>
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Destination Warehouse:{' '}
              <strong className="text-slate-600">{receipt.warehouse_name || '--'}</strong>
            </p>
          </div>
        </div>

        <div className="border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-8 text-xs text-slate-500 space-y-1">
          <p>
            Created At:{' '}
            <span className="font-medium text-slate-700">
              {receipt.created_at ? new Date(receipt.created_at).toLocaleString() : '--'}
            </span>
          </p>
          {receipt.validated_at && (
            <p>
              Validated At:{' '}
              <span className="font-medium text-emerald-700">
                {new Date(receipt.validated_at).toLocaleString()}
              </span>
            </p>
          )}
        </div>
      </div>

      {/* Items Table */}
      <Card
        title="Received Line Items"
        subtitle={
          isDraft
            ? 'Add products and destination bins before validation'
            : 'Validated items recorded into stock balances'
        }
      >
        <Table
          columns={itemColumns}
          data={receipt.items || []}
          emptyMessage="No items have been added to this receipt yet."
        />
      </Card>

      {/* Add Item Modal */}
      <Modal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        title="Add Inbound Item"
        subtitle="Select product, destination location, and quantity received"
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
            label="Quantity Received"
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
