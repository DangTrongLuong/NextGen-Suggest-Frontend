import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { productService } from '../services/productService';
import { categoryService } from '../services/categoryService';
import { normalizeProducts } from '../utils/productNormalizer';

const ProductContext = createContext(null);

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    category: 'All',
    categoryId: null,
    minPrice: '',
    maxPrice: '',
    minRating: '',
    search: '',
    brand: '',
  });
  const [sortBy, setSortBy] = useState('featured');
  const [page, setPage] = useState(0);
  const [pageSize] = useState(12);

  const buildSortParams = (sort) => {
    switch (sort) {
      case 'price-asc':  return { sortBy: 'basePrice', sortDir: 'asc' };
      case 'price-desc': return { sortBy: 'basePrice', sortDir: 'desc' };
      case 'rating':     return { sortBy: 'ratingAvg', sortDir: 'desc' };
      case 'newest':     return { sortBy: 'createdAt', sortDir: 'desc' };
      default:           return { sortBy: 'isFeatured', sortDir: 'desc' };
    }
  };

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      if (filters.search) {
        const data = await productService.search(filters.search.trim(), true, 10);
        const normalized = normalizeProducts(data);
        setProducts(normalized);
        setTotalProducts(normalized.length);
        setTotalPages(1);
        return;
      }

      const { sortBy: sortField, sortDir } = buildSortParams(sortBy);
      const params = {
        page,
        size: pageSize,
        sortBy: sortField,
        sortDir,
        ...(filters.category !== 'All' && { categorySlug: filters.category }),
        ...(filters.brand && { brand: filters.brand }),
        ...(filters.minPrice && { minPrice: filters.minPrice }),
        ...(filters.maxPrice && { maxPrice: filters.maxPrice }),
        ...(filters.minRating && { minRating: filters.minRating }),
      };
      const data = await productService.getAll(params);
      setProducts(normalizeProducts(data?.content));
      setTotalProducts(data?.totalElements || 0);
      setTotalPages(data?.totalPages || 0);
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setProducts([]);
      setTotalProducts(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [filters, sortBy, page, pageSize]);

  // Fetch categories once
  useEffect(() => {
    categoryService.getAll().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Resolve category name → id when filters.category changes
  useEffect(() => {
    if (filters.category === 'All') {
      if (filters.categoryId !== null) {
        setFilters((prev) => ({ ...prev, categoryId: null }));
      }
      return;
    }
    const found = categories.find((c) => c.name === filters.category || c.slug === filters.category);
    if (found && filters.categoryId !== found.id) {
      setFilters((prev) => ({ ...prev, categoryId: found.id }));
    }
  }, [filters.category, categories]);

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(0);
  };

  const resetFilters = () => {
    setFilters({ category: 'All', categoryId: null, minPrice: '', maxPrice: '', minRating: '', search: '', brand: '' });
    setSortBy('featured');
    setPage(0);
  };

  return (
    <ProductContext.Provider
      value={{
        products,
        filteredProducts: products,
        categories,
        totalProducts,
        totalPages,
        loading,
        filters,
        sortBy,
        page,
        pageSize,
        updateFilter,
        setSortBy: (v) => { setSortBy(v); setPage(0); },
        setPage,
        resetFilters,
        refetch: fetchProducts,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => {
  const ctx = useContext(ProductContext);
  if (!ctx) throw new Error('useProducts must be used within ProductProvider');
  return ctx;
};
