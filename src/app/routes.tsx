import { createBrowserRouter } from "react-router";
import Root from "./Root";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import Home from "./pages/Home";
import MasalaPage from "./pages/MasalaPage";
import AdminDashboardOverview from "./pages/AdminDashboardOverview";
import AdminProductsPage from "./pages/AdminProductsPage";
import AdminSettingsPage from "./pages/AdminSettingsPage";
import AdminOrdersPage from "./pages/AdminOrdersPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminLayout from "./components/AdminLayout";
import WebsiteLayout from "./components/WebsiteLayout";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import OtpVerificationPage from "./pages/OtpVerificationPage";
import ProfilePage from "./pages/ProfilePage";
import { ADMIN_LOGIN_ROUTE } from "./config/admin";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    children: [
      {
        element: <WebsiteLayout />,
        children: [
          { index: true, element: <Home /> },
          { path: "masalas", element: <MasalaPage /> },
          { path: "cart", element: <CartPage /> },
          { path: "checkout", element: <CheckoutPage /> },
          { path: "login", element: <LoginPage /> },
          { path: "signup", element: <SignupPage /> },
          { path: "verify-otp", element: <OtpVerificationPage /> },
          { path: "profile", element: <ProfilePage /> },
        ]
      },
      { path: ADMIN_LOGIN_ROUTE, element: <AdminLoginPage /> },
      {
        element: <ProtectedAdminRoute />,
        children: [
          {
            path: "admin",
            element: <AdminLayout />,
            children: [
              { index: true, element: <AdminDashboardOverview /> },
              { path: "products", element: <AdminProductsPage /> },
              { path: "settings", element: <AdminSettingsPage /> },
              { path: "orders", element: <AdminOrdersPage /> },
            ],
          },
        ],
      },
    ],
  },
]);
