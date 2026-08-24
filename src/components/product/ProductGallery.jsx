import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';

const ProductGallery = ({ images = [], name, activeImage, onImageClick }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);

  const resolvedImages = images.length ? images : ['https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=600&q=80'];
  const currentIndex = activeImage ? Math.max(0, resolvedImages.findIndex((img) => (img.url || img) === activeImage)) : activeIndex;
  const prev = () => setActiveIndex((i) => (i === 0 ? resolvedImages.length - 1 : i - 1));
  const next = () => setActiveIndex((i) => (i === resolvedImages.length - 1 ? 0 : i + 1));
  const setCurrent = (i) => {
    setActiveIndex(i);
    onImageClick?.(resolvedImages[i]);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Main Image */}
      <div className="relative bg-slate-50 rounded-2xl overflow-hidden aspect-square group border border-slate-200/80">
        <AnimatePresence mode="wait">
          <motion.img
            key={currentIndex}
            src={resolvedImages[currentIndex]?.url || resolvedImages[currentIndex]}
            alt={`${name} - ${currentIndex + 1}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full object-cover cursor-zoom-in"
            onClick={() => setZoomed(true)}
          />
        </AnimatePresence>

        {resolvedImages.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-lg flex items-center justify-center shadow-xs opacity-0 group-hover:opacity-100 transition-all hover:bg-white cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-lg flex items-center justify-center shadow-xs opacity-0 group-hover:opacity-100 transition-all hover:bg-white cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </>
        )}

        <button
          onClick={() => setZoomed(true)}
          className="absolute top-3 right-3 w-8 h-8 bg-white/90 rounded-lg flex items-center justify-center shadow-xs opacity-0 group-hover:opacity-100 transition-all hover:bg-white cursor-pointer"
        >
          <ZoomIn size={15} />
        </button>
      </div>

      {/* Thumbnails */}
      {resolvedImages.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto scrollbar-hide py-1">
          {resolvedImages.map((img, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                i === currentIndex ? 'border-slate-900' : 'border-transparent hover:border-slate-300'
              }`}
            >
              <img src={img.url || img} alt={`${name} ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Zoom Modal */}
      <AnimatePresence>
        {zoomed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setZoomed(false)}
          >
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={resolvedImages[currentIndex]?.url || resolvedImages[currentIndex]}
              alt={name}
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductGallery;
