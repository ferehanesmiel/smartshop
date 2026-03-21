import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../CartContext';
import { useWallet } from '../WalletContext';
import { ShoppingCart, Trash2, ChevronLeft, ArrowRight, Package, Wallet as WalletIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const MarketplaceCart = () => {
  const { t } = useTranslation();
  const { items, removeItem, updateQuantity, totalPrice, totalItems } = useCart();
  const { wallet } = useWallet();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-dark flex flex-col items-center justify-center p-4">
        <div className="w-24 h-24 bg-brand/10 rounded-full flex items-center justify-center mb-6">
          <ShoppingCart size={48} className="text-brand" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">{t('checkout.cart_empty')}</h1>
        <p className="text-gray-500 mb-8 text-center max-w-xs">
          {t('checkout.cart_empty_msg')}
        </p>
        <Link to="/marketplace" className="px-8 py-3 bg-brand text-white font-bold rounded-2xl hover:bg-brand-dark transition-all shadow-lg shadow-brand/20">
          {t('checkout.start_shopping')}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">{t('checkout.cart_title')}</h1>
          <Link to="/marketplace" className="text-brand font-bold hover:underline flex items-center gap-1">
            <ChevronLeft size={18} />
            {t('checkout.continue_shopping')}
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <motion.div
                key={item.productId}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-dark-surface p-4 md:p-6 rounded-3xl border border-dark-border flex gap-4 md:gap-6 shadow-xl"
              >
                <div className="w-24 h-24 md:w-32 md:h-32 bg-dark rounded-2xl overflow-hidden flex-shrink-0 border border-dark-border">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-dark-border">
                      <Package size={32} />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-white md:text-lg">{item.name}</h3>
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <p className="text-brand font-bold mt-1">{item.price.toLocaleString()} {t('common.currency')}</p>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center bg-dark rounded-xl border border-dark-border overflow-hidden">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="px-3 py-1 hover:bg-dark-surface text-gray-400 hover:text-white transition-colors"
                      >
                        -
                      </button>
                      <span className="px-4 py-1 font-bold text-white text-sm border-x border-dark-border">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="px-3 py-1 hover:bg-dark-surface text-gray-400 hover:text-white transition-colors"
                      >
                        +
                      </button>
                    </div>
                    <p className="font-bold text-white">{(item.price * item.quantity).toLocaleString()} {t('common.currency')}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-dark-surface p-8 rounded-3xl border border-dark-border sticky top-8 shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-6">{t('checkout.order_summary')}</h2>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-gray-400">
                  <span>{t('checkout.subtotal_items', { count: totalItems })}</span>
                  <span>{totalPrice.toLocaleString()} {t('common.currency')}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>{t('checkout.delivery_fee')}</span>
                  <span className="text-brand font-bold">{t('checkout.calculated_at_checkout')}</span>
                </div>

                {wallet && (
                  <div className="p-3 bg-dark rounded-xl border border-dark-border flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <WalletIcon size={14} className="text-brand" />
                      <span>Wallet Balance</span>
                    </div>
                    <span className="text-xs font-bold text-brand">{wallet.balance_sbr} SBR</span>
                  </div>
                )}

                <div className="pt-4 border-t border-dark-border flex justify-between items-center">
                  <span className="text-lg font-bold text-white">{t('checkout.total')}</span>
                  <span className="text-2xl font-bold text-brand">{totalPrice.toLocaleString()} {t('common.currency')}</span>
                </div>
              </div>
              
              <button
                onClick={() => navigate('/marketplace/checkout')}
                className="w-full py-4 bg-brand text-white font-bold rounded-2xl hover:bg-brand-dark transition-all shadow-lg shadow-brand/20 flex items-center justify-center gap-2"
              >
                {t('checkout.title')}
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceCart;
