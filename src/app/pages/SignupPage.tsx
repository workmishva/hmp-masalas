import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Phone, ArrowRight, Sparkles, UserPlus, Lock, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { showErrorToast } from '../utils/errorHandler';

export default function SignupPage() {
  const { user, signupWithEmail, signInWithGoogle, sendPhoneOtp, setupRecaptcha } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [method, setMethod] = useState<'email' | 'phone'>('email');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [recaptchaReady, setRecaptchaReady] = useState(false);

  useEffect(() => {
    const from = location.state?.from?.pathname;
    if (user) navigate(from ? from : '/profile', { replace: true });
  }, [user, navigate, location]);

  useEffect(() => {
    if (method === 'phone' && !recaptchaReady) {
      const timer = setTimeout(() => {
        setupRecaptcha('signup-recaptcha-container');
        setRecaptchaReady(true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [method, setupRecaptcha, recaptchaReady]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || !email.trim() || !password.trim()) return;
    if (password.length < 6) {
      showErrorToast('Password Too Short', 'Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      localStorage.setItem('signup_displayName', displayName.trim());
      localStorage.setItem('signup_isNewUser', 'true');
      await signupWithEmail(email.trim(), password, displayName.trim());
      // onAuthStateChanged will trigger redirect
    } catch {
      // toast handled in context
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = phone.replace(/\D/g, '');
    if (!displayName.trim() || raw.length < 10) return;
    setLoading(true);
    try {
      localStorage.setItem('signup_displayName', displayName.trim());
      localStorage.setItem('signup_isNewUser', 'true');
      const formattedPhone = raw.startsWith('91') ? `+${raw}` : `+91${raw}`;
      await sendPhoneOtp(formattedPhone);
      navigate('/verify-otp', { state: { from: location.state?.from } });
    } catch {
      // toast handled in context
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    try {
      localStorage.setItem('signup_isNewUser', 'true');
      await signInWithGoogle();
    } catch {
      // toast handled in context
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20 relative overflow-hidden bg-stone-50 dark:bg-stone-950">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-amber-500/8 blur-3xl" />
        <div className="absolute -right-32 -bottom-32 h-96 w-96 rounded-full bg-red-800/8 blur-3xl" />
        <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-amber-600/5 blur-2xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="rounded-3xl border border-stone-200/80 dark:border-stone-800/80 bg-white/90 dark:bg-stone-900/90 backdrop-blur-xl shadow-2xl shadow-stone-900/5 dark:shadow-black/20 overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-10 pb-6 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 shadow-lg shadow-amber-600/25"
            >
              <UserPlus size={28} className="text-white" />
            </motion.div>
            <h1 className="text-2xl font-bold text-stone-900 dark:text-white">Create Account</h1>
            <p className="mt-2 text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
              Join Aromatic Heritage — create your account to get started.
            </p>
          </div>

          {/* Google Sign-In */}
          <div className="px-8">
            <button
              onClick={handleGoogleSignup}
              disabled={loading}
              className="group w-full flex items-center justify-center gap-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 py-3.5 text-sm font-semibold text-stone-700 dark:text-stone-200 shadow-sm hover:shadow-md hover:bg-stone-50 dark:hover:bg-stone-700 transition-all disabled:opacity-50"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                <path d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            {/* Divider */}
            <div className="flex items-center gap-4 my-5">
              <div className="flex-1 h-px bg-stone-200 dark:bg-stone-700" />
              <span className="text-xs font-medium text-stone-400 dark:text-stone-500 uppercase tracking-wider">or</span>
              <div className="flex-1 h-px bg-stone-200 dark:bg-stone-700" />
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="mx-8 flex rounded-2xl bg-stone-100 dark:bg-stone-800/80 p-1.5">
            {(['email', 'phone'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setMethod(tab)}
                className={`relative flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all duration-300 ${
                  method === tab
                    ? 'text-white'
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300'
                }`}
              >
                {method === tab && (
                  <motion.div
                    layoutId="signup-tab-bg"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 shadow-md shadow-amber-500/20"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  {tab === 'email' ? <Mail size={16} /> : <Phone size={16} />}
                  {tab === 'email' ? 'Email' : 'Phone'}
                </span>
              </button>
            ))}
          </div>

          {/* Forms */}
          <div className="px-8 py-6">
            {/* Full Name — always shown */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2">Full Name</label>
              <div className="relative">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/60 pl-11 pr-4 py-3.5 text-stone-900 dark:text-white placeholder:text-stone-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
                />
              </div>
            </div>

            <AnimatePresence mode="wait">
              {method === 'email' ? (
                <motion.form
                  key="email-signup"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.25 }}
                  onSubmit={handleEmailSubmit}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2">Email Address</label>
                    <div className="relative">
                      <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="hello@example.com"
                        className="w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/60 pl-11 pr-4 py-3.5 text-stone-900 dark:text-white placeholder:text-stone-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2">Password</label>
                    <div className="relative">
                      <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min. 6 characters"
                        className="w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/60 pl-11 pr-12 py-3.5 text-stone-900 dark:text-white placeholder:text-stone-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !displayName.trim() || !email.trim() || !password.trim()}
                    className="group w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-amber-500/20 hover:shadow-xl hover:shadow-amber-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    ) : (
                      <>
                        Create Account
                        <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </button>
                </motion.form>
              ) : (
                <motion.form
                  key="phone-signup"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  onSubmit={handlePhoneSubmit}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2">Phone Number</label>
                    <div className="relative flex">
                      <span className="flex items-center justify-center rounded-l-xl border border-r-0 border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 px-4 text-sm font-semibold text-stone-600 dark:text-stone-400">+91</span>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="98765 43210"
                        maxLength={10}
                        className="w-full rounded-r-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/60 px-4 py-3.5 text-stone-900 dark:text-white placeholder:text-stone-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div id="signup-recaptcha-container" className="w-full flex justify-center" />
                  <button
                    type="submit"
                    disabled={loading || !displayName.trim() || phone.replace(/\D/g, '').length < 10}
                    className="group w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-amber-500/20 hover:shadow-xl hover:shadow-amber-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    ) : (
                      <>
                        Create Account & Send OTP
                        <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </button>
                  <div className="flex items-start gap-2 text-xs text-stone-400 dark:text-stone-500">
                    <Sparkles size={14} className="mt-0.5 shrink-0 text-amber-500" />
                    <span>A 6-digit OTP will be sent via SMS to verify your number.</span>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="border-t border-stone-100 dark:border-stone-800 px-8 py-5 text-center">
            <p className="text-sm text-stone-500 dark:text-stone-400">
              Already have an account?{' '}
              <Link to="/login" state={{ from: location.state?.from }} className="font-semibold text-red-800 dark:text-red-400 hover:underline transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
