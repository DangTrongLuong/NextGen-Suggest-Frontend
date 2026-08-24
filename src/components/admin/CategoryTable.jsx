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
    <div className="flex items-center gap-2" style={{ paddingLeft: depth * 16 }}>
      {src ? (
        <img src={src} alt={alt} className="w-8 h-8 rounded-lg object-cover bg-slate-100 border border-slate-200" />
      ) : (
        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
          <ImgIcon size={14} className="text-slate-400" />
        </div>
      )}
    </div>
  );

  const TreeRow = ({ cat, depth = 0, idx }) => {
    const children = getChildren(cat.id);
    const expanded = expandedIds.includes(cat.id);
    return (
      <tr className="hover:bg-slate-50/60 transition-colors">
        <td className="px-4 py-2.5 text-slate-500 font-semibold">{pageOffset + idx + 1}</td>
        <td className="px-4 py-2.5">
          <div className="flex items-center gap-1.5" style={{ paddingLeft: depth * 16 }}>
            {children.length > 0 ? (
              <button onClick={() => toggleExpand(cat.id)} className="p-0.5 rounded text-slate-400 hover:text-slate-700 cursor-pointer">
                {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            ) : (
              <span className="w-4" />
            )}
            <ImgCell src={cat.imageUrl} alt={cat.name} />
          </div>
        </td>
        <td className="px-4 py-2.5">
          <p className="font-bold text-slate-900">{cat.name}</p>
          <p className="text-[10px] text-slate-400 font-medium">{cat.slug}</p>
        </td>
        <td className="px-4 py-2.5">
          {cat.parentId ? (
            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-semibold rounded text-[11px]">
              {getParentName(cat.parentId)}
            </span>
          ) : (
            <span className="text-slate-300">—</span>
          )}
        </td>
        <td className="px-4 py-2.5 font-extrabold text-slate-900">{getTotalProductCount(cat)}</td>
        <td className="px-4 py-2.5">
          <button
            onClick={() => onToggleActive(cat.id)}
            className={clsx('relative w-8 h-4 rounded-full transition-colors duration-200 cursor-pointer', cat.isActive ? 'bg-slate-900' : 'bg-slate-200')}
          >
            <span className={clsx('absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform duration-200', cat.isActive ? 'translate-x-4.5' : 'translate-x-0.5')} />
          </button>
        </td>
        <td className="px-4 py-2.5">
          <div className="flex items-center gap-1.5">
            <Link to={`/admin/categories/edit/${cat.id}`} className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors">
              <Edit2 size={14} />
            </Link>
            <button onClick={() => setDeleteTarget(cat)} className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer">
              <Trash2 size={14} />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  const FlatRow = ({ cat, idx }) => (
    <tr className="hover:bg-slate-50/60 transition-colors">
      <td className="px-4 py-2.5 text-slate-500 font-semibold">{pageOffset + idx + 1}</td>
      <td className="px-4 py-2.5"><ImgCell src={cat.imageUrl} alt={cat.name} /></td>
      <td className="px-4 py-2.5">
        <p className="font-bold text-slate-900">{cat.name}</p>
        <p className="text-[10px] text-slate-400 font-medium">{cat.slug}</p>
      </td>
      <td className="px-4 py-2.5">
        {cat.parentId ? (
          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-semibold rounded text-[11px]">
            {getParentName(cat.parentId)}
          </span>
        ) : (
          <span className="text-slate-300">—</span>
        )}
      </td>
      <td className="px-4 py-2.5 font-extrabold text-slate-900">{getTotalProductCount(cat)}</td>
      <td className="px-4 py-2.5">
        <button
          onClick={() => onToggleActive(cat.id)}
          className={clsx('relative w-8 h-4 rounded-full transition-colors duration-200 cursor-pointer', cat.isActive ? 'bg-slate-900' : 'bg-slate-200')}
        >
          <span className={clsx('absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform duration-200', cat.isActive ? 'translate-x-4.5' : 'translate-x-0.5')} />
        </button>
      </td>
      <td className="px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <Link to={`/admin/categories/edit/${cat.id}`} className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors">
            <Edit2 size={14} />
          </Link>
          <button onClick={() => setDeleteTarget(cat)} className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer">
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
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
          <div className="text-center py-12 text-slate-400 text-xs">
            <p className="font-semibold">Chưa có danh mục nào</p>
          </div>
        )}
      </div>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Xóa danh mục" size="sm">
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
    </>
  );
};

export default CategoryTable;
