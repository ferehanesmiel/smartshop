import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../CartContext';
import { useAuth } from '../AuthContext';
import { useWallet } from '../WalletContext';
import { collection, addDoc, doc, updateDoc, increment, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { Order } from '../types';
import { ChevronLeft, CreditCard, Truck, Smartphone, CheckCircle2, AlertCircle, Wallet as WalletIcon, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

const MarketplaceCheckout = () => {
  const { t } = useTranslation();
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const { wallet, payWithSBR } = useWallet();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    customerName: user?.displayName || '',
    customerPhone: '',
    customerAddress: '',
    paymentMethod: 'sbr' as 'sbr' | 'cod' | 'telebirr' | 'bank_transfer',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    if (formData.paymentMethod === 'sbr') {
      if (!wallet || wallet.balance_sbr < totalPrice) {
        setError('Insufficient SBR balance in your wallet.');
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const batch = writeBatch(db);
      
      // Group items by shopId to create separate orders for each shop
      const itemsByShop: Record<string, typeof items> = {};
      items.forEach(item => {
        const shopId = item.shopId || 'unknown';
        if (!itemsByShop[shopId]) itemsByShop[shopId] = [];
        itemsByShop[shopId].push(item);
      });

      if (formData.paymentMethod === 'sbr') {
        const paymentSuccess = await payWithSBR(totalPrice);
        if (!paymentSuccess) {
          throw new Error('SBR Payment failed');
        }
      }

      const orderPromises = Object.entries(itemsByShop).map(async ([shopId, shopItems]) => {
        const shopTotal = shopItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const orderData: Partial<Order> = {
          shop_id: shopId,
          user_id: user?.uid || 'guest',
          customer_name: formData.customerName,
          customer_phone: formData.customerPhone,
          customer_address: formData.customerAddress,
          products: shopItems.map(item => ({
            productId: item.productId || '',
            name: item.name || '',
            price: item.price || 0,
            quantity: item.quantity || 1,
            shopId: item.shopId || shopId,
            imageUrl: item.imageUrl || null,
          })),
          total_price: shopTotal,
          totalAmount: shopTotal,
          status: 'pending',
          payment_method: formData.paymentMethod === 'cod' ? 'cash' : (formData.paymentMethod === 'sbr' ? 'SBR' : 'mobile_money'),
          paymentMethod: formData.paymentMethod,
          payment_status: formData.paymentMethod === 'sbr' ? 'paid' : 'pending',
          delivery_type: 'runner',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        // Create the order
        const orderRef = await addDoc(collection(db, 'orders'), orderData);
        
        // Update inventory for each item
        shopItems.forEach(item => {
          const productRef = doc(db, 'products', item.productId);
          batch.update(productRef, {
            quantity: increment(-item.quantity)
          });
        });

        return orderRef;
      });

      await Promise.all(orderPromises);
      await batch.commit();

      setSuccess(true);
      clearCart();
      toast.success('Order placed successfully!');
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || t('checkout.error_placing_order'));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-dark flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-dark-surface p-12 rounded-[3rem] shadow-2xl text-center max-w-md w-full border border-dark-border"
        >
          <div className="w-24 h-24 bg-brand/10 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 size={48} className="text-brand" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4 tracking-tight">{t('checkout.order_placed')}</h1>
          <p className="text-gray-400 mb-10 leading-relaxed">
            {t('checkout.order_success_msg')}
          </p>
          <button
            onClick={() => navigate('/marketplace')}
            className="w-full py-4 bg-brand text-white font-bold rounded-2xl hover:bg-brand-dark transition-all shadow-lg shadow-brand/20"
          >
            {t('checkout.back_to_marketplace')}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => navigate('/marketplace/cart')}
          className="inline-flex items-center gap-2 text-gray-500 hover:text-brand transition-colors mb-8"
        >
          <ChevronLeft size={20} />
          {t('checkout.back_to_cart')}
        </button>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-dark-surface p-8 rounded-3xl border border-dark-border shadow-xl">
              <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                <Truck className="text-brand" />
                {t('checkout.delivery_info')}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400 ml-1">{t('checkout.full_name')}</label>
                  <input
                    required
                    type="text"
                    className="w-full p-4 rounded-2xl border border-dark-border bg-dark text-white focus:outline-none focus:ring-2 focus:ring-brand transition-all"
                    placeholder={t('checkout.full_name_placeholder')}
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400 ml-1">{t('checkout.phone_number')}</label>
                  <input
                    required
                    type="tel"
                    className="w-full p-4 rounded-2xl border border-dark-border bg-dark text-white focus:outline-none focus:ring-2 focus:ring-brand transition-all"
                    placeholder={t('checkout.phone_placeholder')}
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-bold text-gray-400 ml-1">{t('checkout.delivery_address')}</label>
                  <textarea
                    required
                    rows={3}
                    className="w-full p-4 rounded-2xl border border-dark-border bg-dark text-white focus:outline-none focus:ring-2 focus:ring-brand transition-all resize-none"
                    placeholder={t('checkout.address_placeholder')}
                    value={formData.customerAddress}
                    onChange={(e) => setFormData({ ...formData, customerAddress: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="bg-dark-surface p-8 rounded-3xl border border-dark-border shadow-xl">
              <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                <CreditCard className="text-brand" />
                {t('checkout.payment_method')}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { id: 'sbr', label: 'SBR Wallet', icon: WalletIcon },
                  { id: 'cod', label: t('checkout.cash_on_delivery'), icon: Truck },
                  { id: 'telebirr', label: t('checkout.telebirr'), icon: Smartphone },
                  { id: 'bank_transfer', label: t('checkout.bank_transfer'), icon: CreditCard },
                ].map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, paymentMethod: method.id as any })}
                    className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 text-center ${
                      formData.paymentMethod === method.id
                        ? 'border-brand bg-brand/10 text-brand'
                        : 'border-dark-border hover:border-brand/30 text-gray-500'
                    }`}
                  >
                    <method.icon size={24} />
                    <span className="font-bold text-xs">{method.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-dark-surface p-8 rounded-3xl border border-dark-border sticky top-8 shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-6">{t('checkout.order_summary')}</h2>
              
              <div className="max-h-60 overflow-y-auto mb-6 space-y-4 pr-2 custom-scrollbar">
                {items.map((item) => (
                  <div key={item.productId} className="flex justify-between items-center text-sm">
                    <div className="flex-1 pr-4">
                      <p className="font-bold text-white line-clamp-1">{item.name}</p>
                      <p className="text-gray-500">{t('checkout.qty')}: {item.quantity}</p>
                    </div>
                    <span className="font-bold text-white">{(item.price * item.quantity).toLocaleString()} {t('common.currency')}</span>
                  </div>
                ))}
              </div>
              
              <div className="space-y-4 mb-8 pt-6 border-t border-dark-border">
                <div className="flex justify-between text-gray-500">
                  <span>{t('checkout.subtotal')}</span>
                  <span>{totalPrice.toLocaleString()} {t('common.currency')}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>{t('checkout.delivery_fee')}</span>
                  <span className="text-brand font-bold">{t('checkout.free')}</span>
                </div>

                {formData.paymentMethod === 'sbr' && wallet && (
                  <div className="p-3 bg-dark rounded-xl border border-dark-border flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <WalletIcon size={14} className="text-brand" />
                      <span>Wallet Balance</span>
                    </div>
                    <span className={`text-xs font-bold ${wallet.balance_sbr >= totalPrice ? 'text-brand' : 'text-red-500'}`}>
                      {wallet.balance_sbr} SBR
                    </span>
                  </div>
                )}

                <div className="pt-4 border-t border-dark-border flex justify-between items-center">
                  <span className="text-lg font-bold text-white">{t('checkout.total')}</span>
                  <span className="text-2xl font-bold text-brand">{totalPrice.toLocaleString()} {t('common.currency')}</span>
                </div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6 p-4 bg-red-500/10 text-red-500 rounded-xl text-sm flex items-center gap-2 border border-red-500/20"
                  >
                    <AlertCircle size={16} />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>
              
              <button
                type="submit"
                disabled={loading || items.length === 0}
                className="w-full py-4 bg-brand text-white font-bold rounded-2xl hover:bg-brand-dark transition-all shadow-lg shadow-brand/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    {formData.paymentMethod === 'sbr' ? (
                      <>
                        Pay with SBR
                        <Zap size={20} />
                      </>
                    ) : (
                      <>
                        {t('checkout.place_order')}
                        <CheckCircle2 size={20} />
                      </>
                    )}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MarketplaceCheckout;
