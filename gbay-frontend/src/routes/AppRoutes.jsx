import { Routes, Route } from "react-router-dom";
import Login from "../pages/Login";
// import Dashboard from "../pages/Dashboard";
import Products from "../pages/Products";
import Footer from "../pages/Footer";
import CreateProduct from "../pages/CreateProduct";
import InterestedBuyers from "../pages/InterestedBuyers";
import ProtectedRoute from "./ProtectedRoute";
import DashboardLayout from "../layouts/DashboardLayout";
import MyProducts from "../pages/MyProducts";
import Profile from "../pages/Profile";
import Auth from "../pages/Auth";
import ForgotPassword from "../pages/ForgetPassword";
import BuySellProduct from "../pages/BuySellProduct";
import Notifications from "../pages/Notifications";
import ProductDetail from "../pages/ProductDetail";
import Auctions from "../pages/Auctions";
import AdminDashboard from "../pages/AdminDashboard";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Auth />} />
      <Route path="/admin" element={<Auth />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute requireAdmin>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/products"
        element={
          <ProtectedRoute>
            <Products />
          </ProtectedRoute>
        }
      />
      <Route        path="/product/:id"
        element={
          <ProtectedRoute>
            <ProductDetail />
          </ProtectedRoute>
        }
      />
      <Route        path="/create-product"
        element={
          <ProtectedRoute>
            <CreateProduct />
          </ProtectedRoute>
        }
      />
      <Route
        path="/seller/product/:productId/interests"
        element={
          <ProtectedRoute>
            <InterestedBuyers />
          </ProtectedRoute>
        }
      />

      <Route
        path="/my-products"
        element={
          <ProtectedRoute>
            <MyProducts />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route        path="/notifications"
        element={
          <ProtectedRoute>
            <Notifications />
          </ProtectedRoute>
        }
      />
      <Route        path="/Footer"
        element={
          <ProtectedRoute>
            <Footer />
          </ProtectedRoute>
        }
      />
      <Route
        path="/buy-sell-items"
        element={
          <ProtectedRoute>
            <BuySellProduct />
          </ProtectedRoute>
        }
      />
      <Route
        path="/auctions"
        element={
          <ProtectedRoute>
            <Auctions />
          </ProtectedRoute>
        }
      />
      <Route path="/login" element={<Auth />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
    </Routes>
  );
}
