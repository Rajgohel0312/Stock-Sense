import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  CheckCircle,
  XCircle,
  PackageCheck,
  CheckSquare,
  ArrowUpRight,
  MapPin,
  Clock,
} from 'lucide-react';
import { deliveryService } from '../../services/delivery.service';
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

export default function DeliveryDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { isManagerOrAdmin } = useAuth();

  const [delivery, setDelivery] = useState(null);
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

  const fetchDeliveryDetails = useCallback(async () => {
    setLoading(true);
    try {
      const res = await deliveryService.getDeliveryById(id);
      const data = res.data?.delivery || res.data;
      setDelivery(data);

      if (data.status === 'draft') {
        const [prodRes, locRes] = await Promise.all([
          catalogService.getProducts(),
          inventoryService.getLocations({ warehouseId: data.warehouse_id }),
        ]);
        setProducts(prodRes.data?.products || prodRes.data || []);
        setLocations(locRes.data?.locations || locRes.data || []);
      }
    } catch (err) {
      toast.error('Failed to load delivery details');
      navigate(ROUTES.DELIVERIES);
    } finally {
      setLoading(false);
    }
  }, [id, navigate, toast]);

  useEffect(() => {
    fetchDeliveryDetails();
  }, [fetchDeliveryDetails]);

  const handleAddItem = async (e) => {
    e.preventDefault();
    setItemFormLoading(true);
    try {
      await deliveryService.addItem(id, {
        productId: itemFormData.productId,
        locationId: itemFormData.locationId,
        quantity: Number(itemFormData.quantity),
      });
      toast.success('Item added to delivery order!');
      setIsItemModalOpen(false);
      setItemFormData({ productId: '', locationId: '', quantity: 1 });
      fetchDeliveryDetails();
    } catch (err) {
      toast.error(err.userMessage || 'Failed to add item');
    } finally {
      setItemFormLoading(false);
    }
  };

  const handleWorkflowTransition = async (actionFn, actionName) => {
    setActionLoading(true);
    try {
      await actionFn(id);
      toast.success(`Delivery progressed: ${actionName}`);
      fetchDeliveryDetails();
    } catch (err) {
      toast.error(err.userMessage || `Failed to ${actionName}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !delivery) {
    return (
      <div className="py-20 text-center">
        <Spinner size="xl" className="text-indigo-600 mb-2" />
        <p className="text-sm text-slate-500 font-medium">Loading delivery order...</p>
      </div>
    );
  }

  const isDraft = delivery.status === 'draft';
  const isReady = delivery.status === 'ready';
  const isPicked = delivery.status === 'picked';
  const isPacked = delivery.status === 'packed';
  const isDone = delivery.status === 'done';
  const isCanceled = delivery.status === 'canceled';

  const steps = ['draft', 'ready', 'picked', 'packed', 'done'];
  const currentStepIndex = steps.indexOf(delivery.status);

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
          <span>{item.location_name || item.location_barcode || '--'}</span>
        </div>
      ),
    },
    {
      header: 'Requested Quantity',
      render: (item) => (
        <span className="font-medium text-slate-800">
          {item.quantity_requested ?? item.quantity} {item.uom_code || ''}
        </span>
      ),
    },
    {
      header: 'Shipped Quantity',
      render: (item) => (
        <span className="font-bold text-slate-900">
          {item.quantity_shipped ?? (isDone ? item.quantity_requested : 0)} {item.uom_code || ''}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Bar Navigation and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Button variant="secondary" size="sm" icon={ArrowLeft} onClick={() => navigate(ROUTES.DELIVERIES)}>
          Back to Deliveries
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
              disabled={!delivery.items || delivery.items.length === 0}
              onClick={() => handleWorkflowTransition(deliveryService.markReady, 'Mark as Ready')}
            >
              Mark Ready
            </Button>
          )}

          {isReady && (
            <Button
              variant="primary"
              className="bg-blue-600 hover:bg-blue-700"
              icon={CheckSquare}
              loading={actionLoading}
              onClick={() => handleWorkflowTransition(deliveryService.pick, 'Picked')}
            >
              Confirm Picking
            </Button>
          )}

          {isPicked && (
            <Button
              variant="primary"
              className="bg-purple-600 hover:bg-purple-700"
              icon={PackageCheck}
              loading={actionLoading}
              onClick={() => handleWorkflowTransition(deliveryService.pack, 'Packed')}
            >
              Confirm Packing
            </Button>
          )}

          {isPacked && isManagerOrAdmin && (
            <Button
              variant="success"
              icon={CheckCircle}
              loading={actionLoading}
              onClick={() =>
                handleWorkflowTransition(deliveryService.validateDelivery, 'Validated & Shipped')
              }
            >
              Validate & Ship Order
            </Button>
          )}

          {!isDone && !isCanceled && isManagerOrAdmin && (
            <Button
              variant="danger"
              icon={XCircle}
              loading={actionLoading}
              onClick={() => handleWorkflowTransition(deliveryService.cancelDelivery, 'Canceled')}
            >
              Cancel Order
            </Button>
          )}
        </div>
      </div>

      {/* Progress Pipeline Stepper */}
      {!isCanceled && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between">
            {steps.map((step, idx) => {
              const isPassed = currentStepIndex >= idx;
              const isCurrent = currentStepIndex === idx;

              return (
                <div key={step} className="flex-1 flex items-center">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs uppercase transition-colors ${
                        isPassed
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-slate-100 text-slate-400 border border-slate-200'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <span
                      className={`text-xs mt-2 font-medium capitalize ${
                        isCurrent
                          ? 'text-indigo-600 font-bold'
                          : isPassed
                          ? 'text-slate-800'
                          : 'text-slate-400'
                      }`}
                    >
                      {step}
                    </span>
                  </div>
                  {idx < steps.length - 1 && (
                    <div
                      className={`h-1 flex-1 mx-2 rounded-full transition-colors ${
                        currentStepIndex > idx ? 'bg-indigo-600' : 'bg-slate-200'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Document Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-purple-50 text-purple-700 rounded-xl">
            <ArrowUpRight className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-900 font-mono">
                {delivery.delivery_number}
              </h1>
              <Badge variant={delivery.status}>{delivery.status}</Badge>
            </div>
            <p className="text-sm text-slate-700 mt-1">
              Customer: <strong className="text-slate-900">{delivery.customer_name || '--'}</strong>{' '}
              {delivery.customer_tier && (
                <Badge tier={delivery.customer_tier} size="sm">
                  {delivery.customer_tier}
                </Badge>
              )}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Origin Warehouse:{' '}
              <strong className="text-slate-600">{delivery.warehouse_name || '--'}</strong>
            </p>
          </div>
        </div>

        <div className="border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-8 text-xs text-slate-500 space-y-1">
          <p>
            Created At:{' '}
            <span className="font-medium text-slate-700">
              {delivery.created_at ? new Date(delivery.created_at).toLocaleString() : '--'}
            </span>
          </p>
          {delivery.validated_at && (
            <p>
              Validated & Shipped At:{' '}
              <span className="font-medium text-emerald-700">
                {new Date(delivery.validated_at).toLocaleString()}
              </span>
            </p>
          )}
        </div>
      </div>

      {/* Items Table */}
      <Card
        title="Delivery Order Items"
        subtitle={
          isDraft
            ? 'Add requested items and quantities before marking ready'
            : 'Line items in picking and shipping pipeline'
        }
      >
        <Table
          columns={itemColumns}
          data={delivery.items || []}
          emptyMessage="No items have been added to this delivery order yet."
        />
      </Card>

      {/* Add Item Modal */}
      <Modal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        title="Add Delivery Item"
        subtitle="Select SKU and stock picking location"
      >
        <form onSubmit={handleAddItem} className="space-y-4">
          <Select
            label="Product SKU"
            required
            value={itemFormData.productId}
            onChange={(e) => setItemFormData({ ...itemFormData, productId: e.target.value })}
            options={products.map((p) => ({ value: p.id, label: `${p.name} (${p.sku})` }))}
          />

          <Select
            label="Picking Location"
            required
            value={itemFormData.locationId}
            onChange={(e) => setItemFormData({ ...itemFormData, locationId: e.target.value })}
            options={locations.map((l) => ({
              value: l.id,
              label: `${l.name} ${l.barcode ? `(${l.barcode})` : ''}`,
            }))}
          />

          <Input
            label="Requested Quantity"
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
