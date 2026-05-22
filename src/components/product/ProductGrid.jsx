import { motion } from 'framer-motion';
import ProductCard from './ProductCard';
import EmptyState from '../common/EmptyState';
import { Search } from 'lucide-react';

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const ProductGrid = ({ products, loading = false }) => {
  if (!loading && products.length === 0) {
    return (
      <EmptyState
        icon={Search}
        title="No products found"
        description="Try adjusting your filters or search query to find what you're looking for."
      />
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </motion.div>
  );
};

export default ProductGrid;
