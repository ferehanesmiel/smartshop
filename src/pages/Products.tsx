import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, where, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { useSubscription } from '../SubscriptionContext';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  MoreVertical,
  Package,
  X,
  Image as ImageIcon,
  QrCode,
  AlertCircle,
  Store,
  Globe,
  Filter
} from 'lucide-react';
import { Product } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import QRScanner from '../components/QRScanner';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

const Products = () => {
  const { shop } = useAuth();
  const { isLimitReached, getLimit, plan, isSubscriptionActive } = useSubscription();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const productLimit = getLimit('products');
  const limitReached = isLimitReached('products', products.length);
  
  const marketplaceLimit = getLimit('marketplaceProducts');
  const publishedProductsCount = products.filter(p => p.isPublishedToMarketplace).length;
  const marketplaceLimitReached = isLimitReached('marketplaceProducts', publishedProductsCount);

  const handleScan = (barcode: string) => {
    if (isModalOpen) {
      setFormData(prev => ({ ...prev, barcode }));
    } else {
      setSearchTerm(barcode);
    }
    setIsScannerOpen(false);
  };

  useBarcodeScanner(handleScan);

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    costPrice: '',
    quantity: '',
    category: '',
    image: '',
    description: '',
    barcode: '',
    vatRate: '15',
    vatType: 'inclusive' as 'inclusive' | 'exclusive',
    isPublishedToMarketplace: false,
  });

  useEffect(() => {
    if (!shop) return;

    const productsRef = collection(db, 'products');
    const q = query(productsRef, where('shopId', '==', shop.shopId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({
        productId: doc.id,
        ...doc.data()
      } as Product));
      setProducts(productsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [shop]);

  const handleOpenModal = (product?: Product) => {
    if (!isSubscriptionActive) {
      alert("Your subscription has expired. Please renew to add or edit products.");
      return;
    }

    if (!product && limitReached) {
      alert(`You have reached the product limit (${productLimit === Infinity ? 'Unlimited' : productLimit}) for your ${plan} plan. Please upgrade to add more products.`);
      return;
    }

    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        price: product.price.toString(),
        costPrice: product.costPrice?.toString() || '',
        quantity: product.quantity.toString(),
        category: product.category,
        image: product.imageUrl || '',
        description: product.description || '',
        barcode: product.barcode || '',
        vatRate: (product.vatRate ?? 15).toString(),
        vatType: product.vatType || 'inclusive',
        isPublishedToMarketplace: product.isPublishedToMarketplace || false,
      });
    } else {
      setEditingProduct(null);
      setFormData({ 
        name: '', 
        price: '', 
        costPrice: '', 
        quantity: '', 
        category: '', 
        image: '', 
        description: '', 
        barcode: '',
        vatRate: '15',
        vatType: 'inclusive',
        isPublishedToMarketplace: false,
      });
    }
    setIsModalOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit for base64
        alert('Image size too large. Please choose an image under 1MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop) return;

    const productData = {
      name: formData.name,
      price: parseFloat(formData.price),
      costPrice: formData.costPrice ? parseFloat(formData.costPrice) : 0,
      quantity: parseInt(formData.quantity),
      category: formData.category,
      imageUrl: formData.image || `https://picsum.photos/seed/${formData.name}/200`,
      description: formData.description,
      barcode: formData.barcode,
      vatRate: parseFloat(formData.vatRate),
      vatType: formData.vatType,
      isPublishedToMarketplace: formData.isPublishedToMarketplace,
      shopId: shop.shopId,
      shopName: shop.shopName,
      slug: formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
      createdAt: new Date().toISOString(),
    };

    try {
      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.productId), productData);
      } else {
        await addDoc(collection(db, 'products'), productData);
        // Increment product count
        await updateDoc(doc(db, 'shops', shop.shopId), {
          currentProductCount: increment(1)
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving product:', err);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!shop || !window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteDoc(doc(db, 'products', productId));
      // Decrement product count
      await updateDoc(doc(db, 'shops', shop.shopId), {
        currentProductCount: increment(-1)
      });
    } catch (err) {
      console.error('Error deleting product:', err);
    }
  };

  const [activeTab, setActiveTab] = useState<'all' | 'marketplace'>('all');

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'all' || p.isPublishedToMarketplace;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500">Manage your shop's inventory</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          disabled={limitReached || !isSubscriptionActive}
          className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg ${
            limitReached || !isSubscriptionActive
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none' 
              : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200'
          }`}
        >
          <Plus className="w-5 h-5" />
          Add Product
        </button>
      </div>

      {limitReached && (
        <div className="bg-orange-50 border border-orange-200 text-orange-800 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-bold text-orange-900">Product Limit Reached</h3>
            <p className="text-sm mt-1">
              You have reached the maximum number of products ({productLimit === Infinity ? 'Unlimited' : productLimit}) allowed on the {plan} plan.
            </p>
            <Link to="/dashboard/settings" className="text-orange-700 font-bold text-sm mt-2 inline-block hover:underline">
              Upgrade your plan &rarr;
            </Link>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-xl self-start">
          <button
            onClick={() => setActiveTab('all')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-bold transition-all",
              activeTab === 'all' ? "bg-white text-emerald-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            All Products
          </button>
          <button
            onClick={() => setActiveTab('marketplace')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
              activeTab === 'marketplace' ? "bg-white text-emerald-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            <Globe size={16} />
            Marketplace
          </button>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex-1 flex items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search products or categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            />
          </div>
        </div>
      </div>
      
      {isScannerOpen && !isModalOpen && <QRScanner onScan={handleScan} onClose={() => setIsScannerOpen(false)} />}

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-gray-100 h-64 rounded-2xl"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <motion.div
              layout
              key={product.productId}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group"
            >
              <div className="aspect-square bg-gray-100 relative overflow-hidden">
                {product.imageUrl ? (
                  <img 
                    src={product.imageUrl} 
                    alt={product.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <ImageIcon className="w-12 h-12" />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleOpenModal(product)}
                    className="p-2 bg-white rounded-lg shadow-md text-blue-600 hover:bg-blue-50"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(product.productId)}
                    className="p-2 bg-white rounded-lg shadow-md text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {product.isPublishedToMarketplace && (
                  <div className="absolute top-2 left-2 bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider flex items-center gap-1">
                    <Store className="w-3 h-3" />
                    Marketplace
                  </div>
                )}
                {product.quantity <= 5 && (
                  <div className="absolute bottom-2 left-2 bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">
                    Low Stock
                  </div>
                )}
              </div>
              <div className="p-4">
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">{product.category}</p>
                <h3 className="font-bold text-gray-900 truncate">{product.name}</h3>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-lg font-bold text-gray-900">{product.price.toLocaleString()} ETB</p>
                  <p className="text-xs text-gray-500">{product.quantity} in stock</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                      placeholder="e.g. Traditional Dress"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price (ETB)</label>
                    <input
                      type="number"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price (ETB)</label>
                    <input
                      type="number"
                      value={formData.costPrice}
                      onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                    <input
                      type="number"
                      required
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">VAT Rate (%)</label>
                    <input
                      type="number"
                      value={formData.vatRate}
                      onChange={(e) => setFormData({ ...formData, vatRate: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                      placeholder="15"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">VAT Mode</label>
                    <select
                      value={formData.vatType}
                      onChange={(e) => setFormData({ ...formData, vatType: e.target.value as 'inclusive' | 'exclusive' })}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    >
                      <option value="inclusive">Inclusive</option>
                      <option value="exclusive">Exclusive</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <input
                      type="text"
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                      placeholder="e.g. Clothing, Food, Electronics"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Barcode / QR Code (Optional)</label>
                    {isScannerOpen && isModalOpen ? (
                      <div className="relative aspect-video bg-black rounded-xl overflow-hidden mb-2">
                        <QRScanner 
                          onScan={(code) => {
                            setFormData(prev => ({ ...prev, barcode: code }));
                            setIsScannerOpen(false);
                          }} 
                          onClose={() => setIsScannerOpen(false)} 
                          inline
                        />
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={formData.barcode}
                          onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                          className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                          placeholder="Scan or enter code"
                        />
                        <button
                          type="button"
                          onClick={() => setIsScannerOpen(true)}
                          className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl hover:bg-emerald-100 transition-all border border-emerald-100"
                        >
                          <QrCode className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none min-h-[80px]"
                      placeholder="Product details, features, etc."
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Image</label>
                    <div className="flex flex-col gap-3">
                      {formData.image && (
                        <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200">
                          <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                          <button 
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          id="image-upload"
                        />
                        <label
                          htmlFor="image-upload"
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 border-dashed rounded-xl cursor-pointer hover:bg-gray-100 transition-all"
                        >
                          <ImageIcon className="w-5 h-5 text-gray-400" />
                          <span className="text-sm text-gray-600">Upload Image</span>
                        </label>
                        <div className="flex-1">
                          <input
                            type="url"
                            value={formData.image.startsWith('data:') ? '' : formData.image}
                            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                            placeholder="Or paste URL..."
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-gray-400">Recommended: Square image, max 1MB</p>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className={`flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer group ${
                      formData.isPublishedToMarketplace 
                        ? 'bg-emerald-50 border-emerald-100' 
                        : 'bg-gray-50 border-gray-100'
                    } ${(!isSubscriptionActive || (!formData.isPublishedToMarketplace && marketplaceLimitReached)) ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <input
                        type="checkbox"
                        checked={formData.isPublishedToMarketplace}
                        disabled={!isSubscriptionActive || (!formData.isPublishedToMarketplace && marketplaceLimitReached)}
                        onChange={(e) => {
                          if (!isSubscriptionActive) {
                            alert("Your subscription has expired. Please renew to publish products to the marketplace.");
                            return;
                          }
                          if (e.target.checked && marketplaceLimitReached) {
                            alert(`Marketplace product limit reached (${marketplaceLimit}). Please upgrade your plan.`);
                            return;
                          }
                          setFormData({ ...formData, isPublishedToMarketplace: e.target.checked });
                        }}
                        className="w-5 h-5 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div>
                        <p className="font-bold text-emerald-900">Publish to Online Marketplace</p>
                        <p className="text-xs text-emerald-600">
                          {!isSubscriptionActive 
                            ? 'Subscription expired' 
                            : (marketplaceLimitReached && !formData.isPublishedToMarketplace 
                              ? `Limit reached (${marketplaceLimit})` 
                              : 'Make this product visible to customers in the marketplace')}
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              </form>
              <div className="p-6 border-t border-gray-100 flex gap-3 shrink-0 bg-white">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
                >
                  {editingProduct ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Products;
