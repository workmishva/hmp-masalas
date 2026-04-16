import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { useAdminAuth } from '../context/AdminAuthContext';
import { ADMIN_LOGIN_PATH } from '../config/admin';

export default function ProtectedAdminRoute() {
  const { isAuthenticated } = useAdminAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={ADMIN_LOGIN_PATH} replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
