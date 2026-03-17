import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, where } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Shop } from '../types';
import { Shield, Search, Store, User, Calendar, CheckCircle, XCircle, MoreHorizontal } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { onAuthStateChanged } from 'firebase/auth';

const AdminPanel = () => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [users, setUsers] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [marketplaceOrders, setMarketplaceOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

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

    // Fetch users
    const usersRef = collection(db, 'users');
    const unsubscribeUsers = onSnapshot(usersRef, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });

    // Fetch subscriptions
    const subsRef = collection(db, 'subscriptions');
    const unsubscribeSubs = onSnapshot(subsRef, (snapshot) => {
      setSubscriptions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'subscriptions');
    });

    // Fetch marketplace orders
    const ordersRef = collection(db, 'orders');
    const qOrders = query(ordersRef, where('isMarketplaceOrder', '==', true));
    const unsubscribeOrders = onSnapshot(qOrders, (snapshot) => {
      setMarketplaceOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
    });

    return () => {
      unsubscribeShops();
      unsubscribeSales();
      unsubscribeUsers();
      unsubscribeSubs();
      unsubscribeOrders();
    };
  }, [isAuthenticated]);

  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Please log in to access the Admin Panel.</div>;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
          <p className="text-sm font-medium text-gray-500">Total Users</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{users.length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Total Marketplace Orders</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{marketplaceOrders.length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Total Revenue</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">{totalRevenue.toLocaleString()} ETB</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Active Subscriptions</p>
          <p className="text-3xl font-bold text-emerald-600 mt-1">
            {subscriptions.filter(s => s.subscriptionStatus === 'active').length}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
