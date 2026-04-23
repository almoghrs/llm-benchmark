import React, { useState } from 'react';
import CartDrawer from './CartDrawer';

export interface HeaderProps {
  /** Optional brand name */
  brand?: string;
}

const Header: React.FC<HeaderProps> = ({ brand = 'Axiom Apparel' }) => {
  const [cartOpen, setCartOpen] = useState(false);
  return (
    <header className="global-header">
      <h1>{brand}</h1>
      <button className="cart-toggle" onClick={() => setCartOpen(true)} aria-label="Open cart">
        Cart
      </button>
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </header>
  );
};

export default Header;
