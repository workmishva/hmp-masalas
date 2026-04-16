import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface AdminAuthContextType {
  isAuthenticated: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const SESSION_KEY = 'hmp-admin-session';
const DEFAULT_ADMIN_USERNAME = 'admin';
const DEFAULT_ADMIN_PASSWORD = 'HMP@123';

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

function getConfiguredCredentials() {
  return {
    username: import.meta.env.VITE_ADMIN_USERNAME ?? DEFAULT_ADMIN_USERNAME,
    password: import.meta.env.VITE_ADMIN_PASSWORD ?? DEFAULT_ADMIN_PASSWORD,
  };
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    setIsAuthenticated(window.sessionStorage.getItem(SESSION_KEY) === 'authenticated');
  }, []);

  const login = (username: string, password: string) => {
    const credentials = getConfiguredCredentials();
    const matches =
      username.trim() === credentials.username &&
      password === credentials.password;

    if (matches) {
      window.sessionStorage.setItem(SESSION_KEY, 'authenticated');
      setIsAuthenticated(true);
      return true;
    }

    return false;
  };

  const logout = () => {
    window.sessionStorage.removeItem(SESSION_KEY);
    setIsAuthenticated(false);
  };

  return (
    <AdminAuthContext.Provider value={{ isAuthenticated, login, logout }}>
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
