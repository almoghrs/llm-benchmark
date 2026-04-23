import React from 'react';
import type { Product } from '../types/Product';

export interface ProductCardProps {
  product: Product;
}

import { useCart } from '../context/CartContext';

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addItem } = useCart();
  return (
    <div className="product-card">
      <img src={product.image} alt={product.name} className="product-image" />
      <h3 className="product-name">{product.name}</h3>
      <p className="product-price">${product.price.toFixed(2)}</p>
      <button className="add-to-cart" onClick={() => addItem(product)}>
        Add to Cart
      </button>
    </div>
  );
};

export default ProductCard;
