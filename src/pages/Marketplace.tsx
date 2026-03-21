import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { Shop, Product } from '../types';
import { Search, ShoppingCart, Store, Package, ChevronRight, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const Marketplace = () => {
  const { t } = useTranslation();
  const [shops, setShops] = useState<Shop[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { name: t('marketplace.categories.electronics'), icon: '📱', id: 'Electronics' },
    { name: t('marketplace.categories.clothing'), icon: '👕', id: 'Clothing' },
    { name: t('marketplace.categories.groceries'), icon: '🍎', id: 'Groceries' },
    { name: t('marketplace.categories.home_goods'), icon: '🏠', id: 'Home Goods' },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch featured shops that are active
        const shopsQuery = query(
          collection(db, 'shops'),
          where('isMarketplaceEnabled', '==', true),
          where('subscriptionStatus', 'in', ['active', 'trial']),
          limit(10)
        );
        const shopsSnapshot = await getDocs(shopsQuery);
        const shopsData = shopsSnapshot.docs.map(doc => doc.data() as Shop);
        
        // Filter out expired shops based on expiry date
        const activeShops = shopsData.filter(shop => {
          if (shop.subscriptionExpiryDate) {
            const expiryDate = new Date(shop.subscriptionExpiryDate);
            if (new Date() > expiryDate) return false;
          }
          return true;
        });
        
        setShops(activeShops.slice(0, 4));

        const activeShopIds = activeShops.map(s => s.shopId);

        if (activeShopIds.length > 0) {
          // Fetch featured products only from active shops
          const productsQuery = query(
            collection(db, 'products'),
            where('isPublishedToMarketplace', '==', true),
            where('shopId', 'in', activeShopIds),
            limit(8)
          );
          const productsSnapshot = await getDocs(productsQuery);
          const productsData = productsSnapshot.docs.map(doc => doc.data() as Product);
          setProducts(productsData);
        } else {
          setProducts([]);
        }
      } catch (error) {
        console.error('Error fetching marketplace data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-dark text-white">
      {/* Hero Section */}
      <div className="relative py-24 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand/20 to-dark z-0" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 z-0" />
        
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-bold mb-6 tracking-tight"
          >
            Smart <span className="text-brand">Market</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl mb-10 text-gray-400 max-w-2xl mx-auto"
          >
            The commerce engine of Zemen Digital City. Discover local shops, 
            order with SBR, and get fast delivery via Runner Link.
          </motion.p>
          
          <div className="max-w-2xl mx-auto relative">
            <input
              type="text"
              placeholder={t('marketplace.search_placeholder')}
              className="w-full py-5 px-8 pr-14 rounded-2xl bg-dark-surface border border-dark-border text-white focus:outline-none focus:ring-2 focus:ring-brand shadow-2xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute right-6 top-5 text-gray-500" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Categories */}
        <section className="mb-20">
          <h2 className="text-2xl font-bold mb-10 flex items-center gap-3">
            <Package className="text-brand" />
            {t('marketplace.browse_categories')}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categories.map((cat, index) => (
              <Link
                key={`${cat.id}-${index}`}
                to={`/marketplace?category=${cat.id}`}
                className="bg-dark-surface p-8 rounded-3xl border border-dark-border hover:border-brand/50 transition-all text-center group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-brand/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="text-5xl mb-4 block group-hover:scale-110 transition-transform relative z-10">{cat.icon}</span>
                <span className="font-bold text-gray-300 group-hover:text-white transition-colors relative z-10">{cat.name}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Featured Shops */}
        <section className="mb-20">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Store className="text-brand" />
              {t('marketplace.featured_shops')}
            </h2>
            <Link to="/shops" className="text-brand font-bold hover:underline flex items-center gap-1">
              {t('marketplace.view_all')} <ChevronRight size={18} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {shops.map((shop, index) => (
              <motion.div
                key={`${shop.shopId}-${index}`}
                whileHover={{ y: -8 }}
                className="bg-dark-surface rounded-3xl border border-dark-border overflow-hidden group shadow-xl"
              >
                <div className="h-36 bg-dark relative overflow-hidden">
                  {shop.bannerUrl ? (
                    <img src={shop.bannerUrl} alt={shop.shopName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full bg-brand/5 flex items-center justify-center">
                      <Store className="text-brand/20" size={64} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-dark/80 to-transparent" />
                  <div className="absolute -bottom-8 left-6 w-16 h-16 rounded-2xl border-4 border-dark-surface overflow-hidden bg-dark-surface shadow-lg">
                    {shop.logoUrl ? (
                      <img src={shop.logoUrl} alt={shop.shopName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full bg-brand flex items-center justify-center text-white text-xl font-bold">
                        {shop.shopName[0]}
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-8 pt-10">
                  <h3 className="font-bold text-xl mb-2 group-hover:text-brand transition-colors">{shop.shopName}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                    <MapPin size={14} className="text-brand" />
                    <span>{shop.category || t('marketplace.general_store')}</span>
                  </div>
                  <Link
                    to={`/shop/${shop.slug}`}
                    className="block w-full py-3 text-center bg-dark hover:bg-brand text-white font-bold rounded-2xl border border-dark-border hover:border-brand transition-all"
                  >
                    {t('marketplace.visit_shop')}
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Featured Products */}
        <section>
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <ShoppingCart className="text-brand" />
              {t('marketplace.featured_products')}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((product, index) => (
              <motion.div
                key={`${product.productId}-${index}`}
                whileHover={{ y: -8 }}
                className="bg-dark-surface rounded-3xl border border-dark-border overflow-hidden group shadow-xl"
              >
                <Link to={`/product/${product.slug}`} className="block aspect-square bg-dark overflow-hidden relative">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-dark-border">
                      <Package size={64} />
                    </div>
                  )}
                  <div className="absolute top-4 right-4 bg-brand text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                    HOT
                  </div>
                </Link>
                <div className="p-6">
                  <Link to={`/product/${product.slug}`} className="font-bold text-lg text-white hover:text-brand transition-colors block mb-1 truncate">
                    {product.name}
                  </Link>
                  <p className="text-sm text-gray-500 mb-4 flex items-center gap-1">
                    <Store size={12} />
                    {product.shopName}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-2xl font-bold text-brand">{product.price.toLocaleString()}</span>
                      <span className="text-[10px] text-gray-500 uppercase tracking-widest">ETB</span>
                    </div>
                    <button className="w-12 h-12 bg-brand text-white rounded-2xl hover:bg-brand-dark transition-all shadow-lg shadow-brand/20 flex items-center justify-center">
                      <ShoppingCart size={20} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Marketplace;
