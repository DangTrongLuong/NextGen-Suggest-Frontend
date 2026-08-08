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

  // Reset to page 1 when search or filter changes
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
        <>
          <CategoryTable
            categories={paginatedCategories}
            allCategories={categories}
            onDelete={handleDelete}
            onToggleActive={handleToggleActive}
            viewMode={viewMode}
            pageOffset={startIndex}
          />

          {/* Pagination Controls (10 items per page with Ellipsis) */}
          {filtered.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
              <p className="text-xs text-gray-500 font-medium whitespace-nowrap shrink-0">
                Hiển thị <span className="font-bold text-gray-900">{startIndex + 1} - {Math.min(startIndex + itemsPerPage, filtered.length)}</span> trong tổng số <span className="font-bold text-gray-900">{filtered.length}</span> danh mục
              </p>

              <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap justify-center">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  title="Trang trước"
                >
                  <ChevronLeft size={16} />
                </button>

                {(() => {
                  const getPageNumbers = (current, total) => {
                    if (total <= 7) {
                      return Array.from({ length: total }, (_, i) => i + 1);
                    }
                    if (current <= 4) {
                      return [1, 2, 3, 4, 5, '...', total];
                    }
                    if (current >= total - 3) {
                      return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
                    }
                    return [1, '...', current - 1, current, current + 1, '...', total];
                  };

                  return getPageNumbers(currentPage, totalPages).map((item, idx) => {
                    if (item === '...') {
                      return (
                        <span key={`dots-${idx}`} className="w-8 h-8 flex items-center justify-center text-xs text-gray-400 font-bold select-none">
                          ...
                        </span>
                      );
                    }
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setCurrentPage(item)}
                        className={clsx(
                          'w-9 h-9 text-xs font-bold rounded-xl transition-all cursor-pointer',
                          currentPage === item
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-white border border-gray-200 text-gray-700 hover:border-emerald-400 hover:bg-gray-50'
                        )}
                      >
                        {item}
                      </button>
                    );
                  });
                })()}

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  title="Trang sau"
                >
                  <ChevronRight size={16} />
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
