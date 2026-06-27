import React, { useEffect, useState } from 'react';
import { Bell, LogOut, Menu, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAdminAuth } from '../context/AdminAuthContext';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { fetchAdminOrders } from '../services/adminOrdersApi';

interface AdminHeaderProps {
  onMenuClick: () => void;
}

export default function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const { logout } = useAdminAuth();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const refreshPendingCount = async () => {
      try {
        const orders = await fetchAdminOrders(user);
        const pendingOrders = orders.filter((order) => order.status === 'pending_payment').length;
        if (isMounted) {
          setPendingCount(pendingOrders);
        }
      } catch {
        if (isMounted) {
          setPendingCount(0);
        }
      }
    };

    refreshPendingCount();
    const intervalId = window.setInterval(refreshPendingCount, 30000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [user]);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/85 px-4 shadow-sm backdrop-blur sm:px-6">
      <div className="flex items-center gap-4">
        <button type="button" onClick={onMenuClick} className="text-muted-foreground transition hover:text-foreground lg:hidden">
          <Menu size={24} />
        </button>
        {/* Placeholder title for small screens, large screens use specific page headers */}
        <span className="hidden text-sm font-bold text-muted-foreground sm:inline-block">Welcome back, Admin</span>
      </div>

      <div className="flex items-center gap-4 sm:gap-6">
        <Link
          to="/"
          className="hidden rounded-full border border-border px-4 py-2 text-xs font-bold text-muted-foreground transition hover:border-secondary hover:text-secondary sm:inline-flex"
        >
          View Store
        </Link>
        <button 
          onClick={() => navigate('/admin/orders')}
          type="button" 
          className="relative text-muted-foreground transition hover:text-secondary"
        >
          <Bell size={20} />
          {pendingCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white">
              {pendingCount}
            </span>
          )}
        </button>

        {mounted && (
           <button
             type="button"
             onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
             className="relative text-muted-foreground transition hover:text-secondary hidden sm:block"
             title={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
           >
             {resolvedTheme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
           </button>
        )}

        <div className="h-6 w-px bg-border"></div>

        <button
          type="button"
          onClick={logout}
          className="inline-flex items-center gap-2 rounded-full border border-neutral-foreground/25 px-4 py-2 text-sm font-bold text-neutral-foreground transition hover:border-primary hover:text-primary"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
