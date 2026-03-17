import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Product, Shop } from '../types';
import { ShoppingCart, ArrowLeft, Store, Star, Truck, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { useCart } from '../CartContext';

const MarketplaceProduct = () => {
  const { productId } = useParams<{ productId: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProductAndShop = async () => {
      if (!productId) return;
      
      try {
        const productDoc = await getDoc(doc(db, 'products', productId));
        if (productDoc.exists()) {
          const productData = { productId: productDoc.id, ...productDoc.data() } as Product;
          setProduct(productData);

          // Fetch shop details
          const shopDoc = await getDoc(doc(db, 'shops', productData.shopId));
          if (shopDoc.exists()) {
            const shopData = { shopId: shopDoc.id, ...shopDoc.data() } as Shop;
            if (!shopData.isMarketplaceEnabled || shopData.status !== 'active' || shopData.plan !== 'premium') {
              setProduct(null); // Hide product if shop is inactive
              setLoading(false);
              return;
            }
            setShop(shopData);
          }
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProductAndShop();
  }, [productId]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
        <ShoppingCart className="w-16 h-16 text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h1>
        <p className="text-gray-500 mb-8">The product you're looking for doesn't exist or has been removed.</p>
        <Link to="/shops" className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all">
          Browse Marketplace
        </Link>
      </div>
    );
  }

  const handleAddToCart = () => {
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

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/shops" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-emerald-600 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Shops
        </Link>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row">
          {/* Product Image */}
          <div className="w-full md:w-1/2 aspect-square md:aspect-auto bg-gray-50 relative">
            {product.imageUrl ? (
              <img 
                src={product.imageUrl} 
                alt={product.name} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <Store className="w-24 h-24" />
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-bold text-emerald-600 uppercase tracking-wider">
                  {product.category}
                </p>
                <div className="flex items-center gap-1 text-amber-400">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="text-sm font-bold text-gray-700">4.8</span>
                  <span className="text-xs text-gray-400">(124 reviews)</span>
                </div>
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{product.name}</h1>
              
              <div className="flex items-baseline gap-4 mb-8">
                <span className="text-4xl font-bold text-gray-900">
                  {product.price.toLocaleString()} ETB
                </span>
                {product.quantity > 0 ? (
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full">
                    In Stock ({product.quantity})
                  </span>
                ) : (
                  <span className="bg-red-100 text-red-800 text-xs font-bold px-3 py-1 rounded-full">
                    Out of Stock
                  </span>
                )}
              </div>
              
              {product.description && (
                <div className="mb-8">
                  <h3 className="text-sm font-bold text-gray-900 mb-3">Description</h3>
                  <p className="text-gray-600 leading-relaxed">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Shop Info */}
              {shop && (
                <div className="bg-gray-50 rounded-2xl p-4 mb-8 flex items-center gap-4 border border-gray-100">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center overflow-hidden border border-gray-100 shrink-0">
                    {shop.logoUrl ? (
                      <img src={shop.logoUrl} alt={shop.shopName} className="w-full h-full object-cover" />
                    ) : (
                      <Store className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Sold by</p>
                    <Link to={`/shop/${shop.slug}`} className="font-bold text-gray-900 hover:text-emerald-600 transition-colors truncate block">
                      {shop.shopName}
                    </Link>
                  </div>
                  <Link to={`/shop/${shop.slug}`} className="text-sm font-bold text-emerald-600 hover:text-emerald-700">
                    Visit Shop
                  </Link>
                </div>
              )}

              {/* Trust Badges */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Truck className="w-5 h-5 text-emerald-600" />
                  <span>Fast Delivery</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span>Secure Payment</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={product.quantity <= 0}
              className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
            >
              <ShoppingCart className="w-5 h-5" />
              {product.quantity > 0 ? 'Add to Cart' : 'Out of Stock'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceProduct;
