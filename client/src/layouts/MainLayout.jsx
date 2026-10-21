import React from 'react';
import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function MainLayout() {
  const { pathname } = useLocation();

  // Start every new page at the top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="d-flex flex-column min-vh-100">
      <a href="#main-content" className="visually-hidden-focusable btn btn-light position-absolute m-2" style={{ zIndex: 2000 }}>
        Skip to main content
      </a>
      <Navbar />
      <main id="main-content" className="flex-grow-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
