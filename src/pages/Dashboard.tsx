import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, limit, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { 
  TrendingUp, 
  Package, 
  AlertTriangle, 
  ShoppingBag,
  ArrowUpRight,
  ArrowDownRight,
  Clock
} from 'lucide-react';
import { Sale, Product, Order } from '../types';
import { motion } from 'motion/react';

const Dashboard = () => {
  const { shop } = useAuth();
  const [stats, setStats] = useState({
    todaySales: 0,
    totalProducts: 0,
    lowStock: 0,
    pendingOrders: 0,
  });
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!shop) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Listen for products (for total and low stock)
    const productsRef = collection(db, 'shops', shop.shopId, 'products');
    const unsubscribeProducts = onSnapshot(productsRef, (snapshot) => {
      const products = snapshot.docs.map(doc => doc.data() as Product);
      setStats(prev => ({
        ...prev,
        totalProducts: products.length,
        lowStock: products.filter(p => p.quantity <= 5).length
      }));
    });

    // Listen for today's sales
    const salesRef = collection(db, 'shops', shop.shopId, 'sales');
    const qSales = query(salesRef, where('createdAt', '>=', today.toISOString()), orderBy('createdAt', 'desc'));
    const unsubscribeSales = onSnapshot(qSales, (snapshot) => {
      const sales = snapshot.docs.map(doc => doc.data() as Sale);
      const total = sales.reduce((acc, sale) => acc + sale.total, 0);
      setStats(prev => ({ ...prev, todaySales: total }));
      setRecentSales(sales.slice(0, 5));
    });

    // Listen for pending orders
    const ordersRef = collection(db, 'shops', shop.shopId, 'orders');
    const qOrders = query(ordersRef, where('status', '==', 'pending'));
    const unsubscribeOrders = onSnapshot(qOrders, (snapshot) => {
      setStats(prev => ({ ...prev, pendingOrders: snapshot.size }));
    });

    setLoading(false);

    return () => {
      unsubscribeProducts();
      unsubscribeSales();
      unsubscribeOrders();
    };
  }, [shop]);

  if (loading) return <div className="animate-pulse">Loading dashboard...</div>;

  const cards = [
    { 
      title: "Today's Sales", 
      value: `${stats.todaySales.toLocaleString()} ETB`, 
      icon: TrendingUp, 
      color: "text-emerald-600", 
      bg: "bg-emerald-50",
      trend: "+12%",
      trendUp: true
    },
    { 
      title: "Total Products", 
      value: stats.totalProducts, 
      icon: Package, 
      color: "text-blue-600", 
      bg: "bg-blue-50"
    },
    { 
      title: "Low Stock Alerts", 
      value: stats.lowStock, 
      icon: AlertTriangle, 
      color: "text-amber-600", 
      bg: "bg-amber-50",
      alert: stats.lowStock > 0
    },
    { 
      title: "Pending Orders", 
      value: stats.pendingOrders, 
      icon: ShoppingBag, 
      color: "text-purple-600", 
      bg: "bg-purple-50"
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Welcome back to {shop?.shopName}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${card.bg} rounded-xl flex items-center justify-center`}>
                <card.icon className={`${card.color} w-6 h-6`} />
              </div>
              {card.trend && (
                <div className={`flex items-center text-xs font-medium ${card.trendUp ? 'text-emerald-600' : 'text-red-600'}`}>
                  {card.trendUp ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                  {card.trend}
                </div>
              )}
            </div>
            <p className="text-sm font-medium text-gray-500">{card.title}</p>
            <p className={`text-2xl font-bold mt-1 ${card.alert ? 'text-amber-600' : 'text-gray-900'}`}>
              {card.value}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Sales */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">Recent Sales</h2>
            <button className="text-sm text-emerald-600 font-medium hover:underline">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-xs uppercase text-gray-500 font-bold">
                  <th className="px-6 py-4">Sale ID</th>
                  <th className="px-6 py-4">Items</th>
                  <th className="px-6 py-4">Total</th>
                  <th className="px-6 py-4">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentSales.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-gray-500">No sales today yet</td>
                  </tr>
                ) : (
                  recentSales.map((sale) => (
                    <tr key={sale.saleId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">#{sale.saleId.slice(0, 6)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {sale.items.length} items
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-900">{sale.total.toLocaleString()} ETB</td>
                      <td className="px-6 py-4 text-sm text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <div className="bg-emerald-600 rounded-2xl p-6 text-white shadow-lg shadow-emerald-200">
            <h3 className="font-bold text-lg mb-2">Need Help?</h3>
            <p className="text-emerald-100 text-sm mb-4">Check out our guide on how to manage your inventory and boost sales.</p>
            <button className="bg-white text-emerald-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-emerald-50 transition-colors">
              View Guide
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4">Store Link</h3>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between gap-2">
              <p className="text-xs text-gray-500 truncate">smartshop.et/shop/{shop?.slug}</p>
              <button 
                onClick={() => navigator.clipboard.writeText(`https://smartshop.et/shop/${shop?.slug}`)}
                className="text-emerald-600 text-xs font-bold hover:underline flex-shrink-0"
              >
                Copy
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-3">Share this link with your customers to receive online orders.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
