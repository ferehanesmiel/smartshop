import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { 
  ShoppingBag, 
  TrendingUp, 
  Users, 
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  ExternalLink,
  Store,
  Settings
} from 'lucide-react';
import { Order, Product } from '../types';
import { motion } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';

const MarketplaceDashboard = () => {
  const { shop } = useAuth();
  const [stats, setStats] = useState({
    todayOrders: 0,
    todayRevenue: 0,
    totalOrders: 0,
    totalRevenue: 0,
    publishedProducts: 0
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!shop) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Listen for marketplace orders
    const ordersRef = collection(db, 'orders');
    const qOrders = query(
      ordersRef, 
      where('shopId', '==', shop.shopId),
      where('isMarketplaceOrder', '==', true),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeOrders = onSnapshot(qOrders, (snapshot) => {
      const orders = snapshot.docs.map(doc => ({
        orderId: doc.id,
        ...doc.data()
      })) as Order[];

      const todayOrdersList = orders.filter(o => new Date(o.createdAt) >= today);
      
      setStats(prev => ({
        ...prev,
        todayOrders: todayOrdersList.length,
        todayRevenue: todayOrdersList.reduce((acc, o) => acc + o.totalAmount, 0),
        totalOrders: orders.length,
        totalRevenue: orders.reduce((acc, o) => acc + o.totalAmount, 0)
      }));
      setRecentOrders(orders.slice(0, 5));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
      setLoading(false);
    });

    // Listen for published products
    const productsRef = collection(db, 'products');
    const qProducts = query(
      productsRef, 
      where('shopId', '==', shop.shopId),
      where('isPublishedToMarketplace', '==', true)
    );

    const unsubscribeProducts = onSnapshot(qProducts, (snapshot) => {
      setStats(prev => ({
        ...prev,
        publishedProducts: snapshot.size
      }));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
    });

    return () => {
      unsubscribeOrders();
      unsubscribeProducts();
    };
  }, [shop]);

  const cards = [
    { 
      title: "Online Orders Today", 
      value: stats.todayOrders, 
      icon: ShoppingBag, 
      color: "text-emerald-600", 
      bg: "bg-emerald-50"
    },
    { 
      title: "Online Revenue Today", 
      value: `${stats.todayRevenue.toLocaleString()} ETB`, 
      icon: TrendingUp, 
      color: "text-blue-600", 
      bg: "bg-blue-50"
    },
    { 
      title: "Total Online Orders", 
      value: stats.totalOrders, 
      icon: Users, 
      color: "text-purple-600", 
      bg: "bg-purple-50"
    },
    { 
      title: "Published Products", 
      value: stats.publishedProducts, 
      icon: Package, 
      color: "text-amber-600", 
      bg: "bg-amber-50"
    },
  ];

  if (loading) return <div className="p-8 text-center text-gray-500">Loading marketplace data...</div>;

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Online Marketplace Dashboard</h1>
          <p className="text-gray-500">Monitor your online store performance</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to={`/shop/${shop?.slug}`}
            target="_blank"
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all"
          >
            <ExternalLink className="w-4 h-4" />
            View My Shop
          </Link>
          <Link
            to="/dashboard/settings"
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all"
          >
            <Settings className="w-4 h-4" />
            Shop Settings
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`w-12 h-12 ${card.bg} rounded-xl flex items-center justify-center`}>
                <card.icon className={`${card.color} w-6 h-6`} />
              </div>
            </div>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{card.title}</p>
            <p className="text-2xl font-bold mt-1 text-gray-900">{card.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Recent Online Orders</h3>
          <div className="space-y-4">
            {recentOrders.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No online orders yet</p>
              </div>
            ) : (
              recentOrders.map((order) => (
                <div key={order.orderId} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">Order {order.orderNumber}</p>
                      <p className="text-xs text-gray-500">{order.customerName} • {new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{order.totalAmount.toLocaleString()} ETB</p>
                    <span className={cn(
                      "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full",
                      order.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    )}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))
            )}
            {recentOrders.length > 0 && (
              <Link
                to="/dashboard/online-orders"
                className="block text-center py-3 text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-all"
              >
                View All Online Orders
              </Link>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-emerald-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-lg font-bold mb-2">Marketplace Status</h3>
              <div className="flex items-center gap-2 mb-4">
                <div className={cn("w-2 h-2 rounded-full animate-pulse", shop?.isMarketplaceEnabled ? "bg-emerald-400" : "bg-red-400")} />
                <span className="text-sm font-medium">{shop?.isMarketplaceEnabled ? "Active & Visible" : "Inactive"}</span>
              </div>
              <p className="text-emerald-100 text-sm mb-6">
                {shop?.isMarketplaceEnabled 
                  ? "Your shop is currently visible to all customers on the SmartShop Marketplace."
                  : "Enable marketplace selling in settings to start reaching customers online."}
              </p>
              <Link
                to="/dashboard/settings"
                className="inline-block bg-white text-emerald-900 px-4 py-2 rounded-xl text-sm font-bold hover:bg-emerald-50 transition-all"
              >
                Manage Status
              </Link>
            </div>
            <Store className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 rotate-12" />
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Quick Actions</h3>
            <div className="space-y-2">
              <Link
                to="/dashboard/products"
                className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-emerald-50 hover:text-emerald-700 transition-all group"
              >
                <span className="text-sm font-medium">Manage Online Products</span>
                <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-600" />
              </Link>
              <Link
                to="/dashboard/online-orders"
                className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-emerald-50 hover:text-emerald-700 transition-all group"
              >
                <span className="text-sm font-medium">Process Online Orders</span>
                <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-600" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceDashboard;
