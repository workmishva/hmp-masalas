import React, { useEffect, useRef, useState } from 'react';
import { ShoppingCart, Menu, X, Trash2, User, LogIn, LogOut, Package, ChevronRight, UserPlus } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { getImage } from '../../assets/images';
import { resolveCatalogImage } from '../context/ProductCatalogContext';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { cartCount, isCartOpen, setIsCartOpen, items, removeFromCart, updateQuantity } = useCart();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isHomePage = location.pathname === '/';
  const profileRef = useRef<HTMLDivElement>(null);

  const handleCheckout = () => {
    setIsCartOpen(false);
    if (user) {
      navigate('/checkout');
    } else {
      navigate('/login', { state: { from: { pathname: '/checkout' } } });
    }
  };

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', href: isHomePage ? '#home' : '/' },
    { name: 'Our Spices', href: isHomePage ? '#products' : '/masalas' },
    { name: 'About Us', href: isHomePage ? '#about' : '/#about' },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        window.history.pushState(null, '', href);
      }
    }
  };

  const handleLogout = async () => {
    setIsProfileOpen(false);
    await logout();
    navigate('/');
  };

  // Build avatar letter from display name or email
  const avatarLetter = (user?.displayName || user?.email || user?.phoneNumber || 'U')[0].toUpperCase();

  // Profile avatar button — shared across desktop & mobile
  const ProfileButton = ({ size = 'md' }: { size?: 'sm' | 'md' }) => {
    if (!user) {
      return (
        <button
          onClick={() => navigate('/login')}
          className={`flex items-center gap-2 rounded-full font-semibold transition-all backdrop-blur-md border ${
            size === 'sm' ? 'p-2' : 'px-5 py-2'
          } ${
            isScrolled
              ? 'bg-foreground/5 hover:bg-foreground/10 text-foreground border-foreground/10'
              : 'bg-neutral-foreground/10 hover:bg-neutral-foreground/20 text-neutral-foreground border-neutral-foreground/20'
          }`}
        >
          <LogIn size={size === 'sm' ? 22 : 18} />
          {size !== 'sm' && <span>Log In</span>}
        </button>
      );
    }

    return (
      <button
        onClick={() => setIsProfileOpen((v) => !v)}
        className={`flex items-center gap-2 rounded-full font-semibold transition-all backdrop-blur-md border ${
          size === 'sm' ? 'p-1' : 'px-3 py-1.5'
        } ${
          isScrolled
            ? 'bg-foreground/5 hover:bg-foreground/10 border-foreground/10'
            : 'bg-neutral-foreground/10 hover:bg-neutral-foreground/20 border-neutral-foreground/20'
        }`}
        aria-label="Open profile menu"
      >
        {/* Avatar bubble */}
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-red-800 to-red-900 text-sm font-black text-white shadow-sm">
          {avatarLetter}
        </div>
        {size !== 'sm' && (
          <span className={`text-sm font-semibold ${isScrolled ? 'text-foreground' : 'text-neutral-foreground'}`}>
            {user?.displayName?.split(' ')[0] || 'My Account'}
          </span>
        )}
      </button>
    );
  };

  return (
    <>
      <nav
        className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
          isScrolled ? 'bg-card/95 py-4 shadow-md backdrop-blur' : 'bg-transparent py-6'
        }`}
      >
        <div className="container mx-auto flex items-center justify-between px-6 md:px-12">
          <Link to="/" className="flex items-center gap-3">
            <ImageWithFallback
              src={getImage('logo_bg_removed.png')}
              alt="HMP Masala Logo"
              className="h-11 w-auto object-contain"
            />
            <span className={`text-2xl font-black tracking-tight ${isScrolled ? 'text-foreground' : 'text-neutral-foreground'}`}>
              HMP Masala
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className={`font-semibold transition-colors hover:text-secondary ${
                  isScrolled ? 'text-muted-foreground' : 'text-neutral-foreground'
                }`}
              >
                {link.name}
              </Link>
            ))}
            <button
              onClick={() => setIsCartOpen(true)}
              className={`relative rounded-full p-2 transition-colors hover:bg-secondary/15 ${
                isScrolled ? 'text-foreground' : 'text-neutral-foreground'
              }`}
            >
              <ShoppingCart size={24} />
              {cartCount > 0 && (
                <span className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Desktop Profile / Login */}
            <div className="relative" ref={profileRef}>
              <ProfileButton />
              {/* Profile Dropdown */}
              <AnimatePresence>
                {isProfileOpen && user && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.97 }}
                    transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-stone-200/80 dark:border-stone-700/80 bg-white/95 dark:bg-stone-900/95 backdrop-blur-xl shadow-2xl overflow-hidden"
                  >
                    {/* User info header */}
                    <div className="px-4 py-3 border-b border-stone-100 dark:border-stone-800">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-800 to-red-900 text-base font-black text-white">
                          {avatarLetter}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-bold text-stone-900 dark:text-white">
                            {user?.displayName || 'Welcome!'}
                          </p>
                          <p className="truncate text-xs text-stone-400 dark:text-stone-500">
                            {user?.email || user?.phoneNumber || ''}
                          </p>
                        </div>
                      </div>
                    </div>
                    {/* Menu items */}
                    <div className="py-1">
                      <button
                        onClick={() => { setIsProfileOpen(false); navigate('/profile'); }}
                        className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors group"
                      >
                        <User size={16} className="text-stone-400 group-hover:text-red-800 transition-colors" />
                        My Profile
                        <ChevronRight size={14} className="ml-auto text-stone-300 group-hover:text-stone-500" />
                      </button>
                      <button
                        onClick={() => { setIsProfileOpen(false); navigate('/profile?tab=orders'); }}
                        className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors group"
                      >
                        <Package size={16} className="text-stone-400 group-hover:text-red-800 transition-colors" />
                        My Orders
                        <ChevronRight size={14} className="ml-auto text-stone-300 group-hover:text-stone-500" />
                      </button>
                    </div>
                    <div className="border-t border-stone-100 dark:border-stone-800 py-1">
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors group"
                      >
                        <LogOut size={16} />
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Mobile Nav */}
          <div className="flex items-center gap-3 md:hidden">
            <button
              onClick={() => setIsCartOpen(true)}
              className={`relative p-2 ${isScrolled ? 'text-foreground' : 'text-neutral-foreground'}`}
            >
              <ShoppingCart size={24} />
              {cartCount > 0 && (
                <span className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                  {cartCount}
                </span>
              )}
            </button>
            <ProfileButton size="sm" />
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`${isScrolled ? 'text-foreground' : 'text-neutral-foreground'}`}
            >
              {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute left-0 right-0 top-full flex flex-col bg-card shadow-xl md:hidden"
            >
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  onClick={(e) => {
                    setIsMobileMenuOpen(false);
                    handleNavClick(e, link.href);
                  }}
                  className="w-full px-6 py-3.5 text-left font-medium text-foreground hover:bg-secondary/10 border-b border-border/50"
                >
                  {link.name}
                </Link>
              ))}
              {user ? (
                <>
                  <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-6 py-3.5 font-medium text-foreground hover:bg-secondary/10 border-b border-border/50">
                    <User size={16} /> My Profile
                  </Link>
                  <Link to="/profile?tab=orders" onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-6 py-3.5 font-medium text-foreground hover:bg-secondary/10 border-b border-border/50">
                    <Package size={16} /> My Orders
                  </Link>
                  <button onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }}
                    className="flex w-full items-center gap-3 px-6 py-3.5 font-medium text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 text-left">
                    <LogOut size={16} /> Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-6 py-3.5 font-medium text-foreground hover:bg-secondary/10 border-b border-border/50">
                    <LogIn size={16} /> Log In
                  </Link>
                  <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-6 py-3.5 font-medium text-foreground hover:bg-secondary/10">
                    <UserPlus size={16} /> Create Account
                  </Link>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 z-[60] bg-neutral"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 z-[70] flex h-full w-full max-w-md flex-col bg-card shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-border p-6">
                <h2 className="text-2xl font-bold text-foreground">Your Cart</h2>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="rounded-full p-2 transition-colors hover:bg-muted"
                >
                  <X size={24} className="text-muted-foreground" />
                </button>
              </div>

              <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
                {items.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                    <ShoppingCart size={64} className="mb-4 opacity-50" />
                    <p className="text-lg font-medium text-muted-foreground">Your cart is empty</p>
                    <button
                      onClick={() => setIsCartOpen(false)}
                      className="mt-6 rounded-full bg-primary px-6 py-2 font-medium text-white"
                    >
                      Continue Shopping
                    </button>
                  </div>
                ) : (
                  items.map((item) => (
                    <div key={item.cartId} className="flex items-center gap-4 rounded-2xl bg-muted p-3">
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-card">
                        <ImageWithFallback
                          src={resolveCatalogImage(item.image)}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex flex-1 flex-col">
                        <span className="font-bold text-foreground">{item.name}</span>
                        <span className="text-xs font-semibold text-secondary uppercase tracking-widest">{item.weightId}</span>
                        <div className="mt-1 flex items-center justify-between">
                          <span className="font-black text-primary">₹ {item.weightPrice}</span>
                          <div className="flex items-center gap-1 rounded-md border border-border">
                            <button
                              onClick={() => updateQuantity(item.cartId, item.quantity - 1)}
                              className="flex h-6 w-6 items-center justify-center rounded-l-md text-muted-foreground transition-colors hover:bg-muted hover:text-secondary"
                            >
                              -
                            </button>
                            <span className="w-4 text-center text-sm font-medium">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.cartId, item.quantity + 1)}
                              className="flex h-6 w-6 items-center justify-center rounded-r-md text-muted-foreground transition-colors hover:bg-muted hover:text-secondary"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.cartId)}
                        className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {items.length > 0 && (
                <div className="border-t border-border bg-muted p-6">
                  <div className="mb-6 flex items-center justify-between">
                    <span className="font-medium text-muted-foreground">Subtotal</span>
                    <span className="font-black text-foreground">
                      ₹ {items.reduce((sum, item) => sum + item.weightPrice * item.quantity, 0)}
                    </span>
                  </div>
                  <button
                    onClick={handleCheckout}
                    className="w-full rounded-full bg-primary py-4 text-lg font-bold text-white shadow-lg shadow-primary/20 transition-colors hover:bg-primary/90"
                  >
                    Proceed to Checkout
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
