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
  ShoppingBag,
  Search,
  Filter,
  Share2,
  ChevronRight,
  MapPin,
  FileText,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

const MiniStore = () => {
  const { slug } = useParams<{ slug: string }>();
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isOrderSuccess, setIsOrderSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    address: '',
    note: ''
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
        const productsRef = collection(db, 'products');
        const qProducts = query(productsRef, where('shopId', '==', shopData.shopId));
        const unsubscribe = onSnapshot(qProducts, (snapshot) => {
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

  const addToCart = (product: Product, quantity: number = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.productId);
      if (existing) {
        return prev.map(item => 
          item.productId === product.productId 
            ? { ...item, quantity: item.quantity + quantity } 
            : item
        );
      }
      return [...prev, { 
        productId: product.productId, 
        name: product.name, 
        price: product.price, 
        quantity 
      }];
    });
    setSelectedProduct(null);
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
      await addDoc(collection(db, 'orders'), {
        shopId: shop.shopId,
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        deliveryAddress: customerInfo.address,
        note: customerInfo.note,
        products: cart,
        totalAmount: total,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });

      setIsOrderSuccess(true);
      setCart([]);
      setIsCartOpen(false);
      setCustomerInfo({ name: '', phone: '', address: '', note: '' });
    } catch (err) {
      console.error('Order error:', err);
    }
  };

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];
  
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         p.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: shop?.shopName,
        text: `Check out ${shop?.shopName} on SmartShop Ethiopia!`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
      <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-gray-500 font-medium">Loading store...</p>
    </div>
  );
  
  if (!shop) return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50 p-6 text-center">
      <Store className="w-16 h-16 text-gray-300 mb-4" />
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Shop Not Found</h2>
      <p className="text-gray-500 mb-6">The store you're looking for doesn't exist or has been moved.</p>
      <Link to="/" className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold">Go to Homepage</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
              <Store className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 leading-tight">{shop.shopName}</h1>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Online Store</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleShare}
              className="p-2 text-gray-400 hover:text-emerald-600 transition-colors"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-gray-600 hover:text-emerald-600 transition-colors"
            >
              <ShoppingCart className="w-6 h-6" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                  {cart.reduce((acc, item) => acc + item.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Hero / Shop Info */}
      <div className="bg-white border-b border-gray-100 py-8 px-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome to our store!</h2>
            <p className="text-gray-500 max-w-lg">Browse our products and order directly from your phone. We offer fast delivery and quality products.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a 
              href={`tel:${shop.phone}`}
              className="flex items-center gap-2 bg-gray-50 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-bold border border-gray-200 hover:bg-gray-100 transition-all"
            >
              <Phone className="w-4 h-4" />
              Call Us
            </a>
            <a 
              href={`https://wa.me/${shop.phone.replace(/\s+/g, '')}?text=Hello, I'm interested in your products!`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-[#25D366] text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-green-100 hover:opacity-90 transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="max-w-5xl mx-auto px-4 mt-8 space-y-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-sm"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  "px-6 py-3 rounded-2xl text-sm font-bold whitespace-nowrap transition-all border",
                  selectedCategory === category 
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-100" 
                    : "bg-white text-gray-600 border-gray-200 hover:border-emerald-200"
                )}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {filteredProducts.map((product) => (
            <motion.div 
              layout
              key={product.productId} 
              className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-xl transition-all duration-300"
            >
              <div 
                className="aspect-square bg-gray-50 relative cursor-pointer overflow-hidden"
                onClick={() => setSelectedProduct(product)}
              >
                {product.imageUrl ? (
                  <img 
                    src={product.imageUrl} 
                    alt={product.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <ShoppingBag className="w-12 h-12" />
                  </div>
                )}
                {product.quantity <= 0 && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center text-white text-[10px] font-bold uppercase tracking-widest">
                    Out of Stock
                  </div>
                )}
                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-white/90 backdrop-blur-sm p-2 rounded-xl shadow-lg">
                    <Plus className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">{product.category}</p>
                <h3 
                  className="font-bold text-gray-900 truncate mb-2 cursor-pointer hover:text-emerald-600 transition-colors"
                  onClick={() => setSelectedProduct(product)}
                >
                  {product.name}
                </h3>
                <div className="mt-auto flex items-center justify-between">
                  <p className="text-lg font-bold text-gray-900">{product.price.toLocaleString()} <span className="text-[10px] text-gray-400">ETB</span></p>
                  <button
                    onClick={() => addToCart(product)}
                    disabled={product.quantity <= 0}
                    className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all disabled:opacity-50"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="text-gray-400 w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">No products found</h3>
            <p className="text-gray-500">Try adjusting your search or category filter.</p>
          </div>
        )}
      </div>

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="relative w-full max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col sm:flex-row max-h-[90vh]"
            >
              <button 
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 z-10 p-2 bg-white/80 backdrop-blur-sm rounded-full text-gray-900 shadow-lg"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="w-full sm:w-1/2 aspect-square sm:aspect-auto bg-gray-50">
                {selectedProduct.imageUrl ? (
                  <img 
                    src={selectedProduct.imageUrl} 
                    alt={selectedProduct.name} 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <ShoppingBag className="w-20 h-20" />
                  </div>
                )}
              </div>

              <div className="w-full sm:w-1/2 p-8 flex flex-col overflow-y-auto">
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2">{selectedProduct.category}</p>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{selectedProduct.name}</h2>
                <p className="text-3xl font-bold text-emerald-600 mb-6">{selectedProduct.price.toLocaleString()} <span className="text-sm text-gray-400">ETB</span></p>
                
                <div className="space-y-6 flex-1">
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Description</h4>
                    <p className="text-gray-600 leading-relaxed">
                      {selectedProduct.description || "No description available for this product. Quality guaranteed by the seller."}
                    </p>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                    <span className="text-sm font-bold text-gray-700">Availability</span>
                    <span className={cn(
                      "text-xs font-bold px-3 py-1 rounded-full",
                      selectedProduct.quantity > 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                    )}>
                      {selectedProduct.quantity > 0 ? `${selectedProduct.quantity} in stock` : 'Out of stock'}
                    </span>
                  </div>
                </div>

                <div className="mt-8">
                  <button
                    onClick={() => addToCart(selectedProduct)}
                    disabled={selectedProduct.quantity <= 0}
                    className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    <ShoppingCart className="w-6 h-6" />
                    Add to Cart
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                <div className="flex items-center gap-2">
                  <ShoppingCart className="text-emerald-600 w-6 h-6" />
                  <h2 className="text-xl font-bold text-gray-900">Your Cart</h2>
                </div>
                <button onClick={() => setIsCartOpen(false)} className="text-gray-400 hover:text-gray-600 p-2">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center">
                    <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                      <ShoppingBag className="w-12 h-12 opacity-20" />
                    </div>
                    <p className="text-lg font-medium">Your cart is empty</p>
                    <button 
                      onClick={() => setIsCartOpen(false)}
                      className="mt-4 text-emerald-600 font-bold hover:underline"
                    >
                      Start Shopping
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      {cart.map((item) => (
                        <div key={item.productId} className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl">
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 truncate">{item.name}</p>
                            <p className="text-sm text-emerald-600 font-bold">{item.price.toLocaleString()} ETB</p>
                          </div>
                          <div className="flex items-center gap-3 bg-white rounded-xl p-1 shadow-sm">
                            <button onClick={() => updateQuantity(item.productId, -1)} className="p-1.5 hover:bg-gray-50 rounded text-gray-500"><Minus className="w-4 h-4" /></button>
                            <span className="font-bold w-4 text-center text-sm">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.productId, 1)} className="p-1.5 hover:bg-gray-50 rounded text-gray-500"><Plus className="w-4 h-4" /></button>
                          </div>
                          <button onClick={() => removeFromCart(item.productId)} className="text-red-400 hover:text-red-600 p-1">
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <form id="checkout-form" onSubmit={handleOrder} className="space-y-6">
                      <div className="flex items-center gap-2 text-gray-900">
                        <User className="w-5 h-5 text-emerald-600" />
                        <h3 className="font-bold">Checkout Details</h3>
                      </div>
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Full Name</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Abebe Bikila"
                            value={customerInfo.name}
                            onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Phone Number</label>
                          <input
                            type="tel"
                            required
                            placeholder="e.g. 0911223344"
                            value={customerInfo.phone}
                            onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Delivery Address</label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                            <textarea
                              required
                              placeholder="e.g. Bole, Addis Ababa"
                              value={customerInfo.address}
                              onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all min-h-[80px]"
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Note (Optional)</label>
                          <div className="relative">
                            <FileText className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                            <textarea
                              placeholder="Any special instructions?"
                              value={customerInfo.note}
                              onChange={(e) => setCustomerInfo({ ...customerInfo, note: e.target.value })}
                              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all min-h-[60px]"
                            />
                          </div>
                        </div>
                      </div>
                    </form>
                  </>
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-6 bg-white border-t border-gray-100 shadow-[0_-10px_20px_-5px_rgba(0,0,0,0.05)]">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Total Amount</p>
                      <p className="text-2xl font-bold text-gray-900">{total.toLocaleString()} <span className="text-sm text-gray-400">ETB</span></p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 font-medium">Items</p>
                      <p className="text-lg font-bold text-emerald-600">{cart.reduce((acc, item) => acc + item.quantity, 0)}</p>
                    </div>
                  </div>
                  <button
                    form="checkout-form"
                    type="submit"
                    className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 flex items-center justify-center gap-3"
                  >
                    Place Order
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
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
              <p className="text-gray-500 mb-8">The shop has received your order and will contact you soon for delivery.</p>
              <div className="space-y-3">
                <button
                  onClick={() => window.open(`https://wa.me/${shop.phone.replace(/\s+/g, '')}?text=Hello, I just placed an order on your SmartShop store!`, '_blank')}
                  className="w-full bg-[#25D366] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-100"
                >
                  <MessageCircle className="w-5 h-5" />
                  Contact on WhatsApp
                </button>
                <button
                  onClick={() => setIsOrderSuccess(false)}
                  className="w-full py-3 text-gray-500 font-bold hover:text-gray-900 transition-colors"
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
        <motion.button
          initial={{ scale: 0, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-6 right-6 bg-emerald-600 text-white p-4 rounded-full shadow-2xl z-40 flex items-center gap-3 pr-6"
        >
          <div className="relative">
            <ShoppingCart className="w-6 h-6" />
            <span className="absolute -top-2 -right-2 bg-white text-emerald-600 text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-emerald-600">
              {cart.reduce((acc, item) => acc + item.quantity, 0)}
            </span>
          </div>
          <span className="font-bold">{total.toLocaleString()} ETB</span>
        </motion.button>
      )}
    </div>
  );
};

export default MiniStore;
