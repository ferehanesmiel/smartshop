import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  History, 
  Users, 
  ClipboardList, 
  LogOut,
  Store,
  Settings,
  BarChart3,
  Receipt as ReceiptIcon,
  Menu,
  X as CloseIcon
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useSubscription } from '../SubscriptionContext';
import { auth } from '../firebase';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { shop, isAdmin } = useAuth();
  const { isFeatureAllowed } = useSubscription();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/login');
  };

  const allNavItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', feature: 'sales-tracking' },
    { name: 'POS', icon: ShoppingCart, path: '/dashboard/pos', feature: 'sales-tracking' },
    { name: 'Products', icon: Package, path: '/dashboard/products', feature: 'inventory' },
    { name: 'Sales', icon: History, path: '/dashboard/sales', feature: 'sales-tracking' },
    { name: 'Customers', icon: Users, path: '/dashboard/customers', feature: 'customers' },
    { name: 'Orders', icon: ClipboardList, path: '/dashboard/orders', feature: 'orders' },
    { name: 'Receipts', icon: ReceiptIcon, path: '/dashboard/receipts', feature: 'receipts' },
    { name: 'Reports', icon: BarChart3, path: '/dashboard/reports', feature: 'advanced-reports' },
    { name: 'Settings', icon: Settings, path: '/dashboard/settings', feature: 'inventory' },
  ];

  const navItems = allNavItems.filter(item => !item.feature || isFeatureAllowed(item.feature));

  if (isAdmin) {
    navItems.push({ name: 'Admin Panel', icon: Store, path: '/admin', feature: '' });
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar (Desktop) */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
        <div className="p-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <Store className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight">SmartShop</span>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                location.pathname === item.path
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
              <span className="text-emerald-700 font-bold text-xs">
                {shop?.shopName?.[0] || 'S'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {shop?.shopName || 'My Shop'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {shop?.plan || 'Free'} Plan
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-30">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
            <Store className="text-white w-5 h-5" />
          </div>
          <span className="font-bold text-lg tracking-tight">SmartShop</span>
        </Link>
        <div className="flex items-center gap-4">
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-600">
            {isMobileMenuOpen ? <CloseIcon className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="md:hidden fixed top-0 right-0 bottom-0 w-64 bg-white shadow-2xl z-50 flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <span className="font-bold text-lg">Menu</span>
                <button onClick={() => setIsMobileMenuOpen(false)}>
                  <CloseIcon className="w-6 h-6 text-gray-400" />
                </button>
              </div>
              
              <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                      location.pathname === item.path
                        ? "bg-emerald-50 text-emerald-700"
                        : "text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                ))}
              </nav>

              <div className="p-4 border-t border-gray-100">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 transition-all"
                >
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pt-16 md:pt-0 pb-20 md:pb-0">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around p-2 z-30 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        {navItems.slice(0, 4).map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex flex-col items-center p-2 rounded-lg transition-colors",
              location.pathname === item.path ? "text-emerald-600" : "text-gray-500"
            )}
          >
            <item.icon className="w-6 h-6" />
            <span className="text-[10px] mt-1 font-medium">{item.name}</span>
          </Link>
        ))}
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className={cn(
            "flex flex-col items-center p-2 rounded-lg transition-colors",
            isMobileMenuOpen ? "text-emerald-600" : "text-gray-500"
          )}
        >
          <Menu className="w-6 h-6" />
          <span className="text-[10px] mt-1 font-medium">More</span>
        </button>
      </nav>
    </div>
  );
};

export default Layout;
