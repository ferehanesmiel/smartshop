import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, addDoc, doc, updateDoc, increment, setDoc, getDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { useSubscription } from '../SubscriptionContext';
import { 
  Search, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  User, 
  Phone,
  Receipt,
  CheckCircle2,
  X,
  QrCode,
  Tag,
  Lock
} from 'lucide-react';
import { Product, SaleItem, Sale, Receipt as ReceiptType } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { sendSMS } from '../services/smsService';
import QRScanner from '../components/QRScanner';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';

const POS = () => {
  const { shop } = useAuth();
  const { isFeatureAllowed } = useSubscription();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [discount, setDiscount] = useState<number>(0);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [showCartOnMobile, setShowCartOnMobile] = useState(false);

  const hasDiscountAccess = isFeatureAllowed('discounts');

  const handleScan = (barcode: string) => {
    const product = products.find(p => 
      p.barcode === barcode || 
      p.productId === barcode || 
      p.name.toLowerCase() === barcode.toLowerCase()
    );
    if (product) {
      addToCart(product);
      setIsScannerOpen(false);
    }
  };

  useBarcodeScanner(handleScan);

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

  const addToCart = (product: Product) => {
    if (product.quantity <= 0) return;
    
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.productId);
      if (existing) {
        if (existing.quantity >= product.quantity) return prev;
        return prev.map(item => 
          item.productId === product.productId 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { 
        productId: product.productId, 
        name: product.name, 
        price: product.price, 
        costPrice: product.costPrice || 0,
        quantity: 1 
      }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.productId === productId) {
        const product = products.find(p => p.productId === productId);
        const newQty = item.quantity + delta;
        if (newQty <= 0) return item;
        if (product && newQty > product.quantity) return item;
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  
  let vatAmount = 0;
  let total = 0;
  const baseAmount = Math.max(0, subtotal - discount);

  if (shop?.isVatEnabled) {
    const rate = shop.vatRate || 15;
    if (shop.vatType === 'inclusive') {
      total = baseAmount;
      vatAmount = total * (rate / (100 + rate));
    } else {
      vatAmount = baseAmount * (rate / 100);
      total = baseAmount + vatAmount;
    }
  } else {
    total = baseAmount;
  }

  const handleCheckout = async () => {
    if (!shop || cart.length === 0) return;

    const saleData: Omit<Sale, 'saleId'> = {
      shopId: shop.shopId,
      items: cart.map(item => ({
        productId: item.productId,
        productName: item.name,
        quantity: item.quantity,
        price: item.price,
        costPrice: item.costPrice || 0
      })),
      subtotal,
      discount,
      vatAmount,
      totalAmount: total,
      paymentMethod: 'cash', // Default to cash
      customerPhone,
      createdAt: new Date().toISOString(),
    };

    try {
      // 1. Save Sale
      const saleRef = await addDoc(collection(db, 'sales'), saleData);
      const saleId = saleRef.id;

      // 2. Update Stock for each item
      for (const item of cart) {
        const productRef = doc(db, 'products', item.productId);
        await updateDoc(productRef, {
          quantity: increment(-item.quantity)
        });
      }

      // 3. Update/Create Customer
      if (customerPhone) {
        const customerRef = doc(db, 'customers', customerPhone);
        const customerSnap = await getDoc(customerRef);
        
        if (customerSnap.exists()) {
          await updateDoc(customerRef, {
            purchaseCount: increment(1),
            loyaltyPoints: increment(1), // 1 purchase = 1 loyalty point
            lastPurchaseDate: new Date().toISOString()
          });
        } else {
          await setDoc(customerRef, {
            customerId: customerPhone,
            shopId: shop.shopId,
            name: customerName || 'Valued Customer',
            phone: customerPhone,
            purchaseCount: 1,
            loyaltyPoints: 1,
            lastPurchaseDate: new Date().toISOString()
          });
        }
      }

      setLastSale({ saleId, ...saleData } as Sale);

      // 4. Create Digital Receipt
      const receiptData: Omit<ReceiptType, 'receiptId'> = {
        shopId: shop.shopId,
        saleId: saleId,
        customerPhone: customerPhone || null,
        items: saleData.items,
        subtotal,
        discount,
        vatAmount,
        totalAmount: total,
        paymentMethod: saleData.paymentMethod,
        createdAt: saleData.createdAt,
        shopName: shop.shopName
      };
      await addDoc(collection(db, 'receipts'), receiptData);

      // 5. Send SMS Notification
      if (customerPhone) {
        sendSMS({
          to: customerPhone,
          message: `Thank you for shopping at ${shop.shopName}. Your purchase total is ${total} ETB. Visit again!`,
          shopName: shop.shopName
        });
      }

      setIsReceiptOpen(true);
      setCart([]);
      setCustomerPhone('');
      setCustomerName('');
    } catch (err) {
      console.error('Checkout error:', err);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sendReceiptWhatsApp = () => {
    if (!lastSale) return;
    const message = `Receipt from ${shop?.shopName}\nSale ID: ${lastSale?.saleId?.slice(0, 6)}\nSubtotal: ${lastSale.subtotal?.toLocaleString()} ETB\nDiscount: ${lastSale.discount?.toLocaleString()} ETB\nVAT: ${lastSale.vatAmount?.toLocaleString()} ETB\nTotal: ${lastSale.totalAmount.toLocaleString()} ETB\nThank you for shopping with us!`;
    window.open(`https://wa.me/${customerPhone.replace(/\s+/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const sendReceiptTelegram = () => {
    if (!lastSale) return;
    const message = `Receipt from ${shop?.shopName}\nSale ID: ${lastSale?.saleId?.slice(0, 6)}\nSubtotal: ${lastSale.subtotal?.toLocaleString()} ETB\nDiscount: ${lastSale.discount?.toLocaleString()} ETB\nVAT: ${lastSale.vatAmount?.toLocaleString()} ETB\nTotal: ${lastSale.totalAmount.toLocaleString()} ETB\nThank you for shopping with us!`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.origin)}&text=${encodeURIComponent(message)}`, '_blank');
  };

  const sendReceiptSMS = () => {
    if (!lastSale || !customerPhone) return;
    sendSMS({
      to: customerPhone,
      message: `Receipt from ${shop?.shopName}. Total: ${lastSale.totalAmount.toLocaleString()} ETB. Thank you!`,
      shopName: shop?.shopName || 'SmartShop'
    });
    alert('Receipt sent via SMS!');
  };

  const printReceipt = () => {
    window.print();
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-full lg:h-[calc(100vh-120px)] relative">
      {/* Product Selection */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0",
        showCartOnMobile ? "hidden lg:flex" : "flex"
      )}>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Point of Sale</h1>
          <div className="mt-4 relative flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all shadow-sm"
              />
            </div>
            <button
              onClick={() => setIsScannerOpen(true)}
              className="bg-emerald-50 text-emerald-600 px-4 py-3 rounded-2xl hover:bg-emerald-100 transition-all flex items-center gap-2 border border-emerald-100"
            >
              <QrCode className="w-5 h-5" />
              <span className="text-sm font-bold">Scan</span>
            </button>
          </div>
        </div>
        
        {isScannerOpen && <QRScanner onScan={handleScan} onClose={() => setIsScannerOpen(false)} />}

        <div className="flex-1 overflow-y-auto pb-24 lg:pb-0 pr-2 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <button
              key={product.productId}
              onClick={() => addToCart(product)}
              disabled={product.quantity <= 0}
              className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all text-left flex flex-col group disabled:opacity-50"
            >
              <div className="aspect-square rounded-xl bg-gray-50 mb-3 overflow-hidden relative">
                {product.imageUrl && (
                  <img 
                    src={product.imageUrl} 
                    alt={product.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                    referrerPolicy="no-referrer"
                  />
                )}
                {product.quantity <= 0 && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-xs font-bold uppercase">
                    Out of Stock
                  </div>
                )}
              </div>
              <h3 className="font-bold text-sm text-gray-900 truncate">{product.name}</h3>
              <p className="text-emerald-600 font-bold mt-1">{product.price.toLocaleString()} ETB</p>
              <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">{product.category}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Cart / Checkout */}
      <div className={cn(
        "w-full lg:w-96 bg-white rounded-3xl border border-gray-100 shadow-xl flex flex-col overflow-hidden transition-all",
        showCartOnMobile ? "fixed inset-0 z-40 lg:relative lg:inset-auto" : "hidden lg:flex"
      )}>
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="text-emerald-600 w-5 h-5" />
            <h2 className="font-bold text-gray-900">Current Order</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2 py-1 rounded-lg">
              {cart.length} items
            </span>
            <button 
              onClick={() => setShowCartOnMobile(false)}
              className="lg:hidden p-2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center">
              <ShoppingCart className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-sm">Your cart is empty.<br/>Select products to start.</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.productId} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.price.toLocaleString()} ETB</p>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1">
                  <button 
                    onClick={() => updateQuantity(item.productId, -1)}
                    className="p-1 hover:bg-white rounded text-gray-500"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                  <button 
                    onClick={() => updateQuantity(item.productId, 1)}
                    className="p-1 hover:bg-white rounded text-gray-500"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <button 
                  onClick={() => removeFromCart(item.productId)}
                  className="text-red-400 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100 space-y-4">
          <div className="space-y-2">
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="tel"
                placeholder="Customer Phone (Optional)"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            {customerPhone && (
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Customer Name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            )}
          </div>

          <div className="space-y-2 pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-medium text-gray-900">{subtotal.toLocaleString()} ETB</span>
            </div>
            
            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-500 text-sm flex items-center gap-1">
                <Tag className="w-4 h-4" />
                Discount
              </span>
              <div className="relative w-32">
                <input
                  type="number"
                  min="0"
                  max={subtotal}
                  value={discount || ''}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  disabled={!hasDiscountAccess}
                  placeholder="0"
                  className={cn(
                    "w-full pr-8 pl-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500 text-right",
                    !hasDiscountAccess && "bg-gray-100 text-gray-400 cursor-not-allowed"
                  )}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">ETB</span>
              </div>
            </div>
            
            {!hasDiscountAccess && (
              <div className="flex items-center gap-1 text-[10px] text-orange-600 bg-orange-50 p-1.5 rounded-lg">
                <Lock className="w-3 h-3" />
                <span>Discounts available on Pro plan. <Link to="/dashboard/settings" className="font-bold underline">Upgrade</Link></span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <span className="text-gray-500 font-medium">Total</span>
            <span className="text-2xl font-bold text-gray-900">{total.toLocaleString()} ETB</span>
          </div>

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Receipt className="w-5 h-5" />
            Complete Sale
          </button>
        </div>
      </div>

      {/* Mobile Cart Toggle */}
      {!showCartOnMobile && cart.length > 0 && (
        <button
          onClick={() => setShowCartOnMobile(true)}
          className="lg:hidden fixed bottom-20 right-4 z-30 bg-emerald-600 text-white p-4 rounded-full shadow-2xl flex items-center gap-2 animate-bounce"
        >
          <ShoppingCart className="w-6 h-6" />
          <span className="font-bold">{cart.length}</span>
        </button>
      )}

      {/* Receipt Modal */}
      <AnimatePresence>
        {isReceiptOpen && lastSale && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="text-emerald-600 w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Sale Complete!</h2>
                <p className="text-gray-500 mt-1">Receipt generated successfully</p>
                
                  <div className="mt-8 p-6 bg-gray-50 rounded-2xl border border-dashed border-gray-300 text-left print:border-none print:bg-white">
                    <div className="text-center mb-4 hidden print:block">
                      <h2 className="text-xl font-bold">{shop?.shopName}</h2>
                      <p className="text-xs text-gray-500">{shop?.address}</p>
                      <p className="text-xs text-gray-500">{shop?.phone}</p>
                      <div className="border-b border-gray-200 my-4"></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mb-4">
                      <span>{new Date(lastSale.createdAt).toLocaleString()}</span>
                      <span>#{lastSale?.saleId?.slice(0, 6)}</span>
                    </div>
                    <div className="space-y-2 mb-4">
                      {lastSale.items.map((item, i) => (
                        <div key={item.productId} className="flex justify-between text-sm">
                          <span>{item.productName} x{item.quantity}</span>
                          <span className="font-medium">{(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-gray-200 pt-4 space-y-1">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Subtotal</span>
                        <span>{lastSale.subtotal?.toLocaleString()} ETB</span>
                      </div>
                      {lastSale.discount > 0 && (
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Discount</span>
                          <span>-{lastSale.discount?.toLocaleString()} ETB</span>
                        </div>
                      )}
                      {lastSale.vatAmount > 0 && (
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>VAT ({shop?.vatRate}%)</span>
                          <span>{lastSale.vatAmount?.toLocaleString()} ETB</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-100">
                        <span>Total</span>
                        <span>{lastSale.totalAmount.toLocaleString()} ETB</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 grid grid-cols-2 gap-3 print:hidden">
                    <button
                      onClick={printReceipt}
                      className="col-span-2 bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
                    >
                      <Receipt className="w-5 h-5" />
                      Print Receipt
                    </button>
                    
                    {customerPhone && (
                      <>
                        <button
                          onClick={sendReceiptWhatsApp}
                          className="bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                        >
                          WhatsApp
                        </button>
                        <button
                          onClick={sendReceiptSMS}
                          className="bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                        >
                          SMS
                        </button>
                      </>
                    )}
                    
                    <button
                      onClick={sendReceiptTelegram}
                      className="col-span-2 bg-sky-500 text-white py-3 rounded-xl font-bold hover:bg-sky-600 transition-all flex items-center justify-center gap-2"
                    >
                      Share via Telegram
                    </button>

                    <button
                      onClick={() => setIsReceiptOpen(false)}
                      className="col-span-2 py-3 text-gray-500 font-bold hover:text-gray-900 transition-all"
                    >
                      Close
                    </button>
                  </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default POS;
