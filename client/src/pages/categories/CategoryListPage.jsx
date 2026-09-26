import React, { useState, useEffect, useCallback } from 'react';
import { Plus, FolderTree } from 'lucide-react';
import { catalogService } from '../../services/catalog.service';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';

export default function CategoryListPage() {
  const { isManagerOrAdmin } = useAuth();
  const toast = useToast();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', code: '', description: '' });

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await catalogService.getCategories();
      setCategories(res.data?.categories || res.data || []);
    } catch (err) {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      await catalogService.createCategory(formData);
      toast.success('Category created successfully!');
      setIsModalOpen(false);
      setFormData({ name: '', code: '', description: '' });
      fetchCategories();
    } catch (err) {
      toast.error(err.userMessage || 'Failed to create category');
    } finally {
      setModalLoading(false);
    }
  };

  const columns = [
    {
      header: 'Category Code',
      render: (c) => <span className="font-mono font-semibold text-slate-800">{c.code || '--'}</span>,
    },
    {
      header: 'Name',
      render: (c) => (
        <div className="flex items-center gap-2">
          <FolderTree className="w-4 h-4 text-indigo-500" />
          <span className="font-medium text-slate-900">{c.name}</span>
        </div>
      ),
    },
    {
      header: 'Description',
      render: (c) => <span className="text-slate-500 text-xs">{c.description || 'No description'}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Categories</h1>
          <p className="text-sm text-slate-500 mt-1">
            Organize products into hierarchical classification categories
          </p>
        </div>
        {isManagerOrAdmin && (
          <Button variant="primary" icon={Plus} onClick={() => setIsModalOpen(true)}>
            Add Category
          </Button>
        )}
      </div>

      <Table columns={columns} data={categories} loading={loading} emptyMessage="No categories found" />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Category"
        subtitle="Define a new category to group catalog items"
      >
        <form onSubmit={handleCreateCategory} className="space-y-4">
          <Input
            label="Category Name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Electronics & Hardware"
          />
          <Input
            label="Category Code"
            required
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            placeholder="CAT-ELEC"
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Scope and purpose of this category..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={modalLoading}>
              Create Category
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
