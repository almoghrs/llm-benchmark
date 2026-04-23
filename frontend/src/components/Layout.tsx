import React from 'react';
import type { ReactNode } from 'react';
import Header from './Header';
import NavBar from './NavBar';

export interface LayoutProps {
  /** Page title shown in header */
  title?: string;
  /** Main content */
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ title, children }) => (
  <div className="app-container">
    <Header brand={title} />
    <NavBar />
    <main className="main-content">{children}</main>
  </div>
);

export default Layout;
