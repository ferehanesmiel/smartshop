import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, limit, orderBy, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { 
  TrendingUp, 
  Package, 
  AlertTriangle, 
  ShoppingBag,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Store,
  User,
  Phone,
  Plus,
  Zap,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Sale, Product, Order } from '../types';
import { motion } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '../lib/utils';
import { Link, useLocation } from 'react-router-dom';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { PLANS, PlanType } from '../constants';

const Dashboard = () => {
  const { shop, user } = useAuth();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const urlPlan = (queryParams.get('plan') as PlanType) || 'basic';

  const [stats, setStats] = useState({
    todaySales: 0,
    totalProducts: 0,
    lowStock: 0,
    pendingOrders: 0,
    totalUsers: 0,
  });
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreatingShop, setIsCreatingShop] = useState(false);
  const [newShopData, setNewShopData] = useState({
    shopName: '',
    ownerName: user?.displayName || '',
    phone: '',
    plan: urlPlan,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (urlPlan && PLANS[urlPlan]) {
      setNewShopData(prev => ({ ...prev, plan: urlPlan }));
    }
  }, [urlPlan]);

  const handleCreateShop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsCreatingShop(true);
    setError('');
    try {
      const slug = newShopData.shopName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const shopsRef = collection(db, 'shops');
      const q = query(shopsRef, where('slug', '==', slug));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        throw new Error('Shop name is already taken. Please try another one.');
      }

      const shopId = doc(collection(db, 'shops')).id;
      const planInfo = PLANS[newShopData.plan as PlanType];

      await setDoc(doc(db, 'shops', shopId), {
        shopId,
        shopName: newShopData.shopName,
        ownerName: newShopData.ownerName,
        phone: newShopData.phone,
        email: user.email,
        plan: newShopData.plan,
        planLimits: planInfo.limits,
        subscriptionStatus: 'active',
        createdAt: new Date().toISOString(),
        ownerUid: user.uid,
        slug,
        status: 'active',
      });
      window.location.reload(); // Refresh to update AuthContext
    } catch (err: any) {
      setError(err.message || 'Failed to create shop');
    } finally {
      setIsCreatingShop(false);
    }
  };

  useEffect(() => {
    if (!shop) {
      setLoading(false);
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Listen for products (for total and low stock)
    const productsRef = collection(db, 'products');
    const qProducts = query(productsRef, where('shopId', '==', shop.shopId));
    const unsubscribeProducts = onSnapshot(qProducts, (snapshot) => {
      const products = snapshot.docs.map(doc => doc.data() as Product);
      setStats(prev => ({
        ...prev,
        totalProducts: products.length,
        lowStock: products.filter(p => p.quantity <= 5).length
      }));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
    });

    // Listen for today's sales
    const salesRef = collection(db, 'sales');
    const qSales = query(salesRef, where('shopId', '==', shop.shopId), where('createdAt', '>=', today.toISOString()), orderBy('createdAt', 'desc'));
    const unsubscribeSales = onSnapshot(qSales, (snapshot) => {
      const sales = snapshot.docs.map(doc => ({
        saleId: doc.id,
        ...doc.data()
      } as Sale));
      const total = sales.reduce((acc, sale) => acc + sale.totalAmount, 0);
      setStats(prev => ({ ...prev, todaySales: total }));
      setRecentSales((sales || []).slice(0, 5));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'sales');
    });

    // Listen for pending orders
    const ordersRef = collection(db, 'orders');
    const qOrders = query(ordersRef, where('shopId', '==', shop.shopId), where('status', '==', 'pending'));
    const unsubscribeOrders = onSnapshot(qOrders, (snapshot) => {
      setStats(prev => ({ ...prev, pendingOrders: snapshot.size }));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
    });

    setLoading(false);

    return () => {
      unsubscribeProducts();
      unsubscribeSales();
      unsubscribeOrders();
    };
  }, [shop]);

  const getRevenueData = () => {
    const data: { [key: string]: number } = {};
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toLocaleDateString();
    }).reverse();

    last7Days.forEach(date => data[date] = 0);

    // We only have today's sales in the current state, but in a real app we'd fetch more.
    // For now, let's use the recentSales to populate some data if possible.
    recentSales.forEach(sale => {
      const date = new Date(sale.createdAt).toLocaleDateString();
      if (data[date] !== undefined) {
        data[date] += sale.totalAmount;
      }
    });

    return Object.entries(data).map(([name, amount]) => ({ name, amount }));
  };

  if (loading) return <div className="animate-pulse">Loading dashboard...</div>;

  if (!shop) {
    return (
      <div className="max-w-md mx-auto mt-12">
        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Store className="text-emerald-600 w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Create Your Shop</h1>
            <p className="text-gray-500 mt-2">You're almost there! Just a few details to get started.</p>
          </div>

          <form onSubmit={handleCreateShop} className="p-8 space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">Shop Name</label>
                <div className="relative">
                  <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    required
                    value={newShopData.shopName}
                    onChange={(e) => setNewShopData({ ...newShopData, shopName: e.target.value })}
                    className="w-full pl-10 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#ff6600] outline-none transition-all"
                    placeholder="Abyssinia Boutique"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">Owner Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    required
                    value={newShopData.ownerName}
                    onChange={(e) => setNewShopData({ ...newShopData, ownerName: e.target.value })}
                    className="w-full pl-10 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#ff6600] outline-none transition-all"
                    placeholder="Abebe Bikila"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="tel"
                  required
                  value={newShopData.phone}
                  onChange={(e) => setNewShopData({ ...newShopData, phone: e.target.value })}
                  className="w-full pl-10 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#ff6600] outline-none transition-all"
                  placeholder="+251 911 223 344"
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-bold text-gray-700 ml-1">Select Package</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {(Object.keys(PLANS) as PlanType[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setNewShopData({ ...newShopData, plan: p })}
                    className={cn(
                      "p-4 rounded-2xl border-2 text-left transition-all",
                      newShopData.plan === p 
                        ? "border-[#ff6600] bg-orange-50" 
                        : "border-gray-100 bg-white hover:border-orange-200"
                    )}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-gray-900 capitalize">{PLANS[p].name}</span>
                      {newShopData.plan === p && <CheckCircle2 className="w-5 h-5 text-[#ff6600]" />}
                    </div>
                    <p className="text-xs text-gray-500">{PLANS[p].price} Birr/mo</p>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isCreatingShop}
              className="w-full bg-[#ff6600] text-white py-5 rounded-2xl font-bold text-lg shadow-lg shadow-orange-200 hover:bg-[#e65c00] transition-all disabled:opacity-50 active:scale-[0.98]"
            >
              {isCreatingShop ? 'Creating Shop...' : 'Launch My Shop'}
            </button>
          </form>
        </div>
      </div>
    );
  }

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
    { 
      title: "Marketplace", 
      value: shop?.isMarketplaceEnabled ? "Active" : "Inactive", 
      icon: Store, 
      color: "text-emerald-600", 
      bg: "bg-emerald-50",
      link: "/dashboard/marketplace"
    },
  ];

  const planKey = (shop?.plan && PLANS[shop.plan as PlanType]) ? (shop.plan as PlanType) : 'basic';
  const currentPlan = PLANS[planKey];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-500">Welcome back to {shop?.shopName}</p>
        </div>
        
        <div className="flex items-center gap-3 bg-white p-2 pr-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
            <Zap className="w-5 h-5 text-[#ff6600]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Current Plan</span>
              <span className="px-2 py-0.5 bg-[#ff6600] text-white text-[10px] font-bold rounded-full uppercase">
                {planKey}
              </span>
            </div>
            <p className="text-sm font-bold text-gray-900">
              {currentPlan.price} Birr / Month
            </p>
          </div>
        </div>
      </div>

      {/* Plan Usage & Limits Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-2">Plan Usage & Limits</h2>
            <p className="text-gray-400 mb-6">Monitor your resources and upgrade when needed.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Products</span>
                  <span className="font-bold">
                    {stats.totalProducts} / {currentPlan.limits.products === Infinity ? '∞' : currentPlan.limits.products}
                  </span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#ff6600] transition-all duration-1000" 
                    style={{ 
                      width: `${Math.min((stats.totalProducts / (currentPlan.limits.products === Infinity ? stats.totalProducts || 1 : currentPlan.limits.products)) * 100, 100)}%` 
                    }}
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Users</span>
                  <span className="font-bold">
                    {stats.totalUsers} / {currentPlan.limits.users === Infinity ? '∞' : currentPlan.limits.users}
                  </span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-1000" 
                    style={{ 
                      width: `${Math.min((stats.totalUsers / (currentPlan.limits.users === Infinity ? stats.totalUsers || 1 : currentPlan.limits.users)) * 100, 100)}%` 
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
          <Zap className="absolute -right-8 -bottom-8 w-48 h-48 text-white/5 rotate-12" />
        </div>

        <div className="bg-orange-50 border border-orange-100 rounded-3xl p-8 flex flex-col justify-between shadow-sm">
          <div>
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4">
              <ArrowUpRight className="w-6 h-6 text-[#ff6600]" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Need More Power?</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Upgrade to Premium for unlimited users, products, and multi-branch support.
            </p>
          </div>
          <Link 
            to="/dashboard/settings" 
            className="mt-6 w-full bg-white text-[#ff6600] py-4 rounded-2xl font-bold shadow-sm hover:shadow-md transition-all border border-orange-100 text-center"
          >
            Upgrade Plan
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => {
          const CardContent = (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group h-full"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 ${card.bg} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <card.icon className={`${card.color} w-6 h-6`} />
                </div>
                {card.trend && (
                  <div className={cn(
                    "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg",
                    card.trendUp ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                  )}>
                    {card.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {card.trend}
                  </div>
                )}
              </div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{card.title}</p>
              <p className={`text-2xl font-bold mt-1 ${card.alert ? 'text-amber-600' : 'text-gray-900'}`}>
                {card.value}
              </p>
            </motion.div>
          );

          if (card.link) {
            return (
              <Link key={card.title} to={card.link}>
                {CardContent}
              </Link>
            );
          }

          return <div key={card.title}>{CardContent}</div>;
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Revenue Overview</h3>
              <p className="text-sm text-gray-500">Sales performance for the last 7 days</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl">
              <TrendingUp className="w-4 h-4" />
              Live Updates
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={getRevenueData()}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Sales */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-gray-900">Recent Sales</h3>
            <Link to="/dashboard/sales" className="text-sm font-bold text-emerald-600 hover:underline">View All</Link>
          </div>
          <div className="space-y-6">
            {recentSales.map((sale) => (
              <div key={sale.saleId} className="flex items-center justify-between group cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center group-hover:bg-emerald-50 transition-colors">
                    <Clock className="w-6 h-6 text-gray-400 group-hover:text-emerald-600 transition-colors" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">#{sale?.saleId?.slice(0, 8)}</p>
                    <p className="text-xs text-gray-500">{new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{sale.totalAmount.toLocaleString()} ETB</p>
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">{sale.paymentMethod}</p>
                </div>
              </div>
            ))}
            {recentSales.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No sales today yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
