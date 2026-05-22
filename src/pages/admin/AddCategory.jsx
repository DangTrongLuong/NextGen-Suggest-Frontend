import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import CategoryForm from '../../components/admin/CategoryForm';

const AddCategory = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to="/admin/categories"
          className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Thêm danh mục mới</h2>
          <p className="text-sm text-gray-500">Điền thông tin để tạo danh mục mới</p>
        </div>
      </div>
      <CategoryForm />
    </div>
  );
};

export default AddCategory;
