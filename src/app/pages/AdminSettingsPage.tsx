import React, { useState } from 'react';
import { useStoreConfig } from '../context/StoreConfigContext';
import { Save, Phone, MapPin, Truck, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { showErrorToast } from '../utils/errorHandler';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';

export default function AdminSettingsPage() {
  const { config, updateConfig } = useStoreConfig();
  const [whatsappNumber, setWhatsappNumber] = useState(config.whatsappNumber);
  const [storeLatitude, setStoreLatitude] = useState(config.storeLatitude?.toString() ?? '');
  const [storeLongitude, setStoreLongitude] = useState(config.storeLongitude?.toString() ?? '');
  const [freeShippingRadiusKm, setFreeShippingRadiusKm] = useState(config.freeShippingRadiusKm.toString());
  const [outsideRadiusShippingCharge, setOutsideRadiusShippingCharge] = useState(
    config.outsideRadiusShippingCharge.toString()
  );
  const [upiPayment, setUpiPayment] = useState(config.upiPayment);
  const [success, setSuccess] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedLatitude = storeLatitude.trim() === '' ? null : Number(storeLatitude);
    const parsedLongitude = storeLongitude.trim() === '' ? null : Number(storeLongitude);
    const parsedRadius = Number(freeShippingRadiusKm);
    const parsedOutsideCharge = Number(outsideRadiusShippingCharge);

    if (parsedLatitude !== null && Number.isNaN(parsedLatitude)) {
      showErrorToast('Invalid Latitude', 'Store latitude must be a valid number.');
      return;
    }
    if (parsedLongitude !== null && Number.isNaN(parsedLongitude)) {
      showErrorToast('Invalid Longitude', 'Store longitude must be a valid number.');
      return;
    }
    if (Number.isNaN(parsedRadius) || parsedRadius < 0) {
      showErrorToast('Invalid Radius', 'Free shipping radius must be 0 or more.');
      return;
    }
    if (Number.isNaN(parsedOutsideCharge) || parsedOutsideCharge < 0) {
      showErrorToast('Invalid Charge', 'Outside-radius shipping charge must be 0 or more.');
      return;
    }

    try {
      await updateConfig({
        whatsappNumber,
        storeLatitude: parsedLatitude,
        storeLongitude: parsedLongitude,
        freeShippingRadiusKm: parsedRadius,
        outsideRadiusShippingCharge: parsedOutsideCharge,
        upiPayment,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e: any) {
      showErrorToast('Error', e.message || 'Failed to update store settings');
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-foreground">Store Settings</h1>
        <p className="mt-2 text-muted-foreground">Manage your e-commerce platform configuration.</p>
      </div>

      <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm md:p-8">
        <h2 className="mb-6 text-xl font-bold flex items-center gap-2 text-foreground">
          <Phone className="text-secondary" /> Contact Details
        </h2>

        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-semibold text-foreground">
              WhatsApp Business Number
            </label>
            <p className="mb-4 text-xs text-muted-foreground">
              Enter your number with the country code (e.g. +91 98765 43210 for India). This number receives all checkout orders.
            </p>
            <input
              type="text"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              className="w-full max-w-md rounded-xl border border-input bg-background px-4 py-3 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
              placeholder="919999999999"
              required
            />
          </div>

          <div className="rounded-2xl border border-border bg-background p-4 sm:p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
              <MapPin size={16} className="text-secondary" /> Store Location (for distance shipping)
            </h3>
            <p className="mb-4 text-xs text-muted-foreground">
              Add store GPS coordinates. If customer is within free radius, shipping will be FREE.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-semibold text-foreground">Store Latitude</label>
                <input
                  type="text"
                  value={storeLatitude}
                  onChange={(e) => setStoreLatitude(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                  placeholder="e.g. 28.6139"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold text-foreground">Store Longitude</label>
                <input
                  type="text"
                  value={storeLongitude}
                  onChange={(e) => setStoreLongitude(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                  placeholder="e.g. 77.2090"
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-background p-4 sm:p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
              <Truck size={16} className="text-secondary" /> Shipping Rules
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-semibold text-foreground">Free Shipping Radius (km)</label>
                <input
                  type="number"
                  min={0}
                  step="0.1"
                  value={freeShippingRadiusKm}
                  onChange={(e) => setFreeShippingRadiusKm(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold text-foreground">Charge Beyond Radius (₹)</label>
                <input
                  type="number"
                  min={0}
                  step="1"
                  value={outsideRadiusShippingCharge}
                  onChange={(e) => setOutsideRadiusShippingCharge(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-background p-4 sm:p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
              <span className="text-secondary opacity-70 border border-secondary px-1 text-[10px] rounded leading-none py-1">UPI</span> Payment Features
            </h3>
            <p className="mb-4 text-xs text-muted-foreground">
              Toggle the UPI payment option visibility on the checkout page. Keep it off if you only want WhatsApp orders for now.
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setUpiPayment(!upiPayment)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  upiPayment ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    upiPayment ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="text-sm font-semibold text-foreground">
                {upiPayment ? 'UPI Checkout Enabled' : 'UPI Checkout Disabled'}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-background p-4 sm:p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
              {resolvedTheme === 'dark' ? <Moon size={16} className="text-secondary" /> : <Sun size={16} className="text-secondary" />} Appearance Settings
            </h3>
            <p className="mb-4 text-xs text-muted-foreground">
              Choose your preferred theme for the admin dashboard. (Automatically updates)
            </p>
            <div>
              {mounted && (
                <button
                  type="button"
                  onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                  className="relative inline-flex h-11 w-[102px] items-center rounded-full border border-border bg-muted p-1 shadow-sm transition-colors"
                >
                  <span
                    className={`absolute inset-y-1 left-1 w-[42px] rounded-full bg-card shadow transition-transform duration-300 ${resolvedTheme === 'dark' ? 'translate-x-[52px]' : 'translate-x-0'
                      }`}
                  />
                  <span className={`relative z-10 flex w-1/2 justify-center transition-colors ${resolvedTheme === 'dark' ? 'text-muted-foreground' : 'text-amber-500'}`}>
                    <Sun size={16} />
                  </span>
                  <span className={`relative z-10 flex w-1/2 justify-center transition-colors ${resolvedTheme === 'dark' ? 'text-foreground' : 'text-muted-foreground'}`}>
                    <Moon size={16} />
                  </span>
                </button>
              )}
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-background p-4 sm:p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
              <RotateCcw size={16} className="text-destructive" /> Data Management
            </h3>
            <p className="mb-4 text-xs text-muted-foreground">
              Clear previous dashboard metrics and chart values. New data will begin collecting from today.
            </p>
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Are you sure you want to reset dashboard data? This will clear all visible metrics and charts until new data arrives.')) {
                  localStorage.setItem('adminDashboardResetAt', new Date().toISOString());
                  toast.success('Dashboard data reset successfully.');
                }
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-destructive/10 px-4 py-2 text-sm font-bold text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground"
            >
              <RotateCcw size={16} />
              Reset Dashboard Data
            </button>
          </div>

          <div className="flex items-center gap-4 border-t border-border pt-6">
            <button
              type="submit"
              className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 active:scale-95"
            >
              <Save size={18} />
              Save Settings
            </button>
            {success && (
              <span className="text-sm font-bold text-green-600 animate-in fade-in zoom-in">
                Saved successfully!
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
