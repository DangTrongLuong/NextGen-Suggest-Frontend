import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import ProductTable from '../../components/admin/ProductTable';
import Pagination from '../../components/common/Pagination';
import { Spinner } from '../../components/common/Loading';
import { adminService } from '../../services/adminService';
import { categoryService } from '../../services/categoryService';
import { normalizeProducts } from '../../utils/productNormalizer';
import { debounce } from '../../utils/helpers';

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Sản phẩm</h2>
          <p className="text-sm text-gray-500">{totalElements} sản phẩm</p>
        </div>
        <Link
          to="/admin/products/add"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
        >
          <Plus size={16} /> Thêm sản phẩm
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            defaultValue={search}
            onChange={(e) => debouncedSearch(e.target.value)}
            placeholder="Tìm tên, brand, SKU..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
        <select
          value={categoryId}
          onChange={(e) => { setPage(0); setCategoryId(e.target.value); }}
          className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 min-w-48"
        >
          <option value="">Tất cả danh mục</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : (
        <>
          <ProductTable products={products} onDelete={handleDelete} />
          {totalPages > 1 && (
            <Pagination
              currentPage={page + 1}
              totalPages={totalPages}
              onPageChange={(p) => setPage(p - 1)}
            />
          )}
        </>
      )}
    </div>
  );
};

export default ProductManagement;
