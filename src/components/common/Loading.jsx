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
  <div className="bg-white rounded-xl overflow-hidden border border-slate-200/80 shadow-card animate-pulse flex flex-col justify-between h-full">
    <div className="w-full aspect-square bg-slate-200/80 relative">
      <div className="absolute top-2 left-2 w-10 h-4 bg-slate-300/80 rounded" />
    </div>
    <div className="p-3 flex-1 flex flex-col justify-between space-y-3">
      <div className="space-y-2">
        <div className="h-2.5 bg-slate-200/80 rounded w-1/3" />
        <div className="h-3.5 bg-slate-200/80 rounded w-full" />
        <div className="h-3.5 bg-slate-200/80 rounded w-2/3" />
      </div>
      <div>
        <div className="h-3 bg-slate-200/80 rounded w-1/4 mb-2.5" />
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="space-y-1 w-1/2">
            <div className="h-4 bg-slate-200/80 rounded w-full" />
            <div className="h-2.5 bg-slate-200/80 rounded w-2/3" />
          </div>
          <div className="w-7 h-7 bg-slate-200/80 rounded-lg shrink-0" />
        </div>
      </div>
    </div>
  </div>
);

export const ProductGridSkeleton = ({ count = 10 }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 mb-8">
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
