import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';

const ProductGallery = ({ images = [], name, activeImage, onImageClick }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);

  const resolvedImages = images.length ? images : ['https://via.placeholder.com/600x600?text=No+Image'];
  const currentIndex = activeImage ? Math.max(0, resolvedImages.findIndex((img) => (img.url || img) === activeImage)) : activeIndex;
  const prev = () => setActiveIndex((i) => (i === 0 ? resolvedImages.length - 1 : i - 1));
  const next = () => setActiveIndex((i) => (i === resolvedImages.length - 1 ? 0 : i + 1));
  const setCurrent = (i) => {
    setActiveIndex(i);
    onImageClick?.(resolvedImages[i]);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Main Image */}
      <div className="relative bg-gray-50 rounded-2xl overflow-hidden aspect-square group">
        <AnimatePresence mode="wait">
          <motion.img
            key={currentIndex}
            src={resolvedImages[currentIndex]?.url || resolvedImages[currentIndex]}
            alt={`${name} - ${currentIndex + 1}`}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full object-cover cursor-zoom-in"
            onClick={() => setZoomed(true)}
          />
        </AnimatePresence>

        {/* Nav arrows */}
        {resolvedImages.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 rounded-xl flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-all hover:bg-white"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 rounded-xl flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-all hover:bg-white"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}

        <button
          onClick={() => setZoomed(true)}
          className="absolute top-3 right-3 w-9 h-9 bg-white/90 rounded-xl flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-all hover:bg-white"
        >
          <ZoomIn size={16} />
        </button>
      </div>

      {/* Thumbnails */}
      {resolvedImages.length > 1 && (
        <div className="flex gap-3 overflow-x-auto scrollbar-hide">
          {resolvedImages.map((img, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                i === currentIndex ? 'border-emerald-600 shadow-md' : 'border-transparent hover:border-gray-300'
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
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setZoomed(false)}
          >
            <motion.img
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              src={resolvedImages[currentIndex]?.url || resolvedImages[currentIndex]}
              alt={name}
              className="max-w-full max-h-full object-contain rounded-2xl"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductGallery;
