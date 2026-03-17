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
  Lock,
  CreditCard,
  Smartphone,
  Building2,
  Coins,
  Download,
  Printer,
  Share2
} from 'lucide-react';
import { Product, SaleItem, Sale, Receipt as ReceiptType } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { sendSMS } from '../services/smsService';
import QRScanner from '../components/QRScanner';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';
import jsPDF from 'jspdf';

const POS = () => {
  const { shop } = useAuth();
  const { isFeatureAllowed } = useSubscription();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [discount, setDiscount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'telebirr' | 'bank_transfer' | 'card'>('cash');
  const [amountPaid, setAmountPaid] = useState<string>('');
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
        productName: product.name, 
        price: product.price, 
        costPrice: product.costPrice || 0,
        quantity: 1,
        vatRate: product.vatRate || 15,
        vatType: product.vatType || 'inclusive'
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

  // Advanced VAT and Profit Calculations
  const cartWithCalculations = cart.map(item => {
    const rate = item.vatRate || 15;
    let netPrice = 0;
    let vatAmount = 0;
    let sellingPrice = 0;

    if (item.vatType === 'exclusive') {
      netPrice = item.price;
      vatAmount = netPrice * (rate / 100);
      sellingPrice = netPrice + vatAmount;
    } else {
      sellingPrice = item.price;
      netPrice = sellingPrice / (1 + rate / 100);
      vatAmount = sellingPrice - netPrice;
    }

    const profit = netPrice - (item.costPrice || 0);

    return {
      ...item,
      netPrice,
      vatAmount,
      sellingPrice,
      profit,
      totalItemPrice: sellingPrice * item.quantity,
      totalItemVat: vatAmount * item.quantity,
      totalItemNet: netPrice * item.quantity,
      totalItemProfit: profit * item.quantity,
      totalItemCost: (item.costPrice || 0) * item.quantity
    };
  });

  const subtotal = cartWithCalculations.reduce((acc, item) => acc + item.totalItemNet, 0);
  const totalVat = cartWithCalculations.reduce((acc, item) => acc + item.totalItemVat, 0);
  const totalCost = cartWithCalculations.reduce((acc, item) => acc + item.totalItemCost, 0);
  const grandTotal = cartWithCalculations.reduce((acc, item) => acc + item.totalItemPrice, 0) - discount;
  const totalProfit = cartWithCalculations.reduce((acc, item) => acc + item.totalItemProfit, 0) - discount;

  const changeAmount = amountPaid ? parseFloat(amountPaid) - grandTotal : 0;

  const handleCheckout = async () => {
    if (!shop || cart.length === 0) return;

    const saleData: any = {
      shopId: shop.shopId,
      items: cartWithCalculations.map(item => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
        costPrice: item.costPrice || 0,
        vatRate: item.vatRate,
        vatType: item.vatType,
        vatAmount: item.vatAmount,
        netPrice: item.netPrice,
        profit: item.profit
      })),
      subtotal,
      discount,
      vatAmount: totalVat,
      totalAmount: grandTotal,
      totalCost,
      totalProfit,
      paymentMethod,
      amountPaid: amountPaid ? parseFloat(amountPaid) : grandTotal,
      changeAmount: changeAmount > 0 ? changeAmount : 0,
      createdAt: new Date().toISOString(),
    };

    if (customerPhone) saleData.customerPhone = customerPhone;
    if (customerName) saleData.customerName = customerName;
    if (shop.ownerName) saleData.cashierName = shop.ownerName;

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
      const receiptData: any = {
        shopId: shop.shopId,
        saleId: saleId,
        items: saleData.items,
        subtotal: saleData.subtotal,
        discount: saleData.discount,
        vatAmount: saleData.vatAmount,
        totalAmount: saleData.totalAmount,
        totalCost: saleData.totalCost,
        totalProfit: saleData.totalProfit,
        paymentMethod: saleData.paymentMethod,
        amountPaid: saleData.amountPaid,
        changeAmount: saleData.changeAmount,
        createdAt: saleData.createdAt,
        shopName: shop.shopName,
      };

      if (customerPhone) receiptData.customerPhone = customerPhone;
      if (customerName) receiptData.customerName = customerName;
      if (saleData.cashierName) receiptData.cashierName = saleData.cashierName;
      if (shop.address) receiptData.shopAddress = shop.address;
      if (shop.phone) receiptData.shopPhone = shop.phone;

      await addDoc(collection(db, 'receipts'), receiptData);

      // 5. Send SMS Notification
      if (customerPhone) {
        sendSMS({
          to: customerPhone,
          message: `Thank you for shopping at ${shop.shopName}. Your purchase total is ${grandTotal} ETB. Visit again!`,
          shopName: shop.shopName
        });
      }

      setIsReceiptOpen(true);
      setCart([]);
      setCustomerPhone('');
      setCustomerName('');
      setAmountPaid('');
      setDiscount(0);
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

  const downloadPDF = () => {
    if (!lastSale || !shop) return;
    const doc = new jsPDF({
      unit: 'mm',
      format: [80, 200]
    });

    doc.setFontSize(12);
    doc.text(shop.shopName, 40, 10, { align: 'center' });
    doc.setFontSize(8);
    doc.text(shop.address || 'Addis Ababa', 40, 15, { align: 'center' });
    doc.text(shop.phone || '', 40, 18, { align: 'center' });
    doc.text('--------------------------------', 40, 22, { align: 'center' });
    
    doc.text(`Date: ${new Date(lastSale.createdAt).toLocaleString()}`, 5, 28);
    doc.text(`Receipt: #${lastSale.saleId.slice(0, 6)}`, 5, 32);
    doc.text(`Cashier: ${lastSale.cashierName || 'Admin'}`, 5, 36);
    doc.text('--------------------------------', 40, 40, { align: 'center' });

    let y = 45;
    lastSale.items.forEach(item => {
      doc.text(`${item.productName}`, 5, y);
      doc.text(`${item.quantity} x ${item.price.toFixed(2)}`, 5, y + 4);
      doc.text(`${(item.price * item.quantity).toFixed(2)}`, 75, y + 4, { align: 'right' });
      y += 10;
    });

    doc.text('--------------------------------', 40, y, { align: 'center' });
    y += 5;
    doc.text('Subtotal:', 5, y);
    doc.text(`${lastSale.subtotal?.toFixed(2)}`, 75, y, { align: 'right' });
    y += 4;
    doc.text('VAT Total:', 5, y);
    doc.text(`${lastSale.vatAmount?.toFixed(2)}`, 75, y, { align: 'right' });
    y += 4;
    doc.text('Grand Total:', 5, y);
    doc.setFontSize(10);
    doc.text(`${lastSale.totalAmount.toFixed(2)} ETB`, 75, y, { align: 'right' });
    
    y += 10;
    doc.setFontSize(8);
    doc.text('Thank you for shopping!', 40, y, { align: 'center' });
    doc.text('Powered by SmartShop Ethiopia', 40, y + 4, { align: 'center' });

    doc.save(`receipt-${lastSale.saleId.slice(0, 6)}.pdf`);
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
              cartWithCalculations.map((item) => (
                <div key={item.productId} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{item.productName}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-500">{item.sellingPrice.toLocaleString()} ETB</p>
                      <span className="text-[10px] bg-gray-100 px-1 rounded text-gray-400 uppercase">{item.vatType}</span>
                    </div>
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
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="tel"
                    placeholder="Phone"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="relative flex-1">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setPaymentMethod('cash')}
                className={cn(
                  "flex flex-col items-center justify-center p-2 rounded-xl border transition-all gap-1",
                  paymentMethod === 'cash' ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-gray-600 border-gray-200 hover:border-emerald-200"
                )}
              >
                <Coins className="w-4 h-4" />
                <span className="text-[10px] font-bold">Cash</span>
              </button>
              <button
                onClick={() => setPaymentMethod('telebirr')}
                className={cn(
                  "flex flex-col items-center justify-center p-2 rounded-xl border transition-all gap-1",
                  paymentMethod === 'telebirr' ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:border-blue-200"
                )}
              >
                <Smartphone className="w-4 h-4" />
                <span className="text-[10px] font-bold">Telebirr</span>
              </button>
              <button
                onClick={() => setPaymentMethod('bank_transfer')}
                className={cn(
                  "flex flex-col items-center justify-center p-2 rounded-xl border transition-all gap-1",
                  paymentMethod === 'bank_transfer' ? "bg-purple-600 text-white border-purple-600" : "bg-white text-gray-600 border-gray-200 hover:border-purple-200"
                )}
              >
                <Building2 className="w-4 h-4" />
                <span className="text-[10px] font-bold">Bank</span>
              </button>
              <button
                onClick={() => setPaymentMethod('card')}
                className={cn(
                  "flex flex-col items-center justify-center p-2 rounded-xl border transition-all gap-1",
                  paymentMethod === 'card' ? "bg-orange-600 text-white border-orange-600" : "bg-white text-gray-600 border-gray-200 hover:border-orange-200"
                )}
              >
                <CreditCard className="w-4 h-4" />
                <span className="text-[10px] font-bold">Card</span>
              </button>
            </div>

            {paymentMethod === 'cash' && (
              <div className="space-y-2">
                <div className="relative">
                  <Coins className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="number"
                    placeholder="Amount Paid"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                {amountPaid && parseFloat(amountPaid) >= grandTotal && (
                  <div className="flex justify-between items-center px-3 py-2 bg-emerald-50 rounded-xl text-emerald-700">
                    <span className="text-xs font-bold">Change</span>
                    <span className="font-bold">{changeAmount.toLocaleString()} ETB</span>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2 pt-2 border-t border-gray-100 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Subtotal (Net)</span>
                <span className="font-medium text-gray-900">{subtotal.toLocaleString()} ETB</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">VAT Total</span>
                <span className="font-medium text-gray-900">{totalVat.toLocaleString()} ETB</span>
              </div>
              
              <div className="flex items-center justify-between gap-4">
                <span className="text-gray-500 flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  Discount
                </span>
                <div className="relative w-24">
                  <input
                    type="number"
                    min="0"
                    max={grandTotal + discount}
                    value={discount || ''}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    disabled={!hasDiscountAccess}
                    placeholder="0"
                    className={cn(
                      "w-full pr-6 pl-2 py-1 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500 text-right",
                      !hasDiscountAccess && "bg-gray-100 text-gray-400 cursor-not-allowed"
                    )}
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-[10px] font-bold">ETB</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <span className="text-gray-500 font-medium">Grand Total</span>
              <span className="text-2xl font-bold text-gray-900">{grandTotal.toLocaleString()} ETB</span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || (paymentMethod === 'cash' && amountPaid && parseFloat(amountPaid) < grandTotal)}
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
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-emerald-600 text-white">
                <h2 className="font-bold">Sale Complete</h2>
                <button onClick={() => setIsReceiptOpen(false)} className="hover:bg-white/20 p-1 rounded-lg transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div id="receipt-content" className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm text-left font-mono text-xs">
                  <div className="text-center mb-6">
                    <h2 className="text-lg font-bold uppercase tracking-widest">{shop?.shopName}</h2>
                    <p className="text-gray-500">{shop?.address || 'Addis Ababa, Ethiopia'}</p>
                    <p className="text-gray-500">Tel: {shop?.phone}</p>
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <div className="h-px bg-gray-200 flex-1"></div>
                      <span className="text-[10px] text-gray-400 uppercase tracking-tighter">Official Receipt</span>
                      <div className="h-px bg-gray-200 flex-1"></div>
                    </div>
                  </div>

                  <div className="space-y-1 mb-6">
                    <div className="flex justify-between">
                      <span>Receipt #:</span>
                      <span className="font-bold">{lastSale?.saleId?.slice(0, 8).toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Date:</span>
                      <span>{new Date(lastSale.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cashier:</span>
                      <span>{lastSale.cashierName || 'Admin'}</span>
                    </div>
                    {lastSale.customerPhone && (
                      <div className="flex justify-between">
                        <span>Customer:</span>
                        <span>{lastSale.customerPhone}</span>
                      </div>
                    )}
                  </div>

                  <table className="w-full mb-6">
                    <thead>
                      <tr className="border-b border-gray-200 text-left">
                        <th className="pb-2">Item</th>
                        <th className="pb-2 text-center">Qty</th>
                        <th className="pb-2 text-right">Price</th>
                        <th className="pb-2 text-right">VAT</th>
                        <th className="pb-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {lastSale.items.map((item, i) => (
                        <tr key={i}>
                          <td className="py-2 max-w-[80px] truncate">{item.productName}</td>
                          <td className="py-2 text-center">{item.quantity}</td>
                          <td className="py-2 text-right">{item.price.toFixed(2)}</td>
                          <td className="py-2 text-right">{(item.vatRate || 15)}%</td>
                          <td className="py-2 text-right font-bold">{(item.price * item.quantity).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="space-y-1 border-t border-gray-200 pt-4">
                    <div className="flex justify-between">
                      <span>Subtotal (Net Sales):</span>
                      <span>{lastSale.subtotal?.toFixed(2)} ETB</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total VAT:</span>
                      <span>{lastSale.vatAmount?.toFixed(2)} ETB</span>
                    </div>
                    {lastSale.discount > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>Discount:</span>
                        <span>-{lastSale.discount?.toFixed(2)} ETB</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-bold pt-2 border-t border-gray-100">
                      <span>Grand Total:</span>
                      <span>{lastSale.totalAmount.toFixed(2)} ETB</span>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-200 space-y-1">
                    <div className="flex justify-between">
                      <span className="uppercase">Payment Method:</span>
                      <span className="font-bold uppercase">{lastSale.paymentMethod}</span>
                    </div>
                    {lastSale.paymentMethod === 'cash' && (
                      <>
                        <div className="flex justify-between">
                          <span>Amount Paid:</span>
                          <span>{lastSale.amountPaid?.toFixed(2)} ETB</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Change:</span>
                          <span className="font-bold">{lastSale.changeAmount?.toFixed(2)} ETB</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Owner Only Section */}
                  <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-200 print:hidden">
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Profit Details (Owner Only)</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
                      <span className="text-gray-500">Cost Total:</span>
                      <span className="text-right font-bold">{lastSale.totalCost?.toFixed(2)} ETB</span>
                      <span className="text-gray-500">Net Sales:</span>
                      <span className="text-right font-bold">{lastSale.subtotal?.toFixed(2)} ETB</span>
                      <span className="text-gray-500">Total VAT:</span>
                      <span className="text-right font-bold">{lastSale.vatAmount?.toFixed(2)} ETB</span>
                      <div className="col-span-2 h-px bg-gray-200 my-1"></div>
                      <span className="text-emerald-600 font-bold">Total Profit:</span>
                      <span className="text-right text-emerald-600 font-bold">{lastSale.totalProfit?.toFixed(2)} ETB</span>
                    </div>
                  </div>

                  <div className="mt-8 flex flex-col items-center gap-4">
                    <div className="flex gap-4 items-center">
                      <div className="bg-white p-1 border border-gray-100 rounded-lg">
                        <QRCodeSVG value={lastSale.saleId} size={64} />
                      </div>
                      <div className="flex flex-col items-center">
                        <Barcode value={lastSale.saleId.slice(0, 12)} height={30} width={1} fontSize={8} />
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="font-bold">Thank you for shopping!</p>
                      <p className="text-[10px] text-gray-400">Powered by SmartShop Ethiopia</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-gray-50 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => window.print()}
                    className="bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
                  >
                    <Printer className="w-4 h-4" />
                    Print
                  </button>
                  <button
                    onClick={downloadPDF}
                    className="bg-white text-gray-900 border border-gray-200 py-3 rounded-xl font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    PDF
                  </button>
                  
                  <div className="col-span-2 flex gap-2">
                    <button
                      onClick={sendReceiptWhatsApp}
                      className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                    >
                      <Share2 className="w-4 h-4" />
                      WhatsApp
                    </button>
                    <button
                      onClick={sendReceiptSMS}
                      className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                    >
                      <Smartphone className="w-4 h-4" />
                      SMS
                    </button>
                  </div>

                  <button
                    onClick={() => setIsReceiptOpen(false)}
                    className="col-span-2 py-2 text-gray-500 font-bold hover:text-gray-900 transition-all text-sm"
                  >
                    Close & New Sale
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
