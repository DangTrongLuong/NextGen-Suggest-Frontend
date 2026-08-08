import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Edit2, Trash2, ChevronRight, ChevronDown, AlertTriangle, Image as ImgIcon } from 'lucide-react';
import clsx from 'clsx';
import Modal from '../common/Modal';
import Button from '../common/Button';

const CategoryTable = ({ categories, allCategories, onDelete, onToggleActive, viewMode = 'table', pageOffset = 0 }) => {
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [expandedIds, setExpandedIds] = useState([]);

  // Use allCategories (full set) for tree relations, fallback to categories
  const fullList = allCategories || categories;
  const rootCats = fullList.filter((c) => !c.parentId);
  const getChildren = (parentId) => fullList.filter((c) => c.parentId === parentId);
  const getParentName = (parentId) =>
    parentId ? fullList.find((c) => c.id === parentId)?.name || null : null;

  const toggleExpand = (id) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    onDelete(deleteTarget.id);
    setDeleteTarget(null);
  };

  const hasChildren = (id) => fullList.some((c) => c.parentId === id);

  const getTotalProductCount = (cat) => {
    let count = cat.productCount ?? 0;
    const children = getChildren(cat.id);
    children.forEach((child) => {
      count += getTotalProductCount(child);
    });
    return count;
  };

  const ImgCell = ({ src, alt, depth = 0 }) => (
    <div className="flex items-center gap-2" style={{ paddingLeft: depth * 20 }}>
      {src ? (
        <img src={src} alt={alt} className="w-10 h-10 rounded-xl object-cover bg-gray-100 flex-shrink-0" />
      ) : (
        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
          <ImgIcon size={16} className="text-gray-300" />
        </div>
      )}
    </div>
  );

  const TreeRow = ({ cat, depth = 0, idx }) => {
    const children = getChildren(cat.id);
    const expanded = expandedIds.includes(cat.id);
    return (
      <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-gray-50 transition-colors">
        <td className="px-4 py-3 text-sm text-gray-500">{pageOffset + idx + 1}</td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2" style={{ paddingLeft: depth * 20 }}>
            {children.length > 0 ? (
              <button onClick={() => toggleExpand(cat.id)} className="p-0.5 rounded text-gray-400 hover:text-gray-600">
                {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            ) : (
              <span className="w-5" />
            )}
            <ImgCell src={cat.imageUrl} alt={cat.name} />
          </div>
        </td>
        <td className="px-4 py-3">
          <p className="text-sm font-semibold text-gray-900">{cat.name}</p>
          <p className="text-xs text-gray-400">{cat.slug}</p>
        </td>
        <td className="px-4 py-3">
          {cat.parentId ? (
            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg">
              {getParentName(cat.parentId)}
            </span>
          ) : (
            <span className="text-gray-400 text-sm">—</span>
          )}
        </td>
        <td className="px-4 py-3">
          <span className="text-sm font-semibold text-emerald-600">{getTotalProductCount(cat)}</span>
        </td>
        <td className="px-4 py-3">
          <button
            onClick={() => onToggleActive(cat.id)}
            className={clsx('relative w-10 h-5 rounded-full transition-colors duration-200', cat.isActive ? 'bg-emerald-500' : 'bg-gray-300')}
          >
            <span className={clsx('absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200', cat.isActive ? 'translate-x-5' : 'translate-x-0.5')} />
          </button>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <Link to={`/admin/categories/edit/${cat.id}`} className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors">
              <Edit2 size={15} />
            </Link>
            <button onClick={() => setDeleteTarget(cat)} className="p-1.5 rounded-lg text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors">
              <Trash2 size={15} />
            </button>
          </div>
        </td>
      </motion.tr>
    );
  };

  const FlatRow = ({ cat, idx }) => (
    <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: (idx % 10) * 0.03 }} className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3 text-sm text-gray-500">{pageOffset + idx + 1}</td>
      <td className="px-4 py-3"><ImgCell src={cat.imageUrl} alt={cat.name} /></td>
      <td className="px-4 py-3">
        <p className="text-sm font-semibold text-gray-900">{cat.name}</p>
        <p className="text-xs text-gray-400">{cat.slug}</p>
      </td>
      <td className="px-4 py-3">
        {cat.parentId ? (
          <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg">
            {getParentName(cat.parentId)}
          </span>
        ) : (
          <span className="text-gray-400 text-sm">—</span>
        )}
      </td>
      <td className="px-4 py-3">
        <span className="text-sm font-semibold text-emerald-600">{getTotalProductCount(cat)}</span>
      </td>
      <td className="px-4 py-3">
        <button
          onClick={() => onToggleActive(cat.id)}
          className={clsx('relative w-10 h-5 rounded-full transition-colors duration-200', cat.isActive ? 'bg-emerald-500' : 'bg-gray-300')}
        >
          <span className={clsx('absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200', cat.isActive ? 'translate-x-5' : 'translate-x-0.5')} />
        </button>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Link to={`/admin/categories/edit/${cat.id}`} className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors">
            <Edit2 size={15} />
          </Link>
          <button onClick={() => setDeleteTarget(cat)} className="p-1.5 rounded-lg text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors">
            <Trash2 size={15} />
          </button>
        </div>
      </td>
    </motion.tr>
  );

  const getVisibleTreeItems = () => {
    const list = [];
    const traverse = (cat, depth) => {
      list.push({ cat, depth });
      if (expandedIds.includes(cat.id)) {
        const children = getChildren(cat.id);
        children.forEach((child) => traverse(child, depth + 1));
      }
    };
    rootCats.forEach((cat) => traverse(cat, 0));
    return list;
  };

  const visibleTreeItems = getVisibleTreeItems();

  const headers = ['STT', 'Ảnh', 'Tên danh mục', 'Danh mục cha', 'Sản phẩm', 'Trạng thái', 'Thao tác'];

  return (
    <>
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
              {viewMode === 'tree'
                ? visibleTreeItems.map(({ cat, depth }, idx) => (
                    <TreeRow key={cat.id} cat={cat} depth={depth} idx={idx} />
                  ))
                : categories.map((cat, idx) => (
                    <FlatRow key={cat.id} cat={cat} idx={idx} />
                  ))
              }
            </tbody>
          </table>
        </div>
        {categories.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="font-medium">Chưa có danh mục nào</p>
          </div>
        )}
      </div>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Xóa danh mục" size="sm">
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
                {deleteTarget.productCount > 0 && (
                  <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg mb-2">
                    ⚠️ Có {deleteTarget.productCount} sản phẩm thuộc danh mục này.
                  </p>
                )}
                {hasChildren(deleteTarget.id) && (
                  <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                    ⚠️ Có danh mục con phụ thuộc — cân nhắc kỹ trước khi xóa.
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-2">Hành động không thể hoàn tác.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" fullWidth onClick={() => setDeleteTarget(null)}>Hủy</Button>
              <Button variant="danger" fullWidth onClick={handleDeleteConfirm}>Xóa danh mục</Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default CategoryTable;
