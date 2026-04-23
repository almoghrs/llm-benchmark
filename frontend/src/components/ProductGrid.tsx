import React, { useEffect, useState } from 'react';
import { fetchProducts } from '../api/mockProducts';
import type { Product } from '../types/Product';
import ProductCard from './ProductCard';

export const ProductGrid: React.FC = () => {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts()
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load products');
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="loading">Loading products…</p>;
  if (error) return <p className="error">{error}</p>;
  if (!products || products.length === 0) return <p className="empty">No products available.</p>;

  return (
    <div className="product-grid">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
};

export default ProductGrid;
