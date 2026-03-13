import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { 
  Users, 
  Search, 
  Phone, 
  Star, 
  History,
  ChevronRight,
  UserPlus
} from 'lucide-react';
import { Customer } from '../types';
import { motion } from 'motion/react';

const Customers = () => {
  const { shop } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!shop) return;

    const customersRef = collection(db, 'shops', shop.shopId, 'customers');
    const q = query(customersRef, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const customersData = snapshot.docs.map(doc => ({
        customerId: doc.id,
        ...doc.data()
      } as Customer));
      setCustomers(customersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [shop]);

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
                  <p className="text-lg font-bold text-gray-900">{customer.purchaseHistory.length}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Last Visit</p>
                  <p className="text-sm font-bold text-gray-900">
                    {customer.purchaseHistory.length > 0 ? 'Recently' : 'Never'}
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
