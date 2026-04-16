import React from 'react';
import { useNavigate } from 'react-router';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function CartPage() {
  const { items, removeFromCart, updateQuantity } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.weightPrice, 0);
  const tax = subtotal * 0.05; // Assuming 5% tax based on demo HTML (1100 -> 55)
  const totalAmount = subtotal + tax;

  const handleCheckout = () => {
    if (user) {
      navigate('/checkout');
    } else {
      navigate('/login', { state: { from: { pathname: '/checkout' } } });
    }
  };

  return (
    <div className="pt-32 pb-24 px-8 max-w-screen-2xl mx-auto min-h-[calc(100vh-200px)]">
      <header className="mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight text-red-800 dark:text-red-500 mb-2 font-['Manrope']">Your Heritage Selection</h1>
        <p className="text-stone-600 dark:text-stone-400 font-['Public_Sans']">Review your artisanal masalas before finalizing your journey into flavor.</p>
      </header>

      {items.length === 0 ? (
        <div className="text-center py-24 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm">
          <span className="material-symbols-outlined text-6xl text-stone-300 dark:text-stone-700 mb-4 block">shopping_cart</span>
          <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100 font-['Manrope'] mb-2">Your cart is empty</h2>
          <p className="text-stone-500 mb-6">Explore our selection of heritage spices to find your perfect blend.</p>
          <button 
            onClick={() => navigate('/masalas')}
            className="bg-red-800 text-white px-8 py-3 rounded-lg font-bold hover:bg-red-700 transition-colors inline-flex items-center gap-2"
          >
            <span className="material-symbols-outlined">explore</span>
            Shop Masalas
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          {/* Shopping Cart Table Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="overflow-x-auto bg-white dark:bg-stone-900 rounded-xl shadow-sm border border-stone-200 dark:border-stone-800">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-stone-50/50 dark:bg-stone-950/50 border-b border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 text-sm font-semibold uppercase tracking-wider">
                    <th className="px-8 py-6 rounded-tl-xl">Product</th>
                    <th className="px-6 py-6 text-center">Quantity</th>
                    <th className="px-6 py-6 text-right">Price</th>
                    <th className="px-8 py-6 text-right rounded-tr-xl">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                  {items.map((item) => (
                    <tr key={item.cartId} className="group hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors">
                      <td className="px-8 py-8">
                        <div className="flex items-center gap-6">
                          <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-stone-100 dark:bg-stone-800">
                            <img alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" src={item.image} />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-stone-900 dark:text-stone-100 mb-1 font-['Manrope']">{item.name}</h3>
                            <p className="text-sm text-stone-500 dark:text-stone-400 mb-3">{item.weightId}</p>
                            <button 
                              onClick={() => removeFromCart(item.cartId)}
                              className="flex items-center text-xs font-semibold text-red-600 dark:text-red-400 hover:underline transition-all"
                            >
                              <span className="material-symbols-outlined text-sm mr-1">delete</span>
                              Remove
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-8">
                        <div className="flex items-center justify-center">
                          <div className="flex items-center border border-stone-200 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-900 overflow-hidden">
                            <button 
                              onClick={() => updateQuantity(item.cartId, item.quantity - 1)}
                              className="p-2 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-500 transition-colors"
                            >
                              <span className="material-symbols-outlined text-sm">remove</span>
                            </button>
                            <span className="px-4 font-bold text-stone-900 dark:text-stone-100">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.cartId, item.quantity + 1)}
                              className="p-2 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-500 transition-colors"
                            >
                              <span className="material-symbols-outlined text-sm">add</span>
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-8 text-right font-medium text-stone-600 dark:text-stone-400">
                        ₹{item.weightPrice.toFixed(2)}
                      </td>
                      <td className="px-8 py-8 text-right font-bold text-stone-900 dark:text-stone-100">
                        ₹{(item.weightPrice * item.quantity).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-6 py-4">
              <button 
                onClick={() => navigate('/masalas')}
                className="flex items-center text-red-800 dark:text-red-500 font-bold hover:gap-3 transition-all"
              >
                <span className="material-symbols-outlined mr-2">arrow_back</span>
                Continue Sourcing Spices
              </button>
              <div className="flex items-center bg-stone-50 dark:bg-stone-900 p-2 rounded-lg border border-stone-200 dark:border-stone-800">
                <input className="bg-transparent border-none focus:ring-0 text-sm font-['Public_Sans'] px-4 w-40 text-stone-900 dark:text-white placeholder:text-stone-400" placeholder="Promo code" type="text" />
                <button className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 px-4 py-2 rounded-md text-sm font-bold hover:bg-stone-800 dark:hover:bg-stone-100 transition-colors uppercase tracking-wider">Apply</button>
              </div>
            </div>
          </div>

          {/* Order Summary Section */}
          <aside className="sticky top-32">
            <div className="bg-stone-50/50 dark:bg-stone-900/50 p-8 rounded-xl shadow-sm border border-stone-200 dark:border-stone-800">
              <h2 className="text-2xl font-bold text-stone-900 dark:text-white mb-8 pb-4 border-b border-stone-200 dark:border-stone-700 font-['Manrope']">Order Summary</h2>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-stone-600 dark:text-stone-400">
                  <span className="font-['Public_Sans']">Subtotal ({items.length} items)</span>
                  <span className="font-bold text-stone-900 dark:text-white">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-stone-600 dark:text-stone-400">
                  <span className="font-['Public_Sans']">Shipping</span>
                  <span className="font-bold text-green-600 dark:text-green-400">FREE</span>
                </div>
                <div className="flex justify-between text-stone-600 dark:text-stone-400">
                  <span className="font-['Public_Sans']">Estimated Taxes (5%)</span>
                  <span className="font-bold text-stone-900 dark:text-white">₹{tax.toFixed(2)}</span>
                </div>
              </div>

              <div className="border-t border-stone-200 dark:border-stone-700 pt-6 mb-8">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-stone-500 font-bold mb-1">Total Amount</p>
                    <p className="text-3xl font-extrabold text-red-800 dark:text-red-500">₹{totalAmount.toFixed(2)}</p>
                  </div>
                  <p className="text-xs text-stone-500 italic font-['Public_Sans']">VAT Included</p>
                </div>
              </div>

              <button 
                onClick={handleCheckout}
                className="w-full bg-red-800 text-white py-5 rounded-lg font-bold text-lg shadow-md hover:bg-red-700 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                Proceed to Checkout
                <span className="material-symbols-outlined">lock</span>
              </button>

              <div className="mt-8 space-y-4">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-amber-600">verified</span>
                  <p className="text-xs text-stone-500 leading-tight">Authentic heritage spices sourced directly from farms with traditional grinding methods.</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-amber-600">local_shipping</span>
                  <p className="text-xs text-stone-500 leading-tight">Eco-friendly plastic-free packaging ensures maximum flavor preservation and environmental care.</p>
                </div>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="mt-6 flex justify-center gap-4 text-stone-400 dark:text-stone-600">
              <span className="material-symbols-outlined text-4xl">payments</span>
              <span className="material-symbols-outlined text-4xl">credit_card</span>
              <span className="material-symbols-outlined text-4xl">account_balance</span>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
