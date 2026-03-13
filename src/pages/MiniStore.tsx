import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, query, where, getDocs, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Shop, Product, OrderItem } from '../types';
import { 
  Store, 
  ShoppingCart, 
  Plus, 
  Minus, 
  X, 
  CheckCircle2,
  Phone,
  MessageCircle,
  ShoppingBag
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

const MiniStore = () => {
  const { slug } = useParams<{ slug: string }>();
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isOrderSuccess, setIsOrderSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
  });

  useEffect(() => {
    const fetchShop = async () => {
      const shopsRef = collection(db, 'shops');
      const q = query(shopsRef, where('slug', '==', slug));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const shopData = { shopId: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as Shop;
        setShop(shopData);

        // Fetch products
        const productsRef = collection(db, 'shops', shopData.shopId, 'products');
        const unsubscribe = onSnapshot(productsRef, (snapshot) => {
          const productsData = snapshot.docs.map(doc => ({
            productId: doc.id,
            ...doc.data()
          } as Product));
          setProducts(productsData);
          setLoading(false);
        });

        return () => unsubscribe();
      } else {
        setLoading(false);
      }
    };

    fetchShop();
  }, [slug]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.productId);
      if (existing) {
        return prev.map(item => 
          item.productId === product.productId 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { 
        productId: product.productId, 
        name: product.name, 
        price: product.price, 
        quantity: 1 
      }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.productId === productId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
  };

  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop || cart.length === 0) return;

    try {
      await addDoc(collection(db, 'shops', shop.shopId, 'orders'), {
        shopId: shop.shopId,
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        products: cart,
        total,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });

      setIsOrderSuccess(true);
      setCart([]);
      setIsCartOpen(false);
    } catch (err) {
      console.error('Order error:', err);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen">Loading store...</div>;
  if (!shop) return <div className="flex items-center justify-center h-screen">Shop not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
              <Store className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 leading-tight">{shop.shopName}</h1>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">Online Store</p>
            </div>
          </div>
          <button 
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 text-gray-600 hover:text-emerald-600 transition-colors"
          >
            <ShoppingCart className="w-6 h-6" />
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                {cart.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-emerald-600 text-white py-12 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-2">Welcome to our store!</h2>
          <p className="text-emerald-100 opacity-80">Browse our products and order directly from your phone.</p>
        </div>
      </div>

      {/* Products */}
      <main className="max-w-5xl mx-auto px-4 mt-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product) => (
            <div key={product.productId} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
              <div className="aspect-square bg-gray-100 relative">
                {product.image && (
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer"
                  />
                )}
                {product.quantity <= 0 && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-[10px] font-bold uppercase">
                    Out of Stock
                  </div>
                )}
              </div>
              <div className="p-3 flex-1 flex flex-col">
                <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">{product.category}</p>
                <h3 className="font-bold text-sm text-gray-900 truncate mb-2">{product.name}</h3>
                <div className="mt-auto flex items-center justify-between">
                  <p className="font-bold text-gray-900">{product.price.toLocaleString()} ETB</p>
                  <button
                    onClick={() => addToCart(product)}
                    disabled={product.quantity <= 0}
                    className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Your Cart</h2>
                <button onClick={() => setIsCartOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center">
                    <ShoppingBag className="w-16 h-16 mb-4 opacity-20" />
                    <p>Your cart is empty</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      {cart.map((item) => (
                        <div key={item.productId} className="flex items-center gap-4">
                          <div className="flex-1">
                            <p className="font-bold text-gray-900">{item.name}</p>
                            <p className="text-sm text-gray-500">{item.price.toLocaleString()} ETB</p>
                          </div>
                          <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-1">
                            <button onClick={() => updateQuantity(item.productId, -1)} className="p-1 hover:bg-white rounded"><Minus className="w-4 h-4" /></button>
                            <span className="font-bold w-4 text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.productId, 1)} className="p-1 hover:bg-white rounded"><Plus className="w-4 h-4" /></button>
                          </div>
                          <button onClick={() => removeFromCart(item.productId)} className="text-red-400"><X className="w-5 h-5" /></button>
                        </div>
                      ))}
                    </div>

                    <form onSubmit={handleOrder} className="pt-6 border-t border-gray-100 space-y-4">
                      <h3 className="font-bold text-gray-900">Customer Information</h3>
                      <div className="space-y-3">
                        <input
                          type="text"
                          required
                          placeholder="Your Name"
                          value={customerInfo.name}
                          onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <input
                          type="tel"
                          required
                          placeholder="Phone Number"
                          value={customerInfo.phone}
                          onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div className="pt-4 flex justify-between items-center font-bold text-xl">
                        <span>Total</span>
                        <span className="text-emerald-600">{total.toLocaleString()} ETB</span>
                      </div>
                      <button
                        type="submit"
                        className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
                      >
                        Place Order
                      </button>
                    </form>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {isOrderSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-white rounded-3xl p-8 text-center shadow-2xl"
            >
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="text-emerald-600 w-12 h-12" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Placed!</h2>
              <p className="text-gray-500 mb-8">The shop has received your order and will contact you soon.</p>
              <div className="space-y-3">
                <button
                  onClick={() => window.open(`https://wa.me/${shop.phone.replace(/\s+/g, '')}?text=Hello, I just placed an order on your SmartShop store!`, '_blank')}
                  className="w-full bg-[#25D366] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  Contact on WhatsApp
                </button>
                <button
                  onClick={() => setIsOrderSuccess(false)}
                  className="w-full py-3 text-gray-500 font-bold"
                >
                  Back to Store
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Cart Button (Mobile) */}
      {cart.length > 0 && !isCartOpen && (
        <button
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-6 right-6 bg-emerald-600 text-white p-4 rounded-full shadow-2xl z-40 flex items-center gap-2"
        >
          <ShoppingCart className="w-6 h-6" />
          <span className="font-bold">{total.toLocaleString()} ETB</span>
        </button>
      )}
    </div>
  );
};

export default MiniStore;
