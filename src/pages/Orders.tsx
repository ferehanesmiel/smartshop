import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { 
  ClipboardList, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Phone,
  User,
  Package,
  ChevronRight
} from 'lucide-react';
import { Order } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

const Orders = () => {
  const { shop } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!shop) return;

    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, where('shopId', '==', shop.shopId), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        orderId: doc.id,
        ...doc.data()
      } as Order));
      setOrders(ordersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [shop]);

  const updateStatus = async (orderId: string, status: Order['status']) => {
    if (!shop) return;
    try {
      await updateDoc(doc(db, 'orders', orderId), { status });
      setSelectedOrder(null);
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const statusColors = {
    pending: "bg-amber-100 text-amber-700",
    accepted: "bg-blue-100 text-blue-700",
    completed: "bg-emerald-100 text-emerald-700",
    rejected: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Online Orders</h1>
        <p className="text-gray-500">Manage orders from your mini store</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading ? (
          [1, 2].map(i => (
            <div key={i} className="bg-gray-100 h-48 rounded-2xl animate-pulse"></div>
          ))
        ) : orders.length === 0 ? (
          <div className="col-span-full py-20 text-center text-gray-500 bg-white rounded-2xl border border-gray-100">
            <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>No online orders yet</p>
          </div>
        ) : (
          orders.map((order) => (
            <motion.div
              layout
              key={order.orderId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedOrder(order)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className={cn("text-[10px] font-bold uppercase px-2 py-1 rounded-md", statusColors[order.status])}>
                    {order.status}
                  </span>
                  <span className="text-xs text-gray-400">#{order.orderId.slice(0, 8)}</span>
                </div>
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(order.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{order.customerName}</h3>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {order.customerPhone}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-600">
                  <span className="font-bold">{order.products.length}</span> items
                </p>
                <p className="text-lg font-bold text-gray-900">{order.totalAmount.toLocaleString()} ETB</p>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Order Detail Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
                <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Customer</p>
                    <p className="font-bold text-gray-900">{selectedOrder.customerName}</p>
                    <p className="text-sm text-gray-600">{selectedOrder.customerPhone}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Status</p>
                    <span className={cn("text-xs font-bold uppercase px-2 py-1 rounded-md inline-block mt-1", statusColors[selectedOrder.status])}>
                      {selectedOrder.status}
                    </span>
                  </div>
                </div>

                {selectedOrder.deliveryAddress && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Delivery Address</p>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-100">
                      {selectedOrder.deliveryAddress}
                    </p>
                  </div>
                )}

                {selectedOrder.note && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Customer Note</p>
                    <p className="text-sm text-gray-600 italic bg-amber-50 p-3 rounded-xl border border-amber-100">
                      "{selectedOrder.note}"
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-3">Items</p>
                  <div className="space-y-3">
                    {selectedOrder.products.map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                            <Package className="w-4 h-4 text-gray-400" />
                          </div>
                          <span>{item.name} <span className="text-gray-400">x{item.quantity}</span></span>
                        </div>
                        <span className="font-bold">{(item.price * item.quantity).toLocaleString()} ETB</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-between items-center font-bold text-xl">
                  <span>Total</span>
                  <span className="text-emerald-600">{selectedOrder.totalAmount.toLocaleString()} ETB</span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4">
                  {selectedOrder.status === 'pending' && (
                    <>
                      <button
                        onClick={() => updateStatus(selectedOrder.orderId, 'rejected')}
                        className="px-4 py-3 border border-red-200 text-red-600 rounded-xl font-bold hover:bg-red-50 transition-all"
                      >
                        Reject Order
                      </button>
                      <button
                        onClick={() => updateStatus(selectedOrder.orderId, 'accepted')}
                        className="px-4 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
                      >
                        Accept Order
                      </button>
                    </>
                  )}
                  {selectedOrder.status === 'accepted' && (
                    <button
                      onClick={() => updateStatus(selectedOrder.orderId, 'completed')}
                      className="col-span-2 px-4 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
                    >
                      Mark as Completed
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Orders;
