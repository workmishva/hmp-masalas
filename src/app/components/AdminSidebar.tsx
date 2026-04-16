import React from 'react';
import { NavLink } from 'react-router';
import { LayoutDashboard, Package, ShieldCheck, Settings, ShoppingBag, X } from 'lucide-react';

interface AdminSidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export default function AdminSidebar({ isOpen, setIsOpen }: AdminSidebarProps) {
  const links = [
    { name: 'Overview', to: '/admin', icon: LayoutDashboard, end: true },
    { name: 'Products', to: '/admin/products', icon: Package, end: false },
    { name: 'Orders', to: '/admin/orders', icon: ShoppingBag, end: false },
    { name: 'Settings', to: '/admin/settings', icon: Settings, end: false },
  ];

  return (
    <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-card/95 backdrop-blur transition-transform duration-300 lg:translate-x-0 lg:bg-card/50 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border px-6">
        <div className="flex items-center gap-3">
          <ShieldCheck size={28} className="text-secondary" />
          <span className="text-xl font-black text-foreground">Admin Panel</span>
        </div>
        <button className="lg:hidden text-muted-foreground hover:text-foreground" onClick={() => setIsOpen(false)}>
          <X size={24} />
        </button>
      </div>

      <nav className="flex-1 space-y-2 p-4">
        <div className="mb-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Menu</div>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors ${
                isActive
                  ? 'bg-secondary/15 text-secondary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <link.icon size={20} className={isActive ? 'text-secondary' : 'text-muted-foreground'} />
                {link.name}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      
      <div className="p-4 border-t border-border mt-auto">
        <div className="rounded-2xl bg-[linear-gradient(135deg,rgba(233,162,28,0.2)_0%,rgba(93,64,55,0.1)_100%)] p-4 text-center">
            <span className="text-xs font-bold text-secondary">E-Commerce Engine</span>
            <p className="mt-1 text-[10px] text-muted-foreground">Version 1.0.0</p>
        </div>
      </div>
    </aside>
  );
}
