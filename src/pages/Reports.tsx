import React, { useEffect, useState, useMemo } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { useSubscription } from '../SubscriptionContext';
import { Sale, Product, Order } from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { 
  Download, 
  TrendingUp, 
  Package, 
  ShoppingCart, 
  Calendar,
  Filter,
  Lock,
  CreditCard,
  FileText,
  PieChart as PieIcon,
  Search,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Percent,
  Layers,
  Globe,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useTranslation } from 'react-i18next';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

type ReportTab = 'overview' | 'sales' | 'vat' | 'profit' | 'inventory' | 'marketplace';

const Reports = () => {
  const { t } = useTranslation();
  const { shop } = useAuth();
  const { isFeatureAllowed } = useSubscription();
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ReportTab>('overview');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [filterProduct, setFilterProduct] = useState('');
  const [filterPayment, setFilterPayment] = useState('');
  const [filterCashier, setFilterCashier] = useState('');

  const hasAccess = isFeatureAllowed('advancedReports');

  useEffect(() => {
    if (!shop || !hasAccess) {
      setLoading(false);
      return;
    }

    const salesRef = collection(db, 'sales');
    const qSales = query(salesRef, where('shopId', '==', shop.shopId), orderBy('createdAt', 'desc'));
    
    const unsubscribeSales = onSnapshot(qSales, (snapshot) => {
      const salesData = snapshot.docs.map(doc => ({
        saleId: doc.id,
        ...doc.data()
      } as Sale));
      setSales(salesData);
    });

    const productsRef = collection(db, 'products');
    const qProducts = query(productsRef, where('shopId', '==', shop.shopId));
    const unsubscribeProducts = onSnapshot(qProducts, (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({
        productId: doc.id,
        ...doc.data()
      } as Product));
      setProducts(productsData);
    });

    const ordersRef = collection(db, 'orders');
    const qOrders = query(ordersRef, where('shopId', '==', shop.shopId), orderBy('createdAt', 'desc'));
    const unsubscribeOrders = onSnapshot(qOrders, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        orderId: doc.id,
        ...doc.data()
      } as Order));
      setOrders(ordersData);
      setLoading(false);
    });

    return () => {
      unsubscribeSales();
      unsubscribeProducts();
      unsubscribeOrders();
    };
  }, [shop, hasAccess]);

  // Data Filtering
  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const saleDate = sale.createdAt.split('T')[0];
      const matchesDate = saleDate >= dateRange.start && saleDate <= dateRange.end;
      const matchesProduct = !filterProduct || sale.items.some(item => item.productName.toLowerCase().includes(filterProduct.toLowerCase()));
      const matchesPayment = !filterPayment || sale.paymentMethod === filterPayment;
      const matchesCashier = !filterCashier || sale.cashierName?.toLowerCase().includes(filterCashier.toLowerCase());
      return matchesDate && matchesProduct && matchesPayment && matchesCashier;
    });
  }, [sales, dateRange, filterProduct, filterPayment, filterCashier]);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const orderDate = order.createdAt.split('T')[0];
      return orderDate >= dateRange.start && orderDate <= dateRange.end;
    });
  }, [orders, dateRange]);

  // Calculations
  const stats = useMemo(() => {
    const totalRevenue = filteredSales.reduce((acc, s) => acc + s.totalAmount, 0);
    const totalCost = filteredSales.reduce((acc, s) => acc + (s.totalCost || 0), 0);
    const totalProfit = filteredSales.reduce((acc, s) => acc + (s.totalProfit || 0), 0);
    const totalVat = filteredSales.reduce((acc, s) => acc + (s.vatAmount || 0), 0);
    
    const marketplaceRevenue = filteredOrders
      .filter(o => o.status === 'delivered')
      .reduce((acc, o) => acc + o.totalAmount, 0);
    
    const inventoryValue = products.reduce((acc, p) => acc + (p.quantity * (p.costPrice || 0)), 0);
    const lowStockCount = products.filter(p => p.quantity <= 5).length;

    return {
      totalRevenue,
      totalCost,
      totalProfit,
      totalVat,
      marketplaceRevenue,
      inventoryValue,
      lowStockCount,
      salesCount: filteredSales.length,
      ordersCount: filteredOrders.length
    };
  }, [filteredSales, filteredOrders, products]);

  // Chart Data Preparation
  const revenueTrendData = useMemo(() => {
    const data: { [key: string]: { revenue: number, profit: number } } = {};
    filteredSales.forEach(sale => {
      const date = new Date(sale.createdAt).toLocaleDateString();
      if (!data[date]) data[date] = { revenue: 0, profit: 0 };
      data[date].revenue += sale.totalAmount;
      data[date].profit += (sale.totalProfit || 0);
    });
    return Object.entries(data)
      .map(([name, values]) => ({ name, ...values }))
      .sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime());
  }, [filteredSales]);

  const bestSellersData = useMemo(() => {
    const data: { [key: string]: { quantity: number, revenue: number } } = {};
    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        if (!data[item.productName]) data[item.productName] = { quantity: 0, revenue: 0 };
        data[item.productName].quantity += item.quantity;
        data[item.productName].revenue += (item.quantity * item.price);
      });
    });
    return Object.entries(data)
      .map(([name, values]) => ({ name, ...values }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [filteredSales]);

  const paymentMethodsData = useMemo(() => {
    const data: { [key: string]: number } = {};
    filteredSales.forEach(sale => {
      data[sale.paymentMethod] = (data[sale.paymentMethod] || 0) + sale.totalAmount;
    });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [filteredSales]);

  // Export Functions
  const exportToExcel = () => {
    const data = filteredSales.map(sale => ({
      'Sale ID': sale.saleId,
      'Date': new Date(sale.createdAt).toLocaleString(),
      'Total Amount': sale.totalAmount,
      'VAT': sale.vatAmount || 0,
      'Profit': sale.totalProfit || 0,
      'Payment Method': sale.paymentMethod,
      'Cashier': sale.cashierName || 'N/A',
      'Customer': sale.customerName || 'N/A'
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sales Report');
    XLSX.writeFile(wb, `SmartShop_Sales_Report_${dateRange.start}_to_${dateRange.end}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text('SmartShop Ethiopia - Sales Report', 14, 15);
    doc.text(`Period: ${dateRange.start} to ${dateRange.end}`, 14, 22);
    
    const tableData = filteredSales.map(sale => [
      new Date(sale.createdAt).toLocaleDateString(),
      sale.saleId.slice(0, 8),
      sale.totalAmount.toLocaleString(),
      sale.paymentMethod,
      sale.cashierName || 'N/A'
    ]);

    (doc as any).autoTable({
      head: [['Date', 'ID', 'Amount (ETB)', 'Payment', 'Cashier']],
      body: tableData,
      startY: 30,
    });

    doc.save(`SmartShop_Sales_Report_${dateRange.start}_to_${dateRange.end}.pdf`);
  };

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-6">
          <Lock className="w-10 h-10 text-[#ff6600]" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('reports.advanced_reports')}</h2>
        <p className="text-gray-500 max-w-md mb-8">
          {t('reports.advanced_reports_desc')}
        </p>
        <Link 
          to="/dashboard/settings" 
          className="bg-[#ff6600] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#e65c00] transition-all shadow-lg shadow-orange-200"
        >
          {t('reports.upgrade_to_pro')}
        </Link>
      </div>
    );
  }

  if (loading) return <div className="flex items-center justify-center h-64">{t('reports.loading')}</div>;

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Global Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('reports.title')}</h1>
          <p className="text-gray-500">{t('reports.subtitle')}</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-2 rounded-xl shadow-sm">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input 
              type="date" 
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="text-sm outline-none bg-transparent"
            />
            <span className="text-gray-300">to</span>
            <input 
              type="date" 
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="text-sm outline-none bg-transparent"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={exportToExcel}
              className="p-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-all shadow-sm"
              title="Export to Excel"
            >
              <FileText className="w-5 h-5" />
            </button>
            <button 
              onClick={exportToPDF}
              className="p-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-all shadow-sm"
              title="Export to PDF"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {[
          { id: 'overview', label: t('reports.tabs.overview'), icon: PieIcon },
          { id: 'sales', label: t('reports.tabs.sales'), icon: ShoppingCart },
          { id: 'vat', label: t('reports.tabs.vat'), icon: Percent },
          { id: 'profit', label: t('reports.tabs.profit'), icon: TrendingUp },
          { id: 'inventory', label: t('reports.tabs.inventory'), icon: Package },
          { id: 'marketplace', label: t('reports.tabs.marketplace'), icon: Globe },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as ReportTab)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' 
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: t('reports.overview.total_revenue'), value: `${stats.totalRevenue.toLocaleString()} ${t('common.currency')}`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                  { label: t('reports.overview.total_profit'), value: `${stats.totalProfit.toLocaleString()} ${t('common.currency')}`, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: t('reports.overview.marketplace_sales'), value: `${stats.marketplaceRevenue.toLocaleString()} ${t('common.currency')}`, icon: Globe, color: 'text-purple-600', bg: 'bg-purple-50' },
                  { label: t('reports.overview.inventory_value'), value: `${stats.inventoryValue.toLocaleString()} ${t('common.currency')}`, icon: Package, color: 'text-amber-600', bg: 'bg-amber-50' },
                ].map((stat, i) => (
                  <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center mb-4`}>
                      <stat.icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue & Profit Trend */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-6">{t('reports.overview.revenue_vs_profit')}</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={revenueTrendData}>
                        <defs>
                          <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorProf" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                        <Tooltip />
                        <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRev)" strokeWidth={3} />
                        <Area type="monotone" dataKey="profit" stroke="#3b82f6" fillOpacity={1} fill="url(#colorProf)" strokeWidth={3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Best Sellers */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-6">{t('reports.overview.top_selling')}</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={bestSellersData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#4b5563' }} width={120} />
                        <Tooltip />
                        <Bar dataKey="quantity" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sales' && (
            <div className="space-y-6">
              {/* Sales Filters */}
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input 
                    type="text" 
                    placeholder={t('reports.sales.filter_product')}
                    value={filterProduct}
                    onChange={(e) => setFilterProduct(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <select 
                  value={filterPayment}
                  onChange={(e) => setFilterPayment(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">{t('reports.sales.filter_payment')}</option>
                  <option value="cash">{t('pos.cash')}</option>
                  <option value="mobile">{t('pos.mobile_money')}</option>
                  <option value="card">{t('pos.card')}</option>
                  <option value="telebirr">{t('pos.telebirr')}</option>
                  <option value="bank_transfer">{t('pos.bank')}</option>
                </select>
                <input 
                  type="text" 
                  placeholder={t('reports.sales.filter_cashier')}
                  value={filterCashier}
                  onChange={(e) => setFilterCashier(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Sales Table */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{t('reports.sales.date')}</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{t('reports.sales.receipt')}</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{t('reports.sales.product_name')}</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{t('reports.sales.qty')}</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{t('reports.sales.unit_price')}</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{t('reports.sales.total')}</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{t('reports.sales.payment')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredSales.flatMap(sale => 
                        sale.items.map((item, idx) => (
                          <tr key={`${sale.saleId}-${idx}`} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {idx === 0 ? new Date(sale.createdAt).toLocaleDateString() : ''}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                              {idx === 0 ? `#${sale.saleId.slice(0, 8)}` : ''}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {item.productName}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {item.quantity}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {item.price.toLocaleString()} {t('common.currency')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-emerald-600">
                              {(item.quantity * item.price).toLocaleString()} {t('common.currency')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {idx === 0 ? (
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-[10px] font-bold uppercase">
                                  {sale.paymentMethod}
                                </span>
                              ) : ''}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'vat' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <p className="text-sm font-medium text-gray-500 uppercase">Total Taxable Amount</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {(stats.totalRevenue - stats.totalVat).toLocaleString()} ETB
                  </p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <p className="text-sm font-medium text-gray-500 uppercase">Total VAT Collected</p>
                  <p className="text-2xl font-bold text-emerald-600 mt-1">
                    {stats.totalVat.toLocaleString()} ETB
                  </p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <p className="text-sm font-medium text-gray-500 uppercase">VAT Rate (Standard)</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">15%</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h3 className="font-bold text-gray-900">VAT Summary by Transaction</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Receipt</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Net Amount</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">VAT Amount</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredSales.map((sale) => (
                        <tr key={sale.saleId}>
                          <td className="px-6 py-4 text-sm text-gray-600">{new Date(sale.createdAt).toLocaleDateString()}</td>
                          <td className="px-6 py-4 text-sm font-bold">#{sale.saleId.slice(0, 8)}</td>
                          <td className="px-6 py-4 text-sm">{(sale.totalAmount - (sale.vatAmount || 0)).toLocaleString()} ETB</td>
                          <td className="px-6 py-4 text-sm text-emerald-600 font-bold">{(sale.vatAmount || 0).toLocaleString()} ETB</td>
                          <td className="px-6 py-4 text-sm font-bold">{sale.totalAmount.toLocaleString()} ETB</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'profit' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <p className="text-sm font-medium text-gray-500 uppercase">Gross Revenue</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalRevenue.toLocaleString()} ETB</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <p className="text-sm font-medium text-gray-500 uppercase">Total Cost of Goods</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">{stats.totalCost.toLocaleString()} ETB</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <p className="text-sm font-medium text-gray-500 uppercase">Net Profit</p>
                  <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.totalProfit.toLocaleString()} ETB</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <p className="text-sm font-medium text-gray-500 uppercase">Profit Margin</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">
                    {stats.totalRevenue > 0 ? ((stats.totalProfit / stats.totalRevenue) * 100).toFixed(1) : 0}%
                  </p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-6">Profitability by Product</h3>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={bestSellersData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="revenue" fill="#10b981" name="Revenue" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                      <Package className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md uppercase">Total Items</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{products.reduce((acc, p) => acc + p.quantity, 0)}</p>
                  <p className="text-sm text-gray-500 mt-1">Across {products.length} unique products</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-amber-600" />
                    </div>
                    <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md uppercase">Low Stock</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stats.lowStockCount}</p>
                  <p className="text-sm text-gray-500 mt-1">Items with 5 or less units</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-emerald-600" />
                    </div>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md uppercase">Inventory Value</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stats.inventoryValue.toLocaleString()} ETB</p>
                  <p className="text-sm text-gray-500 mt-1">Based on cost price</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h3 className="font-bold text-gray-900">Inventory Status Report</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Product Name</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Category</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Stock Level</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Unit Cost</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Total Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {products.map((product) => (
                        <tr key={product.productId}>
                          <td className="px-6 py-4 text-sm font-bold text-gray-900">{product.name}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{product.category}</td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`font-bold ${product.quantity <= 5 ? 'text-red-600' : 'text-gray-900'}`}>
                              {product.quantity}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm">{(product.costPrice || 0).toLocaleString()} ETB</td>
                          <td className="px-6 py-4 text-sm font-bold">{(product.quantity * (product.costPrice || 0)).toLocaleString()} ETB</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'marketplace' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <p className="text-sm font-medium text-gray-500 uppercase">Marketplace Orders</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.ordersCount}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <p className="text-sm font-medium text-gray-500 uppercase">Delivered Revenue</p>
                  <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.marketplaceRevenue.toLocaleString()} ETB</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <p className="text-sm font-medium text-gray-500 uppercase">Avg. Order Value</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">
                    {stats.ordersCount > 0 ? (stats.marketplaceRevenue / stats.ordersCount).toLocaleString() : 0} ETB
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h3 className="font-bold text-gray-900">Online Marketplace Orders</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Order ID</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Customer</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredOrders.map((order) => (
                        <tr key={order.orderId}>
                          <td className="px-6 py-4 text-sm text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</td>
                          <td className="px-6 py-4 text-sm font-bold">#{order.orderId.slice(0, 8)}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{order.customerName}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                              order.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
                              order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-bold">{order.totalAmount.toLocaleString()} ETB</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Reports;
