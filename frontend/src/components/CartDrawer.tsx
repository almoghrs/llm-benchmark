import React from 'react';
import { useCart } from '../context/CartContext';
import ProductCard from './ProductCard';

export interface CartDrawerProps {
  /** Whether the drawer is open */
  isOpen: boolean;
  /** Function to close the drawer */
  onClose: () => void;
}

const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const { items, updateQuantity, removeItem, total, clearCart } = useCart();

  return (
    <div className={`cart-drawer ${isOpen ? 'open' : ''}`} role="dialog" aria-modal="true">
      <button className="close-btn" onClick={onClose} aria-label="Close cart">
        ×
      </button>
      <h2>Your Cart</h2>
      {items.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <ul className="cart-items">
          {items.map(({ product, quantity }) => (
            <li key={product.id} className="cart-item">
              <ProductCard product={product} />
              <div className="cart-controls">
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) =>
                    updateQuantity(product.id, Number(e.target.value))
                  }
                />
                <button onClick={() => removeItem(product.id)} className="remove-btn">
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="cart-summary">
        <p>Total: ${total.toFixed(2)}</p>
        <button onClick={clearCart} className="clear-btn">
          Clear Cart
        </button>
        {/* Checkout placeholder */}
        <button className="checkout-btn">Proceed to Checkout</button>
      </div>
    </div>
  );
};

export default CartDrawer;
