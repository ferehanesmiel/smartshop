import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Shop } from '../types';
import { Store, Search, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

const ShopsDirectory = () => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const q = query(
          collection(db, 'shops'),
          where('isMarketplaceEnabled', '==', true)
        );
        const snapshot = await getDocs(q);
        const shopsData = snapshot.docs.map(doc => doc.data() as Shop);
        setShops(shopsData);
      } catch (error) {
        console.error('Error fetching shops:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchShops();
  }, []);

  const filteredShops = shops.filter(shop =>
    shop.shopName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (shop.category && shop.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Shops Directory</h1>
            <p className="text-gray-500 text-lg">Browse all registered shops selling on our marketplace</p>
          </div>
          
          <div className="relative max-w-md w-full">
            <input
              type="text"
              placeholder="Search shops by name or category..."
              className="w-full py-3 px-5 pr-12 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute right-4 top-3.5 text-gray-400" size={20} />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-3xl h-64 animate-pulse shadow-sm border border-gray-100" />
            ))}
          </div>
        ) : filteredShops.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredShops.map((shop) => (
              <motion.div
                key={shop.shopId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -5 }}
                className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden group"
              >
                <div className="h-40 bg-gray-100 relative">
                  {shop.bannerUrl ? (
                    <img src={shop.bannerUrl} alt={shop.shopName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full bg-emerald-50 flex items-center justify-center">
                      <Store className="text-emerald-200" size={64} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                </div>
                
                <div className="p-8 relative">
                  <div className="absolute -top-12 left-8 w-20 h-20 rounded-2xl border-4 border-white overflow-hidden bg-white shadow-md">
                    {shop.logoUrl ? (
                      <img src={shop.logoUrl} alt={shop.shopName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full bg-emerald-600 flex items-center justify-center text-white text-2xl font-bold">
                        {shop.shopName[0]}
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-8">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">{shop.shopName}</h3>
                        <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-full uppercase tracking-wider">
                          {shop.category || 'General Store'}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-gray-500 text-sm mb-6 line-clamp-2">
                      {shop.description || 'Welcome to our shop! We offer high-quality products at competitive prices.'}
                    </p>
                    
                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-8">
                      <MapPin size={16} />
                      <span className="truncate">{shop.address || 'Ethiopia'}</span>
                    </div>
                    
                    <Link
                      to={`/shop/${shop.slug}`}
                      className="block w-full py-4 text-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-emerald-600/20"
                    >
                      Visit Shop
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
            <Store className="mx-auto text-gray-300 mb-4" size={64} />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No shops found</h3>
            <p className="text-gray-500">Try adjusting your search query to find what you're looking for.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopsDirectory;
