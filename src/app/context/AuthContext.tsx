import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  onAuthStateChanged,
  signOut,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { toast } from 'sonner';
import { showErrorToast, showSuccessToast, showWarningToast } from '../utils/errorHandler';

type OtpMethod = 'email' | 'phone' | null;

interface AuthContextType {
  user: User | null;
  loading: boolean;
  otpMethod: OtpMethod;
  otpTarget: string;
  isOtpSent: boolean;
  isEmailLinkSignIn: boolean;
  signupWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  sendEmailOtp: (email: string) => Promise<void>;
  setupRecaptcha: (containerId: string) => Promise<void>;
  sendPhoneOtp: (phoneNumber: string) => Promise<void>;
  verifyPhoneOtp: (otp: string) => Promise<void>;
  resetOtpState: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const EMAIL_FOR_SIGN_IN_KEY = 'emailForSignIn';
const googleProvider = new GoogleAuthProvider();

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [otpMethod, setOtpMethod] = useState<OtpMethod>(null);
  const [otpTarget, setOtpTarget] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isEmailLinkSignIn, setIsEmailLinkSignIn] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser: User | null) => {
      setUser(currentUser);
      
      if (currentUser) {
        try {
          const token = await currentUser.getIdToken();
          const storedName = localStorage.getItem('signup_displayName');
          const displayName = storedName || currentUser.displayName || currentUser.email?.split('@')[0] || 'User';

          await fetch(`${import.meta.env.VITE_BACKEND_URL || ''}/api/users/me`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              displayName,
              email: currentUser.email || '',
              phone: currentUser.phoneNumber || '',
              photoURL: currentUser.photoURL || ''
            })
          });
          localStorage.removeItem('signup_displayName');
        } catch (err) {
          console.error('Failed to sync user to MongoDB', err);
        }
      }
      
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Handle email link sign-in when user returns from email click
  useEffect(() => {
    if (isSignInWithEmailLink(auth, window.location.href)) {
      setIsEmailLinkSignIn(true);
      let email = window.localStorage.getItem(EMAIL_FOR_SIGN_IN_KEY);
      if (!email) {
        email = window.prompt('Please provide your email for confirmation');
      }
      if (email) {
        signInWithEmailLink(auth, email, window.location.href)
          .then(() => {
            window.localStorage.removeItem(EMAIL_FOR_SIGN_IN_KEY);
            showSuccessToast('Email Verified', 'You are now signed in!');
            // After sign-in, navigate to home — clean the URL
            window.history.replaceState(null, '', '/');
          })
          .catch((error) => {
            console.error('Email link sign-in error:', error);
            showErrorToast('Verification Failed', 'Failed to verify email link. Please try again.');
            setIsEmailLinkSignIn(false);
          });
      } else {
        setIsEmailLinkSignIn(false);
      }
    }
  }, []);

  // --- Email + Password Auth ---
  const signupWithEmail = async (email: string, password: string, displayName: string) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName });
      showSuccessToast('Account Created', 'Welcome aboard!');
    } catch (error: any) {
      console.error('Signup error:', error);
      const msg = error.code === 'auth/email-already-in-use'
        ? 'This email is already registered. Try logging in.'
        : 'Failed to create account. Please try again.';
      showErrorToast('Signup Failed', msg);
      throw error;
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error('Login error:', error);
      const msg = error.code === 'auth/invalid-credential'
        ? 'Invalid email or password.'
        : 'Failed to sign in. Please try again.';
      showErrorToast('Login Failed', msg);
      throw error;
    }
  };

  // --- Google Sign-In ---
  const signInWithGoogleHandler = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      showSuccessToast('Welcome!', 'Signed in with Google.');
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      if (error.code !== 'auth/popup-closed-by-user') {
        showErrorToast('Google Sign-In Failed', 'Could not sign in with Google. Please try again.');
      }
      throw error;
    }
  };

  // --- Email Link (Magic Link) ---
  const sendEmailOtp = async (email: string) => {
    const actionCodeSettings = {
      url: `${window.location.origin}/verify-otp?method=email`,
      handleCodeInApp: true,
    };
    try {
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem(EMAIL_FOR_SIGN_IN_KEY, email);
      setOtpMethod('email');
      setOtpTarget(email);
      setIsOtpSent(true);
      showSuccessToast('Link Sent', `Verification link sent to ${email}`);
    } catch (error: any) {
      console.error('Email link error:', error);
      showErrorToast('Email Link Failed', 'Failed to send verification email. Please check your email address and try again.');
      throw error;
    }
  };

  // --- Phone OTP ---
  const setupRecaptcha = async (containerId: string) => {
    if (!recaptchaVerifier) {
      const verifier = new RecaptchaVerifier(auth, containerId, {
        size: 'invisible',
        callback: () => {},
      });
      setRecaptchaVerifier(verifier);
    }
  };

  const sendPhoneOtp = async (phoneNumber: string) => {
    if (!recaptchaVerifier) {
      showErrorToast('reCAPTCHA Error', 'reCAPTCHA not initialized. Please refresh the page.');
      return;
    }
    try {
      const result = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
      setConfirmationResult(result);
      setOtpMethod('phone');
      setOtpTarget(phoneNumber);
      setIsOtpSent(true);
      showSuccessToast('OTP Sent', 'A verification code has been sent to your phone.');
    } catch (error: any) {
      console.error('Phone OTP error:', error);
      showErrorToast('OTP Failed', 'Please check your number and try again.');
      throw error;
    }
  };

  const verifyPhoneOtp = async (otp: string) => {
    if (!confirmationResult) {
      showWarningToast('No OTP Request', 'Please request an OTP first.');
      return;
    }
    try {
      await confirmationResult.confirm(otp);
    } catch (error: any) {
      console.error('OTP verification error:', error);
      showErrorToast('Invalid OTP', 'The code you entered is incorrect. Please try again.');
      throw error;
    }
  };

  const resetOtpState = () => {
    setOtpMethod(null);
    setOtpTarget('');
    setIsOtpSent(false);
    setConfirmationResult(null);
  };

  const logout = async () => {
    try {
      await signOut(auth);
      resetOtpState();
      showSuccessToast('Goodbye!', 'Logged out successfully.');
    } catch (error: any) {
      console.error('Logout error:', error);
      showErrorToast('Logout Failed', 'Could not log you out. Please try again.');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        otpMethod,
        otpTarget,
        isOtpSent,
        isEmailLinkSignIn,
        signupWithEmail,
        loginWithEmail,
        signInWithGoogle: signInWithGoogleHandler,
        sendEmailOtp,
        setupRecaptcha,
        sendPhoneOtp,
        verifyPhoneOtp,
        resetOtpState,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
