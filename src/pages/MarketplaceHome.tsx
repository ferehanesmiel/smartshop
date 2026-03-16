import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Shop, Product } from '../types';
import { Link, useNavigate } from 'react-router-dom';
import { Store, Star, ShoppingBag, ArrowRight, Search, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { useCart } from '../CartContext';

const MarketplaceHome = () => {
  const [featuredShops, setFeaturedShops] = useState<Shop[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchMarketplaceData = async () => {
      try {
        // Fetch shops that have marketplace enabled
        const shopsRef = collection(db, 'shops');
        const qShops = query(
          shopsRef,
          where('isMarketplaceEnabled', '==', true),
          where('status', '==', 'active'),
          where('subscriptionPlan', '==', 'premium'),
          limit(6)
        );
        const shopsSnapshot = await getDocs(qShops);
        const shopsData = shopsSnapshot.docs.map(doc => ({
          shopId: doc.id,
          ...doc.data()
        } as Shop));
        setFeaturedShops(shopsData);

        // Fetch some products from these shops
        if (shopsData.length > 0) {
          const shopIds = shopsData.map(s => s.shopId);
          const productsRef = collection(db, 'products');
          // Firestore 'in' query supports up to 10 values
          const qProducts = query(
            productsRef,
            where('shopId', 'in', shopIds.slice(0, 10)),
            limit(12)
          );
          const productsSnapshot = await getDocs(qProducts);
          const productsData = productsSnapshot.docs.map(doc => {
            const data = doc.data();
            const shop = shopsData.find(s => s.shopId === data.shopId);
            return {
              productId: doc.id,
              ...data,
              shopName: shop?.shopName || 'Unknown Shop'
            } as Product;
          });
          setFeaturedProducts(productsData);
        }
      } catch (error) {
        console.error('Error fetching marketplace data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMarketplaceData();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shops?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-emerald-600 rounded-3xl p-8 md:p-16 text-center text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-3xl mx-auto space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              Discover Local Shops & Products
            </h1>
            <p className="text-lg md:text-xl text-emerald-100">
              Shop directly from the best stores in Ethiopia, all in one place.
            </p>
            
            <form onSubmit={handleSearch} className="max-w-xl mx-auto pt-4 pb-2 relative">
              <div className="relative flex items-center">
                <Search className="absolute left-4 text-gray-400 w-6 h-6" />
                <input
                  type="text"
                  placeholder="Search for products or shops..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-32 py-4 bg-white text-gray-900 border-transparent rounded-full focus:ring-4 focus:ring-emerald-300 transition-all outline-none text-lg shadow-lg"
                />
                <button 
                  type="submit"
                  className="absolute right-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-full font-bold transition-colors"
                >
                  Search
                </button>
              </div>
            </form>

            <div className="flex flex-wrap justify-center gap-4 pt-2">
              <Link
                to="/shops"
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-8 py-3 rounded-full font-bold transition-all backdrop-blur-sm"
              >
                Browse All Shops
              </Link>
            </div>
          </div>
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 right-10 w-48 h-48 bg-white rounded-full blur-3xl"></div>
          </div>
        </div>
      </section>

      {/* Product Categories (Placeholder) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Categories</h2>
        </div>
        <div className="flex overflow-x-auto pb-4 gap-4 custom-scrollbar hide-scrollbar">
          {['Electronics', 'Clothing', 'Groceries', 'Home & Garden', 'Beauty', 'Sports'].map((category, i) => (
            <Link 
              key={i} 
              to={`/shops?category=${category.toLowerCase()}`}
              className="px-6 py-3 bg-white border border-gray-100 rounded-full text-sm font-bold text-gray-700 whitespace-nowrap hover:border-emerald-500 hover:text-emerald-600 transition-colors shadow-sm"
            >
              {category}
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Shops */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Store className="w-6 h-6 text-emerald-500" />
            Featured Shops
          </h2>
          <Link to="/shops" className="text-emerald-600 font-bold hover:text-emerald-700 flex items-center gap-1">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredShops.map((shop, index) => (
            <motion.div
              key={shop.shopId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                to={`/shop/${shop.slug}`}
                className="block bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                    {shop.logoUrl ? (
                      <img src={shop.logoUrl} alt={shop.shopName} className="w-full h-full object-cover" />
                    ) : (
                      <Store className="w-8 h-8 text-emerald-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 group-hover:text-emerald-600 transition-colors">
                      {shop.shopName}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                      {shop.description || 'Welcome to our online store!'}
                    </p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
        {featuredShops.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
            <Store className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900">No shops available</h3>
            <p className="text-gray-500">Check back later for new shops.</p>
          </div>
        )}
      </section>

      {/* Popular Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-orange-500" />
            Popular Products
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product, index) => (
            <motion.div
              key={product.productId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                to={`/product/${product.productId}`}
                className="block bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden group h-full flex flex-col"
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
                      <ShoppingBag className="w-12 h-12" />
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
                    <p className="text-xs text-emerald-600 font-bold mb-1 truncate">{product.shopName}</p>
                    <h3 className="font-bold text-gray-900 line-clamp-2 leading-tight mb-2">
                      {product.name}
                    </h3>
                  </div>
                  <div className="mt-auto pt-4 flex items-center justify-between">
                    <span className="font-bold text-lg text-gray-900">
                      {product.price.toLocaleString()} ETB
                    </span>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        if (product.quantity > 0) {
                          addToCart({
                            productId: product.productId,
                            name: product.name,
                            price: product.price,
                            imageUrl: product.imageUrl,
                            shopId: product.shopId,
                            shopName: product.shopName || 'Unknown Shop'
                          });
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
        {featuredProducts.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
            <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900">No products available</h3>
            <p className="text-gray-500">Check back later for new products.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default MarketplaceHome;
