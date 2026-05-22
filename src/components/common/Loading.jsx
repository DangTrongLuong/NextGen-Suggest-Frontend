import { motion } from 'framer-motion';

export const Spinner = ({ size = 'md', color = 'emerald' }) => {
  const sizes = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' };
  const colors = { emerald: 'border-emerald-600', gray: 'border-gray-600', white: 'border-white' };
  return (
    <div
      className={`${sizes[size]} animate-spin rounded-full border-2 border-t-transparent ${colors[color]}`}
    />
  );
};

export const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-4"
    >
      <div className="h-12 w-12 animate-spin rounded-full border-3 border-emerald-600 border-t-transparent" />
      <p className="text-gray-500 text-sm font-medium">Loading...</p>
    </motion.div>
  </div>
);

export const CardSkeleton = () => (
  <div className="bg-white rounded-2xl overflow-hidden animate-pulse">
    <div className="h-56 bg-gray-200" />
    <div className="p-4 space-y-3">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-200 rounded w-1/2" />
      <div className="h-5 bg-gray-200 rounded w-1/3" />
    </div>
  </div>
);

export const ProductGridSkeleton = ({ count = 8 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
);

const Loading = ({ fullPage = false }) => {
  if (fullPage) return <PageLoader />;
  return (
    <div className="flex items-center justify-center py-16">
      <Spinner size="lg" />
    </div>
  );
};

export default Loading;
