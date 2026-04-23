import React, { useEffect, useState } from 'react';
import { fetchProducts } from '../api/mockProducts';
import type { Product } from '../types/Product';
import ProductCard from './ProductCard';

export const ProductGrid: React.FC = () => {
  // Original data fetched from mock API
  const [originalProducts, setOriginalProducts] = useState<Product[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state for filtering and sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState<'price-asc' | 'price-desc'>('price-asc');

  useEffect(() => {
    fetchProducts()
      .then((data) => {
        setOriginalProducts(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load products');
        setLoading(false);
      });
  }, []);

  // Derive filtered and sorted list without mutating original data
  const displayedProducts = React.useMemo(() => {
    if (!originalProducts) return [];
    let filtered = originalProducts.filter((p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const sorted = filtered.slice().sort((a, b) => {
      if (sortOption === 'price-asc') return a.price - b.price;
      return b.price - a.price; // price-desc
    });
    return sorted;
  }, [originalProducts, searchTerm, sortOption]);

  if (loading) return <p className="loading">Loading products…</p>;
  if (error) return <p className="error">{error}</p>;
  if (!originalProducts) return null; // should not happen after loading

  return (
    <section className="product-section">
      <div className="controls">
        <input
          type="text"
          placeholder="Search products…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value as any)}
          className="sort-select"
        >
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
        </select>
      </div>

      {displayedProducts.length === 0 ? (
        <p className="empty">No products match your criteria.</p>
      ) : (
        <div className="product-grid">
          {displayedProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </section>
  );
};

export default ProductGrid;
