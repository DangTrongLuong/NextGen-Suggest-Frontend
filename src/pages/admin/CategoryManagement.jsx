import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search, LayoutList, GitBranch, Upload } from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import CategoryTable from '../../components/admin/CategoryTable';
import { Spinner } from '../../components/common/Loading';
import { categoryService } from '../../services/categoryService';
import ImportExcelModal from '../../components/admin/ImportExcelModal';

const statusFilters = [
  { key: 'all', label: 'Tất cả' },
  { key: 'active', label: 'Đang hoạt động' },
  { key: 'inactive', label: 'Tạm ẩn' },
  { key: 'root', label: 'Danh mục gốc' },
  { key: 'child', label: 'Danh mục con' },
];

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('table');
  const [isImportOpen, setIsImportOpen] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const data = await categoryService.getAllAdmin();
      setCategories(data);
    } catch {
      toast.error('Không tải được danh mục');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const filtered = categories.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.slug || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && c.isActive) ||
      (statusFilter === 'inactive' && !c.isActive) ||
      (statusFilter === 'root' && !c.parentId) ||
      (statusFilter === 'child' && !!c.parentId);
    return matchSearch && matchStatus;
  });

  const handleDelete = async (id) => {
    try {
      await categoryService.delete(id);
      toast.success('Đã xóa danh mục');
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể xóa');
    }
  };

  const handleToggleActive = async (id) => {
    const cat = categories.find((c) => c.id === id);
    if (!cat) return;
    try {
      await categoryService.update(id, {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        imageUrl: cat.imageUrl,
        icon: cat.icon,
        parentId: cat.parentId,
        sortOrder: cat.sortOrder,
        isActive: !cat.isActive,
        seoTitle: cat.seoTitle,
        seoDescription: cat.seoDescription,
      });
      toast.success(cat.isActive ? 'Đã tạm ẩn' : 'Đã kích hoạt');
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cập nhật thất bại');
    }
  };

  const activeCount = categories.filter((c) => c.isActive).length;
  const rootCount = categories.filter((c) => !c.parentId).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Quản lý danh mục</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {categories.length} danh mục · {activeCount} đang hoạt động · {rootCount} danh mục gốc
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsImportOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm font-semibold rounded-xl transition-colors"
          >
            <Upload size={16} /> Import Excel
          </button>
          <Link
            to="/admin/categories/add"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
          >
            <Plus size={16} /> Thêm danh mục
          </Link>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm danh mục..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
          {statusFilters.map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={clsx(
                'flex-shrink-0 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all',
                statusFilter === f.key
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-emerald-300'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden flex-shrink-0">
          <button
            onClick={() => setViewMode('table')}
            className={clsx('px-3 py-2.5 transition-colors', viewMode === 'table' ? 'bg-emerald-600 text-white' : 'text-gray-500 hover:bg-gray-50')}
            title="Dạng bảng"
          >
            <LayoutList size={16} />
          </button>
          <button
            onClick={() => setViewMode('tree')}
            className={clsx('px-3 py-2.5 transition-colors', viewMode === 'tree' ? 'bg-emerald-600 text-white' : 'text-gray-500 hover:bg-gray-50')}
            title="Dạng cây"
          >
            <GitBranch size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Tổng danh mục', value: categories.length, color: 'bg-gray-50 text-gray-700' },
          { label: 'Đang hoạt động', value: activeCount, color: 'bg-emerald-50 text-emerald-700' },
          { label: 'Danh mục gốc', value: rootCount, color: 'bg-blue-50 text-blue-700' },
          { label: 'Danh mục con', value: categories.length - rootCount, color: 'bg-purple-50 text-purple-700' },
        ].map(({ label, value, color }) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl p-4 ${color}`}
          >
            <p className="text-2xl font-black">{value}</p>
            <p className="text-xs font-medium mt-0.5 opacity-70">{label}</p>
          </motion.div>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : (
        <CategoryTable
          categories={filtered}
          allCategories={categories}
          onDelete={handleDelete}
          onToggleActive={handleToggleActive}
          viewMode={viewMode}
        />
      )}
      <ImportExcelModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        entityType="category"
        onPreviewSuccess={fetchCategories}
        previewApi={categoryService.previewCategoryExcel}
        confirmApi={categoryService.confirmCategoryImport}
      />
    </div>
  );
};

export default CategoryManagement;
