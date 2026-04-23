import React from 'react';

export interface HeaderProps {
  /** Optional brand name */
  brand?: string;
}

const Header: React.FC<HeaderProps> = ({ brand = 'Axiom Apparel' }) => (
  <header className="global-header">
    <h1>{brand}</h1>
  </header>
);

export default Header;
