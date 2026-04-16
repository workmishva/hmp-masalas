import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { showErrorToast, showSuccessToast } from '../utils/errorHandler';
import { useAuth } from '../context/AuthContext';
import { User, Phone, MapPin, Sparkles, ChevronRight, Mail } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

interface UserProfile {
  displayName: string;
  email: string;
  phone: string;
  onboardingCompleted?: boolean;
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

export default function OnboardingModal() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<Partial<UserProfile>>({});
  const [saving, setSaving] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(false);

  useEffect(() => {
    if (user && localStorage.getItem('signup_isNewUser') === 'true') {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    setLoadingConfig(true);
    try {
      const token = await user!.getIdToken();
      const res = await fetch(`${BACKEND_URL}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user.onboardingCompleted) {
          localStorage.removeItem('signup_isNewUser');
          setIsOpen(false);
          return;
        }
        setForm({
          displayName: data.user.displayName || user?.displayName || '',
          email: data.user.email || user?.email || '',
          phone: data.user.phone || user?.phoneNumber || '',
          address: data.user.address || {},
        });
      }
      setIsOpen(true);
    } catch (err) {
      console.error('Failed to load profile for onboarding', err);
    } finally {
      setLoadingConfig(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = await user!.getIdToken();
      const res = await fetch(`${BACKEND_URL}/api/users/me`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...form,
          onboardingCompleted: true,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({})) as any;
        throw new Error(errData.error || 'Failed to update profile');
      }

      showSuccessToast('Welcome Aboard!', 'Your profile has been completed.');
      closeModal();
    } catch (error: any) {
      showErrorToast('Save Failed', 'Failed to save your information. Please check your input and try again.');
    } finally {
      setSaving(false);
    }
  };

  const closeModal = () => {
    localStorage.removeItem('signup_isNewUser');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 pt-10 pb-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeModal}
          className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-2xl p-6 overflow-hidden max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="mb-6 text-center pt-4">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600">
              <Sparkles size={32} />
            </div>
            <h2 className="text-2xl font-black text-stone-900 dark:text-white">Welcome!</h2>
            <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
              Let's complete your profile so you can checkout faster next time.
            </p>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-500 mb-1.5 uppercase tracking-wider">Display Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  value={form.displayName || ''}
                  onChange={(e) => setForm(f => ({ ...f, displayName: e.target.value }))}
                  placeholder="Your Name"
                  className="w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 pl-10 pr-4 py-3 text-sm text-stone-900 dark:text-white focus:border-red-800 focus:ring-2 focus:ring-red-800/20 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-500 mb-1.5 uppercase tracking-wider">Phone</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="tel"
                  value={form.phone || ''}
                  onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="+91..."
                  className="w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 pl-10 pr-4 py-3 text-sm text-stone-900 dark:text-white focus:border-red-800 focus:ring-2 focus:ring-red-800/20 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-500 mb-1.5 uppercase tracking-wider">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="email"
                  value={form.email || ''}
                  onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="hello@example.com"
                  className="w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 pl-10 pr-4 py-3 text-sm text-stone-900 dark:text-white focus:border-red-800 focus:ring-2 focus:ring-red-800/20 outline-none transition-all"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
              <label className="block text-xs font-semibold text-stone-500 mb-3 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin size={14} /> Shipping Address
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(['house', 'street', 'nearby', 'cityVillage', 'district', 'state', 'country', 'postalCode'] as const).map(field => (
                  <input
                    key={field}
                    type="text"
                    value={(form.address as any)?.[field] || ''}
                    onChange={(e) => setForm(f => ({
                      ...f,
                      address: { ...(f.address || {}), [field]: e.target.value }
                    }))}
                    placeholder={field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')}
                    className="rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-3 py-2.5 text-sm text-stone-900 dark:text-white focus:border-red-800 focus:ring-2 focus:ring-red-800/20 outline-none transition-all"
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <button
              onClick={closeModal}
              className="flex-1 rounded-xl bg-stone-100 dark:bg-stone-800 px-4 py-3 text-sm font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-all"
            >
              I'll do it later
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-800 to-red-900 px-4 py-3 text-sm font-bold text-white hover:shadow-lg hover:shadow-red-900/20 transition-all disabled:opacity-50"
            >
              {saving ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>Save Profile <ChevronRight size={16} /></>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
