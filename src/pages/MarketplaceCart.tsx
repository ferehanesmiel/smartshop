import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../CartContext';
import { ShoppingCart, Trash2, ChevronLeft, ArrowRight, Package } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const MarketplaceCart = () => {
  const { t } = useTranslation();
  const { items, removeItem, updateQuantity, totalPrice, totalItems } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
          <ShoppingCart size={48} className="text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('checkout.cart_empty')}</h1>
        <p className="text-gray-500 mb-8 text-center max-w-xs">
          {t('checkout.cart_empty_msg')}
        </p>
        <Link to="/marketplace" className="px-8 py-3 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20">
          {t('checkout.start_shopping')}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{t('checkout.cart_title')}</h1>
          <Link to="/marketplace" className="text-emerald-600 font-medium hover:underline flex items-center gap-1">
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
                className="bg-white p-4 md:p-6 rounded-3xl shadow-sm border border-gray-100 flex gap-4 md:gap-6"
              >
                <div className="w-24 h-24 md:w-32 md:h-32 bg-gray-50 rounded-2xl overflow-hidden flex-shrink-0">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-200">
                      <Package size={32} />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-gray-900 md:text-lg">{item.name}</h3>
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <p className="text-emerald-600 font-bold mt-1">{item.price.toLocaleString()} {t('common.currency')}</p>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center border border-gray-100 rounded-xl overflow-hidden bg-gray-50">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="px-3 py-1 hover:bg-gray-200 text-gray-600 transition-colors"
                      >
                        -
                      </button>
                      <span className="px-4 py-1 font-bold text-gray-900 text-sm">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="px-3 py-1 hover:bg-gray-200 text-gray-600 transition-colors"
                      >
                        +
                      </button>
                    </div>
                    <p className="font-bold text-gray-900">{(item.price * item.quantity).toLocaleString()} {t('common.currency')}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 sticky top-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">{t('checkout.order_summary')}</h2>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-gray-500">
                  <span>{t('checkout.subtotal_items', { count: totalItems })}</span>
                  <span>{totalPrice.toLocaleString()} {t('common.currency')}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>{t('checkout.delivery_fee')}</span>
                  <span className="text-emerald-600 font-medium">{t('checkout.calculated_at_checkout')}</span>
                </div>
                <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">{t('checkout.total')}</span>
                  <span className="text-2xl font-bold text-emerald-600">{totalPrice.toLocaleString()} {t('common.currency')}</span>
                </div>
              </div>
              
              <button
                onClick={() => navigate('/marketplace/checkout')}
                className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
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
