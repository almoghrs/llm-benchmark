import React from 'react';
import type { Product } from '../types/Product';

export interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => (
  <div className="product-card">
    <img src={product.image} alt={product.name} className="product-image" />
    <h3 className="product-name">{product.name}</h3>
    <p className="product-price">${product.price.toFixed(2)}</p>
  </div>
);

export default ProductCard;
