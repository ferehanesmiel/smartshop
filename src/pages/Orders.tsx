import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { useSubscription } from '../SubscriptionContext';
import { 
  ClipboardList, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Phone,
  User,
  Package,
  ChevronRight,
  Lock
} from 'lucide-react';
import { Order } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Orders = () => {
  const { t } = useTranslation();
  const { shop } = useAuth();
  const { isFeatureAllowed } = useSubscription();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const hasAccess = isFeatureAllowed('orders');

  useEffect(() => {
    if (!shop || !hasAccess) {
      setLoading(false);
      return;
    }

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
  }, [shop, hasAccess]);

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-6">
          <Lock className="w-10 h-10 text-[#ff6600]" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('orders.purchase_orders')}</h2>
        <p className="text-gray-500 max-w-md mb-8">
          {t('orders.purchase_orders_desc')}
        </p>
        <Link 
          to="/dashboard/settings" 
          className="bg-[#ff6600] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#e65c00] transition-all shadow-lg shadow-orange-200"
        >
          {t('reports.upgrade_to_pro')}
        </Link>
      </div>
    );
  }

  const updateStatus = async (orderId: string, status: Order['orderStatus']) => {
    if (!shop) return;
    try {
      await updateDoc(doc(db, 'orders', orderId), { orderStatus: status });
      setSelectedOrder(null);
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const statusColors: Record<string, string> = {
    'Pending': "bg-amber-100 text-amber-700",
    'Confirmed': "bg-blue-100 text-blue-700",
    'Shipped': "bg-purple-100 text-purple-700",
    'Delivered': "bg-emerald-100 text-emerald-700",
    'Cancelled': "bg-red-100 text-red-700",
  };

  const getStatusLabel = (status: Order['orderStatus']) => {
    return status;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('orders.title')}</h1>
        <p className="text-gray-500">{t('orders.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading ? (
          [1, 2].map(i => (
            <div key={i} className="bg-gray-100 h-48 rounded-2xl animate-pulse"></div>
          ))
        ) : orders.length === 0 ? (
          <div className="col-span-full py-20 text-center text-gray-500 bg-white rounded-2xl border border-gray-100">
            <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>{t('orders.no_orders')}</p>
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
                  <span className={cn("text-[10px] font-bold uppercase px-2 py-1 rounded-md", statusColors[order.orderStatus || 'Pending'])}>
                    {getStatusLabel(order.orderStatus || 'Pending')}
                  </span>
                  <span className="text-xs text-gray-400">#{order?.orderId?.slice(0, 8)}</span>
                </div>
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : new Date(order.createdAt).toLocaleDateString()}
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
                  <span className="font-bold">{t('orders.items_count', { count: (order.items || order.products)?.length || 0 })}</span>
                </p>
                <p className="text-lg font-bold text-gray-900">{order.totalAmount.toLocaleString()} {t('common.currency')}</p>
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
                <h2 className="text-xl font-bold text-gray-900">{t('orders.order_details')}</h2>
                <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">{t('orders.customer')}</p>
                    <p className="font-bold text-gray-900">{selectedOrder.customerName}</p>
                    <p className="text-sm text-gray-600">{selectedOrder.customerPhone}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">{t('orders.status')}</p>
                    <span className={cn("text-xs font-bold uppercase px-2 py-1 rounded-md inline-block mt-1", statusColors[selectedOrder.orderStatus || 'Pending'])}>
                      {getStatusLabel(selectedOrder.orderStatus || 'Pending')}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {selectedOrder.customerAddress && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">{t('orders.delivery_address')}</p>
                      <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-100 h-full">
                        {selectedOrder.customerAddress}
                      </p>
                    </div>
                  )}
                  {selectedOrder.paymentMethod && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">{t('orders.payment_method')}</p>
                      <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-100 h-full uppercase font-bold">
                        {selectedOrder.paymentMethod.replace('_', ' ')}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-3">{t('orders.items')}</p>
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
                        <span className="font-bold">{(item.price * item.quantity).toLocaleString()} {t('common.currency')}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-between items-center font-bold text-xl">
                  <span>{t('orders.total')}</span>
                  <span className="text-emerald-600">{selectedOrder.totalAmount.toLocaleString()} {t('common.currency')}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4">
                  {(selectedOrder.orderStatus === 'Pending' || !selectedOrder.orderStatus) && (
                    <>
                      <button
                        onClick={() => updateStatus(selectedOrder.orderId, 'Cancelled')}
                        className="px-4 py-3 border border-red-200 text-red-600 rounded-xl font-bold hover:bg-red-50 transition-all"
                      >
                        {t('orders.cancel_order')}
                      </button>
                      <button
                        onClick={() => updateStatus(selectedOrder.orderId, 'Confirmed')}
                        className="px-4 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
                      >
                        {t('orders.confirm_order')}
                      </button>
                    </>
                  )}
                  {selectedOrder.orderStatus === 'Confirmed' && (
                    <button
                      onClick={() => updateStatus(selectedOrder.orderId, 'Shipped')}
                      className="col-span-2 px-4 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-all shadow-lg shadow-purple-200"
                    >
                      {t('orders.mark_as_shipped')}
                    </button>
                  )}
                  {selectedOrder.orderStatus === 'Shipped' && (
                    <button
                      onClick={() => updateStatus(selectedOrder.orderId, 'Delivered')}
                      className="col-span-2 px-4 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
                    >
                      {t('orders.mark_as_delivered')}
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
