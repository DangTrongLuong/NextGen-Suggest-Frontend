import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import ProductTable from '../../components/admin/ProductTable';
import Pagination from '../../components/common/Pagination';
import { Spinner } from '../../components/common/Loading';
import { adminService } from '../../services/adminService';
import { categoryService } from '../../services/categoryService';
import { normalizeProducts } from '../../utils/productNormalizer';
import { debounce } from '../../utils/helpers';
import ImportExcelModal from '../../components/admin/ImportExcelModal';

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const pageSize = 12;

  const fetchProducts = useCallback(async (params) => {
    setLoading(true);
    try {
      const data = await adminService.getProducts(params);
      setProducts(normalizeProducts(data?.content));
      setTotalPages(data?.totalPages || 0);
      setTotalElements(data?.totalElements || 0);
    } catch {
      toast.error('Không tải được danh sách sản phẩm');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    categoryService.getAllAdmin().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    fetchProducts({
      page,
      size: pageSize,
      ...(search && { search }),
      ...(categoryId && { categoryId }),
    });
  }, [page, search, categoryId, fetchProducts]);

  const debouncedSearch = useCallback(
    debounce((value) => { setPage(0); setSearch(value); }, 400),
    []
  );

  const handleDelete = async (id) => {
    try {
      await adminService.deleteProduct(id);
      toast.success('Đã xóa sản phẩm');
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setTotalElements((prev) => Math.max(0, prev - 1));
      window.dispatchEvent(new Event('product-changed'));
      if (products.length === 1 && page > 0) setPage((p) => p - 1);
      else fetchProducts({ page, size: pageSize, ...(search && { search }), ...(categoryId && { categoryId }) });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể xóa sản phẩm');
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 uppercase tracking-tight">Quản lý Sản phẩm</h2>
          <p className="text-xs text-slate-500 font-medium">{totalElements} sản phẩm trong hệ thống</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsImportOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            <Upload size={14} /> Import Excel
          </button>
          <Link
            to="/admin/products/add"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Plus size={14} /> Thêm sản phẩm
          </Link>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            defaultValue={search}
            onChange={(e) => debouncedSearch(e.target.value)}
            placeholder="Tìm tên, thương hiệu, SKU..."
            className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-slate-900 font-medium"
          />
        </div>
        <select
          value={categoryId}
          onChange={(e) => { setPage(0); setCategoryId(e.target.value); }}
          className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-slate-900 min-w-48 cursor-pointer"
        >
          <option value="">Tất cả danh mục</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : (
        <>
          <ProductTable products={products} onDelete={handleDelete} />
          {totalPages > 1 && (
            <div className="flex justify-center pt-2">
              <Pagination
                currentPage={page + 1}
                totalPages={totalPages}
                onPageChange={(p) => setPage(p - 1)}
              />
            </div>
          )}
        </>
      )}
      <ImportExcelModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        entityType="product"
        onPreviewSuccess={() => fetchProducts({ page, size: pageSize, ...(search && { search }), ...(categoryId && { categoryId }) })}
        previewApi={adminService.previewProductExcel}
        confirmApi={adminService.confirmProductImport}
      />
    </div>
  );
};

export default ProductManagement;
