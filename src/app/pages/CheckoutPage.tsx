import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useStoreConfig } from '../context/StoreConfigContext';
import { toast } from 'sonner';
import { showErrorToast, handleNetworkError } from '../utils/errorHandler';
import { motion, AnimatePresence } from 'motion/react';
import { resolveCatalogImage } from '../context/ProductCatalogContext';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function calculateDistanceInKm(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number }
) {
  const earthRadiusKm = 6371;
  const deltaLatitude = toRadians(to.latitude - from.latitude);
  const deltaLongitude = toRadians(to.longitude - from.longitude);
  const a =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(toRadians(from.latitude)) *
    Math.cos(toRadians(to.latitude)) *
    Math.sin(deltaLongitude / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function CheckoutPage() {
  const { items, setIsCartOpen, updateQuantity, clearCart } = useCart();
  const { user, loading } = useAuth();
  const { config } = useStoreConfig();
  const navigate = useNavigate();

  const [customerInfo, setCustomerInfo] = useState({
    firstName: '',
    surname: '',
    phone: '',
    house: '',
    street: '',
    nearby: '',
    cityVillage: '',
    district: '',
    state: '',
    country: 'India',
    postalCode: '',
  });

  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'whatsapp'>('whatsapp');
  const [upiId, setUpiId] = useState('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  const [paymentState, setPaymentState] = useState<'idle' | 'awaiting_payment' | 'failed' | 'awaiting_whatsapp'>('idle');
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [whatsappVerificationCode, setWhatsappVerificationCode] = useState('');
  const [enteredVerificationCode, setEnteredVerificationCode] = useState('');
  const [whatsappLink, setWhatsappLink] = useState('');
  const [finalTotalToPay, setFinalTotalToPay] = useState(0);
  const [paymentTimeLeft, setPaymentTimeLeft] = useState(900);
  const [userCoordinates, setUserCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    if (!config.upiPayment && paymentMethod === 'upi') {
      setPaymentMethod('whatsapp');
    }
  }, [config.upiPayment, paymentMethod]);

  useEffect(() => {
    let timerId: ReturnType<typeof setInterval>;
    if (paymentState === 'awaiting_payment' && paymentTimeLeft > 0) {
      timerId = setInterval(() => {
        setPaymentTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (paymentState === 'awaiting_payment' && paymentTimeLeft <= 0) {
      setPaymentState('failed');
    }
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [paymentState, paymentTimeLeft]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login', { state: { from: { pathname: '/checkout' } } });
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => {
        setUserCoordinates(null);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60 * 1000 }
    );
  }, []);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || ''}/api/users/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const profile = data.user;
          setCustomerInfo(prev => ({
            ...prev,
            firstName: profile.displayName ? profile.displayName.split(' ')[0] : prev.firstName,
            surname: profile.displayName ? profile.displayName.split(' ').slice(1).join(' ') : prev.surname,
            phone: profile.phone || prev.phone,
            house: profile.address?.house || prev.house,
            street: profile.address?.street || prev.street,
            nearby: profile.address?.nearby || prev.nearby,
            cityVillage: profile.address?.cityVillage || prev.cityVillage,
            district: profile.address?.district || prev.district,
            state: profile.address?.state || prev.state,
            country: profile.address?.country || prev.country,
            postalCode: profile.address?.postalCode || prev.postalCode,
          }));
        }
      } catch (err) {
        console.error('Failed to prefill profile', err);
      }
    };
    fetchUserProfile();
  }, [user]);

  const calculateItemTax = (item: any) => (item.weightPrice * ((item.taxPercent || 0) / 100));
  const calculateItemFinalPrice = (item: any) => item.weightPrice + calculateItemTax(item);

  const baseSubtotal = items.reduce((sum, item) => sum + item.weightPrice * item.quantity, 0);
  const taxTotal = items.reduce((sum, item) => sum + calculateItemTax(item) * item.quantity, 0);
  const productsTotal = baseSubtotal + taxTotal;
  const shouldTaxBeIncludedInSubtotal = items.length > 1;
  const subtotal = shouldTaxBeIncludedInSubtotal ? productsTotal : baseSubtotal;

  const hasStoreCoordinates =
    typeof config.storeLatitude === 'number' && typeof config.storeLongitude === 'number';

  const distanceFromStoreKm =
    userCoordinates && hasStoreCoordinates
      ? calculateDistanceInKm(userCoordinates, {
        latitude: config.storeLatitude as number,
        longitude: config.storeLongitude as number,
      })
      : null;

  const shippingCost =
    distanceFromStoreKm !== null && distanceFromStoreKm <= config.freeShippingRadiusKm
      ? 0
      : config.outsideRadiusShippingCharge;

  const totalAmount = productsTotal + shippingCost;

  const validateForm = (): boolean => {
    if (!customerInfo.firstName.trim()) { showErrorToast('Missing Field', 'Please enter your first name'); return false; }
    if (!customerInfo.surname.trim()) { showErrorToast('Missing Field', 'Please enter your surname'); return false; }
    if (!customerInfo.phone.trim() || customerInfo.phone.length < 10) { showErrorToast('Invalid Phone', 'Please enter a valid 10-digit mobile number'); return false; }
    if (!customerInfo.house.trim()) { showErrorToast('Missing Field', 'Please enter your house number'); return false; }
    if (!customerInfo.street.trim()) { showErrorToast('Missing Field', 'Please enter your street name'); return false; }
    if (!customerInfo.cityVillage.trim()) { showErrorToast('Missing Field', 'Please enter your city/village'); return false; }
    if (!customerInfo.district.trim()) { showErrorToast('Missing Field', 'Please enter your district'); return false; }
    if (!customerInfo.state.trim()) { showErrorToast('Missing Field', 'Please enter your state'); return false; }
    if (!customerInfo.country.trim()) { showErrorToast('Missing Field', 'Please enter your country'); return false; }
    if (!customerInfo.postalCode.trim()) { showErrorToast('Missing Field', 'Please enter your zipcode'); return false; }
    return true;
  };

  const performOrderPlacement = async () => {
    if (!user) return;
    setIsPlacingOrder(true);

    try {
      const token = await user.getIdToken();

      const orderPayload = {
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          weightId: item.weightId,
          quantity: item.quantity,
          weightPrice: item.weightPrice,
          taxPercent: item.taxPercent || 0
        })),
        shippingAddress: {
          fullName: `${customerInfo.firstName} ${customerInfo.surname}`.trim(),
          house: customerInfo.house,
          street: customerInfo.street,
          nearby: customerInfo.nearby,
          cityVillage: customerInfo.cityVillage,
          district: customerInfo.district,
          state: customerInfo.state,
          country: customerInfo.country,
          postalCode: customerInfo.postalCode,
          phone: customerInfo.phone
        },
        shippingMethod: 'standard',
        paymentMethod: paymentMethod,
        shippingCost,
      };

      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || ''}/api/orders/checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderPayload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to place order');
      }

      const orderResponseData = await res.json();
      setCreatedOrderId(orderResponseData.orderId);

      const genCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      setWhatsappVerificationCode(genCode);
      setFinalTotalToPay(totalAmount);

      // Auto-save this updated address to their Profile
      try {
        await fetch(`${import.meta.env.VITE_BACKEND_URL || ''}/api/users/me`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            phone: customerInfo.phone,
            address: {
              house: customerInfo.house,
              street: customerInfo.street,
              nearby: customerInfo.nearby,
              cityVillage: customerInfo.cityVillage,
              district: customerInfo.district,
              state: customerInfo.state,
              country: customerInfo.country,
              postalCode: customerInfo.postalCode
            }
          })
        });
      } catch (e) {
        console.error("Could not background update user profile", e);
      }

      // Always process WhatsApp messaging regardless of payment method
      const phoneNumber = config.whatsappNumber;
      let message = `Hey! I'm *${customerInfo.firstName} ${customerInfo.surname}* from *${customerInfo.cityVillage}*, and I have checked out your website *HMP Masala*. I would like to order some masalas I've mentioned below.\n\n`;
      message += `📝 *Order Details*\n`;
      message += `───────────────\n`;
      message += `🔖 *Order ID:* ${orderResponseData.orderId}\n`;
      message += `🔐 *Verification Code:* ${genCode}\n`;
      message += `───────────────\n`;
      message += `💰 *Total: ₹${totalAmount.toFixed(2)}*\n`;
      message += `💳 *Payment Method: ${paymentMethod === 'upi' ? 'UPI' : 'WhatsApp'}\n`;

      const encodedMessage = encodeURIComponent(message);
      setWhatsappLink(`https://wa.me/${phoneNumber}?text=${encodedMessage}`);

      if (paymentMethod === 'whatsapp') {
        setEnteredVerificationCode('');
        setPaymentState('awaiting_whatsapp');
      } else {
        // For UPI, assume successful immediately or handle separately
        clearCart();
        setOrderSuccess(true);
        setPaymentState('idle');
      }
    } catch (error: any) {
      handleNetworkError(error, 'Checkout');
      setPaymentState('idle');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleConfirmWhatsApp = () => {
    clearCart();
    setOrderSuccess(true);
    setPaymentState('idle');
  };

  const handleCancelWhatsApp = async () => {
    if (createdOrderId && user) {
      try {
        const token = await user.getIdToken();
        await fetch(`${import.meta.env.VITE_BACKEND_URL || ''}/api/orders/${createdOrderId}/cancel`, {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (e) {
        console.error("Failed to cancel order", e);
      }
    }
    setPaymentState('idle');
    toast.error('Order not placed. You canceled the WhatsApp confirmation.');
  };

  const handlePlaceOrderClick = () => {
    if (!validateForm()) return;
    if (!user) {
      showErrorToast('Login Required', 'You must be logged in to checkout');
      return;
    }

    if (paymentMethod === 'upi') {
      setPaymentState('awaiting_payment');
      setPaymentTimeLeft(900); // 15 minutes timer

      // Auto checkout simulate hook
      setTimeout(() => {
        performOrderPlacement();
      }, 15000);
    } else {
      performOrderPlacement();
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-red-800 border-t-transparent rounded-full animate-spin" />
          <span className="text-stone-500">Loading...</span>
        </div>
      </div>
    );
  }

  if (items.length === 0 && !orderSuccess) {
    return (
      <div className="pt-32 pb-24 px-8 text-center min-h-[calc(100vh-200px)] flex flex-col items-center justify-center">
        <span className="material-symbols-outlined text-7xl text-stone-300 mb-4" style={{ fontSize: '80px' }}>shopping_cart</span>
        <h2 className="text-2xl font-bold mb-2 font-['Manrope'] text-stone-900">Your cart is empty</h2>
        <p className="text-stone-500 mb-6">Add some spices to your cart before checking out.</p>
        <button onClick={() => navigate('/masalas')} className="bg-red-800 text-white px-8 py-3 rounded-lg font-bold hover:bg-red-700 transition-colors">
          Shop Now
        </button>
      </div>
    );
  }

  // Awaiting WhatsApp confirmation screen
  if (paymentState === 'awaiting_whatsapp') {
    return (
      <div className="pt-32 pb-24 px-8 text-center min-h-[calc(100vh-200px)] flex flex-col items-center justify-center">
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 10 }}
          className="text-8xl mb-6 flex items-center justify-center"
        >
          💬
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-3xl font-bold mb-3 font-['Manrope'] text-stone-900"
        >
          Did you send the message?
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-stone-500 mb-6 max-w-md mx-auto leading-relaxed"
        >
          Click the button below to send your order details via WhatsApp. The message will contain a 6-character Verification Code. Return here and enter it to verify.
        </motion.p>
        <motion.a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          className="bg-[#25D366] text-white px-8 py-4 mb-6 rounded-lg font-bold hover:bg-[#128C7E] transition-colors shadow-lg flex items-center justify-center gap-2"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          Send Order on WhatsApp
        </motion.a>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-8 w-full max-w-xs"
        >
          <input
            type="text"
            placeholder="Enter 6-char Code"
            maxLength={6}
            value={enteredVerificationCode}
            onChange={(e) => setEnteredVerificationCode(e.target.value.toUpperCase())}
            className="w-full px-4 py-3 text-center text-xl tracking-widest uppercase font-mono rounded-xl border border-stone-300 focus:border-red-800 focus:ring-2 focus:ring-red-800/20 bg-stone-50 text-stone-900 transition-all outline-none"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <button
            onClick={handleCancelWhatsApp}
            className="bg-stone-100 text-stone-600 px-8 py-3 rounded-lg font-bold hover:bg-stone-200 transition-colors shadow-sm order-2 sm:order-1"
          >
            No, Cancel Order
          </button>
          <button
            onClick={handleConfirmWhatsApp}
            disabled={enteredVerificationCode !== whatsappVerificationCode || whatsappVerificationCode === ''}
            className={`px-8 py-3 rounded-lg font-bold transition-colors shadow-lg order-1 sm:order-2 ${enteredVerificationCode === whatsappVerificationCode && whatsappVerificationCode !== '' ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-stone-200 text-stone-400 cursor-not-allowed'}`}
          >
            Verify & Place Order
          </button>
        </motion.div>
      </div>
    );
  }

  // Failed payment screen
  if (paymentState === 'failed') {
    return (
      <div className="pt-32 pb-24 px-8 text-center min-h-[calc(100vh-200px)] flex flex-col items-center justify-center">
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 10 }}
          className="text-8xl mb-6 flex items-center justify-center"
        >
          🧐
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-3xl font-bold mb-3 font-['Manrope'] text-stone-900"
        >
          Payment Unsuccessful
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-stone-500 mb-8 max-w-md mx-auto leading-relaxed"
        >
          We didn't receive your payment! It seems you ran out of time or cancelled the payment process. Don't worry, you can always try again.
        </motion.p>
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={() => setPaymentState('idle')}
          className="bg-red-800 text-white px-8 py-3 rounded-lg font-bold hover:bg-red-700 transition-colors shadow-lg"
        >
          Retry Payment
        </motion.button>
      </div>
    );
  }

  // Awaiting Payment screen (15 mins timer)
  if (paymentState === 'awaiting_payment') {
    return (
      <div className="pt-24 pb-16 px-4 sm:px-6 max-w-4xl mx-auto min-h-[calc(100vh-200px)] flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 md:p-10 rounded-3xl shadow-2xl border border-stone-200 w-full"
        >
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold font-['Manrope'] mb-3 text-stone-900">Complete Your Payment</h2>
            <p className="text-stone-500 max-w-md mx-auto">
              Scan the QR code with any UPI app, or select your preferred payment method below to complete the secure transaction.
            </p>
          </div>

          {/* Timer Section */}
          <div className="flex justify-center mb-10">
            <div className="bg-red-50 text-red-800 px-6 py-3 rounded-2xl border border-red-800/10 flex items-center gap-3">
              <span className="material-symbols-outlined animate-pulse">timer</span>
              <div className="text-3xl font-mono font-black tracking-widest">
                {Math.floor(paymentTimeLeft / 60)}:{(paymentTimeLeft % 60).toString().padStart(2, '0')}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 mb-10 items-center">
            {/* Left QR Side */}
            <div className="flex flex-col items-center justify-center p-8 bg-stone-50 rounded-2xl border border-stone-200 shadow-inner">
              <div className="w-56 h-56 bg-white p-3 border-2 border-red-800/20 rounded-xl flex items-center justify-center mb-4 relative overflow-hidden group">
                <span className="material-symbols-outlined text-stone-300" style={{ fontSize: '150px' }}>qr_code_2</span>
                <div className="absolute inset-0 bg-red-800/5 rotate-45 scale-150 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              </div>
              <p className="font-extrabold text-2xl text-stone-900 mb-1">₹{totalAmount.toFixed(2)}</p>
              <p className="text-sm font-medium text-stone-500 uppercase tracking-widest">SCAN TO PAY</p>
            </div>

            {/* Right Buttons Side */}
            <div className="flex flex-col gap-4">
              <h3 className="font-bold text-stone-900 mb-2">Popular UPI Apps</h3>

              <button onClick={performOrderPlacement} className="flex items-center gap-4 w-full p-4 border-2 border-[#00B9F1] text-[#00B9F1] rounded-xl font-bold hover:bg-[#00B9F1]/10 transition-all hover:-translate-y-1">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.91 14.814l-1.026 3.195H9.606l2.128-6.602h2.247l1.458 4.54a5.35 5.35 0 0 1-1.025-1.135h-1.503z" />
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                  <text x="12" y="16" fontSize="10" textAnchor="middle" fontWeight="bold">Pay</text>
                </svg>
                Pay via Paytm
              </button>

              <button onClick={performOrderPlacement} className="flex items-center gap-4 w-full p-4 border-2 border-[#5F259F] text-[#5F259F] rounded-xl font-bold hover:bg-[#5F259F]/10 transition-all hover:-translate-y-1">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15.42 12.38" />
                  <rect x="2" y="2" width="20" height="20" rx="4" stroke="currentColor" strokeWidth="2" fill="none" />
                  <text x="12" y="16" fontSize="10" textAnchor="middle" fontWeight="bold">Pe</text>
                </svg>
                Pay via PhonePe
              </button>

              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-stone-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-stone-400 font-medium tracking-wide">OR ENTER ID</span>
                </div>
              </div>

              <input
                type="text"
                placeholder="e.g. name@bank or 9876543210@upi"
                className="w-full p-4 rounded-xl border border-stone-300 focus:border-red-800 focus:ring-2 focus:ring-red-800/20 outline-none text-center font-medium bg-stone-50"
              />
            </div>
          </div>

          <div className="flex flex-col items-center justify-center border-t border-stone-100 pt-8 mt-4">
            {isPlacingOrder ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-red-800 border-t-transparent rounded-full animate-spin" />
                <p className="font-bold text-red-800 animate-pulse">Processing Payment...</p>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-stone-500">
                <div className="w-5 h-5 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
                <p className="font-medium animate-pulse">Loading secure checkout confirmation... you will be redirected shortly.</p>
              </div>
            )}
            <button onClick={() => setPaymentState('idle')} className="mt-6 px-6 py-2 text-sm text-stone-400 hover:text-stone-800 underline transition-colors">Cancel Checkout</button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Order success screen
  if (orderSuccess) {
    return (
      <div className="pt-32 pb-24 px-8 text-center min-h-[calc(100vh-200px)] flex flex-col items-center justify-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 15 }}
          className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mb-6 text-green-600"
        >
          <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-bold mb-3 font-['Manrope'] text-stone-900"
        >
          Order Placed Successfully!
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-stone-500 mb-2 max-w-md"
        >
          {paymentMethod === 'whatsapp'
            ? 'Your order has been sent via WhatsApp. Our team will confirm your order shortly.'
            : 'Your order has been placed. You will receive a UPI payment request shortly.'}
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-2xl font-extrabold text-red-800 mb-8"
        >
          Total: ₹{finalTotalToPay.toFixed(2)}
        </motion.p>
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          onClick={() => {
            setIsCartOpen(false);
            navigate('/');
          }}
          className="bg-red-800 text-white px-8 py-3 rounded-lg font-bold hover:bg-red-700 transition-colors"
        >
          Back to Home
        </motion.button>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-16 px-4 sm:px-6 max-w-7xl mx-auto min-h-[calc(100vh-200px)]">
      {/* Page Header */}
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-red-800 mb-2 font-['Manrope']">
          Checkout
        </h1>
        <p className="text-stone-500 font-['Public_Sans']">
          Fill in your details and choose a payment method to complete your order.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* ─── LEFT COLUMN: Forms ─── */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-8">

          {/* Section 1: Customer Information */}
          <section className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-stone-200">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2.5 font-['Manrope'] text-stone-900">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-red-800 text-white text-sm font-bold">1</span>
              Customer Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-stone-600">First Name <span className="text-red-500">*</span></label>
                <input
                  id="checkout-first-name"
                  type="text"
                  value={customerInfo.firstName}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, firstName: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-red-800 focus:ring-2 focus:ring-red-800/20 bg-stone-50 text-stone-900 transition-all outline-none"
                  placeholder="Enter first name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-stone-600">Surname <span className="text-red-500">*</span></label>
                <input
                  id="checkout-surname"
                  type="text"
                  value={customerInfo.surname}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, surname: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-red-800 focus:ring-2 focus:ring-red-800/20 bg-stone-50 text-stone-900 transition-all outline-none"
                  placeholder="Enter surname"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1.5 text-stone-600">Mobile Number <span className="text-red-500">*</span></label>
                <div className="flex">
                  <span className="inline-flex items-center px-4 rounded-l-xl border border-r-0 border-stone-300 bg-stone-100 text-stone-600 text-sm font-medium">
                    +91
                  </span>
                  <input
                    id="checkout-phone"
                    type="tel"
                    maxLength={10}
                    value={customerInfo.phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setCustomerInfo({ ...customerInfo, phone: val });
                    }}
                    className="w-full px-4 py-3 rounded-r-xl border border-stone-300 focus:border-red-800 focus:ring-2 focus:ring-red-800/20 bg-stone-50 text-stone-900 transition-all outline-none"
                    placeholder="9876543210"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Delivery Address */}
          <section className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-stone-200">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2.5 font-['Manrope'] text-stone-900">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-red-800 text-white text-sm font-bold">2</span>
              Delivery Address
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-stone-600">House / Flat *</label>
                <input
                  id="checkout-house"
                  type="text"
                  value={customerInfo.house}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, house: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-red-800 focus:ring-2 focus:ring-red-800/20 bg-stone-50 text-stone-900 transition-all outline-none"
                  placeholder="House No. / Flat"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-stone-600">Street *</label>
                <input
                  id="checkout-street"
                  type="text"
                  value={customerInfo.street}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, street: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-red-800 focus:ring-2 focus:ring-red-800/20 bg-stone-50 text-stone-900 transition-all outline-none"
                  placeholder="Street / Society"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1.5 text-stone-600">Nearby (Optional)</label>
                <input
                  id="checkout-nearby"
                  type="text"
                  value={customerInfo.nearby}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, nearby: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-red-800 focus:ring-2 focus:ring-red-800/20 bg-stone-50 text-stone-900 transition-all outline-none"
                  placeholder="Famous Landmark / Building"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-stone-600">City / Village *</label>
                <input
                  id="checkout-city"
                  type="text"
                  value={customerInfo.cityVillage}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, cityVillage: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-red-800 focus:ring-2 focus:ring-red-800/20 bg-stone-50 text-stone-900 transition-all outline-none"
                  placeholder="City or Village"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-stone-600">District *</label>
                <input
                  id="checkout-district"
                  type="text"
                  value={customerInfo.district}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, district: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-red-800 focus:ring-2 focus:ring-red-800/20 bg-stone-50 text-stone-900 transition-all outline-none"
                  placeholder="District"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:col-span-2">
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-stone-600">State *</label>
                  <input
                    id="checkout-state"
                    type="text"
                    value={customerInfo.state}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, state: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-red-800 focus:ring-2 focus:ring-red-800/20 bg-stone-50 text-stone-900 transition-all outline-none"
                    placeholder="State"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-stone-600">Country *</label>
                  <input
                    id="checkout-country"
                    type="text"
                    value={customerInfo.country}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, country: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-red-800 focus:ring-2 focus:ring-red-800/20 bg-stone-50 text-stone-900 transition-all outline-none"
                    placeholder="Country"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-stone-600">Zipcode *</label>
                  <input
                    id="checkout-postal"
                    type="text"
                    maxLength={6}
                    value={customerInfo.postalCode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setCustomerInfo({ ...customerInfo, postalCode: val });
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-red-800 focus:ring-2 focus:ring-red-800/20 bg-stone-50 text-stone-900 transition-all outline-none"
                    placeholder="000000"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Payment Method */}
          <section className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-stone-200">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2.5 font-['Manrope'] text-stone-900">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-red-800 text-white text-sm font-bold">3</span>
              Payment Method
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* UPI Payment Option */}
              {config.upiPayment && (
                <label
                  className={`relative flex flex-col p-5 cursor-pointer rounded-xl border-2 transition-all duration-200 ${paymentMethod === 'upi'
                    ? 'border-red-800 bg-red-50/60 shadow-md shadow-red-800/5'
                    : 'border-stone-200 bg-stone-50 hover:border-stone-300'
                    }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <input
                      type="radio"
                      name="payment"
                      value="upi"
                      checked={paymentMethod === 'upi'}
                      onChange={() => setPaymentMethod('upi')}
                      className="h-4 w-4 text-red-800 border-stone-300 focus:ring-red-800"
                    />
                    <svg className="w-6 h-6 text-red-800 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <span className="font-bold text-stone-900 w-full">UPI Payment</span>
                  </div>
                  <p className="text-xs text-stone-500 ml-7 mt-1">Pay securely using any UPI app — Google Pay, PhonePe, Paytm, etc.</p>
                  {paymentMethod === 'upi' && (
                    <div className="absolute top-3 right-3 bg-white rounded-full shadow-sm">
                      <svg className="w-5 h-5 text-red-800 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </label>
              )}

              {/* WhatsApp Checkout Option */}
              <label
                className={`relative flex flex-col p-5 cursor-pointer rounded-xl border-2 transition-all duration-200 ${paymentMethod === 'whatsapp'
                  ? 'border-green-600 bg-green-50/60 shadow-md shadow-green-600/5'
                  : 'border-stone-200 bg-stone-50 hover:border-stone-300'
                  }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <input
                    type="radio"
                    name="payment"
                    value="whatsapp"
                    checked={paymentMethod === 'whatsapp'}
                    onChange={() => setPaymentMethod('whatsapp')}
                    className="h-4 w-4 text-green-600 border-stone-300 focus:ring-green-600"
                  />
                  <svg className="w-6 h-6 text-green-600 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  <span className="font-bold text-stone-900 w-full">WhatsApp</span>
                </div>
                <p className="text-xs text-stone-500 ml-7 mt-1">Place your order via WhatsApp. We'll confirm and arrange payment.</p>
                {paymentMethod === 'whatsapp' && (
                  <div className="absolute top-3 right-3 bg-white rounded-full shadow-sm">
                    <svg className="w-5 h-5 text-green-600 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </label>
            </div>

            {/* UPI Details (conditionally shown) */}
            <AnimatePresence>
              {config.upiPayment && paymentMethod === 'upi' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 p-5 bg-stone-50 rounded-xl border border-stone-200">
                    <p className="text-sm text-stone-600">
                      After clicking "Place Order", you will be securely redirected to our payment page where you can pay easily via:<br />
                      <span className="font-bold text-stone-800 mt-2 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-800"></span> Scan QR Code</span>
                      <span className="font-bold text-stone-800 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-800"></span> Paytm</span>
                      <span className="font-bold text-stone-800 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-800"></span> PhonePe</span>
                      <span className="font-bold text-stone-800 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-800"></span> Other UPI ID Manually</span>
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </div>

        {/* ─── RIGHT COLUMN: Order Summary ─── */}
        <div className="lg:col-span-5 xl:col-span-4">
          <div className="sticky top-24 space-y-6">
            <div className="bg-white rounded-2xl shadow-lg border border-stone-200 overflow-hidden">
              {/* Header */}
              <div className="p-6 border-b border-stone-200 bg-stone-50/70">
                <h3 className="text-xl font-bold font-['Manrope'] text-stone-900">Order Summary</h3>
              </div>

              {/* Item List */}
              <div className="p-5 space-y-4 max-h-[320px] overflow-y-auto">
                {items.map((item) => (
                  <div key={item.cartId} className="flex gap-3.5 mt-2 mb-2">
                    <div className="w-14 h-14 rounded-lg bg-stone-100 flex-shrink-0 overflow-hidden mt-1">
                      <ImageWithFallback alt={item.name} className="w-full h-full object-cover" src={resolveCatalogImage(item.image)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold truncate text-stone-900 font-['Manrope']">
                        {item.name}
                        {item.taxPercent && item.taxPercent > 0 ? (
                          <span className="block text-[10px] text-stone-400 font-normal mt-0.5">Includes {item.taxPercent}% Tax</span>
                        ) : null}
                      </h4>
                      <p className="text-xs text-stone-500 mt-0.5">{item.weightId}</p>

                      <div className="flex items-center gap-2 mt-2 w-max bg-white px-2 py-1 rounded-md border border-stone-200 shadow-sm">
                        <button
                          onClick={() => updateQuantity(item.cartId, item.quantity - 1)}
                          className="h-6 w-6 rounded border border-stone-200 text-sm font-bold text-stone-700 hover:bg-stone-100 transition-colors focus:outline-none"
                          aria-label={`Decrease quantity for ${item.name}`}
                        >
                          -
                        </button>
                        <span className="text-xs font-bold text-stone-800 min-w-4 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.cartId, item.quantity + 1)}
                          className="h-6 w-6 rounded border border-stone-200 text-sm font-bold text-stone-700 hover:bg-stone-100 transition-colors focus:outline-none"
                          aria-label={`Increase quantity for ${item.name}`}
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-stone-900 whitespace-nowrap mt-1">₹{(calculateItemFinalPrice(item) * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="p-5 bg-stone-50/70 space-y-3 border-t border-stone-200">
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">Subtotal ({items.length} items)</span>
                  <span className="font-medium text-stone-900">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">
                    Tax {shouldTaxBeIncludedInSubtotal ? '(included in subtotal)' : ''}
                  </span>
                  <span className="font-medium text-stone-900">₹{taxTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">Shipping</span>
                  <span className={`font-bold ${shippingCost === 0 ? 'text-green-600' : 'text-stone-900'}`}>
                    {shippingCost === 0 ? 'FREE' : `₹${shippingCost.toFixed(2)}`}
                  </span>
                </div>
                {distanceFromStoreKm !== null && (
                  <p className="text-[11px] text-stone-400">
                    Distance from store: {distanceFromStoreKm.toFixed(1)} km (free within {config.freeShippingRadiusKm} km)
                  </p>
                )}
                <div className="pt-3 border-t border-stone-200 flex justify-between items-end">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-stone-500 font-bold mb-0.5">Total Amount</p>
                    <p className="text-2xl font-extrabold text-red-800">₹{totalAmount.toFixed(2)}</p>
                  </div>
                  <p className="text-[10px] text-stone-400 italic">Incl. GST</p>
                </div>

                {/* Payment Method Indicator */}
                <div className="flex items-center gap-2 pt-2 text-xs text-stone-500">
                  {paymentMethod === 'upi' ? (
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  )}
                  <span>Paying via {paymentMethod === 'upi' ? 'UPI' : 'WhatsApp'}</span>
                </div>

                {/* Place Order Button */}
                <button
                  id="checkout-place-order"
                  onClick={handlePlaceOrderClick}
                  disabled={isPlacingOrder}
                  className={`w-full mt-4 py-4 rounded-xl font-bold text-lg transition-all shadow-md active:scale-[0.98] transform flex items-center justify-center gap-2.5 ${paymentMethod === 'whatsapp'
                    ? 'bg-green-600 hover:bg-green-700 text-white shadow-green-600/20'
                    : 'bg-red-800 hover:bg-red-700 text-white shadow-red-800/20'
                    } ${isPlacingOrder ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isPlacingOrder ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : paymentMethod === 'whatsapp' ? (
                    <>
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                      Checkout via WhatsApp
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-xl">lock</span>
                      Place Order — ₹{totalAmount.toFixed(2)}
                    </>
                  )}
                </button>

                <p className="text-center text-[10px] text-stone-400 mt-3">
                  By placing your order, you agree to our Terms and Conditions.
                </p>
              </div>
            </div>

            {/* Secure Badge */}
            <div className="flex items-center justify-center gap-2 text-stone-400 text-xs">
              {/*<span className="material-symbols-outlined text-green-600 text-base">verified_user</span>*/}
              <span>Secure 256-bit SSL encrypted checkout</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
