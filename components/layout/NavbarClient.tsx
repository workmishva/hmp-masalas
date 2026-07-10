'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShoppingCart, Menu, X, ChevronDown, LogOut, User, LayoutDashboard } from 'lucide-react'
import { signOut } from 'next-auth/react'
import { useCart } from '@/context/CartContext'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

interface NavbarClientProps {
  userName?: string
  userRole?: string
  darkModeEnabled?: boolean
}

const navLinks = [
  { href: '/',        label: 'Home' },
  { href: '/products', label: 'Products' },
]

export function NavbarClient({ userName, userRole, darkModeEnabled = false }: NavbarClientProps) {
  const [mobileOpen, setMobileOpen]   = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const pathname   = usePathname()
  const { count: cartCount } = useCart()
  const isHeroPage = pathname === '/'

  /* ─── Scroll effect — pure DOM, zero React re-renders ───────────────────
   * Sets two data attributes on #site-header:
   *   data-scrolled="true"  → CSS bumps glass opacity slightly
   *   data-hero="false"     → CSS restores dark brand text/icon colours
   * All visual transitions are handled in globals.css with CSS transitions.
   */
  useEffect(() => {
    const header = document.getElementById('site-header')
    if (!header) return

    // Initialise hero attribute immediately so SSR state matches
    header.setAttribute('data-hero', isHeroPage ? 'true' : 'false')

    const onScroll = () => {
      const y = window.scrollY
      // data-scrolled: nudges glass opacity (applies on all pages)
      header.setAttribute('data-scrolled', String(y > 8))
      // data-hero: controls text/icon colour (only meaningful on hero page)
      if (isHeroPage) {
        header.setAttribute('data-hero', String(y < window.innerHeight * 0.78))
      }
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [isHeroPage])

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <>
      {/* ── Logo wordmark ── */}
      <Link href="/" className="flex items-center gap-2 shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icon-512.svg"
          alt="HMP Masala"
          style={{ height: '36px', width: 'auto', display: 'block', flexShrink: 0 }}
        />
        {/* CSS in globals.css targets [data-hero="true"] .navbar-wordmark */}
        <span className="navbar-wordmark text-xl font-brand font-black tracking-tight">
          HMP Masala
        </span>
      </Link>

      {/* ── Desktop nav links ── */}
      <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`navbar-link text-sm font-medium ${
              isActive(link.href) ? 'navbar-link-active' : ''
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      {/* ── Right actions ── */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        {darkModeEnabled && <ThemeToggle />}

        {/* Cart */}
        <Link
          href="/cart"
          className="navbar-icon relative p-2 rounded-xl"
          aria-label={`Cart, ${cartCount} item${cartCount !== 1 ? 's' : ''}`}
        >
          <ShoppingCart className="w-5 h-5" />
          {cartCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-chili-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {cartCount > 9 ? '9+' : cartCount}
            </span>
          )}
        </Link>

        {/* Auth */}
        {userName ? (
          <div className="relative hidden md:block">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="navbar-icon flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium"
            >
              <span className="navbar-avatar w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold">
                {userName.charAt(0).toUpperCase()}
              </span>
              {userName.split(' ')[0]}
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {profileOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-masala-100 rounded-2xl border border-masala-200 shadow-card-hover py-1 z-50"
                onBlur={() => setProfileOpen(false)}
              >
                {userRole === 'admin' && (
                  <Link
                    href="/admin"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-masala-800 hover:bg-masala-50"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Admin Panel
                  </Link>
                )}
                <Link
                  href="/profile"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-masala-800 hover:bg-masala-50"
                >
                  <User className="w-4 h-4" />
                  My Profile
                </Link>
                <Link
                  href="/my-orders"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-masala-800 hover:bg-masala-50"
                >
                  <ShoppingCart className="w-4 h-4" />
                  My Orders
                </Link>
                <hr className="my-1 border-masala-200" />
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-chili-600 hover:bg-chili-100"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-2">
            <Link href="/login" className="navbar-signin text-sm font-medium px-4 py-1.5 rounded-xl shadow-sm">
              Sign In
            </Link>
          </div>
        )}

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="navbar-icon md:hidden p-2 rounded-xl"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* ── Mobile drawer — always readable glass (72% white) ── */}
      {mobileOpen && (
        <div
          className="md:hidden absolute top-full left-0 right-0 rounded-b-2xl py-4 px-6 z-40 flex flex-col gap-1"
          style={{
            background:           'rgba(255, 255, 255, 0.80)',
            backdropFilter:       'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderBottom:         '1px solid rgba(255, 255, 255, 0.20)',
            boxShadow:            '0 12px 40px rgba(0, 0, 0, 0.12)',
          }}
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`py-2.5 text-sm font-medium transition-colors ${
                isActive(link.href) ? 'text-chili-600' : 'text-masala-800'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <hr className="my-1 border-masala-200" />
          {userName ? (
            <>
              {userRole === 'admin' && (
                <Link href="/admin" onClick={() => setMobileOpen(false)} className="py-2.5 text-sm font-medium text-masala-800">Admin Panel</Link>
              )}
              <Link href="/profile"   onClick={() => setMobileOpen(false)} className="py-2.5 text-sm font-medium text-masala-800">My Profile</Link>
              <Link href="/my-orders" onClick={() => setMobileOpen(false)} className="py-2.5 text-sm font-medium text-masala-800">My Orders</Link>
              <button onClick={() => signOut({ callbackUrl: '/' })} className="py-2.5 text-sm font-medium text-chili-600 text-left">Sign Out</button>
            </>
          ) : (
            <Link href="/login" onClick={() => setMobileOpen(false)} className="py-2.5 text-sm font-medium text-chili-600">Sign In</Link>
          )}
        </div>
      )}
    </>
  )
}
