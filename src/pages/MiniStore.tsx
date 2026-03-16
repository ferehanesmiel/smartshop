import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Shop, Product } from '../types';
import { 
  Store, 
  ShoppingCart, 
  Plus, 
  Phone,
  MessageCircle,
  Search,
  MapPin,
  ArrowLeft,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useCart } from '../CartContext';

const MiniStore = () => {
  const { slug } = useParams<{ slug: string }>();
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchShop = async () => {
      const shopsRef = collection(db, 'shops');
      const q = query(shopsRef, where('slug', '==', slug));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const shopData = { shopId: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as Shop;
        
        if (!shopData.isMarketplaceEnabled || shopData.status !== 'active' || shopData.subscriptionPlan !== 'premium') {
          setLoading(false);
          return;
        }

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

  const handleAddToCart = (product: Product) => {
    if (!shop) return;
    addToCart({
      productId: product.productId,
      name: product.name,
      price: product.price,
      quantity: 1,
      imageUrl: product.imageUrl,
      shopId: shop.shopId,
      shopName: shop.shopName
    });
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
        <Store className="w-16 h-16 text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Shop Not Found</h1>
        <p className="text-gray-500 mb-8">The shop you're looking for doesn't exist or has been removed.</p>
        <Link to="/shops" className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all">
          Browse Marketplace
        </Link>
      </div>
    );
  }

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Shop Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <Link to="/shops" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-emerald-600 mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Shops
          </Link>
          
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
            <div className="w-24 h-24 md:w-32 md:h-32 bg-emerald-50 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden border-4 border-white shadow-lg">
              {shop.logoUrl ? (
                <img src={shop.logoUrl} alt={shop.shopName} className="w-full h-full object-cover" />
              ) : (
                <Store className="w-12 h-12 md:w-16 md:h-16 text-emerald-600" />
              )}
            </div>
            
            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{shop.shopName}</h1>
                <p className="text-gray-600 max-w-2xl">{shop.description || 'Welcome to our online store!'}</p>
              </div>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-gray-600">
                {shop.address && (
                  <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span>{shop.address}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg">
                  <Phone className="w-4 h-4 text-emerald-600" />
                  <span>{shop.phone}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-center md:justify-start gap-3 pt-2">
                <a 
                  href={`tel:${shop.phone}`}
                  className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-xl font-bold hover:bg-gray-800 transition-all text-sm"
                >
                  <Phone className="w-4 h-4" />
                  Call Shop
                </a>
                <a 
                  href={`https://wa.me/${shop.phone.replace(/\s+/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-[#25D366] text-white px-4 py-2 rounded-xl font-bold hover:bg-[#128C7E] transition-all text-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar / Filters */}
          <div className="w-full md:w-64 shrink-0 space-y-6">
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none text-sm"
                />
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wider">Categories</h3>
                <div className="space-y-1">
                  {categories.map(category => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        selectedCategory === category
                          ? "bg-emerald-50 text-emerald-700"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      )}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {selectedCategory === 'All' ? 'All Products' : selectedCategory}
              </h2>
              <span className="text-sm text-gray-500">{filteredProducts.length} items</span>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm">
                <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-500">Try adjusting your search or category filter.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {filteredProducts.map((product, index) => (
                  <motion.div
                    key={product.productId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      to={`/product/${product.productId}`}
                      className="block bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all overflow-hidden group h-full flex flex-col"
                    >
                      <div className="aspect-square bg-gray-50 relative overflow-hidden">
                        {product.imageUrl ? (
                          <img 
                            src={product.imageUrl} 
                            alt={product.name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <Store className="w-12 h-12" />
                          </div>
                        )}
                        {product.quantity <= 0 && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                              Out of Stock
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="p-4 flex flex-col flex-1">
                        <div className="flex-1">
                          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{product.category}</p>
                          <h3 className="font-bold text-gray-900 line-clamp-2 leading-tight mb-2 group-hover:text-emerald-600 transition-colors">
                            {product.name}
                          </h3>
                        </div>
                        
                        <div className="mt-auto pt-4 flex items-center justify-between">
                          <span className="font-bold text-lg text-emerald-600">
                            {product.price.toLocaleString()} ETB
                          </span>
                          
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              if (product.quantity > 0) {
                                handleAddToCart(product);
                              }
                            }}
                            disabled={product.quantity <= 0}
                            className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiniStore;
