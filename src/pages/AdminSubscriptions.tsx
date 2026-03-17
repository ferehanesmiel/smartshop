import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { CheckCircle2, XCircle, Clock, Search, Filter } from 'lucide-react';
import { cn } from '../lib/utils';

const AdminSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'payments'>('subscriptions');
  const [searchTerm, setSearchTerm] = useState('');

  const [sendingReminders, setSendingReminders] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const subsSnapshot = await getDocs(query(collection(db, 'subscriptions'), orderBy('start_date', 'desc')));
        const subsData = subsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSubscriptions(subsData);

        const paymentsSnapshot = await getDocs(query(collection(db, 'payments'), orderBy('payment_date', 'desc')));
        const paymentsData = paymentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPayments(paymentsData);
      } catch (error) {
        console.error("Error fetching admin data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleApprovePayment = async (paymentId: string, shopId: string, amount: number) => {
    try {
      // Update payment status
      await updateDoc(doc(db, 'payments', paymentId), {
        status: 'completed'
      });

      // Find the plan based on amount (hacky, but works for this demo)
      let plan = 'basic';
      if (amount === 700) plan = 'pro';
      if (amount === 1500) plan = 'premium';

      const now = new Date();
      const expiryDate = new Date();
      expiryDate.setDate(now.getDate() + 30);

      // Update shop subscription
      await updateDoc(doc(db, 'shops', shopId), {
        plan: plan,
        subscriptionStatus: 'active',
        subscriptionStartDate: now.toISOString(),
        subscriptionExpiryDate: expiryDate.toISOString(),
      });

      // Update local state
      setPayments(prev => prev.map(p => p.id === paymentId ? { ...p, status: 'completed' } : p));
      alert("Payment approved and subscription activated.");
    } catch (error) {
      console.error("Error approving payment:", error);
      alert("Failed to approve payment.");
    }
  };

  const handleSendReminders = async () => {
    setSendingReminders(true);
    try {
      // In a real app, this would trigger a Cloud Function
      // Here we just simulate finding expiring shops and sending notifications
      const now = new Date();
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(now.getDate() + 3);

      const expiringShops = subscriptions.filter(sub => {
        if (sub.status !== 'active' && sub.status !== 'trial') return false;
        const endDate = new Date(sub.end_date);
        const diffTime = endDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 3 && diffDays >= 0;
      });

      if (expiringShops.length === 0) {
        alert("No subscriptions expiring in the next 3 days.");
        return;
      }

      // Simulate sending
      await new Promise(resolve => setTimeout(resolve, 1500));
      alert(`Successfully sent reminders to ${expiringShops.length} shops.`);
    } catch (error) {
      console.error("Error sending reminders:", error);
      alert("Failed to send reminders.");
    } finally {
      setSendingReminders(false);
    }
  };

  const filteredSubscriptions = subscriptions.filter(sub => 
    sub.shop_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.plan_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPayments = payments.filter(pay => 
    pay.shop_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pay.transaction_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-8 text-center">Loading data...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Subscriptions & Payments</h2>
        
        <div className="flex items-center gap-4">
          <button
            onClick={handleSendReminders}
            disabled={sendingReminders}
            className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-bold hover:bg-emerald-200 transition-all disabled:opacity-50"
          >
            {sendingReminders ? 'Sending...' : 'Send Reminders'}
          </button>
          <div className="flex bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('subscriptions')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-bold transition-all",
              activeTab === 'subscriptions' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            Subscriptions
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-bold transition-all",
              activeTab === 'payments' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            Payments
          </button>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by Shop ID, Plan, or Transaction ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-4 font-bold text-gray-900">Shop ID</th>
                {activeTab === 'subscriptions' ? (
                  <>
                    <th className="p-4 font-bold text-gray-900">Plan</th>
                    <th className="p-4 font-bold text-gray-900">Start Date</th>
                    <th className="p-4 font-bold text-gray-900">End Date</th>
                    <th className="p-4 font-bold text-gray-900">Status</th>
                  </>
                ) : (
                  <>
                    <th className="p-4 font-bold text-gray-900">Amount</th>
                    <th className="p-4 font-bold text-gray-900">Method</th>
                    <th className="p-4 font-bold text-gray-900">Transaction ID</th>
                    <th className="p-4 font-bold text-gray-900">Date</th>
                    <th className="p-4 font-bold text-gray-900">Status</th>
                    <th className="p-4 font-bold text-gray-900">Action</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {activeTab === 'subscriptions' ? (
                filteredSubscriptions.length > 0 ? (
                  filteredSubscriptions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 text-sm font-medium text-gray-900">{sub.shop_id}</td>
                      <td className="p-4 text-sm text-gray-600 capitalize">{sub.plan_name}</td>
                      <td className="p-4 text-sm text-gray-600">{new Date(sub.start_date).toLocaleDateString()}</td>
                      <td className="p-4 text-sm text-gray-600">{new Date(sub.end_date).toLocaleDateString()}</td>
                      <td className="p-4">
                        <span className={cn(
                          "px-2 py-1 rounded-full text-xs font-bold uppercase",
                          sub.status === 'active' ? "bg-emerald-100 text-emerald-700" :
                          sub.status === 'trial' ? "bg-blue-100 text-blue-700" :
                          "bg-red-100 text-red-700"
                        )}>
                          {sub.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">No subscriptions found.</td>
                  </tr>
                )
              ) : (
                filteredPayments.length > 0 ? (
                  filteredPayments.map((pay) => (
                    <tr key={pay.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 text-sm font-medium text-gray-900">{pay.shop_id}</td>
                      <td className="p-4 text-sm font-bold text-gray-900">{pay.amount} Birr</td>
                      <td className="p-4 text-sm text-gray-600 capitalize">{pay.payment_method.replace('_', ' ')}</td>
                      <td className="p-4 text-sm font-mono text-gray-500">{pay.transaction_id}</td>
                      <td className="p-4 text-sm text-gray-600">{new Date(pay.payment_date).toLocaleDateString()}</td>
                      <td className="p-4">
                        <span className={cn(
                          "px-2 py-1 rounded-full text-xs font-bold uppercase flex items-center gap-1 w-fit",
                          pay.status === 'completed' ? "bg-emerald-100 text-emerald-700" :
                          pay.status === 'pending' ? "bg-amber-100 text-amber-700" :
                          "bg-red-100 text-red-700"
                        )}>
                          {pay.status === 'completed' ? <CheckCircle2 className="w-3 h-3" /> :
                           pay.status === 'pending' ? <Clock className="w-3 h-3" /> :
                           <XCircle className="w-3 h-3" />}
                          {pay.status}
                        </span>
                      </td>
                      <td className="p-4">
                        {pay.status === 'pending' && (
                          <button
                            onClick={() => handleApprovePayment(pay.id, pay.shop_id, pay.amount)}
                            className="px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-colors"
                          >
                            Approve
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">No payments found.</td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminSubscriptions;
