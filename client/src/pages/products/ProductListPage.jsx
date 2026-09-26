import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Edit, Package, AlertCircle } from 'lucide-react';
import { catalogService } from '../../services/catalog.service';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';

export default function ProductListPage() {
  const { isManagerOrAdmin } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [uoms, setUoms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Create / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    categoryId: '',
    uomId: '',
    minStock: 0,
    reorderPoint: 0,
    maxStock: 100,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [prodRes, catRes, uomRes] = await Promise.all([
        catalogService.getProducts({
          search: search || undefined,
          categoryId: selectedCategory || undefined,
        }),
        catalogService.getCategories(),
        catalogService.getUOMs(),
      ]);

      setProducts(prodRes.data?.products || prodRes.data || []);
      setCategories(catRes.data?.categories || catRes.data || []);
      setUoms(uomRes.data?.uoms || uomRes.data || []);
    } catch (err) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory, toast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      sku: '',
      name: '',
      description: '',
      categoryId: categories[0]?.id || '',
      uomId: uoms[0]?.id || '',
      minStock: 10,
      reorderPoint: 20,
      maxStock: 100,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      sku: product.sku || '',
      name: product.name || '',
      description: product.description || '',
      categoryId: product.category_id || '',
      uomId: product.uom_id || '',
      minStock: product.min_stock || 0,
      reorderPoint: product.reorder_point || 0,
      maxStock: product.max_stock || 100,
    });
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      if (editingProduct) {
        await catalogService.updateProduct(editingProduct.id, formData);
        toast.success('Product updated successfully!');
      } else {
        await catalogService.createProduct(formData);
        toast.success('Product created successfully!');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.userMessage || 'Failed to save product');
    } finally {
      setModalLoading(false);
    }
  };

  const columns = [
    {
      header: 'SKU',
      render: (p) => <span className="font-mono font-semibold text-slate-800">{p.sku}</span>,
    },
    {
      header: 'Product Name',
      render: (p) => (
        <div>
          <span className="font-medium text-slate-900">{p.name}</span>
          {p.description && <p className="text-xs text-slate-400 truncate max-w-xs">{p.description}</p>}
        </div>
      ),
    },
    {
      header: 'Category',
      render: (p) => p.category_name || '--',
    },
    {
      header: 'UOM',
      render: (p) => <span className="text-xs font-mono">{p.uom_code || p.uom_name || 'Units'}</span>,
    },
    {
      header: 'Min / Reorder Point',
      render: (p) => (
        <span className="text-xs text-slate-600">
          Min: <span className="font-semibold">{p.min_stock ?? 0}</span> | Reorder:{' '}
          <span className="font-semibold">{p.reorder_point ?? 0}</span>
        </span>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (p) => (
        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          {isManagerOrAdmin && (
            <Button
              variant="secondary"
              size="sm"
              icon={Edit}
              onClick={() => handleOpenEditModal(p)}
            >
              Edit
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Product Catalog</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage product master data, tracking codes, and safety reorder rules
          </p>
        </div>
        {isManagerOrAdmin && (
          <Button variant="primary" icon={Plus} onClick={handleOpenCreateModal}>
            Add Product
          </Button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by SKU, name, or description..."
            icon={Search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="sm:w-64">
          <Select
            placeholder="All Categories"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
          />
        </div>
      </div>

      {/* Products Table */}
      <Table
        columns={columns}
        data={products}
        loading={loading}
        emptyMessage="No products match your criteria"
        onRowClick={(p) => navigate(`/products/${p.id}`)}
      />

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
        subtitle="Configure SKU code, unit of measure, and replenishment thresholds"
      >
        <form onSubmit={handleSaveProduct} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="SKU Code"
              required
              disabled={!!editingProduct}
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              placeholder="SKU-PROD-001"
            />
            <Input
              label="Product Name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Wireless Barcode Scanner"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Category"
              required
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
            />
            <Select
              label="Unit of Measure"
              required
              value={formData.uomId}
              onChange={(e) => setFormData({ ...formData, uomId: e.target.value })}
              options={uoms.map((u) => ({ value: u.id, label: `${u.name} (${u.code})` }))}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Min Stock"
              type="number"
              min="0"
              required
              value={formData.minStock}
              onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
            />
            <Input
              label="Reorder Point"
              type="number"
              min="0"
              required
              value={formData.reorderPoint}
              onChange={(e) => setFormData({ ...formData, reorderPoint: Number(e.target.value) })}
            />
            <Input
              label="Max Stock"
              type="number"
              min="1"
              value={formData.maxStock}
              onChange={(e) => setFormData({ ...formData, maxStock: Number(e.target.value) })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Product specifications, notes, packaging details..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={modalLoading}>
              {editingProduct ? 'Save Changes' : 'Create Product'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
