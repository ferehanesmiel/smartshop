import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { SubscriptionProvider } from './SubscriptionContext';
import { CartProvider } from './CartContext';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from './components/ErrorBoundary';

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
import Branches from './pages/Branches';
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
import SubscriptionPage from './pages/SubscriptionPage';
import POSScanner from './pages/POSScanner';
import MarketplaceLayout from './components/MarketplaceLayout';
import Marketplace from './pages/Marketplace';
import ShopsDirectory from './pages/ShopsDirectory';
import MarketplaceShop from './pages/MarketplaceShop';
import MarketplaceProduct from './pages/MarketplaceProduct';
import MarketplaceCart from './pages/MarketplaceCart';
import MarketplaceCheckout from './pages/MarketplaceCheckout';
import OnlineOrders from './pages/OnlineOrders';
import MarketplaceDashboard from './pages/MarketplaceDashboard';

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const { user, userRole, loading } = useAuth();
  
  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center max-w-md">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-500 text-2xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-500 mb-6">You don't have permission to access this page.</p>
          <button 
            onClick={() => window.history.back()}
            className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

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
          <ErrorBoundary>
            <Toaster position="top-right" />
            <Router>
              <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/pricing" element={<Navigate to="/#pricing" replace />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/subscription" element={<SubscriptionPage />} />
              <Route path="/pos" element={<POSScanner />} />
              
              {/* Marketplace Routes */}
              <Route element={<MarketplaceLayout />}>
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/shops" element={<ShopsDirectory />} />
                <Route path="/shop/:slug" element={<MarketplaceShop />} />
                <Route path="/product/:slug" element={<MarketplaceProduct />} />
                <Route path="/marketplace/cart" element={<MarketplaceCart />} />
                <Route path="/marketplace/checkout" element={<MarketplaceCheckout />} />
              </Route>
              
              <Route path="/dashboard" element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard/products" element={
            <ProtectedRoute allowedRoles={['owner', 'manager', 'inventory']}>
              <Layout>
                <Products />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard/pos" element={
            <ProtectedRoute allowedRoles={['owner', 'manager', 'cashier']}>
              <Layout>
                <POS />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard/sales" element={
            <ProtectedRoute allowedRoles={['owner', 'manager', 'accountant']}>
              <Layout>
                <Sales />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard/customers" element={
            <ProtectedRoute allowedRoles={['owner', 'manager']}>
              <Layout>
                <Customers />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard/orders" element={
            <ProtectedRoute allowedRoles={['owner', 'manager']}>
              <Layout>
                <Orders />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard/reports" element={
            <ProtectedRoute allowedRoles={['owner', 'manager', 'accountant']}>
              <Layout>
                <Reports />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard/settings" element={
            <ProtectedRoute allowedRoles={['owner']}>
              <Layout>
                <Settings />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard/receipts" element={
            <ProtectedRoute allowedRoles={['owner', 'manager', 'accountant']}>
              <Layout>
                <Receipts />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard/branches" element={
            <ProtectedRoute allowedRoles={['owner']}>
              <Layout>
                <Branches />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard/marketplace" element={
            <ProtectedRoute allowedRoles={['owner', 'manager']}>
              <Layout>
                <MarketplaceDashboard />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard/online-orders" element={
            <ProtectedRoute allowedRoles={['owner', 'manager']}>
              <Layout>
                <OnlineOrders />
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
          </ErrorBoundary>
        </CartProvider>
      </SubscriptionProvider>
    </AuthProvider>
  );
}
