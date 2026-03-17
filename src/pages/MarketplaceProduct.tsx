import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { Product, Shop } from '../types';
import { Package, ShoppingCart, Store, ChevronLeft, ShieldCheck, Truck, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';

const MarketplaceProduct = () => {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchProductData = async () => {
      if (!slug) return;
      
      try {
        const productQuery = query(
          collection(db, 'products'),
          where('slug', '==', slug),
          limit(1)
        );
        const productSnapshot = await getDocs(productQuery);
        
        if (!productSnapshot.empty) {
          const productData = productSnapshot.docs[0].data() as Product;
          setProduct(productData);
          
          // Fetch shop details
          const shopQuery = query(
            collection(db, 'shops'),
            where('shopId', '==', productData.shopId),
            limit(1)
          );
          const shopSnapshot = await getDocs(shopQuery);
          if (!shopSnapshot.empty) {
            setShop(shopSnapshot.docs[0].data() as Shop);
          }
        }
      } catch (error) {
        console.error('Error fetching product data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <Package size={64} className="text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h1>
        <p className="text-gray-500 mb-6">The product you are looking for does not exist or has been removed.</p>
        <Link to="/marketplace" className="px-6 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors">
          Back to Marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <Link to="/marketplace" className="inline-flex items-center gap-2 text-gray-500 hover:text-emerald-600 transition-colors mb-8">
          <ChevronLeft size={20} />
          Back to Marketplace
        </Link>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Product Image */}
            <div className="p-8 lg:p-12 bg-gray-50 flex items-center justify-center">
              <div className="relative aspect-square w-full max-w-md rounded-2xl overflow-hidden shadow-lg bg-white">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-200">
                    <Package size={120} />
                  </div>
                )}
              </div>
            </div>

            {/* Product Info */}
            <div className="p-8 lg:p-12">
              <div className="mb-8">
                <Link 
                  to={shop ? `/shop/${shop.slug}` : '#'} 
                  className="inline-flex items-center gap-2 text-emerald-600 font-medium hover:underline mb-4"
                >
                  <Store size={18} />
                  {shop?.shopName || 'Unknown Shop'}
                </Link>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{product.name}</h1>
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-3xl font-bold text-emerald-600">{product.price.toLocaleString()} ETB</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${product.quantity > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                    {product.quantity > 0 ? `${product.quantity} in stock` : 'Out of stock'}
                  </span>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  {product.description || 'No description available for this product.'}
                </p>
              </div>

              {product.quantity > 0 && (
                <div className="space-y-6 mb-10">
                  <div className="flex items-center gap-4">
                    <span className="font-medium text-gray-900">Quantity:</span>
                    <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="px-4 py-2 hover:bg-gray-50 text-gray-600 transition-colors"
                      >
                        -
                      </button>
                      <span className="px-6 py-2 font-bold text-gray-900 border-x border-gray-200">{quantity}</span>
                      <button
                        onClick={() => setQuantity(Math.min(product.quantity, quantity + 1))}
                        className="px-4 py-2 hover:bg-gray-50 text-gray-600 transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <button className="flex-1 py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2">
                      <ShoppingCart size={20} />
                      Add to Cart
                    </button>
                    <button className="flex-1 py-4 bg-gray-900 text-white font-bold rounded-2xl hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/20">
                      Buy Now
                    </button>
                  </div>
                </div>
              )}

              {/* Trust Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8 border-t border-gray-100">
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <ShieldCheck className="text-emerald-600" size={20} />
                  <span>Secure Payment</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <Truck className="text-emerald-600" size={20} />
                  <span>Fast Delivery</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <RotateCcw className="text-emerald-600" size={20} />
                  <span>Easy Returns</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceProduct;
