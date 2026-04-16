import React from 'react';
import { Package, TrendingUp, Users, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useProductCatalog } from '../context/ProductCatalogContext';

const mockSalesData = [
  { name: 'Mon', views: 4000, sales: 2400 },
  { name: 'Tue', views: 3000, sales: 1398 },
  { name: 'Wed', views: 2000, sales: 9800 },
  { name: 'Thu', views: 2780, sales: 3908 },
  { name: 'Fri', views: 1890, sales: 4800 },
  { name: 'Sat', views: 2390, sales: 3800 },
  { name: 'Sun', views: 3490, sales: 4300 },
];

export default function AdminDashboardOverview() {
  const { products } = useProductCatalog();
  const featuredCount = products.filter((p) => p.featured).length;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-black text-white sm:text-4xl">Dashboard Overview</h1>
        <p className="mt-2 text-primary-foreground/70">Welcome to your store's command center.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { title: 'Total Products', icon: Package, value: products.length, bg: 'bg-blue-500/10', color: 'text-blue-500' },
          { title: 'Featured Items', icon: TrendingUp, value: featuredCount, bg: 'bg-green-500/10', color: 'text-green-500' },
          { title: 'Active Sessions', icon: Activity, value: '143', bg: 'bg-secondary/10', color: 'text-secondary' },
          { title: 'Daily Customers', icon: Users, value: '2.5k', bg: 'bg-purple-500/10', color: 'text-purple-500' },
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
            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-green-500">
              <TrendingUp size={16} />
              <span>+12% from last week</span>
            </div>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-border/80 bg-card/85 p-6 shadow-xl backdrop-blur">
        <h2 className="mb-6 text-xl font-bold text-foreground">Weekly Performance</h2>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mockSalesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--secondary)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--secondary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '1rem', color: 'var(--foreground)' }}
                itemStyle={{ color: 'var(--foreground)' }}
              />
              <Area type="monotone" dataKey="views" stroke="var(--secondary)" fillOpacity={1} fill="url(#colorViews)" />
              <Area type="monotone" dataKey="sales" stroke="var(--primary)" fillOpacity={1} fill="url(#colorSales)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
