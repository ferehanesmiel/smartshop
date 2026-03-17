import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Store, Search, User, Menu, X, LayoutDashboard } from 'lucide-react';
import { useCart } from '../CartContext';
import { useAuth } from '../AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const MarketplaceLayout = () => {
  const { totalItems } = useCart();
  const { user, shop } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'Home', path: '/marketplace' },
    { name: 'Shops', path: '/shops' },
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans text-gray-900">
      {/* Top Navigation */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/marketplace" className="flex items-center gap-2 group">
              <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-600/20 group-hover:scale-110 transition-transform">
                <Store size={24} />
              </div>
              <span className="text-xl font-bold tracking-tight">SmartShop <span className="text-emerald-600">Market</span></span>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`font-medium transition-colors ${
                    location.pathname === link.path ? 'text-emerald-600' : 'text-gray-500 hover:text-emerald-600'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            <Link to="/marketplace/cart" className="relative p-2 text-gray-500 hover:text-emerald-600 transition-colors">
              <ShoppingCart size={24} />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                  {totalItems}
                </span>
              )}
            </Link>
            
            {user && shop && (
              <Link 
                to="/dashboard" 
                className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
              >
                <LayoutDashboard size={18} />
                Dashboard
              </Link>
            )}

            {!user && (
              <Link 
                to="/login" 
                className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-gray-50 text-gray-700 font-bold rounded-xl hover:bg-emerald-50 hover:text-emerald-600 transition-all"
              >
                <User size={18} />
                Seller Login
              </Link>
            )}

            <button 
              className="md:hidden p-2 text-gray-500"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-t border-gray-100 overflow-hidden"
            >
              <div className="p-4 space-y-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsMenuOpen(false)}
                    className="block py-2 text-lg font-medium text-gray-600"
                  >
                    {link.name}
                  </Link>
                ))}
                {user && shop && (
                  <Link
                    to="/dashboard"
                    onClick={() => setIsMenuOpen(false)}
                    className="block py-3 text-center bg-emerald-600 text-white font-bold rounded-xl"
                  >
                    Dashboard
                  </Link>
                )}
                {!user && (
                  <Link
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="block py-3 text-center bg-emerald-600 text-white font-bold rounded-xl"
                  >
                    Seller Login
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-2">
              <Link to="/marketplace" className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white">
                  <Store size={20} />
                </div>
                <span className="text-xl font-bold tracking-tight">SmartShop <span className="text-emerald-600">Market</span></span>
              </Link>
              <p className="text-gray-500 max-w-sm leading-relaxed">
                The leading e-commerce marketplace in Ethiopia, connecting local shops with customers nationwide. 
                Powered by SmartShop Ethiopia SaaS.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-6 uppercase text-xs tracking-widest">Marketplace</h4>
              <ul className="space-y-4 text-gray-500 text-sm">
                <li><Link to="/marketplace" className="hover:text-emerald-600 transition-colors">Home</Link></li>
                <li><Link to="/shops" className="hover:text-emerald-600 transition-colors">All Shops</Link></li>
                <li><Link to="/marketplace?category=Electronics" className="hover:text-emerald-600 transition-colors">Electronics</Link></li>
                <li><Link to="/marketplace?category=Clothing" className="hover:text-emerald-600 transition-colors">Clothing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-6 uppercase text-xs tracking-widest">For Sellers</h4>
              <ul className="space-y-4 text-gray-500 text-sm">
                <li><Link to="/register" className="hover:text-emerald-600 transition-colors">Register Shop</Link></li>
                <li><Link to="/login" className="hover:text-emerald-600 transition-colors">Seller Login</Link></li>
                <li><Link to="/" className="hover:text-emerald-600 transition-colors">Platform Features</Link></li>
                <li><Link to="/" className="hover:text-emerald-600 transition-colors">Pricing Plans</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400">
            <p>© 2026 SmartShop Ethiopia. All rights reserved.</p>
            <div className="flex gap-8">
              <Link to="/" className="hover:text-emerald-600 transition-colors">Privacy Policy</Link>
              <Link to="/" className="hover:text-emerald-600 transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MarketplaceLayout;
