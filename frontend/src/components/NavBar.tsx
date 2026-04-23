import React from 'react';

export interface NavBarProps {
  /** Navigation links */
  links?: { label: string; href: string }[];
}

const defaultLinks = [
  { label: 'Home', href: '/' },
  { label: 'Shop', href: '/shop' },
  { label: 'Contact', href: '/contact' },
];

const NavBar: React.FC<NavBarProps> = ({ links = defaultLinks }) => (
  <nav className="global-nav">
    <ul>
      {links.map((link) => (
        <li key={link.href}>
          <a href={link.href}>{link.label}</a>
        </li>
      ))}
    </ul>
  </nav>
);

export default NavBar;
