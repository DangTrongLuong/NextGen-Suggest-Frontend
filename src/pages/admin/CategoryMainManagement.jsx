import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, Image as ImgIcon, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Spinner } from '../../components/common/Loading';
import { categoryMainService } from '../../services/categoryMainService';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';

const CategoryMainManagement = () => {
  const [categoryMains, setCategoryMains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchCategoryMains = useCallback(async () => {
    setLoading(true);
    try {
      const data = await categoryMainService.getAllAdmin();
      setCategoryMains(data);
    } catch {
      toast.error('Không tải được danh mục chính');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategoryMains();
  }, [fetchCategoryMains]);

  const filtered = categoryMains.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.slug || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await categoryMainService.delete(deleteTarget.id);
      toast.success('Đã xóa danh mục chính');
      fetchCategoryMains();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể xóa');
    } finally {
      setDeleteTarget(null);
    }
  };

  const headers = ['STT', 'Ảnh', 'Tên danh mục chính', 'Slug', 'Thứ tự', 'Thao tác'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Quản lý danh mục chính</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Có {categoryMains.length} danh mục chính của hệ thống
          </p>
        </div>
        <Link
          to="/admin/category-mains/add"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
        >
          <Plus size={16} /> Thêm danh mục chính
        </Link>
      </div>

      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm danh mục chính..."
          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {headers.map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((cat, idx) => (
                  <motion.tr
                    key={cat.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.04 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-gray-500">{idx + 1}</td>
                    <td className="px-4 py-3">
                      {cat.imageUrl ? (
                        <img src={cat.imageUrl} alt={cat.name} className="w-10 h-10 rounded-xl object-cover bg-gray-100 flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <ImgIcon size={16} className="text-gray-300" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">{cat.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{cat.slug}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{cat.displayOrder ?? 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link to={`/admin/category-mains/edit/${cat.id}`} className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors">
                          <Edit2 size={15} />
                        </Link>
                        <button onClick={() => setDeleteTarget(cat)} className="p-1.5 rounded-lg text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <p className="font-medium">Chưa có danh mục chính nào</p>
            </div>
          )}
        </div>
      )}

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Xóa danh mục chính" size="sm">
        {deleteTarget && (
          <div>
            <div className="flex items-start gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={18} className="text-red-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-1">
                  Xóa "{deleteTarget.name}"?
                </p>
                <p className="text-xs text-gray-500">Hành động này sẽ không xóa các danh mục con, nhưng chúng sẽ mất liên kết tới danh mục chính này. Hành động không thể hoàn tác.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" fullWidth onClick={() => setDeleteTarget(null)}>Hủy</Button>
              <Button variant="danger" fullWidth onClick={handleDeleteConfirm}>Xóa</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CategoryMainManagement;
