import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Store, CreditCard, TrendingUp, AlertCircle, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const AdminRevenue = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeShops: 0,
    monthlySubscriptions: 0,
    marketplaceCommission: 0,
    revenueThisMonth: 0,
    expiredSubscriptions: 0,
  });
  const [planDistribution, setPlanDistribution] = useState<any[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<any[]>([]);

  useEffect(() => {
    const fetchRevenueData = async () => {
      try {
        // Fetch shops
        const shopsSnapshot = await getDocs(collection(db, 'shops'));
        let active = 0;
        let expired = 0;
        const plans: Record<string, number> = { basic: 0, pro: 0, premium: 0 };

        shopsSnapshot.forEach(doc => {
          const data = doc.data();
          if (data.subscriptionStatus === 'active' || data.subscriptionStatus === 'trial') {
            active++;
          } else if (data.subscriptionStatus === 'expired') {
            expired++;
          }
          
          if (data.plan && plans[data.plan] !== undefined) {
            plans[data.plan]++;
          }
        });

        setPlanDistribution([
          { name: 'Basic', value: plans.basic, color: '#3b82f6' },
          { name: 'Pro', value: plans.pro, color: '#10b981' },
          { name: 'Premium', value: plans.premium, color: '#f59e0b' },
        ]);

        // Fetch payments
        const paymentsSnapshot = await getDocs(collection(db, 'payments'));
        let totalRevenue = 0;
        let thisMonthRevenue = 0;
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const monthlyData: Record<string, number> = {};

        paymentsSnapshot.forEach(doc => {
          const data = doc.data();
          if (data.status === 'completed') {
            totalRevenue += data.amount;
            
            const paymentDate = new Date(data.payment_date);
            if (paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear) {
              thisMonthRevenue += data.amount;
            }

            const monthKey = paymentDate.toLocaleString('default', { month: 'short' });
            monthlyData[monthKey] = (monthlyData[monthKey] || 0) + data.amount;
          }
        });

        const chartData = Object.keys(monthlyData).map(key => ({
          name: key,
          revenue: monthlyData[key]
        }));

        setMonthlyRevenue(chartData);

        // Fetch orders for marketplace commission
        const ordersSnapshot = await getDocs(query(collection(db, 'orders'), where('isMarketplaceOrder', '==', true)));
        let totalCommission = 0;
        ordersSnapshot.forEach(doc => {
          const data = doc.data();
          if (data.commissionAmount) {
            totalCommission += data.commissionAmount;
          } else {
            // Calculate 3% if not explicitly stored
            totalCommission += (data.totalAmount * 0.03);
          }
        });

        setStats({
          activeShops: active,
          monthlySubscriptions: totalRevenue,
          marketplaceCommission: totalCommission,
          revenueThisMonth: thisMonthRevenue,
          expiredSubscriptions: expired,
        });

      } catch (error) {
        console.error("Error fetching revenue data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRevenueData();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading revenue data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Revenue Dashboard</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <Store className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Active Shops</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeShops}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Revenue This Month</p>
              <p className="text-2xl font-bold text-gray-900">{stats.revenueThisMonth.toLocaleString()} Birr</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Subscriptions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.monthlySubscriptions.toLocaleString()} Birr</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Marketplace Commission</p>
              <p className="text-2xl font-bold text-gray-900">{stats.marketplaceCommission.toLocaleString()} Birr</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Expired Subs</p>
              <p className="text-2xl font-bold text-gray-900">{stats.expiredSubscriptions}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Monthly Revenue</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `${value}`} />
                <Tooltip cursor={{ fill: '#f3f4f6' }} />
                <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Plan Distribution</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={planDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {planDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            {planDistribution.map((plan) => (
              <div key={plan.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: plan.color }}></div>
                <span className="text-sm text-gray-600">{plan.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminRevenue;
