import React, { useEffect } from 'react';
import { Outlet } from 'react-router';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { CartProvider } from './context/CartContext';
import { ProductCatalogProvider } from './context/ProductCatalogContext';
import { StoreConfigProvider } from './context/StoreConfigContext';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from 'next-themes';
import { Toaster } from './components/ui/sonner';
import ErrorBoundary from './components/ErrorBoundary';
import { setupGlobalErrorHandlers } from './utils/errorHandler';

export default function Root() {
  useEffect(() => {
    setupGlobalErrorHandlers();
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <AdminAuthProvider>
          <StoreConfigProvider>
            <ProductCatalogProvider>
              <CartProvider>
                  <ErrorBoundary>
                    <style>{`html { scroll-behavior: smooth; }`}</style>
                    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground">
                      <Outlet />
                    </div>
                  </ErrorBoundary>
                  <Toaster
                    position="top-center"
                    expand={false}
                    toastOptions={{ duration: 5000 }}
                  />
              </CartProvider>
            </ProductCatalogProvider>
          </StoreConfigProvider>
        </AdminAuthProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
