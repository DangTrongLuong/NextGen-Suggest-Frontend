import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import CategoryMainForm from '../../components/admin/CategoryMainForm';

const AddCategoryMain = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/admin/category-mains"
          className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Thêm danh mục chính</h2>
          <p className="text-sm text-gray-500 mt-0.5">Tạo một danh mục chính mới trong hệ thống</p>
        </div>
      </div>

      <CategoryMainForm />
    </div>
  );
};

export default AddCategoryMain;
