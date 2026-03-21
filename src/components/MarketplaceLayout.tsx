import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Store, Search, User, Menu, X, LayoutDashboard, Wallet as WalletIcon } from 'lucide-react';
import { useCart } from '../CartContext';
import { useAuth } from '../AuthContext';
import { useWallet } from '../WalletContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

const MarketplaceLayout = () => {
  const { t } = useTranslation();
  const { totalItems } = useCart();
  const { user, shop } = useAuth();
  const { wallet } = useWallet();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const location = useLocation();

  const navLinks = [
    { name: t('nav.home'), path: '/marketplace' },
    { name: t('nav.shops') || 'Shops', path: '/shops' },
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans text-white bg-dark">
      {/* Top Navigation */}
      <header className="bg-dark-surface border-b border-dark-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/marketplace" className="flex items-center gap-2 group">
              <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand/20 group-hover:scale-110 transition-transform">
                <Store size={24} />
              </div>
              <span className="text-xl font-bold tracking-tight">Smart <span className="text-brand">Market</span></span>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`font-medium transition-colors ${
                    location.pathname === link.path ? 'text-brand' : 'text-gray-400 hover:text-brand'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            <div className="hidden md:block">
              <LanguageSwitcher />
            </div>

            {user && wallet && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-dark rounded-lg border border-dark-border">
                <WalletIcon size={16} className="text-brand" />
                <span className="text-sm font-bold text-brand">{wallet.balance_sbr} SBR</span>
              </div>
            )}

            <Link to="/marketplace/cart" className="relative p-2 text-gray-400 hover:text-brand transition-colors">
              <ShoppingCart size={24} />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-dark-surface">
                  {totalItems}
                </span>
              )}
            </Link>
            
            {user && (
              <Link 
                to="/dashboard" 
                className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-brand text-white font-bold rounded-xl hover:bg-brand-dark transition-all shadow-lg shadow-brand/20"
              >
                <LayoutDashboard size={18} />
                {t('common.dashboard')}
              </Link>
            )}

            {!user && (
              <Link 
                to="/login" 
                className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-dark-surface text-white font-bold rounded-xl hover:bg-dark border border-dark-border transition-all"
              >
                <User size={18} />
                {t('common.login')}
              </Link>
            )}

            <button 
              className="md:hidden p-2 text-gray-400"
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
              className="md:hidden bg-dark-surface border-t border-dark-border overflow-hidden"
            >
              <div className="p-4 space-y-4">
                {user && wallet && (
                  <div className="flex items-center justify-between p-3 bg-dark rounded-xl border border-dark-border">
                    <div className="flex items-center gap-2">
                      <WalletIcon size={18} className="text-brand" />
                      <span className="font-bold">Wallet Balance</span>
                    </div>
                    <span className="font-bold text-brand">{wallet.balance_sbr} SBR</span>
                  </div>
                )}
                <div className="flex justify-center py-2">
                  <LanguageSwitcher />
                </div>
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsMenuOpen(false)}
                    className="block py-2 text-lg font-medium text-gray-300"
                  >
                    {link.name}
                  </Link>
                ))}
                {user && (
                  <Link
                    to="/dashboard"
                    onClick={() => setIsMenuOpen(false)}
                    className="block py-3 text-center bg-brand text-white font-bold rounded-xl"
                  >
                    {t('common.dashboard')}
                  </Link>
                )}
                {!user && (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setIsMenuOpen(false)}
                      className="block py-3 text-center bg-dark text-white font-bold rounded-xl border border-dark-border"
                    >
                      {t('common.login')}
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setIsMenuOpen(false)}
                      className="block py-3 text-center bg-brand text-white font-bold rounded-xl"
                    >
                      {t('nav.get_started')}
                    </Link>
                  </>
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
      <footer className="bg-dark-surface border-t border-dark-border py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-2">
              <Link to="/marketplace" className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center text-white">
                  <Store size={20} />
                </div>
                <span className="text-xl font-bold tracking-tight">Smart <span className="text-brand">Market</span></span>
              </Link>
              <p className="text-gray-400 max-w-sm leading-relaxed">
                The commerce engine of Zemen Digital City ecosystem. 
                Connecting local shops with city data and delivery systems.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-6 uppercase text-xs tracking-widest">Marketplace</h4>
              <ul className="space-y-4 text-gray-400 text-sm">
                <li><Link to="/marketplace" className="hover:text-brand transition-colors">Home</Link></li>
                <li><Link to="/shops" className="hover:text-brand transition-colors">All Shops</Link></li>
                <li><Link to="/marketplace?category=Electronics" className="hover:text-brand transition-colors">Electronics</Link></li>
                <li><Link to="/marketplace?category=Clothing" className="hover:text-brand transition-colors">Clothing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-6 uppercase text-xs tracking-widest">For Sellers</h4>
              <ul className="space-y-4 text-gray-400 text-sm">
                <li><Link to="/register" className="hover:text-brand transition-colors">Register Shop</Link></li>
                <li><Link to="/login" className="hover:text-brand transition-colors">Seller Login</Link></li>
                <li><Link to="/" className="hover:text-brand transition-colors">Platform Features</Link></li>
                <li><Link to="/" className="hover:text-brand transition-colors">Pricing Plans</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-dark-border flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
            <p>© 2026 Smart Market | Zemen Digital City. All rights reserved.</p>
            <div className="flex gap-8">
              <Link to="/" className="hover:text-brand transition-colors">Privacy Policy</Link>
              <Link to="/" className="hover:text-brand transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MarketplaceLayout;
