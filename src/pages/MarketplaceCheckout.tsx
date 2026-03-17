import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../CartContext';
import { collection, addDoc, doc, updateDoc, increment, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { Order } from '../types';
import { ChevronLeft, CreditCard, Truck, Smartphone, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MarketplaceCheckout = () => {
  const { items, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    paymentMethod: 'cod' as 'cod' | 'telebirr' | 'bank_transfer',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

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

      const orderPromises = Object.entries(itemsByShop).map(async ([shopId, shopItems]) => {
        const orderData: Omit<Order, 'orderId'> = {
          shopId,
          customerName: formData.customerName,
          customerPhone: formData.customerPhone,
          customerAddress: formData.customerAddress,
          items: shopItems.map(item => ({
            productId: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            imageUrl: item.imageUrl,
            shopId: item.shopId
          })),
          totalAmount: shopItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
          commissionAmount: shopItems.reduce((sum, item) => sum + item.price * item.quantity, 0) * 0.03,
          status: 'pending',
          paymentMethod: formData.paymentMethod,
          paymentStatus: 'pending',
          isMarketplaceOrder: true,
          createdAt: new Date().toISOString(),
        };

        // Create the order
        const orderRef = await addDoc(collection(db, 'orders'), orderData);
        
        // Update inventory for each item
        shopItems.forEach(item => {
          const productRef = doc(db, 'products', item.id);
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
    } catch (err) {
      console.error('Checkout error:', err);
      setError('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-12 rounded-[3rem] shadow-xl text-center max-w-md w-full border border-emerald-100"
        >
          <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 size={48} className="text-emerald-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Order Placed!</h1>
          <p className="text-gray-500 mb-10 leading-relaxed">
            Thank you for your order. The shop owners have been notified and will process your order soon.
          </p>
          <button
            onClick={() => navigate('/marketplace')}
            className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
          >
            Back to Marketplace
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => navigate('/marketplace/cart')}
          className="inline-flex items-center gap-2 text-gray-500 hover:text-emerald-600 transition-colors mb-8"
        >
          <ChevronLeft size={20} />
          Back to Cart
        </button>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                <Truck className="text-emerald-600" />
                Delivery Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">Full Name</label>
                  <input
                    required
                    type="text"
                    className="w-full p-4 rounded-2xl border border-gray-100 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    placeholder="Enter your full name"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">Phone Number</label>
                  <input
                    required
                    type="tel"
                    className="w-full p-4 rounded-2xl border border-gray-100 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    placeholder="e.g. 0912345678"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">Delivery Address</label>
                  <textarea
                    required
                    rows={3}
                    className="w-full p-4 rounded-2xl border border-gray-100 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all resize-none"
                    placeholder="Enter your detailed delivery address"
                    value={formData.customerAddress}
                    onChange={(e) => setFormData({ ...formData, customerAddress: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                <CreditCard className="text-emerald-600" />
                Payment Method
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { id: 'cod', label: 'Cash on Delivery', icon: Truck },
                  { id: 'telebirr', label: 'Telebirr', icon: Smartphone },
                  { id: 'bank_transfer', label: 'Bank Transfer', icon: CreditCard },
                ].map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, paymentMethod: method.id as any })}
                    className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 text-center ${
                      formData.paymentMethod === method.id
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-600'
                        : 'border-gray-100 hover:border-emerald-200 text-gray-500'
                    }`}
                  >
                    <method.icon size={24} />
                    <span className="font-bold text-sm">{method.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 sticky top-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
              
              <div className="max-h-60 overflow-y-auto mb-6 space-y-4 pr-2 custom-scrollbar">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-sm">
                    <div className="flex-1 pr-4">
                      <p className="font-bold text-gray-900 line-clamp-1">{item.name}</p>
                      <p className="text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <span className="font-bold text-gray-900">{(item.price * item.quantity).toLocaleString()} ETB</span>
                  </div>
                ))}
              </div>
              
              <div className="space-y-4 mb-8 pt-6 border-t border-gray-100">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span>{totalPrice.toLocaleString()} ETB</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Delivery Fee</span>
                  <span className="text-emerald-600 font-bold">FREE</span>
                </div>
                <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-emerald-600">{totalPrice.toLocaleString()} ETB</span>
                </div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm flex items-center gap-2"
                  >
                    <AlertCircle size={16} />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>
              
              <button
                type="submit"
                disabled={loading || items.length === 0}
                className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Place Order
                    <CheckCircle2 size={20} />
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
