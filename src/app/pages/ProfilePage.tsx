import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useProductCatalog } from '../context/ProductCatalogContext';
import {
  User, Mail, Phone, MapPin, Package, LogOut, Edit3, Save, X,
  CheckCircle, Clock, Truck, ShoppingBag, ChevronRight, AlertCircle, Sun, Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { showErrorToast, showSuccessToast, handleNetworkError } from '../utils/errorHandler';
import { useTheme } from 'next-themes';

interface UserProfile {
  displayName: string;
  email: string;
  phone: string;
  photoURL: string;
  address?: {
    house?: string;
    street?: string;
    nearby?: string;
    cityVillage?: string;
    district?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
}

interface OrderItem {
  productId: string;
  productName?: string;
  weightId: string;
  quantity: number;
  weightPrice: number;
}

interface Order {
  orderId: string;
  items: OrderItem[];
  shippingAddress: { fullName: string; city: string; phone: string };
  totalAmount: number;
  status: string;
  shippingMethod: string;
  paymentMethod: string;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.FC<any> }> = {
  pending_payment: { label: 'Pending Payment', color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20', icon: Clock },
  confirmed: { label: 'Confirmed', color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20', icon: CheckCircle },
  processing: { label: 'Processing', color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20', icon: Package },
  shipped: { label: 'Shipped', color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20', icon: Truck },
  delivered: { label: 'Delivered', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'text-red-600 bg-red-50 dark:bg-red-900/20', icon: X },
};

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { resolvedTheme, setTheme } = useTheme();
  const { products } = useProductCatalog();

  // Build a lookup map: productId → productName from the catalog
  // This ensures legacy orders (before productName was stored) still show readable names
  const productNameById = useMemo(
    () => new Map(products.map((p) => [p.id, p.name])),
    [products]
  );

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'orders'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({});
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) navigate('/login', { replace: true });
  }, [user, navigate]);

  // Fetch profile from backend
  useEffect(() => {
    if (!user) return;
    fetchProfile();
  }, [user]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getAuthHeaders = async () => {
    const token = await user!.getIdToken();
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  };

  const fetchProfile = async () => {
    try {
      setLoadingProfile(true);
      const headers = await getAuthHeaders();
      const res = await fetch(`${BACKEND_URL}/api/users/me`, { headers });

      if (res.status === 404) {
        // New user — create profile automatically using Firebase data
        await createInitialProfile();
        return;
      }

      if (!res.ok) throw new Error('Failed to fetch profile');
      const data = await res.json();
      setProfile(data.user);
      setOrders(data.orders || []);
    } catch (err) {
      handleNetworkError(err, 'Profile');
      // Fallback to Firebase Auth data if backend is unreachable
      setProfile({
        displayName: user?.displayName || user?.email?.split('@')[0] || 'User',
        email: user?.email || '',
        phone: user?.phoneNumber || '',
        photoURL: user?.photoURL || '',
      });
    } finally {
      setLoadingProfile(false);
    }
  };

  const createInitialProfile = async () => {
    try {
      const headers = await getAuthHeaders();
      const storedName = localStorage.getItem('signup_displayName');
      const displayName = storedName || user?.displayName || user?.email?.split('@')[0] || 'User';

      const res = await fetch(`${BACKEND_URL}/api/users/me`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          displayName,
          email: user?.email || '',
          phone: user?.phoneNumber || '',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setProfile(data.user);
        localStorage.removeItem('signup_displayName');
      }
    } catch (err) {
      handleNetworkError(err, 'Create Profile');
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleEditStart = () => {
    setEditForm({
      displayName: profile?.displayName || '',
      email: profile?.email || user?.email || '',
      phone: profile?.phone || user?.phoneNumber || '',
      address: { ...(profile?.address || {}) },
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${BACKEND_URL}/api/users/me`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(editForm),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        let errMsg = errData.error || 'Failed to update';
        if (errData.details && Array.isArray(errData.details)) {
           errMsg += ': ' + errData.details.map((d: any) => `${d.path?.join('.') || 'field'} - ${d.message}`).join(', ');
        }
        throw new Error(errMsg);
      }
      const data = await res.json();
      setProfile(data.user);
      setIsEditing(false);
      showSuccessToast('Profile Updated', 'Your profile has been saved successfully.');
    } catch (error: any) {
      showErrorToast('Update Failed', 'Failed to save changes. Please verify your info and try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  const avatarLetter = (profile?.displayName || user?.email || 'U')[0].toUpperCase();
  const isDarkTheme = mounted ? resolvedTheme === 'dark' : false;

  if (loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-stone-200 border-t-red-800" />
          <p className="text-sm text-stone-500">Loading your profile…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 pt-24 pb-16 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Profile Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-stone-200/80 dark:border-stone-800/80 bg-white/90 dark:bg-stone-900/90 backdrop-blur-xl shadow-lg overflow-hidden mb-5"
        >
          {/* Banner */}
          <div className="h-14 bg-gradient-to-r from-red-800 via-red-900 to-stone-900 relative">
            <div className="absolute inset-0 opacity-20"
              style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(251,191,36,0.4) 0%, transparent 60%)' }}
            />
          </div>

          <div className="px-4 py-4 sm:px-5 sm:py-5">
            <div className="mb-3 flex justify-end">
              <button
                type="button"
                onClick={() => setTheme(isDarkTheme ? 'light' : 'dark')}
                aria-label={isDarkTheme ? 'Switch to light mode' : 'Switch to dark mode'}
                className="relative inline-flex h-11 w-[102px] items-center rounded-full border border-stone-200 bg-stone-100 p-1 shadow-sm transition-colors dark:border-stone-700 dark:bg-stone-900"
              >
                <span
                  className={`absolute inset-y-1 left-1 w-[42px] rounded-full bg-white shadow transition-transform duration-300 dark:bg-stone-950 ${
                    isDarkTheme ? 'translate-x-[52px]' : 'translate-x-0'
                  }`}
                />
                <span className={`relative z-10 flex w-1/2 justify-center transition-colors ${isDarkTheme ? 'text-stone-400' : 'text-amber-500'}`}>
                  <Sun size={16} />
                </span>
                <span className={`relative z-10 flex w-1/2 justify-center transition-colors ${isDarkTheme ? 'text-stone-200' : 'text-stone-400'}`}>
                  <Moon size={16} />
                </span>
              </button>
            </div>

            {/* Avatar */}
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-red-800 to-red-900 border-4 border-white dark:border-stone-900 shadow-md text-xl font-black text-white">
                {avatarLetter}
              </div>
              <div className="mb-0.5 flex flex-wrap items-center justify-end gap-1.5">
                {!isEditing ? (
                  <button
                    onClick={handleEditStart}
                    className="flex items-center gap-1 rounded-lg bg-stone-100 dark:bg-stone-800 px-3 py-1.5 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-all"
                  >
                    <Edit3 size={12} /> Edit Profile
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="flex items-center gap-1 rounded-lg bg-stone-100 dark:bg-stone-800 px-3 py-1.5 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:bg-stone-200 transition-all"
                    >
                      <X size={12} /> Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-red-800 to-red-900 px-3 py-1.5 text-xs font-bold text-white hover:shadow-md transition-all disabled:opacity-50"
                    >
                      {saving ? <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Save size={12} />}
                      Save
                    </button>
                  </>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 rounded-lg bg-red-50 dark:bg-red-900/20 px-3 py-1.5 text-xs font-semibold text-red-700 dark:text-red-400 hover:bg-red-100 transition-all"
                >
                  <LogOut size={12} /> Sign Out
                </button>
              </div>
            </div>

            {/* Name & Identity */}
            {isEditing ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={editForm.displayName || ''}
                  onChange={(e) => setEditForm(f => ({ ...f, displayName: e.target.value }))}
                  placeholder="Full Name"
                  className="w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-4 py-2.5 text-base font-bold text-stone-900 dark:text-white focus:border-red-800 focus:ring-2 focus:ring-red-800/20 outline-none transition-all"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="tel"
                    value={editForm.phone || ''}
                    onChange={(e) => setEditForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="Phone Number"
                    className="w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-4 py-2.5 text-sm font-semibold text-stone-900 dark:text-white focus:border-red-800 focus:ring-2 focus:ring-red-800/20 outline-none transition-all"
                  />
                  <input
                    type="email"
                    value={editForm.email || ''}
                    onChange={(e) => setEditForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="Email Address"
                    className="w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-4 py-2.5 text-sm font-semibold text-stone-900 dark:text-white focus:border-red-800 focus:ring-2 focus:ring-red-800/20 outline-none transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {(['house', 'street', 'nearby', 'cityVillage', 'district', 'state', 'country', 'postalCode'] as const).map(field => (
                    <input
                      key={field}
                      type="text"
                      value={(editForm.address as any)?.[field] || ''}
                      onChange={(e) => setEditForm(f => ({
                        ...f,
                        address: { ...(f.address || {}), [field]: e.target.value }
                      }))}
                      placeholder={field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')}
                      className="rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-3 py-2.5 text-sm text-stone-900 dark:text-white focus:border-red-800 focus:ring-2 focus:ring-red-800/20 outline-none transition-all"
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-2xl font-black text-stone-900 dark:text-white">
                  {profile?.displayName || 'User'}
                </h2>
                <div className="mt-3 flex flex-wrap gap-3">
                  {(profile?.email) && (
                    <span className="flex items-center gap-1.5 text-sm text-stone-500 dark:text-stone-400">
                      <Mail size={14} className="text-red-700" />
                      {profile.email}
                    </span>
                  )}
                  {(profile?.phone || user?.phoneNumber) && (
                    <span className="flex items-center gap-1.5 text-sm text-stone-500 dark:text-stone-400">
                      <Phone size={14} className="text-red-700" />
                      {profile?.phone || user?.phoneNumber}
                    </span>
                  )}
                  {profile?.address?.cityVillage && (
                    <span className="flex items-center gap-1.5 text-sm text-stone-500 dark:text-stone-400">
                      <MapPin size={14} className="text-red-700" />
                      {[profile.address.cityVillage, profile.address.state].filter(Boolean).join(', ')}
                    </span>
                  )}
                </div>
                {profile?.address?.street && (
                  <p className="mt-2 text-sm text-stone-400 dark:text-stone-500">
                    {[profile.address.house, profile.address.street, profile.address.postalCode].filter(Boolean).join(' — ')}
                  </p>
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-2xl bg-stone-100 dark:bg-stone-900 p-1.5 mb-6">
          {([
            { id: 'profile', label: 'My Info', icon: User },
            { id: 'orders', label: `Orders (${orders.length})`, icon: ShoppingBag },
          ] as const).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`relative flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all duration-300 ${
                activeTab === id
                  ? 'text-white'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-700'
              }`}
            >
              {activeTab === id && (
                <motion.div
                  layoutId="profile-tab-bg"
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-800 to-red-900 shadow-md"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Icon size={16} />
                {label}
              </span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'profile' ? (
            <motion.div
              key="profile-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="rounded-3xl border border-stone-200/80 dark:border-stone-800/80 bg-white/90 dark:bg-stone-900/90 backdrop-blur-xl shadow-lg overflow-hidden"
            >
              <div className="p-6 space-y-0 divide-y divide-stone-100 dark:divide-stone-800">
                {[
                  { label: 'Full Name', value: profile?.displayName, icon: User },
                  { label: 'Email Address', value: profile?.email || user?.email || '—', icon: Mail },
                  { label: 'Phone Number', value: profile?.phone || user?.phoneNumber || '—', icon: Phone },
                  { label: 'House / Flat', value: profile?.address?.house || '—', icon: MapPin },
                  { label: 'Street', value: profile?.address?.street || '—', icon: MapPin },
                  { label: 'Nearby', value: profile?.address?.nearby || '—', icon: MapPin },
                  { label: 'City / Village', value: profile?.address?.cityVillage || '—', icon: MapPin },
                  { label: 'District', value: profile?.address?.district || '—', icon: MapPin },
                  { label: 'State', value: profile?.address?.state || '—', icon: MapPin },
                  { label: 'Country', value: profile?.address?.country || '—', icon: MapPin },
                  { label: 'Postal Code', value: profile?.address?.postalCode || '—', icon: MapPin },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/20">
                      <Icon size={16} className="text-red-800 dark:text-red-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">{label}</p>
                      <p className="mt-0.5 text-sm font-semibold text-stone-800 dark:text-stone-200 truncate">{value || '—'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="orders-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              {orders.length === 0 ? (
                <div className="rounded-3xl border border-stone-200/80 dark:border-stone-800/80 bg-white/90 dark:bg-stone-900/90 p-16 text-center">
                  <ShoppingBag size={48} className="mx-auto mb-4 text-stone-300 dark:text-stone-600" />
                  <h3 className="text-lg font-bold text-stone-600 dark:text-stone-400">No orders yet</h3>
                  <p className="mt-2 text-sm text-stone-400 dark:text-stone-500">
                    Your order history will appear here once you make a purchase.
                  </p>
                  <button
                    onClick={() => navigate('/masalas')}
                    className="mt-6 rounded-xl bg-gradient-to-r from-red-800 to-red-900 px-6 py-2.5 text-sm font-bold text-white hover:shadow-md transition-all"
                  >
                    Shop Spices
                  </button>
                </div>
              ) : (
                orders.map((order, i) => {
                  const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending_payment;
                  const StatusIcon = status.icon;
                  return (
                    <motion.div
                      key={order.orderId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="rounded-2xl border border-stone-200/80 dark:border-stone-800/80 bg-white/90 dark:bg-stone-900/90 p-5 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-mono text-sm font-bold text-stone-800 dark:text-stone-200">
                              {order.orderId}
                              {order.paymentMethod === 'whatsapp' && (
                                <span className="ml-2 text-[10px] uppercase font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded align-middle">
                                  via WhatsApp
                                </span>
                              )}
                            </p>
                            <span className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${status.color}`}>
                              <StatusIcon size={11} />
                              {status.label}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-stone-400 dark:text-stone-500">
                            {new Date(order.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric', month: 'short', year: 'numeric'
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black text-stone-900 dark:text-white">
                            ₹{order.totalAmount.toFixed(2)}
                          </p>
                          <p className="text-xs text-stone-400 capitalize">{order.shippingMethod} shipping</p>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-stone-100 dark:border-stone-800">
                        <p className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-2">
                          {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {order.items.map((item, j) => {
                            const displayName =
                              item.productName ||
                              productNameById.get(item.productId) ||
                              'Unknown Product';
                            return (
                              <span
                                key={j}
                                className="rounded-lg bg-stone-100 dark:bg-stone-800 px-2.5 py-1 text-xs font-medium text-stone-600 dark:text-stone-400"
                              >
                                {displayName} × {item.quantity} ({item.weightId})
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
