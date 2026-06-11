// Normalize a backend ProductResponse → flattened shape used by UI components
export const normalizeProduct = (p) => {
  if (!p) return null;
  const variants = p.variants || [];
  const totalStock = Number(p.stock ?? variants.reduce((s, v) => s + (v.availableStock ?? v.stock ?? 0), 0));
  const images = (p.images || []).map((img) => ({
    id: img.id,
    url: img.url,
    altText: img.altText || p.name,
    isPrimary: img.isPrimary,
  }));
  return {
    ...p,
    price: Number(p.basePrice) || 0,
    originalPrice: Number(p.comparePrice) || 0,
    discount:
      p.comparePrice && Number(p.comparePrice) > Number(p.basePrice)
        ? Math.round(((Number(p.comparePrice) - Number(p.basePrice)) / Number(p.comparePrice)) * 100)
        : 0,
    rating: parseFloat(p.ratingAvg) || 0,
    reviewCount: p.ratingCount || 0,
    images,
    stock: variants.length > 0 ? totalStock : 0,
    colors: variants.map((v) => v.name),
    features: [],
    categoryName: p.category?.name || '',
  };
};

export const normalizeProducts = (list) => (list || []).map(normalizeProduct);
