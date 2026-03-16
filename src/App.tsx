/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { SubscriptionProvider } from './SubscriptionContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import POS from './pages/POS';
import Sales from './pages/Sales';
import Customers from './pages/Customers';
import Orders from './pages/Orders';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Receipts from './pages/Receipts';
import MiniStore from './pages/MiniStore';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import AdminPanel from './pages/AdminPanel';
import AdminShops from './pages/AdminShops';
import AdminOrders from './pages/AdminOrders';
import AdminSiteControl from './pages/AdminSiteControl';
import AdminSubscriptions from './pages/AdminSubscriptions';
import AdminRevenue from './pages/AdminRevenue';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminSettings from './pages/AdminSettings';
import MarketplaceLayout from './components/MarketplaceLayout';
import MarketplaceHome from './pages/MarketplaceHome';
import MarketplaceShops from './pages/MarketplaceShops';
import MarketplaceProduct from './pages/MarketplaceProduct';
import MarketplaceCheckout from './pages/MarketplaceCheckout';
import { CartProvider } from './CartContext';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  if (!user || !isAdmin) return <Navigate to="/" />;
  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <SubscriptionProvider>
        <CartProvider>
          <Router>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              
              {/* Marketplace Routes */}
              <Route element={<MarketplaceLayout />}>
                <Route path="/marketplace" element={<MarketplaceHome />} />
                <Route path="/shops" element={<MarketplaceShops />} />
                <Route path="/shop/:slug" element={<MiniStore />} />
                <Route path="/product/:productId" element={<MarketplaceProduct />} />
                <Route path="/checkout" element={<MarketplaceCheckout />} />
              </Route>
              
              <Route path="/dashboard" element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard/products" element={
            <ProtectedRoute>
              <Layout>
                <Products />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard/pos" element={
            <ProtectedRoute>
              <Layout>
                <POS />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard/sales" element={
            <ProtectedRoute>
              <Layout>
                <Sales />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard/customers" element={
            <ProtectedRoute>
              <Layout>
                <Customers />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard/orders" element={
            <ProtectedRoute>
              <Layout>
                <Orders />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard/reports" element={
            <ProtectedRoute>
              <Layout>
                <Reports />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard/settings" element={
            <ProtectedRoute>
              <Layout>
                <Settings />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard/receipts" element={
            <ProtectedRoute>
              <Layout>
                <Receipts />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/admin" element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }>
            <Route index element={<AdminPanel />} />
            <Route path="shops" element={<AdminShops />} />
            <Route path="subscriptions" element={<AdminSubscriptions />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="revenue" element={<AdminRevenue />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="site-control" element={<AdminSiteControl />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
            </Routes>
          </Router>
        </CartProvider>
      </SubscriptionProvider>
    </AuthProvider>
  );
}

