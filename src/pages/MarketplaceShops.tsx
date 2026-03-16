import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Shop, Product } from '../types';
import { Link, useSearchParams } from 'react-router-dom';
import { Store, Search, MapPin, ShoppingBag, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { useCart } from '../CartContext';

const MarketplaceShops = () => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  const categoryQuery = searchParams.get('category') || '';
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const shopsRef = collection(db, 'shops');
        let q = query(
          shopsRef,
          where('isMarketplaceEnabled', '==', true),
          where('status', '==', 'active'),
          where('subscriptionPlan', '==', 'premium'),
          orderBy('shopName')
        );

        const snapshot = await getDocs(q);
        let shopsData = snapshot.docs.map(doc => ({
          shopId: doc.id,
          ...doc.data()
        } as Shop));

        let productsData: Product[] = [];

        if (searchQuery || categoryQuery) {
          // Fetch products for these shops
          if (shopsData.length > 0) {
            const productsRef = collection(db, 'products');
            // Fetch all products from these shops (in a real app, use a proper search service like Algolia)
            // For now, we'll fetch all and filter client-side since we can't easily do full-text search in Firestore
            const productsSnapshot = await getDocs(productsRef);
            
            productsData = productsSnapshot.docs
              .map(doc => {
                const data = doc.data();
                const shop = shopsData.find(s => s.shopId === data.shopId);
                if (!shop) return null;
                return {
                  productId: doc.id,
                  ...data,
                  shopName: shop.shopName
                } as Product;
              })
              .filter((p): p is Product => p !== null);

            if (searchQuery) {
              const lowerQuery = searchQuery.toLowerCase();
              shopsData = shopsData.filter(shop => 
                shop.shopName.toLowerCase().includes(lowerQuery) ||
                shop.description?.toLowerCase().includes(lowerQuery)
              );
              
              productsData = productsData.filter(product => 
                product.name.toLowerCase().includes(lowerQuery) ||
                product.description?.toLowerCase().includes(lowerQuery) ||
                product.category.toLowerCase().includes(lowerQuery)
              );
            }

            if (categoryQuery) {
              const lowerCategory = categoryQuery.toLowerCase();
              productsData = productsData.filter(product => 
                product.category.toLowerCase() === lowerCategory
              );
              // If filtering by category, maybe we don't want to show shops unless they sell this category?
              // For simplicity, we'll just show the products.
            }
          }
        } else {
          // If no search, just show shops
          productsData = [];
        }

        setShops(shopsData);
        setProducts(productsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [searchQuery, categoryQuery]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {searchQuery ? 'Search Results' : categoryQuery ? `${categoryQuery} Products` : 'Shops Directory'}
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto">
          {searchQuery 
            ? `Showing results for "${searchQuery}"` 
            : categoryQuery 
              ? `Browse products in the ${categoryQuery} category.`
              : 'Discover and shop from the best local businesses in Ethiopia.'}
        </p>
      </div>

      {/* Products Section (only show if searching or filtering by category) */}
      {(searchQuery || categoryQuery) && (
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-emerald-600" />
            Products ({products.length})
          </h2>
          
          {products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product, index) => (
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
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
              <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900">No products found</h3>
              <p className="text-gray-500">Try adjusting your search terms.</p>
            </div>
          )}
        </div>
      )}

      {/* Shops Section */}
      {(!categoryQuery || shops.length > 0) && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Store className="w-6 h-6 text-emerald-600" />
            Shops {searchQuery && `(${shops.length})`}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {shops.map((shop, index) => (
              <motion.div
                key={shop.shopId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  to={`/shop/${shop.slug}`}
                  className="block bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all group h-full flex flex-col"
                >
                  <div className="flex flex-col items-center text-center mb-6">
                    <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-4 overflow-hidden border-4 border-white shadow-md group-hover:scale-105 transition-transform">
                      {shop.logoUrl ? (
                        <img src={shop.logoUrl} alt={shop.shopName} className="w-full h-full object-cover" />
                      ) : (
                        <Store className="w-10 h-10 text-emerald-600" />
                      )}
                    </div>
                    <h3 className="font-bold text-xl text-gray-900 group-hover:text-emerald-600 transition-colors">
                      {shop.shopName}
                    </h3>
                    {shop.address && (
                      <p className="text-sm text-gray-500 flex items-center justify-center gap-1 mt-2">
                        <MapPin className="w-4 h-4" />
                        {shop.address}
                      </p>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm line-clamp-3 flex-1 text-center">
                    {shop.description || 'Welcome to our online store! Browse our products and shop with ease.'}
                  </p>
                  <div className="mt-6 pt-6 border-t border-gray-50 text-center">
                    <span className="text-emerald-600 font-bold text-sm group-hover:underline">
                      Visit Shop &rarr;
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {shops.length === 0 && (
            <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
              <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No shops found</h3>
              <p className="text-gray-500">
                {searchQuery ? "Try adjusting your search terms." : "There are currently no shops available."}
              </p>
              {searchQuery && (
                <Link to="/shops" className="mt-6 inline-block bg-emerald-50 text-emerald-600 px-6 py-2 rounded-xl font-bold hover:bg-emerald-100 transition-colors">
                  Clear Search
                </Link>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MarketplaceShops;
