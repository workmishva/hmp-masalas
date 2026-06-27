/* @refresh reset */
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { auth } from '../config/firebase';

interface AdminAuthContextType {
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  logout: () => void;
}

const SESSION_KEY = 'hmp-admin-session';

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

const googleProvider = new GoogleAuthProvider();

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    setIsAuthenticated(window.sessionStorage.getItem(SESSION_KEY) === 'authenticated');
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || ''}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.token) {
          window.sessionStorage.setItem('hmp-admin-jwt', data.token);
          window.sessionStorage.setItem(SESSION_KEY, 'authenticated');
          setIsAuthenticated(true);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const loginWithGoogle = async () => {
    try {
      // Sign in with Google popup via Firebase
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      // Send token to backend to verify it's the admin email
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || ''}/api/admin/google-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.token) {
          window.sessionStorage.setItem('hmp-admin-jwt', data.token);
          window.sessionStorage.setItem(SESSION_KEY, 'authenticated');
          setIsAuthenticated(true);
          return true;
        }
      }

      // If not authorized, sign them out of Firebase too
      await signOut(auth);
      return false;
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user') {
        console.error('Google admin login error:', error);
      }
      // Clean up Firebase session if something went wrong
      try { await signOut(auth); } catch {}
      return false;
    }
  };

  const logout = () => {
    window.sessionStorage.removeItem('hmp-admin-jwt');
    window.sessionStorage.removeItem(SESSION_KEY);
    setIsAuthenticated(false);
  };

  return (
    <AdminAuthContext.Provider value={{ isAuthenticated, login, loginWithGoogle, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
