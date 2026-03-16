import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart, CartItem } from '../CartContext';
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { ShoppingCart, ArrowRight, CreditCard, Banknote, Phone, MapPin, User, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

const MarketplaceCheckout = () => {
  const { cart: items, totalAmount, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    paymentMethod: 'cod' as 'cod' | 'telebirr' | 'bank_transfer'
  });

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-gray-50 p-4">
        <ShoppingCart className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-8">Add some products to your cart to checkout.</p>
        <Link to="/shops" className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all">
          Browse Shops
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Group items by shopId to create separate orders for each shop
      const itemsByShop = items.reduce((acc, item) => {
        if (!acc[item.shopId]) {
          acc[item.shopId] = [];
        }
        acc[item.shopId].push(item);
        return acc;
      }, {} as Record<string, CartItem[]>);

      // Create an order for each shop and update inventory
      for (const [shopId, itemsForShop] of Object.entries(itemsByShop)) {
        const shopItems = itemsForShop as CartItem[];
        const shopTotal = shopItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        const orderData = {
          shopId,
          customerName: formData.name,
          customerPhone: formData.phone,
          customerAddress: formData.address,
          items: shopItems.map(item => ({
            productId: item.productId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            imageUrl: item.imageUrl
          })),
          totalAmount: shopTotal,
          status: 'pending',
          paymentMethod: formData.paymentMethod,
          createdAt: serverTimestamp(),
          isMarketplaceOrder: true
        };

        await addDoc(collection(db, 'orders'), orderData);

        // Update product inventory
        for (const item of shopItems) {
          const productRef = doc(db, 'products', item.productId);
          await updateDoc(productRef, {
            quantity: increment(-item.quantity)
          });
        }
      }

      clearCart();
      navigate('/checkout/success');
    } catch (err) {
      console.error('Error creating order:', err);
      setError('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/shops" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-emerald-600 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Continue Shopping
        </Link>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row">
          {/* Order Summary */}
          <div className="w-full md:w-1/3 bg-gray-900 text-white p-8 flex flex-col">
            <h2 className="text-xl font-bold mb-6">Order Summary</h2>
            
            <div className="flex-1 overflow-y-auto space-y-4 mb-6 pr-2 custom-scrollbar">
              {items.map((item) => (
                <div key={item.productId} className="flex gap-4">
                  <div className="w-16 h-16 bg-gray-800 rounded-lg overflow-hidden shrink-0">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600">
                        <ShoppingCart className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm truncate">{item.name}</h4>
                    <p className="text-gray-400 text-xs truncate">Sold by: {item.shopName}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-400">Qty: {item.quantity}</span>
                      <span className="font-bold text-sm text-emerald-400">
                        {(item.price * item.quantity).toLocaleString()} ETB
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-6 border-t border-gray-800 mt-auto">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">Subtotal</span>
                <span className="font-bold">{totalAmount.toLocaleString()} ETB</span>
              </div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-400">Delivery</span>
                <span className="text-sm text-emerald-400">Calculated later</span>
              </div>
              <div className="flex items-center justify-between text-xl">
                <span className="font-bold">Total</span>
                <span className="font-bold text-emerald-400">{totalAmount.toLocaleString()} ETB</span>
              </div>
            </div>
          </div>

          {/* Checkout Form */}
          <div className="w-full md:w-2/3 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Checkout Details</h2>
            
            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-emerald-600" />
                  Contact Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
                      placeholder="0911234567"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address</label>
                  <textarea
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none resize-none h-24"
                    placeholder="City, Sub-city, Woreda, Specific Location"
                  />
                </div>
              </div>

              <div className="space-y-4 pt-6 border-t border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                  Payment Method
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className={`
                    relative flex flex-col items-center p-4 cursor-pointer rounded-xl border-2 transition-all
                    ${formData.paymentMethod === 'cod' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-emerald-200'}
                  `}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={formData.paymentMethod === 'cod'}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                      className="sr-only"
                    />
                    <Banknote className={`w-8 h-8 mb-2 ${formData.paymentMethod === 'cod' ? 'text-emerald-600' : 'text-gray-400'}`} />
                    <span className={`text-sm font-bold text-center ${formData.paymentMethod === 'cod' ? 'text-emerald-900' : 'text-gray-600'}`}>
                      Cash on Delivery
                    </span>
                  </label>

                  <label className={`
                    relative flex flex-col items-center p-4 cursor-pointer rounded-xl border-2 transition-all
                    ${formData.paymentMethod === 'telebirr' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-emerald-200'}
                  `}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="telebirr"
                      checked={formData.paymentMethod === 'telebirr'}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                      className="sr-only"
                    />
                    <Phone className={`w-8 h-8 mb-2 ${formData.paymentMethod === 'telebirr' ? 'text-emerald-600' : 'text-gray-400'}`} />
                    <span className={`text-sm font-bold text-center ${formData.paymentMethod === 'telebirr' ? 'text-emerald-900' : 'text-gray-600'}`}>
                      Telebirr
                    </span>
                  </label>

                  <label className={`
                    relative flex flex-col items-center p-4 cursor-pointer rounded-xl border-2 transition-all
                    ${formData.paymentMethod === 'bank_transfer' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-emerald-200'}
                  `}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="bank_transfer"
                      checked={formData.paymentMethod === 'bank_transfer'}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                      className="sr-only"
                    />
                    <CreditCard className={`w-8 h-8 mb-2 ${formData.paymentMethod === 'bank_transfer' ? 'text-emerald-600' : 'text-gray-400'}`} />
                    <span className={`text-sm font-bold text-center ${formData.paymentMethod === 'bank_transfer' ? 'text-emerald-900' : 'text-gray-600'}`}>
                      Bank Transfer
                    </span>
                  </label>
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      Place Order
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceCheckout;
