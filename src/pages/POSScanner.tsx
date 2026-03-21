import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { collection, query, where, getDocs, doc, addDoc, updateDoc, increment, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { useWallet } from '../WalletContext';
import { getLangString } from '../utils/lang';
import { Product, Sale } from '../types';
import { ShoppingCart, Trash2, CheckCircle2, AlertCircle, Package, Search, QrCode, Wallet as WalletIcon, Zap, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

interface CartItem extends Product {
  quantity: number;
}

const POSScanner = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { wallet, payWithSBR } = useWallet();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(true);
  const [manualBarcode, setManualBarcode] = useState('');
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (showScanner) {
      const scanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );
      scanner.render(onScanSuccess, onScanFailure);
      scannerRef.current = scanner;

      return () => {
        scanner.clear();
      };
    }
  }, [showScanner]);

  const onScanSuccess = async (decodedText: string) => {
    await findAndAddProduct(decodedText);
  };

  const findAndAddProduct = async (code: string) => {
    setLoading(true);
    try {
      const productsRef = collection(db, 'products');
      // Search by barcode
      const q = query(productsRef, where('barcode', '==', code));
      let querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        // Try QR code
        const qQr = query(productsRef, where('qrCode', '==', code));
        querySnapshot = await getDocs(qQr);
      }

      if (!querySnapshot.empty) {
        const prodData = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as Product;
        addToCart(prodData);
        toast.success(`Added ${getLangString(prodData.name)} to cart`);
      } else {
        toast.error("Product not found");
      }
    } catch (error) {
      console.error("Error finding product:", error);
      toast.error("Error searching for product");
    } finally {
      setLoading(false);
      setManualBarcode('');
    }
  };

  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prevCart => prevCart.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const onScanFailure = (error: any) => {
    // Silent failure for scanner
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = async (paymentMethod: 'cash' | 'sbr' | 'telebirr') => {
    if (cart.length === 0) return;

    if (paymentMethod === 'sbr') {
      if (!wallet || wallet.balance_sbr < totalAmount) {
        toast.error('Insufficient SBR balance');
        return;
      }
    }

    setCheckoutLoading(true);
    try {
      const batch = writeBatch(db);
      
      if (paymentMethod === 'sbr') {
        const success = await payWithSBR(totalAmount);
        if (!success) throw new Error('SBR Payment failed');
      }

      // Create Sale record
      const saleData: Partial<Sale> = {
        shop_id: user?.uid || 'unknown',
        items: cart.map(item => ({
          productId: item.id || '',
          name: getLangString(item.name),
          price: item.price,
          quantity: item.quantity
        })),
        total_amount: totalAmount,
        payment_method: paymentMethod,
        timestamp: new Date().toISOString(),
        cashier_id: user?.uid || 'unknown'
      };

      await addDoc(collection(db, 'sales'), saleData);

      // Update inventory
      cart.forEach(item => {
        if (item.id) {
          const productRef = doc(db, 'products', item.id);
          batch.update(productRef, {
            stock: increment(-item.quantity)
          });
        }
      });

      await batch.commit();
      setCart([]);
      toast.success('Sale completed successfully!');
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error('Failed to complete sale');
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark flex flex-col lg:flex-row">
      {/* Left Side: Scanner & Search */}
      <div className="flex-1 p-6 border-r border-dark-border">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <QrCode className="text-brand" />
            POS Terminal
          </h1>
          <button 
            onClick={() => setShowScanner(!showScanner)}
            className={`px-4 py-2 rounded-xl font-bold transition-all ${
              showScanner ? 'bg-red-500/10 text-red-500' : 'bg-brand/10 text-brand'
            }`}
          >
            {showScanner ? 'Close Scanner' : 'Open Scanner'}
          </button>
        </div>

        <div className="space-y-6">
          {showScanner && (
            <div className="bg-dark-surface p-4 rounded-3xl border border-dark-border overflow-hidden shadow-2xl">
              <div id="reader" className="w-full"></div>
            </div>
          )}

          <div className="bg-dark-surface p-6 rounded-3xl border border-dark-border shadow-xl">
            <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider">Manual Entry</h3>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="text"
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && findAndAddProduct(manualBarcode)}
                  placeholder="Enter Barcode or Product Name..."
                  className="w-full pl-12 pr-4 py-4 bg-dark border border-dark-border rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-brand transition-all"
                />
              </div>
              <button 
                onClick={() => findAndAddProduct(manualBarcode)}
                disabled={loading || !manualBarcode}
                className="px-8 bg-brand text-white font-bold rounded-2xl hover:bg-brand-dark transition-all disabled:opacity-50"
              >
                {loading ? '...' : 'Find'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Cart & Checkout */}
      <div className="w-full lg:w-96 bg-dark-surface flex flex-col border-l border-dark-border">
        <div className="p-6 border-b border-dark-border flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShoppingCart size={20} className="text-brand" />
            Current Cart
          </h2>
          <span className="bg-brand text-white text-xs font-bold px-2 py-1 rounded-full">
            {cart.length} Items
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          <AnimatePresence>
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50">
                <Package size={48} className="mb-2" />
                <p>Cart is empty</p>
              </div>
            ) : (
              cart.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-dark p-3 rounded-2xl border border-dark-border flex gap-3"
                >
                  <div className="w-16 h-16 bg-dark-surface rounded-xl overflow-hidden flex-shrink-0 border border-dark-border">
                    {item.images?.[0] ? (
                      <img src={item.images[0]} alt={getLangString(item.name)} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-700">
                        <Package size={20} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-white truncate">{getLangString(item.name)}</h4>
                    <p className="text-brand text-xs font-bold">{item.price.toLocaleString()} ETB</p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center bg-dark-surface rounded-lg border border-dark-border overflow-hidden">
                        <button onClick={() => updateQuantity(item.id!, -1)} className="px-2 py-0.5 text-gray-400 hover:text-white">-</button>
                        <span className="px-2 py-0.5 text-xs font-bold text-white border-x border-dark-border">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id!, 1)} className="px-2 py-0.5 text-gray-400 hover:text-white">+</button>
                      </div>
                      <button onClick={() => removeFromCart(item.id!)} className="text-gray-500 hover:text-red-500">
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        <div className="p-6 bg-dark border-t border-dark-border space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-gray-400 text-sm">
              <span>Subtotal</span>
              <span>{totalAmount.toLocaleString()} ETB</span>
            </div>
            <div className="flex justify-between text-white font-bold text-lg">
              <span>Total</span>
              <span className="text-brand">{totalAmount.toLocaleString()} ETB</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleCheckout('cash')}
              disabled={checkoutLoading || cart.length === 0}
              className="py-3 bg-dark-surface border border-dark-border text-white font-bold rounded-xl hover:bg-dark-border transition-all disabled:opacity-50"
            >
              Cash
            </button>
            <button
              onClick={() => handleCheckout('telebirr')}
              disabled={checkoutLoading || cart.length === 0}
              className="py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50"
            >
              Telebirr
            </button>
          </div>

          <button
            onClick={() => handleCheckout('sbr')}
            disabled={checkoutLoading || cart.length === 0}
            className="w-full py-4 bg-brand text-white font-bold rounded-xl hover:bg-brand-dark transition-all shadow-lg shadow-brand/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {checkoutLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Zap size={18} />
                Pay with SBR
              </>
            )}
          </button>

          {wallet && (
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
              <WalletIcon size={12} />
              <span>Balance: <span className="text-brand font-bold">{wallet.balance_sbr} SBR</span></span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default POSScanner;
