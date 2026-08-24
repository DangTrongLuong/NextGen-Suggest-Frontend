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
    if (sortField !== field) return <ChevronUp size={13} className="text-slate-300" />;
    return sortDir === 'asc'
      ? <ChevronUp size={13} className="text-slate-900" />
      : <ChevronDown size={13} className="text-slate-900" />;
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
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {headers.map(({ label, field }) => (
                  <th
                    key={label}
                    onClick={() => field && handleSort(field)}
                    className={clsx(
                      'px-4 py-3 text-left font-bold text-slate-700 uppercase tracking-wider',
                      field && 'cursor-pointer hover:text-slate-900 select-none'
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
            <tbody className="divide-y divide-slate-100">
              {sorted.map((product) => (
                <tr
                  key={product.id}
                  className="hover:bg-slate-50/60 transition-colors"
                >
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      <img
                        src={product.images.find(img => img.isPrimary)?.url ?? product.images[0]?.url ?? 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=600&q=80'}
                        alt={product.name}
                        className="w-9 h-9 rounded-lg object-cover bg-slate-100 border border-slate-200"
                      />
                      <div>
                        <p className="font-bold text-slate-900 line-clamp-1">{product.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{product.brand || product.sku || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-semibold rounded text-[11px]">
                      {product.categoryName || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div>
                      <p className="font-extrabold text-slate-900">{formatPrice(product.price)}</p>
                      {product.originalPrice > product.price && (
                        <p className="text-[10px] text-slate-400 line-through">{formatPrice(product.originalPrice)}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={clsx(
                      'px-2 py-0.5 text-[11px] font-bold rounded',
                      product.stock === 0
                        ? 'bg-rose-50 text-rose-600'
                        : product.stock < 20
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-emerald-50 text-emerald-700'
                    )}>
                      {product.stock === 0 ? 'Hết hàng' : `${product.stock}`}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1">
                      <Star size={12} className="text-amber-400 fill-amber-400" />
                      <span className="font-bold text-slate-900">{(product.rating || 0).toFixed(1)}</span>
                      <span className="text-[10px] text-slate-400">({product.reviewCount})</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={clsx(
                      'px-2 py-0.5 text-[11px] font-bold rounded',
                      product.isActive ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'
                    )}>
                      {product.isActive ? 'Hoạt động' : 'Tạm ẩn'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <Link
                        to={`/admin/products/edit/${product.id}`}
                        className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                      >
                        <Edit2 size={14} />
                      </Link>
                      <button
                        onClick={() => setDeleteId(product.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {products.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Package size={36} className="text-slate-300 mb-2" />
            <p className="text-slate-600 font-bold text-xs">Chưa có sản phẩm nào</p>
          </div>
        )}
      </div>

      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Xóa sản phẩm" size="sm">
        <p className="text-xs text-slate-600 mb-5">
          Bạn có chắc muốn xóa sản phẩm này? Hành động này không thể hoàn tác.
        </p>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setDeleteId(null)} fullWidth>Hủy</Button>
          <Button variant="danger" size="sm" onClick={handleDelete} fullWidth>Xóa</Button>
        </div>
      </Modal>
    </>
  );
};

export default ProductTable;
