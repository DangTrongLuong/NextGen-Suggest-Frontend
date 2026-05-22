import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Edit2, Trash2, Star, Package, ChevronUp, ChevronDown } from 'lucide-react';
import clsx from 'clsx';
import { formatPrice } from '../../utils/formatPrice';
import Modal from '../common/Modal';
import Button from '../common/Button';

const ProductTable = ({ products, onDelete }) => {
  const [deleteId, setDeleteId] = useState(null);
  const [sortField, setSortField] = useState('id');
  const [sortDir, setSortDir] = useState('asc');

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const sorted = [...products].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    const dir = sortDir === 'asc' ? 1 : -1;
    if (typeof aVal === 'string') return aVal.localeCompare(bVal) * dir;
    return ((aVal ?? 0) - (bVal ?? 0)) * dir;
  });

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ChevronUp size={14} className="text-gray-300" />;
    return sortDir === 'asc'
      ? <ChevronUp size={14} className="text-emerald-600" />
      : <ChevronDown size={14} className="text-emerald-600" />;
  };

  const handleDelete = async () => {
    if (onDelete) await onDelete(deleteId);
    setDeleteId(null);
  };

  const headers = [
    { label: 'Sản phẩm', field: 'name' },
    { label: 'Danh mục', field: 'categoryName' },
    { label: 'Giá', field: 'price' },
    { label: 'Tồn kho', field: 'stock' },
    { label: 'Đánh giá', field: 'rating' },
    { label: 'Trạng thái', field: 'isActive' },
    { label: 'Thao tác', field: null },
  ];

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {headers.map(({ label, field }) => (
                  <th
                    key={label}
                    onClick={() => field && handleSort(field)}
                    className={clsx(
                      'px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide',
                      field && 'cursor-pointer hover:text-gray-900 select-none'
                    )}
                  >
                    <div className="flex items-center gap-1">
                      {label}
                      {field && <SortIcon field={field} />}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sorted.map((product) => (
                <motion.tr
                  key={product.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={product.images.find(img => img.isPrimary)?.url ?? product.images[0]?.url ?? 'https://via.placeholder.com/40'}
                        alt={product.name}
                        className="w-10 h-10 rounded-xl object-cover bg-gray-100"
                      />
                      <div>
                        <p className="text-sm font-semibold text-gray-900 line-clamp-1">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.brand || product.sku || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg">
                      {product.categoryName || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-bold text-gray-900">{formatPrice(product.price)}</p>
                      {product.originalPrice > product.price && (
                        <p className="text-xs text-gray-400 line-through">{formatPrice(product.originalPrice)}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={clsx(
                      'px-2.5 py-1 text-xs font-semibold rounded-lg',
                      product.stock === 0
                        ? 'bg-red-100 text-red-700'
                        : product.stock < 20
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-emerald-100 text-emerald-700'
                    )}>
                      {product.stock === 0 ? 'Hết hàng' : `${product.stock}`}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Star size={13} className="text-amber-400 fill-amber-400" />
                      <span className="text-sm font-medium text-gray-900">{(product.rating || 0).toFixed(1)}</span>
                      <span className="text-xs text-gray-400">({product.reviewCount})</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={clsx(
                      'px-2.5 py-1 text-xs font-semibold rounded-lg',
                      product.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                    )}>
                      {product.isActive ? 'Hoạt động' : 'Tạm ẩn'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/admin/products/edit/${product.id}`}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                      >
                        <Edit2 size={15} />
                      </Link>
                      <button
                        onClick={() => setDeleteId(product.id)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {products.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Package size={40} className="text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">Chưa có sản phẩm</p>
          </div>
        )}
      </div>

      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Xóa sản phẩm" size="sm">
        <p className="text-gray-600 mb-6">
          Bạn có chắc muốn xóa sản phẩm này? Hành động không thể hoàn tác.
        </p>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => setDeleteId(null)} fullWidth>Hủy</Button>
          <Button variant="danger" onClick={handleDelete} fullWidth>Xóa</Button>
        </div>
      </Modal>
    </>
  );
};

export default ProductTable;
