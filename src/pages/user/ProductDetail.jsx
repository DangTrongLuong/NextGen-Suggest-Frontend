import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Heart, Star, Check, Minus, Plus, Share2, Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import ProductReview from '../../components/product/ProductReview';
import ProductCard from '../../components/product/ProductCard';
import { normalizeProducts } from '../../utils/productNormalizer';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import Button from '../../components/common/Button';
import { PageLoader } from '../../components/common/Loading';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { productService } from '../../services/productService';
import { categoryService } from '../../services/categoryService';
import { categoryMainService } from '../../services/categoryMainService';
import { formatPrice } from '../../utils/formatPrice';
import { useBehaviorTracker } from '../../hooks/useBehaviorTracker';
import clsx from 'clsx';
import toast from 'react-hot-toast';

const normalize = (p) => ({
  ...p,
  price: p.basePrice,
  originalPrice: p.comparePrice,
  discount:
    p.comparePrice > p.basePrice
      ? Math.round(((p.comparePrice - p.basePrice) / p.comparePrice) * 100)
      : 0,
  rating: parseFloat(p.ratingAvg) || 0,
  reviewCount: p.ratingCount || 0,
});

const buildAllImages = (product) => {
  if (!product) return [];
  const imgs = [];

  const push = (url, variantId = null) => {
    if (!url) return;
    const existing = imgs.find((img) => img.url === url);
    if (existing) {
      if (variantId && !existing.variantId) {
        existing.variantId = variantId;
      }
      return;
    }
    imgs.push({ url, variantId });
  };

  if (product.imageUrl) push(product.imageUrl, null);
  (product.images || []).forEach((img) => push(img.url, img.variantId || null));
  (product.variants || []).forEach((v) => {
    if (v.imageUrl) push(v.imageUrl, v.id);
  });

  return imgs;
};

const parseTokens = (val) =>
  val ? val.split(',').map((s) => s.trim()).filter(Boolean) : [];

const matchesToken = (fieldValue, selectedValue) => {
  if (!selectedValue) return true;
  if (!fieldValue) return false;
  return parseTokens(fieldValue).includes(selectedValue);
};

const Gallery = ({ images, activeUrl, onSelect }) => {
  const [mainIdx, setMainIdx] = useState(0);
  const [zoomStyle, setZoomStyle] = useState({ transformOrigin: 'center center', transform: 'scale(1)' });

  useEffect(() => {
    if (!activeUrl) return;
    const idx = images.findIndex((img) => img.url === activeUrl);
    if (idx >= 0) setMainIdx(idx);
  }, [activeUrl, images]);

  const current = images[mainIdx] || {};

  const prev = () => setMainIdx((i) => Math.max(0, i - 1));
  const next = () => setMainIdx((i) => Math.min(images.length - 1, i + 1));

  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({
      transformOrigin: `${x}% ${y}%`,
      transform: 'scale(1.4)',
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle({
      transformOrigin: 'center center',
      transform: 'scale(1)',
    });
  };

  return (
    <div className="flex flex-col-reverse sm:flex-row gap-4 sm:gap-5">
      {/* Thumbnail column */}
      <div className="flex flex-row sm:flex-col gap-2.5 w-full sm:w-16 overflow-x-auto sm:overflow-y-auto max-h-none sm:max-h-[500px] scrollbar-hide py-1 sm:py-0 shrink-0">
        {images.map((img, idx) => (
          <button
            key={img.url}
            onClick={() => { setMainIdx(idx); onSelect(img); }}
            className={clsx(
              'w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all duration-150 shadow-xs cursor-pointer',
              mainIdx === idx
                ? 'border-slate-900'
                : 'border-slate-200 hover:border-slate-400 opacity-75 hover:opacity-100',
            )}
          >
            <img src={img.url} alt="" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>

      {/* Main image */}
      <div 
        className="relative flex-1 aspect-square rounded-2xl overflow-hidden bg-slate-50 border border-slate-200/80 shadow-card group cursor-zoom-in"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={current.url}
            className="w-full h-full overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <img
              src={current.url || 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=600&q=80'}
              alt="product"
              style={zoomStyle}
              className="w-full h-full object-cover transition-transform duration-100 ease-out"
            />
          </motion.div>
        </AnimatePresence>

        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              disabled={mainIdx === 0}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-white/90 flex items-center justify-center shadow-xs hover:bg-white transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronLeft size={16} className="text-slate-800" />
            </button>
            <button
              onClick={next}
              disabled={mainIdx === images.length - 1}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-white/90 flex items-center justify-center shadow-xs hover:bg-white transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronRight size={16} className="text-slate-800" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

const ProductDetail = ({ idOverride }) => {
  const { id: paramId } = useParams();
  const id = idOverride || paramId;
  const navigate = useNavigate();
  const { trackProductView, trackAddToCart, trackWishlist } = useBehaviorTracker();

  const [product, setProduct]               = useState(null);
  const [related, setRelated]               = useState([]);
  const [quantity, setQuantity]             = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedColor, setSelectedColor]     = useState(null);
  const [selectedSize, setSelectedSize]       = useState(null);
  const [activeTab, setActiveTab]           = useState('description');
  const [loading, setLoading]               = useState(true);
  const [activeImageUrl, setActiveImageUrl] = useState(null);

  const [categoryMains, setCategoryMains]   = useState([]);
  const [breadcrumbs, setBreadcrumbs]       = useState([]);

  const { addToCart, isInCart }     = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  useEffect(() => {
    categoryMainService.getAll()
      .then((data) => setCategoryMains(data || []))
      .catch(() => setCategoryMains([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    setQuantity(1);
    setSelectedVariant(null);
    setSelectedColor(null);
    setSelectedSize(null);
    setActiveImageUrl(null);

    productService
      .getById(id)
      .then((data) => {
        setProduct(normalize(data));
        
        if (data.category?.slug) {
          categoryService.getBreadcrumb(data.category.slug)
            .then(setBreadcrumbs)
            .catch(() => setBreadcrumbs([]));
        } else {
          setBreadcrumbs([]);
        }

        const firstVariant = data.variants?.[0] || null;
        setSelectedVariant(firstVariant);
        const initColor = parseTokens(firstVariant?.color)[0] || parseTokens(data.color)[0] || null;
        const initSize  = parseTokens(firstVariant?.size)[0]  || parseTokens(data.size)[0]  || null;
        setSelectedColor(initColor);
        setSelectedSize(initSize);
        const initImg = firstVariant?.imageUrl || data.images?.find((img) => {
          if (img.variantId && firstVariant && Number(img.variantId) === Number(firstVariant.id)) return true;
          return false;
        })?.url || data.imageUrl || data.images?.[0]?.url || null;

        setActiveImageUrl(initImg);
        if (data.id) {
          trackProductView(data.id);
        }
        return productService.getRelated(id, 4);
      })
      .then((rel) => setRelated(normalizeProducts(rel || [])))
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [id]);

  const allImages = useMemo(() => buildAllImages(product), [product]);

  const handleGallerySelect = useCallback(
    (img) => {
      setActiveImageUrl(img.url);
      const matched = product?.variants?.find(
        (v) => (img.variantId && Number(v.id) === Number(img.variantId)) || (v.imageUrl && v.imageUrl === img.url)
      );
      if (matched) {
        setSelectedVariant(matched);
        if (matched.color) setSelectedColor(parseTokens(matched.color)[0]);
        if (matched.size) setSelectedSize(parseTokens(matched.size)[0]);
        setQuantity(1);
      }
    },
    [product],
  );

  useEffect(() => {
    if (!product?.variants || product.variants.length === 0) return;

    let matched = product.variants.find((v) => matchesToken(v.color, selectedColor) && matchesToken(v.size, selectedSize));
    
    if (!matched && selectedColor) {
      matched = product.variants.find((v) => matchesToken(v.color, selectedColor));
    }
    if (!matched && selectedSize) {
      matched = product.variants.find((v) => matchesToken(v.size, selectedSize));
    }

    if (matched) {
      setSelectedVariant((current) => {
        if (!current || current.id !== matched.id) {
          return matched;
        }
        return current;
      });

      if (matched.color) {
        const mColors = parseTokens(matched.color);
        if (!mColors.includes(selectedColor)) {
          setSelectedColor(mColors[0]);
        }
      }
      if (matched.size) {
        const mSizes = parseTokens(matched.size);
        if (!mSizes.includes(selectedSize)) {
          setSelectedSize(mSizes[0]);
        }
      }

      const targetImg = matched.imageUrl || product.images?.find((img) => Number(img.variantId) === Number(matched.id))?.url;
      if (targetImg) {
        setActiveImageUrl(targetImg);
      }
    }
  }, [selectedColor, selectedSize, product]);

  const handleSelectColor = (color) => {
    setSelectedColor(color);
    setQuantity(1);
  };

  const handleSelectSize = (size) => {
    setSelectedSize(size);
    setQuantity(1);
  };

  const inWishlist     = isInWishlist(product?.id);
  const inCart         = isInCart(product?.id);
  const currentStock   = selectedVariant?.availableStock ?? selectedVariant?.stock ?? product?.stock ?? 0;
  const currentPrice   = selectedVariant?.price   ?? product?.price   ?? 0;
  const currentCompare = selectedVariant?.comparePrice ?? product?.originalPrice ?? 0;
  const currentDiscount =
    currentCompare > currentPrice
      ? Math.round(((currentCompare - currentPrice) / currentCompare) * 100)
      : 0;

  const productColors = parseTokens(product?.color);
  const productSizes  = parseTokens(product?.size);

  const uniqueColors = useMemo(() => {
    if (!product?.variants) return [];
    const colors = new Set();
    product.variants.forEach((v) => {
      if (v.color) {
        parseTokens(v.color).forEach(c => colors.add(c));
      }
    });
    return [...colors];
  }, [product]);

  const uniqueSizes = useMemo(() => {
    if (!product?.variants) return [];
    const sizes = new Set();
    product.variants.forEach((v) => {
      if (v.size) {
        parseTokens(v.size).forEach(s => sizes.add(s));
      }
    });
    return [...sizes];
  }, [product]);

  const currentCategoryMain = useMemo(() => {
    const crumbWithMain = breadcrumbs.find((crumb) => crumb.categoryMainId);
    const mainId = crumbWithMain?.categoryMainId || product?.category?.categoryMainId;
    if (!mainId) return null;
    return categoryMains.find((m) => m.id === mainId);
  }, [product, categoryMains, breadcrumbs]);

  const breadcrumbItems = useMemo(() => {
    const items = [];
    if (currentCategoryMain) {
      let path = `/products/${currentCategoryMain.slug}`;
      items.push({ label: currentCategoryMain.name, to: path });

      breadcrumbs.forEach((crumb) => {
        path += `/${crumb.slug}`;
        items.push({ label: crumb.name, to: path });
      });

      items.push({ label: product?.name || '', to: `/products/${product?.id}` });
    } else {
      if (product) {
        items.push({ label: product.name, to: `/products/${product.id}` });
      }
    }
    return items;
  }, [currentCategoryMain, breadcrumbs, product]);

  const isColorDisabled = useCallback((color) => {
    return !product?.variants?.some(
      (v) => matchesToken(v.color, color) && (!selectedSize || matchesToken(v.size, selectedSize)) && v.isActive
    );
  }, [product, selectedSize]);

  const isSizeDisabled = useCallback((size) => {
    return !product?.variants?.some(
      (v) => matchesToken(v.size, size) && (!selectedColor || matchesToken(v.color, selectedColor)) && v.isActive
    );
  }, [product, selectedColor]);

  if (loading) return <PageLoader />;
  if (!product)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-sm font-semibold text-slate-800">Không tìm thấy sản phẩm</p>
        <Link to="/products"><Button size="sm">Quay lại sản phẩm</Button></Link>
      </div>
    );

  const handleAddToCart = () => {
    const isLoggedIn = !!localStorage.getItem('auth_tokens');
    if (!isLoggedIn) {
      toast.error('Vui lòng đăng nhập để thêm vào giỏ hàng');
      window.dispatchEvent(new Event('open-login-modal'));
      return;
    }
    addToCart(product, quantity, selectedVariant?.id);
    trackAddToCart(product.id);
  };
  const handleBuyNow = () => {
    const isLoggedIn = !!localStorage.getItem('auth_tokens');
    if (!isLoggedIn) {
      toast.error('Vui lòng đăng nhập để mua ngay');
      window.dispatchEvent(new Event('open-login-modal'));
      return;
    }
    addToCart(product, quantity, selectedVariant?.id);
    trackAddToCart(product.id);
    navigate('/checkout', {
      state: { buyNow: true, productId: product.id, variantId: selectedVariant?.id },
    });
  };
  const handleToggleWishlist = () => {
    toggleWishlist(product);
    trackWishlist(product.id);
  };

  const location = useLocation();
  const searchUrl = location.state?.searchUrl || sessionStorage.getItem('nivora_search_back_url');

  return (
    <div className="min-h-screen bg-[#fafbfd] flex flex-col pt-4">
      <div className="max-w-[96%] xl:max-w-[92%] mx-auto w-full px-4 sm:px-6 flex flex-wrap items-center justify-start gap-4 mb-4">
        {searchUrl && searchUrl.includes('search=') && (
          <Link
            to={searchUrl}
            className="inline-flex items-center gap-1 px-3 py-1 bg-white hover:bg-slate-100 text-slate-800 rounded-lg text-xs font-semibold border border-slate-200 cursor-pointer shrink-0"
          >
            <ChevronLeft size={14} />
            <span>Quay lại kết quả tìm kiếm</span>
          </Link>
        )}

        <Breadcrumbs items={breadcrumbItems} />
      </div>

      <div className="max-w-[96%] xl:max-w-[92%] mx-auto w-full px-4 sm:px-6 pb-16 flex-grow">
        <div className="grid lg:grid-cols-2 gap-10 mb-12">
          {/* Gallery */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
            {allImages.length > 0 ? (
              <Gallery
                images={allImages}
                activeUrl={activeImageUrl}
                onSelect={handleGallerySelect}
              />
            ) : (
              <div className="aspect-square rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-200">
                <span className="text-slate-400 text-xs">Chưa có ảnh</span>
              </div>
            )}
          </motion.div>

          {/* Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-5"
          >
            <div className="flex flex-wrap gap-1.5">
              {product.isNew && (
                <span className="px-2.5 py-0.5 bg-slate-900 text-white text-[10px] font-semibold rounded">MỚI</span>
              )}
              {product.isBestSeller && (
                <span className="px-2.5 py-0.5 bg-amber-500 text-white text-[10px] font-semibold rounded">BÁN CHẠY</span>
              )}
              {currentDiscount > 0 && (
                <span className="px-2.5 py-0.5 bg-rose-600 text-white text-[10px] font-bold rounded">
                  -{currentDiscount}%
                </span>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                {product.brand}
              </p>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">{product.name}</h1>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center text-amber-400">
                <Star size={14} className="fill-amber-400" />
              </div>
              <span className="font-bold text-slate-900">{product.rating}</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-500 font-medium">{product.reviewCount} đánh giá</span>
            </div>

            <div className="flex items-baseline gap-3 bg-slate-100/70 border border-slate-200 rounded-xl px-5 py-3">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{formatPrice(currentPrice)}</span>
              {currentCompare > currentPrice && (
                <span className="text-sm text-slate-400 line-through font-normal">{formatPrice(currentCompare)}</span>
              )}
            </div>

            {/* Variant Selector */}
            {(() => {
              const showVariantColors = uniqueColors.length > 0;
              const showProductColors = !showVariantColors && productColors.length > 0;
              const showVariantSizes  = uniqueSizes.length > 0;
              const showProductSizes  = !showVariantSizes && productSizes.length > 0;

              if (!showVariantColors && !showProductColors && !showVariantSizes && !showProductSizes) return null;

              return (
                <div className="space-y-4 border-t border-b border-slate-200/80 py-4">
                  {showVariantColors && (
                    <div>
                      <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Màu sắc: <span className="font-normal text-slate-900 normal-case ml-1">{selectedColor}</span>
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {uniqueColors.map((colorKey) => {
                          const isSelected = selectedColor === colorKey;
                          const disabled = isColorDisabled(colorKey);
                          return (
                            <button
                              key={colorKey}
                              onClick={() => handleSelectColor(colorKey)}
                              disabled={disabled}
                              className={clsx(
                                'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer',
                                isSelected
                                  ? 'border-slate-900 bg-slate-900 text-white font-bold'
                                  : 'border-slate-200 text-slate-700 hover:border-slate-400 bg-white',
                                disabled && 'opacity-30 cursor-not-allowed line-through'
                              )}
                            >
                              {colorKey}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {showProductColors && (
                    <div>
                      <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Màu sắc: <span className="font-normal text-slate-900 normal-case ml-1">{selectedColor}</span>
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {productColors.map((c) => (
                          <button
                            key={c}
                            onClick={() => setSelectedColor(c)}
                            className={clsx(
                              'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer',
                              selectedColor === c
                                ? 'border-slate-900 bg-slate-900 text-white font-bold'
                                : 'border-slate-200 text-slate-700 hover:border-slate-400 bg-white',
                            )}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {showVariantSizes && (
                    <div>
                      <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Kích thước: <span className="font-normal text-slate-900 normal-case ml-1">{selectedSize}</span>
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {uniqueSizes.map((sizeKey) => {
                          const isSelected = selectedSize === sizeKey;
                          const disabled = isSizeDisabled(sizeKey);
                          return (
                            <button
                              key={sizeKey}
                              onClick={() => handleSelectSize(sizeKey)}
                              disabled={disabled}
                              className={clsx(
                                'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer',
                                isSelected
                                  ? 'border-slate-900 bg-slate-900 text-white font-bold'
                                  : 'border-slate-200 text-slate-700 hover:border-slate-400 bg-white',
                                disabled && 'opacity-30 cursor-not-allowed line-through',
                              )}
                            >
                              {sizeKey}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {showProductSizes && (
                    <div>
                      <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Kích thước: <span className="font-normal text-slate-900 normal-case ml-1">{selectedSize}</span>
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {productSizes.map((s) => (
                          <button
                            key={s}
                            onClick={() => setSelectedSize(s)}
                            className={clsx(
                              'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer',
                              selectedSize === s
                                ? 'border-slate-900 bg-slate-900 text-white font-bold'
                                : 'border-slate-200 text-slate-700 hover:border-slate-400 bg-white',
                            )}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Quantity */}
            <div>
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Số lượng</p>
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-slate-200 bg-white rounded-lg p-0.5">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    type="button"
                    className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-md cursor-pointer"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-10 text-center text-xs font-bold text-slate-900">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(currentStock, q + 1))}
                    disabled={quantity >= currentStock}
                    type="button"
                    className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-md disabled:opacity-30 cursor-pointer"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <span className="text-xs text-slate-500 font-medium">
                  {currentStock > 0 ? `${currentStock} sản phẩm sẵn có` : 'Hết hàng'}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                onClick={handleAddToCart}
                disabled={currentStock === 0}
                className={clsx(
                  "flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer border",
                  inCart 
                    ? "bg-slate-100 border-slate-300 text-slate-900"
                    : "bg-white border-slate-900 text-slate-900 hover:bg-slate-50"
                )}
              >
                <ShoppingCart size={15} />
                {inCart ? 'Đã trong giỏ hàng' : 'Thêm vào giỏ'}
              </button>

              <button
                onClick={handleBuyNow}
                disabled={currentStock === 0}
                className="flex-1 flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-5 rounded-xl text-xs uppercase tracking-wider shadow-xs transition-colors cursor-pointer disabled:opacity-40"
              >
                <Zap size={15} />
                Mua ngay
              </button>

              <button
                onClick={handleToggleWishlist}
                className={clsx(
                  'w-11 h-11 rounded-xl border flex items-center justify-center transition-colors shrink-0 cursor-pointer',
                  inWishlist
                    ? 'border-rose-500 bg-rose-50 text-rose-500'
                    : 'border-slate-200 text-slate-600 hover:border-slate-400 bg-white',
                )}
              >
                <Heart size={18} fill={inWishlist ? 'currentColor' : 'none'} />
              </button>
            </div>
          </motion.div>
        </div>

        {/* Description & Review Tabs */}
        <div className="mb-12">
          <div className="flex gap-2 border-b border-slate-200 mb-6">
            {['description', 'reviews'].map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={clsx(
                    'px-5 py-3 text-xs font-bold uppercase tracking-wider relative transition-colors cursor-pointer',
                    isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-800',
                  )}
                >
                  {tab === 'description' ? 'Mô tả sản phẩm' : `Đánh giá (${product.reviewCount})`}
                  {isActive && (
                    <motion.div
                      layoutId="activeTabUnderline"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900"
                      transition={{ duration: 0.2 }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'description' ? (
              <motion.div 
                key="description"
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="bg-white rounded-2xl border border-slate-200/80 p-6 leading-relaxed text-slate-700 text-xs sm:text-sm"
              >
                {product.description || 'Chưa có mô tả chi tiết cho sản phẩm này.'}
              </motion.div>
            ) : (
              <motion.div 
                key="reviews"
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="bg-white rounded-2xl border border-slate-200/80 p-6"
              >
                <ProductReview product={product} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 mb-4 uppercase tracking-tight">Sản phẩm liên quan</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;