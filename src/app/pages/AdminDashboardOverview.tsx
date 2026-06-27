import React, { useEffect, useState } from 'react';
import { Package, Users, IndianRupee, Clock, Loader2, RefreshCw } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AdminDashboardStats, fetchAdminDashboardStats } from '../services/adminOrdersApi';
import { showErrorToast } from '../utils/errorHandler';

export default function AdminDashboardOverview() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await fetchAdminDashboardStats(null);
      setStats(data);
    } catch (error) {
      showErrorToast('Failed to load stats', 'Could not load dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black text-foreground sm:text-4xl">Dashboard Overview</h1>
          <p className="mt-2 text-muted-foreground">Welcome to your store's command center.</p>
        </div>
        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            type="button"
            onClick={() => loadStats()}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-muted-foreground shadow-sm transition hover:border-secondary hover:text-secondary"
            title="Refresh the dashboard data"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { title: 'Total Revenue', icon: IndianRupee, value: `₹${stats.totalRevenue.toFixed(2)}`, bg: 'bg-green-500/10', color: 'text-green-500' },
          { title: 'Total Orders', icon: Package, value: stats.totalOrders.toString(), bg: 'bg-blue-500/10', color: 'text-blue-500' },
          { title: 'Pending Orders', icon: Clock, value: stats.pendingOrders.toString(), bg: 'bg-amber-500/10', color: 'text-amber-500' },
          { title: 'Total Customers', icon: Users, value: stats.totalCustomers.toString(), bg: 'bg-purple-500/10', color: 'text-purple-500' },
        ].map((stat, index) => (
          <div key={index} className="rounded-2xl border border-border/80 bg-card/85 p-6 shadow-xl backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{stat.title}</p>
                <p className="mt-2 text-3xl font-black text-foreground">{stat.value}</p>
              </div>
              <div className={`p-4 rounded-xl ${stat.bg}`}>
                <stat.icon size={24} className={stat.color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-border/80 bg-card/85 p-6 shadow-xl backdrop-blur">
        <h2 className="mb-6 text-xl font-bold text-foreground">Weekly Performance (Revenue)</h2>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.dailySales} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '1rem', color: 'var(--foreground)' }}
                itemStyle={{ color: 'var(--foreground)' }}
              />
              <Area type="monotone" dataKey="revenue" stroke="var(--primary)" fillOpacity={1} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
