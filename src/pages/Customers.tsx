import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { useSubscription } from '../SubscriptionContext';
import { 
  Users, 
  Search, 
  Phone, 
  Star, 
  History,
  ChevronRight,
  UserPlus,
  Lock
} from 'lucide-react';
import { Customer } from '../types';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

const Customers = () => {
  const { shop } = useAuth();
  const { isFeatureAllowed } = useSubscription();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const hasAccess = isFeatureAllowed('customers');

  useEffect(() => {
    if (!shop || !hasAccess) {
      setLoading(false);
      return;
    }

    const customersRef = collection(db, 'customers');
    const q = query(customersRef, where('shopId', '==', shop.shopId), orderBy('lastPurchaseDate', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const customersData = snapshot.docs.map(doc => ({
        customerId: doc.id,
        ...doc.data()
      } as Customer));
      setCustomers(customersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [shop, hasAccess]);

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-6">
          <Lock className="w-10 h-10 text-[#ff6600]" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Customer Database</h2>
        <p className="text-gray-500 max-w-md mb-8">
          Track loyalty, purchase history, and manage your customer relationships with the Pro plan.
        </p>
        <Link 
          to="/dashboard/settings" 
          className="bg-[#ff6600] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#e65c00] transition-all shadow-lg shadow-orange-200"
        >
          Upgrade to Pro
        </Link>
      </div>
    );
  }

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Management</h1>
          <p className="text-gray-500">Track loyalty and purchase history</p>
        </div>
        <button className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-200">
          <UserPlus className="w-5 h-5" />
          Add Customer
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name or phone number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* Customers List */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="bg-gray-100 h-48 rounded-2xl animate-pulse"></div>
          ))
        ) : filteredCustomers.length === 0 ? (
          <div className="col-span-full py-20 text-center text-gray-500 bg-white rounded-2xl border border-gray-100">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>No customers found</p>
          </div>
        ) : (
          filteredCustomers.map((customer) => (
            <motion.div
              layout
              key={customer.customerId}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold text-lg">
                    {customer.name[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{customer.name}</h3>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {customer.phone}
                    </p>
                  </div>
                </div>
                <div className="bg-amber-50 text-amber-700 px-2 py-1 rounded-lg flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-700" />
                  <span className="text-xs font-bold">{customer.loyaltyPoints}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Total Visits</p>
                  <p className="text-lg font-bold text-gray-900">{customer.purchaseCount}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Last Visit</p>
                  <p className="text-sm font-bold text-gray-900">
                    {customer.lastPurchaseDate ? new Date(customer.lastPurchaseDate).toLocaleDateString() : 'Never'}
                  </p>
                </div>
              </div>

              <button className="w-full mt-6 py-2 flex items-center justify-center gap-2 text-sm font-bold text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors">
                <History className="w-4 h-4" />
                View History
                <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default Customers;
