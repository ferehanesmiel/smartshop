import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Shop } from '../types';
import { 
  Shield, 
  Search, 
  Store, 
  User, 
  Calendar,
  CheckCircle,
  XCircle,
  MoreHorizontal
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

const AdminPanel = () => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const shopsRef = collection(db, 'shops');
    const q = query(shopsRef, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const shopsData = snapshot.docs.map(doc => ({
        shopId: doc.id,
        ...doc.data()
      } as Shop));
      setShops(shopsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const toggleShopStatus = async (shopId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await updateDoc(doc(db, 'shops', shopId), { status: newStatus });
    } catch (err) {
      console.error('Error updating shop status:', err);
    }
  };

  const filteredShops = shops.filter(s => 
    s.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center">
          <Shield className="text-white w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Platform Admin</h1>
          <p className="text-gray-500">Manage all registered shops and subscriptions</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Total Shops</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{shops.length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Active Shops</p>
          <p className="text-3xl font-bold text-emerald-600 mt-1">
            {shops.filter(s => s.status === 'active').length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Total Revenue (Est.)</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">0 ETB</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search shops, owners, or emails..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none transition-all"
          />
        </div>
      </div>

      {/* Shops Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-xs uppercase text-gray-500 font-bold">
                <th className="px-6 py-4">Shop</th>
                <th className="px-6 py-4">Owner</th>
                <th className="px-6 py-4">Plan</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Joined</th>
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
              ) : filteredShops.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-500">No shops found</td>
                </tr>
              ) : (
                filteredShops.map((shop) => (
                  <tr key={shop.shopId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Store className="text-gray-500 w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{shop.shopName}</p>
                          <p className="text-xs text-gray-500">/{shop.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">{shop.ownerName}</p>
                        <p className="text-xs text-gray-500">{shop.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold uppercase px-2 py-1 bg-blue-50 text-blue-700 rounded-md">
                        {shop.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "text-xs font-bold uppercase px-2 py-1 rounded-md",
                        shop.status === 'active' ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                      )}>
                        {shop.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(shop.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => toggleShopStatus(shop.shopId, shop.status)}
                        className={cn(
                          "text-xs font-bold px-3 py-1 rounded-lg transition-colors",
                          shop.status === 'active' ? "text-red-600 hover:bg-red-50" : "text-emerald-600 hover:bg-emerald-50"
                        )}
                      >
                        {shop.status === 'active' ? 'Deactivate' : 'Activate'}
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

export default AdminPanel;
