import { motion } from 'framer-motion';
import ProductCard from './ProductCard';
import EmptyState from '../common/EmptyState';
import { Search } from 'lucide-react';

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

const ProductGrid = ({ products, loading = false, placeholderCount = 8 }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 w-full">
        {Array.from({ length: placeholderCount }).map((_, idx) => (
          <div
            key={idx}
            className="bg-white rounded-lg border border-gray-200/80 p-3 flex flex-col justify-between aspect-[1/1.5] w-full animate-pulse"
          >
            <div className="bg-gray-150/80 rounded-md w-full aspect-square mb-3"></div>
            <div className="flex-1 flex flex-col gap-2">
              <div className="h-2.5 bg-gray-150/80 rounded w-1/3"></div>
              <div className="h-3 bg-gray-150/80 rounded w-3/4"></div>
              <div className="h-3 bg-gray-150/80 rounded w-5/6"></div>
              <div className="h-4 bg-gray-150/80 rounded w-1/2 mt-auto"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <EmptyState
        icon={Search}
        title="Không tìm thấy sản phẩm"
        description="Hãy thử nhập từ khóa tìm kiếm khác hoặc thay đổi bộ lọc."
      />
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6"
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </motion.div>
  );
};

export default ProductGrid;

