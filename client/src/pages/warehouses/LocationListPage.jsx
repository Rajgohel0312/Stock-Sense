import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, MapPin, QrCode } from 'lucide-react';
import { inventoryService } from '../../services/inventory.service';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';

export default function LocationListPage() {
  const [searchParams] = useSearchParams();
  const initialWh = searchParams.get('warehouseId') || '';

  const { isManagerOrAdmin } = useAuth();
  const toast = useToast();

  const [locations, setLocations] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState(initialWh);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [formData, setFormData] = useState({
    warehouseId: initialWh,
    name: '',
    barcode: '',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [locRes, whRes] = await Promise.all([
        inventoryService.getLocations({
          warehouseId: selectedWarehouse || undefined,
        }),
        inventoryService.getWarehouses(),
      ]);
      setLocations(locRes.data?.locations || locRes.data || []);
      setWarehouses(whRes.data?.warehouses || whRes.data || []);
    } catch (err) {
      toast.error('Failed to load locations');
    } finally {
      setLoading(false);
    }
  }, [selectedWarehouse, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateLocation = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      await inventoryService.createLocation(formData);
      toast.success('Storage location created successfully!');
      setIsModalOpen(false);
      setFormData({ warehouseId: selectedWarehouse || warehouses[0]?.id || '', name: '', barcode: '' });
      fetchData();
    } catch (err) {
      toast.error(err.userMessage || 'Failed to create location');
    } finally {
      setModalLoading(false);
    }
  };

  const columns = [
    {
      header: 'Location Name / Rack',
      render: (l) => (
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-indigo-500" />
          <span className="font-semibold text-slate-900">{l.name}</span>
        </div>
      ),
    },
    {
      header: 'Barcode / Tag',
      render: (l) => (
        <div className="flex items-center gap-1.5 font-mono text-xs text-slate-700 bg-slate-100 px-2 py-1 rounded w-fit">
          <QrCode className="w-3.5 h-3.5 text-slate-400" />
          <span>{l.barcode || 'N/A'}</span>
        </div>
      ),
    },
    {
      header: 'Warehouse',
      render: (l) => <span className="font-medium text-slate-800">{l.warehouse_name || '--'}</span>,
    },
    {
      header: 'Status',
      render: (l) => (
        <Badge variant={l.is_active === false ? 'inactive' : 'active'}>
          {l.is_active === false ? 'Inactive' : 'Active'}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Storage Locations</h1>
          <p className="text-sm text-slate-500 mt-1">
            Bins, shelves, aisles, and staging zones mapped within warehouses
          </p>
        </div>
        {isManagerOrAdmin && (
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => {
              setFormData({
                warehouseId: selectedWarehouse || warehouses[0]?.id || '',
                name: '',
                barcode: '',
              });
              setIsModalOpen(true);
            }}
          >
            Add Location
          </Button>
        )}
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 sm:w-72">
        <Select
          placeholder="Filter by Warehouse (All)"
          value={selectedWarehouse}
          onChange={(e) => setSelectedWarehouse(e.target.value)}
          options={warehouses.map((w) => ({ value: w.id, label: `${w.name} (${w.code})` }))}
        />
      </div>

      <Table columns={columns} data={locations} loading={loading} emptyMessage="No storage locations found" />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Storage Location"
        subtitle="Add a specific rack or bin zone to a warehouse"
      >
        <form onSubmit={handleCreateLocation} className="space-y-4">
          <Select
            label="Warehouse"
            required
            value={formData.warehouseId}
            onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
            options={warehouses.map((w) => ({ value: w.id, label: `${w.name} (${w.code})` }))}
          />
          <Input
            label="Location Name"
            required
            placeholder="Aisle 3 - Shelf B - Bin 04"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <Input
            label="Barcode / Tracking Scan Code"
            placeholder="LOC-A3-B04"
            value={formData.barcode}
            onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={modalLoading}>
              Save Location
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
