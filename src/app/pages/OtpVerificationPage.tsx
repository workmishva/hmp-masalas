import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Mail, Phone, ArrowLeft, CheckCircle2, RefreshCw, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { showErrorToast } from '../utils/errorHandler';

const OTP_LENGTH = 6;

export default function OtpVerificationPage() {
  const { user, otpMethod, otpTarget, isOtpSent, isEmailLinkSignIn, verifyPhoneOtp, sendPhoneOtp, sendEmailOtp, resetOtpState, setupRecaptcha } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Redirect after successful verification
  useEffect(() => {
    if (user && !verified) {
      setVerified(true);
      const isNewUser = localStorage.getItem('signup_isNewUser') === 'true';
      // New users → profile page, returning users → home page
      // ...unless they came from somewhere specific like checkout
      const defaultDestination = isNewUser ? '/profile' : '/';
      const destination = location.state?.from?.pathname || defaultDestination;
      
      // Do not return clearTimeout so that re-renders don't cancel it
      setTimeout(() => navigate(destination, { replace: true }), 4000); // 4 sec delay
    }
  }, [user, navigate, verified, location]);

  // Redirect to login if no OTP was sent (but NOT when a magic link sign-in is in progress)
  useEffect(() => {
    if (!isOtpSent && !user && !isEmailLinkSignIn) {
      navigate('/login', { replace: true });
    }
  }, [isOtpSent, user, isEmailLinkSignIn, navigate]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendTimer > 0 && !canResend) {
      const interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [resendTimer, canResend]);

  // Focus first input on mount
  useEffect(() => {
    const timer = setTimeout(() => inputRefs.current[0]?.focus(), 400);
    return () => clearTimeout(timer);
  }, []);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // only digits

    const newOtp = [...otp];

    if (value.length > 1) {
      // Handle paste
      const digits = value.split('').filter((c) => /\d/.test(c)).slice(0, OTP_LENGTH);
      digits.forEach((digit, i) => {
        if (index + i < OTP_LENGTH) {
          newOtp[index + i] = digit;
        }
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + digits.length, OTP_LENGTH - 1);
      inputRefs.current[nextIndex]?.focus();
    } else {
      newOtp[index] = value;
      setOtp(newOtp);
      if (value && index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
    }
    if (e.key === 'Enter') {
      const code = otp.join('');
      if (code.length === OTP_LENGTH) {
        handleVerify();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (paste) {
      const newOtp = [...otp];
      paste.split('').forEach((digit, i) => {
        newOtp[i] = digit;
      });
      setOtp(newOtp);
      const nextIndex = Math.min(paste.length, OTP_LENGTH - 1);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== OTP_LENGTH) {
      showErrorToast('Incomplete Code', 'Please enter the full 6-digit verification code');
      return;
    }

    if (otpMethod === 'email') {
      // For email OTP, verification happens via the magic link click.
      // This page shows a "check your email" message.
      toast.info('Please click the link in your email to verify.');
      return;
    }

    setLoading(true);
    try {
      await verifyPhoneOtp(code);
      // Success is handled by the onAuthStateChanged listener
    } catch {
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setCanResend(false);
    setResendTimer(30);
    try {
      if (otpMethod === 'phone') {
        // Need to re-setup recaptcha for resend
        await setupRecaptcha('recaptcha-container-verify');
        await sendPhoneOtp(otpTarget);
      } else if (otpMethod === 'email') {
        await sendEmailOtp(otpTarget);
      }
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } catch {
      // toast handled in context
      setCanResend(true);
    }
  };

  const handleGoBack = () => {
    resetOtpState();
    navigate('/login');
  };

  const isEmail = otpMethod === 'email';
  const maskedTarget = isEmail
    ? otpTarget.replace(/(.{2})(.*)(@.*)/, '$1***$3')
    : otpTarget.replace(/(\+\d{2})(\d{3})(\d+)(\d{2})/, '$1 $2****$4');

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20 relative overflow-hidden bg-stone-50 dark:bg-stone-950">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-red-800/8 blur-3xl" />
        <div className="absolute -right-32 -bottom-32 h-96 w-96 rounded-full bg-emerald-600/6 blur-3xl" />
        <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-amber-600/5 blur-2xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="rounded-3xl border border-stone-200/80 dark:border-stone-800/80 bg-white/90 dark:bg-stone-900/90 backdrop-blur-xl shadow-2xl shadow-stone-900/5 dark:shadow-black/20 overflow-hidden">
          {/* Back button */}
          <div className="px-6 pt-6">
            <button
              onClick={handleGoBack}
              className="flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 transition-colors"
            >
              <ArrowLeft size={16} />
              Back to Login
            </button>
          </div>

          <AnimatePresence mode="wait">
            {verified ? (
              /* ---- SUCCESS STATE ---- */
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="px-8 py-16 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                  className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/30"
                >
                  <CheckCircle2 size={40} className="text-white" />
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-bold text-stone-900 dark:text-white"
                >
                  Verification Successful!
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mt-3 text-stone-500 dark:text-stone-400"
                >
                  Redirecting you to the home page…
                </motion.p>
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.5, duration: 1.2 }}
                  className="mt-8 mx-auto h-1 w-32 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 origin-left"
                />
              </motion.div>
            ) : isEmail ? (
              /* ---- EMAIL MAGIC LINK STATE ---- */
              <motion.div
                key="email-otp"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-8 pt-8 pb-10 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-500/25"
                >
                  <Mail size={28} className="text-white" />
                </motion.div>
                <h2 className="text-2xl font-bold text-stone-900 dark:text-white">Check Your Email</h2>
                <p className="mt-3 text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
                  We've sent a magic sign-in link to
                </p>
                <p className="mt-2 text-base font-bold text-stone-800 dark:text-stone-200 bg-stone-100 dark:bg-stone-800 rounded-xl py-3 px-4 inline-block">
                  {maskedTarget}
                </p>
                <p className="mt-5 text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
                  Click the link in your email to sign in. The link will expire in 1 hour.
                </p>

                {/* Email tips */}
                <div className="mt-8 rounded-2xl bg-stone-50 dark:bg-stone-800/50 p-5 text-left space-y-3">
                  <p className="text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider">Can't find it?</p>
                  <ul className="text-sm text-stone-500 dark:text-stone-400 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                      Check your spam/junk folder
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                      Make sure you entered the correct email
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                      The link works only in this browser
                    </li>
                  </ul>
                </div>

                {/* Resend */}
                <div className="mt-6">
                  {canResend ? (
                    <button
                      onClick={handleResend}
                      className="flex items-center gap-2 mx-auto text-sm font-semibold text-red-800 dark:text-red-400 hover:underline transition-all"
                    >
                      <RefreshCw size={14} /> Resend Email
                    </button>
                  ) : (
                    <p className="text-sm text-stone-400">
                      Resend in <span className="font-bold text-stone-600 dark:text-stone-300">{resendTimer}s</span>
                    </p>
                  )}
                </div>
              </motion.div>
            ) : (
              /* ---- PHONE OTP INPUT STATE ---- */
              <motion.div
                key="phone-otp"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-8 pt-8 pb-10"
              >
                <div className="text-center mb-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-red-800 to-red-900 shadow-lg shadow-red-900/25"
                  >
                    <ShieldCheck size={28} className="text-white" />
                  </motion.div>
                  <h2 className="text-2xl font-bold text-stone-900 dark:text-white">Enter Verification Code</h2>
                  <p className="mt-3 text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
                    We've sent a 6-digit code to
                  </p>
                  <p className="mt-1 text-base font-bold text-stone-800 dark:text-stone-200">
                    {maskedTarget}
                  </p>
                </div>

                {/* OTP Input Boxes */}
                <div
                  className="flex items-center justify-center gap-3"
                  onPaste={handlePaste}
                >
                  {otp.map((digit, index) => (
                    <motion.input
                      key={index}
                      ref={(el) => { inputRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + index * 0.05 }}
                      className={`h-14 w-12 rounded-xl border-2 text-center text-xl font-bold transition-all duration-200 outline-none
                        ${digit
                          ? 'border-red-800 dark:border-red-500 bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-300'
                          : 'border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/60 text-stone-900 dark:text-white'
                        }
                        focus:border-red-800 focus:ring-2 focus:ring-red-800/20 dark:focus:border-red-500 dark:focus:ring-red-500/20`}
                    />
                  ))}
                </div>

                {/* Verify Button */}
                <button
                  onClick={handleVerify}
                  disabled={loading || otp.join('').length !== OTP_LENGTH}
                  className="group mt-8 w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-800 to-red-900 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-900/20 hover:shadow-xl hover:shadow-red-900/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <>
                      Verify & Continue
                      <CheckCircle2 size={16} className="transition-transform group-hover:scale-110" />
                    </>
                  )}
                </button>

                {/* Resend */}
                <div className="mt-6 text-center">
                  {canResend ? (
                    <button
                      onClick={handleResend}
                      className="flex items-center gap-2 mx-auto text-sm font-semibold text-red-800 dark:text-red-400 hover:underline transition-all"
                    >
                      <RefreshCw size={14} /> Resend OTP
                    </button>
                  ) : (
                    <p className="text-sm text-stone-400">
                      Resend in <span className="font-bold text-stone-600 dark:text-stone-300">{resendTimer}s</span>
                    </p>
                  )}
                </div>

                <div id="recaptcha-container-verify" className="w-full flex justify-center mt-4" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
