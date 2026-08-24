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
    <div className="space-y-5 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 uppercase tracking-tight">Danh mục chính</h2>
          <p className="text-xs text-slate-500 font-medium">
            Có {categoryMains.length} danh mục chính của hệ thống
          </p>
        </div>
        <Link
          to="/admin/category-mains/add"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-slate-800 transition-colors shadow-xs"
        >
          <Plus size={14} /> Thêm danh mục chính
        </Link>
      </div>

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm danh mục chính..."
          className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-slate-900 font-medium"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {headers.map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-bold text-slate-700 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((cat, idx) => (
                  <tr
                    key={cat.id}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="px-4 py-2.5 font-semibold text-slate-500">{idx + 1}</td>
                    <td className="px-4 py-2.5">
                      {cat.imageUrl ? (
                        <img src={cat.imageUrl} alt={cat.name} className="w-8 h-8 rounded-lg object-cover bg-slate-100 border border-slate-200" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                          <ImgIcon size={14} className="text-slate-400" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2.5 font-bold text-slate-900">{cat.name}</td>
                    <td className="px-4 py-2.5 text-slate-500 font-medium">{cat.slug}</td>
                    <td className="px-4 py-2.5 text-slate-500 font-medium">{cat.displayOrder ?? 0}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <Link to={`/admin/category-mains/edit/${cat.id}`} className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors">
                          <Edit2 size={14} />
                        </Link>
                        <button onClick={() => setDeleteTarget(cat)} className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-xs">
              <p className="font-semibold">Chưa có danh mục chính nào</p>
            </div>
          )}
        </div>
      )}

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Xóa danh mục chính" size="sm">
        {deleteTarget && (
          <div>
            <p className="text-xs text-slate-600 mb-5">
              Bạn có chắc muốn xóa "{deleteTarget.name}"? Hành động không thể hoàn tác.
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" fullWidth onClick={() => setDeleteTarget(null)}>Hủy</Button>
              <Button variant="danger" size="sm" fullWidth onClick={handleDeleteConfirm}>Xóa</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CategoryMainManagement;
