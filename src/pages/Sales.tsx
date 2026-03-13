import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { 
  Calendar, 
  Search, 
  Download,
  Receipt,
  ChevronRight,
  Clock,
  Phone
} from 'lucide-react';
import { Sale } from '../types';
import { motion } from 'motion/react';

const Sales = () => {
  const { shop } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!shop) return;

    const salesRef = collection(db, 'sales');
    const q = query(salesRef, where('shopId', '==', shop.shopId), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const salesData = snapshot.docs.map(doc => ({
        saleId: doc.id,
        ...doc.data()
      } as Sale));
      setSales(salesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [shop]);

  const filteredSales = sales.filter(s => 
    s.saleId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.customerPhone?.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales History</h1>
          <p className="text-gray-500">View and manage all your transactions</p>
        </div>
        <button className="bg-white border border-gray-200 px-4 py-2 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition-all flex items-center justify-center gap-2 shadow-sm">
          <Download className="w-5 h-5" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by Sale ID or Customer Phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Calendar className="text-gray-400 w-5 h-5" />
          <select className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 w-full">
            <option>All Time</option>
            <option>Today</option>
            <option>This Week</option>
            <option>This Month</option>
          </select>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-xs uppercase text-gray-500 font-bold">
                <th className="px-6 py-4">Transaction</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Items</th>
                <th className="px-6 py-4">Total Amount</th>
                <th className="px-6 py-4">Date & Time</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                [1, 2, 3].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-4 h-16 bg-gray-50/50"></td>
                  </tr>
                ))
              ) : filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-500">No transactions found</td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.saleId} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                          <Receipt className="text-emerald-600 w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">#{sale.saleId.slice(0, 8)}</p>
                          <p className="text-xs text-gray-500">POS Sale</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {sale.customerPhone ? (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="w-3 h-3" />
                          {sale.customerPhone}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Guest Customer</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex -space-x-2">
                        {sale.items.slice(0, 3).map((item, i) => (
                          <div key={i} className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-[8px] font-bold">
                            {item.productName[0]}
                          </div>
                        ))}
                        {sale.items.length > 3 && (
                          <div className="w-6 h-6 rounded-full bg-emerald-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-emerald-700">
                            +{sale.items.length - 3}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-gray-900">{sale.totalAmount.toLocaleString()} ETB</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">
                        <p className="font-medium">{new Date(sale.createdAt).toLocaleDateString()}</p>
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-gray-400 hover:text-emerald-600 transition-colors">
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Sales;
