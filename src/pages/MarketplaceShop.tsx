import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { Shop, Product } from '../types';
import { Store, Phone, Mail, MapPin, Package, ShoppingCart, Search } from 'lucide-react';
import { motion } from 'framer-motion';

const MarketplaceShop = () => {
  const { slug } = useParams<{ slug: string }>();
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchShopData = async () => {
      if (!slug) return;
      
      try {
        // Fetch shop details
        const shopQuery = query(
          collection(db, 'shops'),
          where('slug', '==', slug),
          limit(1)
        );
        const shopSnapshot = await getDocs(shopQuery);
        
        if (!shopSnapshot.empty) {
          const shopData = shopSnapshot.docs[0].data() as Shop;
          
          let isExpired = false;
          if (shopData.subscriptionExpiryDate) {
            const expiryDate = new Date(shopData.subscriptionExpiryDate);
            if (new Date() > expiryDate) {
              isExpired = true;
            }
          }
          if (shopData.subscriptionStatus === 'expired') {
            isExpired = true;
          }

          if (!shopData.isMarketplaceEnabled || isExpired) {
            setShop(null);
            return;
          }

          setShop(shopData);
          
          // Fetch shop products
          const productsQuery = query(
            collection(db, 'products'),
            where('shopId', '==', shopData.shopId),
            where('isPublishedToMarketplace', '==', true)
          );
          const productsSnapshot = await getDocs(productsQuery);
          const productsData = productsSnapshot.docs.map(doc => doc.data() as Product);
          setProducts(productsData);
        }
      } catch (error) {
        console.error('Error fetching shop data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchShopData();
  }, [slug]);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <Store size={64} className="text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Shop Not Found</h1>
        <p className="text-gray-500 mb-6">The shop you are looking for does not exist or has been disabled.</p>
        <Link to="/marketplace" className="px-6 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors">
          Back to Marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Shop Header */}
      <div className="relative h-64 md:h-80 bg-gray-200">
        {shop.bannerUrl ? (
          <img src={shop.bannerUrl} alt={shop.shopName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <div className="w-full h-full bg-emerald-600/10 flex items-center justify-center">
            <Store size={80} className="text-emerald-600/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        <div className="absolute -bottom-16 left-4 md:left-8 flex flex-col md:flex-row items-end gap-6 w-full max-w-7xl mx-auto px-4">
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl border-4 border-white overflow-hidden bg-white shadow-xl flex-shrink-0">
            {shop.logoUrl ? (
              <img src={shop.logoUrl} alt={shop.shopName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-full h-full bg-emerald-600 flex items-center justify-center text-white text-4xl font-bold">
                {shop.shopName[0]}
              </div>
            )}
          </div>
          <div className="pb-4 md:pb-6 text-white">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{shop.shopName}</h1>
            <div className="flex flex-wrap gap-4 text-sm opacity-90">
              <span className="flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full backdrop-blur-md">
                <Package size={14} /> {shop.category || 'General Store'}
              </span>
              {shop.address && (
                <span className="flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full backdrop-blur-md">
                  <MapPin size={14} /> {shop.address}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-24 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <h2 className="font-bold text-gray-900 mb-4">About Shop</h2>
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                {shop.description || 'Welcome to our shop! We are committed to providing the best products and services to our customers.'}
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <Phone size={16} />
                  </div>
                  <span>{shop.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <Mail size={16} />
                  </div>
                  <span className="truncate">{shop.email}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Product Grid */}
          <div className="lg:col-span-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <h2 className="text-2xl font-bold text-gray-900">All Products</h2>
              <div className="relative max-w-xs w-full">
                <input
                  type="text"
                  placeholder="Search in this shop..."
                  className="w-full py-2 px-4 pr-10 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="absolute right-3 top-2.5 text-gray-400" size={18} />
              </div>
            </div>

            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <motion.div
                    key={product.productId}
                    whileHover={{ y: -5 }}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group"
                  >
                    <Link to={`/product/${product.slug}`} className="block aspect-square bg-gray-50 overflow-hidden">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <Package size={48} />
                        </div>
                      )}
                    </Link>
                    <div className="p-4">
                      <Link to={`/product/${product.slug}`} className="font-bold text-gray-900 hover:text-emerald-600 transition-colors block mb-1">
                        {product.name}
                      </Link>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-lg font-bold text-emerald-600">{product.price.toLocaleString()} ETB</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${product.quantity > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                          {product.quantity > 0 ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </div>
                      <button 
                        disabled={product.quantity <= 0}
                        className="w-full py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ShoppingCart size={18} />
                        Add to Cart
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                <Package className="mx-auto text-gray-300 mb-4" size={64} />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-500">This shop hasn't published any products to the marketplace yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceShop;
