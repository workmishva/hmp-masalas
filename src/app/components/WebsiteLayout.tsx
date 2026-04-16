import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import Navbar from './Navbar';
import Footer from './Footer';
import OnboardingModal from './OnboardingModal';

export default function WebsiteLayout() {
  const location = useLocation();
  const shouldHideFooter = location.pathname === '/checkout' || location.pathname === '/profile';

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname, location.search]);


  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      {!shouldHideFooter && <Footer />}
      <OnboardingModal />
    </>
  );
}
