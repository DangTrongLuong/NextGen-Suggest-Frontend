import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { recommendationService } from '../../services/recommendationService';
import { useAuth } from '../../context/AuthContext';

const HeroAISuggestions = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);

    recommendationService.getQuerySuggestions(user)
      .then((data) => {
        if (!active) return;
        if (data && data.length > 0) {
          setSuggestions(data);
        } else {
          setSuggestions([]);
        }
      })
      .catch((err) => {
        if (!active) return;
        console.error('Failed to load query suggestions:', err);
        setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user]);

  const handleCardClick = (query) => {
    // 1. Fill the search input on the Header
    const searchInputs = document.querySelectorAll('input[placeholder*="Tìm kiếm"]');
    searchInputs.forEach(input => {
      input.value = query;
      // Trigger input event to update React state
      const event = new Event('input', { bubbles: true });
      input.dispatchEvent(event);
    });

    // 2. Navigate to search page
    navigate(`/products?search=${encodeURIComponent(query)}`);
  };

  // Framer motion variants for stagger animation
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        type: 'spring', 
        stiffness: 110, 
        damping: 15 
      } 
    }
  };

  if (loading) {
    return (
      <div className="mt-12 w-full text-left bg-white/5 border border-white/8 backdrop-blur-md rounded-2xl p-6 shadow-xl animate-pulse">
        <div className="h-5 w-48 bg-white/10 rounded mb-2.5" />
        <div className="h-4 w-64 bg-white/5 rounded mb-5 border-b border-white/5 pb-4" />
        <div className="flex flex-wrap gap-2.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-9 w-28 rounded-full bg-white/5 border border-white/5" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-12 w-full text-left bg-white/5 border border-white/8 backdrop-blur-md rounded-2xl p-6 shadow-xl text-white/50 text-xs font-light">
        Không thể tải gợi ý tìm kiếm AI. Vui lòng làm mới trang.
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="mt-12 w-full text-left bg-white/5 border border-white/8 backdrop-blur-md rounded-2xl p-6 shadow-xl">
      {/* Title & Description inside the same div */}
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-white/10 pb-4">
        <div>
          <h3 className="text-white text-sm font-bold tracking-wider flex items-center gap-2 uppercase">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            Bạn đang tìm gì hôm nay?
          </h3>
          <p className="text-gray-300 text-xs font-light mt-1.5 opacity-90">
            AI gợi ý những nhu cầu phù hợp để bạn bắt đầu tìm kiếm.
          </p>
        </div>
      </div>

      {/* Grid of Suggestions as Pill Buttons */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="flex flex-wrap gap-2.5 overflow-x-auto sm:overflow-x-visible pb-2 sm:pb-0 scrollbar-none"
      >
        {suggestions.map((item, index) => (
          <motion.button
            key={index}
            variants={cardVariants}
            onClick={() => handleCardClick(item.title || item.query)}
            className="flex-shrink-0 px-4.5 py-2 rounded-full cursor-pointer bg-white/5 border border-white/8 hover:bg-white/12 hover:border-white/20 text-white text-[12.5px] font-semibold transition-all duration-250 shadow-sm outline-none focus:outline-none"
            whileHover={{ 
              y: -3, 
              scale: 1.025, 
              boxShadow: '0 6px 15px -4px rgba(0, 0, 0, 0.35)'
            }}
            whileTap={{ scale: 0.97 }}
          >
            {item.title}
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
};

export default HeroAISuggestions;
