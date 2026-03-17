import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { Shop, Product } from '../types';
import { Search, ShoppingCart, Store, Package, ChevronRight } from 'lucide-react';
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
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-emerald-600 text-white py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">{t('marketplace.title')}</h1>
          <p className="text-xl mb-8 opacity-90">{t('marketplace.subtitle')}</p>
          
          <div className="max-w-2xl mx-auto relative">
            <input
              type="text"
              placeholder={t('marketplace.search_placeholder')}
              className="w-full py-4 px-6 pr-12 rounded-full text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-400 shadow-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute right-4 top-4 text-gray-400" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Categories */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
            <Package className="text-emerald-600" />
            {t('marketplace.browse_categories')}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((cat, index) => (
              <Link
                key={`${cat.id}-${index}`}
                to={`/marketplace?category=${cat.id}`}
                className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow text-center border border-gray-100 group"
              >
                <span className="text-4xl mb-3 block group-hover:scale-110 transition-transform">{cat.icon}</span>
                <span className="font-medium text-gray-900">{cat.name}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Featured Shops */}
        <section className="mb-16">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Store className="text-emerald-600" />
              {t('marketplace.featured_shops')}
            </h2>
            <Link to="/shops" className="text-emerald-600 font-medium hover:underline flex items-center gap-1">
              {t('marketplace.view_all')} <ChevronRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {shops.map((shop, index) => (
              <motion.div
                key={`${shop.shopId}-${index}`}
                whileHover={{ y: -5 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <div className="h-32 bg-gray-100 relative">
                  {shop.bannerUrl ? (
                    <img src={shop.bannerUrl} alt={shop.shopName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full bg-emerald-50 flex items-center justify-center">
                      <Store className="text-emerald-200" size={48} />
                    </div>
                  )}
                  <div className="absolute -bottom-6 left-4 w-12 h-12 rounded-xl border-2 border-white overflow-hidden bg-white shadow-sm">
                    {shop.logoUrl ? (
                      <img src={shop.logoUrl} alt={shop.shopName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full bg-emerald-600 flex items-center justify-center text-white font-bold">
                        {shop.shopName[0]}
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-6 pt-8">
                  <h3 className="font-bold text-lg mb-1">{shop.shopName}</h3>
                  <p className="text-sm text-gray-500 mb-4">{shop.category || t('marketplace.general_store')}</p>
                  <Link
                    to={`/shop/${shop.slug}`}
                    className="block w-full py-2 text-center bg-gray-50 hover:bg-emerald-50 text-emerald-600 font-medium rounded-xl transition-colors"
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
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <ShoppingCart className="text-emerald-600" />
              {t('marketplace.featured_products')}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product, index) => (
              <motion.div
                key={`${product.productId}-${index}`}
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
                  <p className="text-sm text-gray-500 mb-3">{product.shopName}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-emerald-600">{product.price.toLocaleString()} ETB</span>
                    <button className="p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shadow-sm">
                      <ShoppingCart size={18} />
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
