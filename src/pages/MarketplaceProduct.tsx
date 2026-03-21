import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, limit, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Product, Shop, Order } from '../types';
import { Package, ShoppingCart, Store, ChevronLeft, ShieldCheck, Truck, RotateCcw, Plus, Wallet as WalletIcon, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCart } from '../CartContext';
import { useAuth } from '../AuthContext';
import { useWallet } from '../WalletContext';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

const MarketplaceProduct = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { wallet, payWithSBR } = useWallet();
  const [product, setProduct] = useState<Product | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

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
          const productData = { id: productSnapshot.docs[0].id, ...productSnapshot.docs[0].data() } as Product;
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

  const handleSendRunner = async () => {
    if (!user || !product || !shop) {
      toast.error('Please login to order');
      navigate('/login');
      return;
    }

    if (!wallet || wallet.balance_sbr < product.price * quantity) {
      toast.error('Insufficient SBR balance');
      return;
    }

    setIsProcessing(true);
    try {
      const success = await payWithSBR(product.price * quantity);
      if (success) {
        // Create order
        const orderData: Partial<Order> = {
          user_id: user.uid,
          shop_id: shop.shopId,
          products: [{
            productId: product.productId || product.id,
            name: typeof product.name === 'string' ? product.name : product.name.en,
            price: product.price,
            quantity: quantity,
            shopId: shop.shopId || shop.id,
            imageUrl: product.imageUrl || (product.images && product.images[0])
          }],
          total_price: product.price * quantity,
          totalAmount: product.price * quantity,
          status: 'pending',
          payment_status: 'paid',
          payment_method: 'SBR',
          paymentMethod: 'sbr',
          delivery_type: 'runner',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const docRef = await addDoc(collection(db, 'orders'), orderData);
        toast.success('Runner dispatched! Track your order in dashboard.');
        navigate('/dashboard/orders');
      } else {
        toast.error('Payment failed');
      }
    } catch (error) {
      console.error('Order failed:', error);
      toast.error('Something went wrong');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-dark flex flex-col items-center justify-center p-4">
        <Package size={64} className="text-dark-border mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Product Not Found</h1>
        <p className="text-gray-500 mb-6">The product you are looking for does not exist or has been removed.</p>
        <Link to="/marketplace" className="px-6 py-2 bg-brand text-white rounded-xl hover:bg-brand-dark transition-colors">
          Back to Marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <Link to="/marketplace" className="inline-flex items-center gap-2 text-gray-500 hover:text-brand transition-colors mb-8">
          <ChevronLeft size={20} />
          Back to Marketplace
        </Link>

        <div className="bg-dark-surface rounded-3xl border border-dark-border overflow-hidden shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Product Image */}
            <div className="p-8 lg:p-12 bg-dark flex items-center justify-center relative">
              <div className="absolute top-8 left-8 bg-brand/10 text-brand text-xs font-bold px-4 py-1.5 rounded-full border border-brand/20">
                PREMIUM
              </div>
              <div className="relative aspect-square w-full max-w-md rounded-3xl overflow-hidden shadow-2xl bg-dark-surface border border-dark-border">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={typeof product.name === 'string' ? product.name : product.name.en}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-dark-border">
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
                  className="inline-flex items-center gap-2 text-brand font-bold hover:underline mb-4"
                >
                  <Store size={18} />
                  {shop?.shopName || 'Unknown Shop'}
                </Link>
                <h1 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                  {typeof product.name === 'string' ? product.name : product.name.en}
                </h1>
                <div className="flex items-center gap-6 mb-8">
                  <div className="flex flex-col">
                    <span className="text-4xl font-bold text-brand">{product.price.toLocaleString()}</span>
                    <span className="text-xs text-gray-500 uppercase tracking-widest">ETB / SBR</span>
                  </div>
                  <div className="h-10 w-px bg-dark-border" />
                  <span className={`px-4 py-1.5 rounded-full text-sm font-bold border ${product.quantity > 0 ? 'bg-brand/10 text-brand border-brand/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                    {product.quantity > 0 ? `${product.quantity} in stock` : 'Out of stock'}
                  </span>
                </div>
                <p className="text-gray-400 leading-relaxed text-lg">
                  {product.description || 'No description available for this product.'}
                </p>
              </div>

              {product.quantity > 0 && (
                <div className="space-y-8 mb-12">
                  <div className="flex items-center gap-6">
                    <span className="font-bold text-gray-300">Quantity:</span>
                    <div className="flex items-center bg-dark rounded-2xl border border-dark-border overflow-hidden">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="px-5 py-3 hover:bg-dark-surface text-gray-400 hover:text-white transition-colors"
                      >
                        -
                      </button>
                      <span className="px-8 py-3 font-bold text-white border-x border-dark-border">{quantity}</span>
                      <button
                        onClick={() => setQuantity(Math.min(product.quantity, quantity + 1))}
                        className="px-5 py-3 hover:bg-dark-surface text-gray-400 hover:text-white transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button 
                      onClick={() => {
                        if (product && shop) {
                          addToCart({
                            productId: product.productId || product.id,
                            name: typeof product.name === 'string' ? product.name : product.name.en,
                            price: product.price,
                            quantity: quantity,
                            imageUrl: product.imageUrl || (product.images && product.images[0]),
                            shopId: product.shopId,
                            shopName: shop.name || shop.shopName
                          });
                          toast.success('Added to cart');
                        }
                      }}
                      className="py-4 bg-dark-surface text-white font-bold rounded-2xl border border-dark-border hover:border-brand transition-all flex items-center justify-center gap-2"
                    >
                      <ShoppingCart size={20} />
                      Add to Cart
                    </button>
                    <button 
                      onClick={handleSendRunner}
                      disabled={isProcessing}
                      className="py-4 bg-brand text-white font-bold rounded-2xl hover:bg-brand-dark transition-all shadow-xl shadow-brand/20 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <Zap size={20} />
                          Send Runner (SBR)
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Trust Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-10 border-t border-dark-border">
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center text-brand">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-white">Secure</p>
                    <p className="text-xs">SBR Protected</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center text-brand">
                    <Truck size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-white">Runner Link</p>
                    <p className="text-xs">Fast Delivery</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center text-brand">
                    <RotateCcw size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-white">Returns</p>
                    <p className="text-xs">Easy Policy</p>
                  </div>
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
