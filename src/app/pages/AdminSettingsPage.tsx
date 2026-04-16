import React, { useState } from 'react';
import { useStoreConfig } from '../context/StoreConfigContext';
import { Save, Phone, MapPin, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { showErrorToast } from '../utils/errorHandler';

export default function AdminSettingsPage() {
  const { config, updateConfig } = useStoreConfig();
  const [whatsappNumber, setWhatsappNumber] = useState(config.whatsappNumber);
  const [storeLatitude, setStoreLatitude] = useState(config.storeLatitude?.toString() ?? '');
  const [storeLongitude, setStoreLongitude] = useState(config.storeLongitude?.toString() ?? '');
  const [freeShippingRadiusKm, setFreeShippingRadiusKm] = useState(config.freeShippingRadiusKm.toString());
  const [outsideRadiusShippingCharge, setOutsideRadiusShippingCharge] = useState(
    config.outsideRadiusShippingCharge.toString()
  );
  const [success, setSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
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

    updateConfig({
      whatsappNumber,
      storeLatitude: parsedLatitude,
      storeLongitude: parsedLongitude,
      freeShippingRadiusKm: parsedRadius,
      outsideRadiusShippingCharge: parsedOutsideCharge,
    });
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
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
              Enter your number with the country code (e.g. 917984904156 for India). This number receives all checkout orders.
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
