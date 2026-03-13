import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Shop } from '../types';
import { Shield, Search, Store, User, Calendar, CheckCircle, XCircle, MoreHorizontal } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';

const AdminPanel = () => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const shopsRef = collection(db, 'shops');
    const q = query(shopsRef, orderBy('createdAt', 'desc'));
    
    const unsubscribeShops = onSnapshot(q, (snapshot) => {
      const shopsData = snapshot.docs.map(doc => ({
        shopId: doc.id,
        ...doc.data()
      } as Shop));
      setShops(shopsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'shops');
      setLoading(false);
    });

    // Calculate total revenue from all sales
    const salesRef = collection(db, 'sales');
    const unsubscribeSales = onSnapshot(salesRef, (snapshot) => {
      const total = snapshot.docs.reduce((acc, doc) => acc + (doc.data().totalAmount || 0), 0);
      setTotalRevenue(total);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'sales');
    });

    return () => {
      unsubscribeShops();
      unsubscribeSales();
    };
  }, []);

  return (
    <div className="space-y-6">
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
          <p className="text-sm font-medium text-gray-500">Total Transaction Volume</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">{totalRevenue.toLocaleString()} ETB</p>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
