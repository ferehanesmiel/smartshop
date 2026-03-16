import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Order } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { motion, AnimatePresence } from 'motion/react';
import { XCircle, Package } from 'lucide-react';
import { cn } from '../lib/utils';

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-800',
  accepted: 'bg-blue-100 text-blue-800',
  completed: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800'
};

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        orderId: doc.id,
        ...doc.data()
      } as Order));
      setOrders(ordersData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateStatus = async (orderId: string, status: Order['status']) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status });
      setSelectedOrder(prev => prev ? { ...prev, status } : null);
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Orders Management</h2>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-xs uppercase text-gray-500 font-bold">
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Payment</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-4 text-center">Loading...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-4 text-center">No orders found</td></tr>
              ) : (
                orders.map((order) => (
                  <tr 
                    key={order.orderId} 
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">#{order?.orderId?.slice(0, 8)}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{order.customerName || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{order.totalAmount.toLocaleString()} ETB</td>
                    <td className="px-6 py-4 text-sm text-gray-500 uppercase">{order.paymentMethod?.replace('_', ' ') || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <span className={cn("text-xs font-bold uppercase px-2 py-1 rounded-md", statusColors[order.status])}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
                <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
                <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
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

                <div className="grid grid-cols-2 gap-4">
                  {selectedOrder.customerAddress && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Delivery Address</p>
                      <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-100 h-full">
                        {selectedOrder.customerAddress}
                      </p>
                    </div>
                  )}
                  {selectedOrder.paymentMethod && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Payment Method</p>
                      <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-100 h-full uppercase font-bold">
                        {selectedOrder.paymentMethod.replace('_', ' ')}
                      </p>
                    </div>
                  )}
                </div>

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
                    {(selectedOrder.items || selectedOrder.products)?.map((item, i) => (
                      <div key={item.productId} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover rounded" />
                            ) : (
                              <Package className="w-4 h-4 text-gray-400" />
                            )}
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
                        onClick={() => updateStatus(selectedOrder.orderId, 'cancelled')}
                        className="px-4 py-3 border border-red-200 text-red-600 rounded-xl font-bold hover:bg-red-50 transition-all"
                      >
                        Cancel Order
                      </button>
                      <button
                        onClick={() => updateStatus(selectedOrder.orderId, 'confirmed')}
                        className="px-4 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
                      >
                        Confirm Order
                      </button>
                    </>
                  )}
                  {selectedOrder.status === 'confirmed' && (
                    <button
                      onClick={() => updateStatus(selectedOrder.orderId, 'shipped')}
                      className="col-span-2 px-4 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-all shadow-lg shadow-purple-200"
                    >
                      Mark as Shipped
                    </button>
                  )}
                  {selectedOrder.status === 'shipped' && (
                    <button
                      onClick={() => updateStatus(selectedOrder.orderId, 'delivered')}
                      className="col-span-2 px-4 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
                    >
                      Mark as Delivered
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

export default AdminOrders;
