import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search, LayoutList, GitBranch, Upload, ChevronLeft, ChevronRight } from 'lucide-react';
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
];

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('table');
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const filtered = categories.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.slug || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && c.isActive) ||
      (statusFilter === 'inactive' && !c.isActive) ||
      (statusFilter === 'root' && !c.parentId);
    return matchSearch && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCategories = filtered.slice(startIndex, startIndex + itemsPerPage);

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
    <div className="space-y-5 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 uppercase tracking-tight">Quản lý Danh mục</h2>
          <p className="text-xs text-slate-500 font-medium">
            {categories.length} danh mục • {activeCount} đang hoạt động • {rootCount} danh mục gốc
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsImportOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            <Upload size={14} /> Import Excel
          </button>
          <Link
            to="/admin/categories/add"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Plus size={14} /> Thêm danh mục
          </Link>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm danh mục..."
            className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-slate-900 font-medium"
          />
        </div>

        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          {statusFilters.map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={clsx(
                'flex-shrink-0 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer',
                statusFilter === f.key
                  ? 'bg-slate-900 text-white font-bold'
                  : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden flex-shrink-0">
          <button
            onClick={() => setViewMode('table')}
            className={clsx('px-3 py-2 transition-colors cursor-pointer', viewMode === 'table' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50')}
            title="Dạng bảng"
          >
            <LayoutList size={15} />
          </button>
          <button
            onClick={() => setViewMode('tree')}
            className={clsx('px-3 py-2 transition-colors cursor-pointer', viewMode === 'tree' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50')}
            title="Dạng cây"
          >
            <GitBranch size={15} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Tổng danh mục', value: categories.length, color: 'bg-white text-slate-900 border border-slate-200/80 shadow-card' },
          { label: 'Đang hoạt động', value: activeCount, color: 'bg-emerald-50/60 text-emerald-800 border border-emerald-200/80' },
          { label: 'Danh mục gốc', value: rootCount, color: 'bg-emerald-50/60 text-emerald-800 border border-emerald-200/80' },
          { label: 'Danh mục con', value: categories.length - rootCount, color: 'bg-slate-100 text-slate-800 border border-slate-200' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`rounded-2xl p-4 ${color}`}>
            <p className="text-xl font-extrabold">{value}</p>
            <p className="text-xs font-medium mt-0.5 opacity-80">{label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : (
        <>
          <CategoryTable
            categories={paginatedCategories}
            allCategories={categories}
            onDelete={handleDelete}
            onToggleActive={handleToggleActive}
            viewMode={viewMode}
            pageOffset={startIndex}
          />

          {filtered.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-card">
              <p className="text-xs text-slate-500 font-medium shrink-0">
                Hiển thị <span className="font-bold text-slate-900">{startIndex + 1} - {Math.min(startIndex + itemsPerPage, filtered.length)}</span> / <span className="font-bold text-slate-900">{filtered.length}</span>
              </p>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
                >
                  <ChevronLeft size={15} />
                </button>

                <span className="text-xs font-bold px-2 text-slate-900">{currentPage}/{totalPages}</span>

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </>
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
