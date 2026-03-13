import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { Receipt } from '../types';
import { 
  Search, 
  Calendar, 
  Phone, 
  Printer, 
  Eye, 
  Receipt as ReceiptIcon,
  ChevronRight,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const Receipts = () => {
  const { shop } = useAuth();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);

  useEffect(() => {
    if (!shop) return;

    const receiptsRef = collection(db, 'receipts');
    const q = query(
      receiptsRef, 
      where('shopId', '==', shop.shopId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        receiptId: doc.id,
        ...doc.data()
      } as Receipt));
      setReceipts(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [shop]);

  const filteredReceipts = receipts.filter(r => {
    const matchesSearch = r.customerPhone?.includes(searchTerm) || r.receiptId.includes(searchTerm);
    const matchesDate = dateFilter ? r.createdAt.startsWith(dateFilter) : true;
    return matchesSearch && matchesDate;
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Receipt History</h1>
          <p className="text-gray-500">View and manage digital receipts</p>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by phone or receipt ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>
      </div>

      {/* Receipts List */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Receipt ID</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Method</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">Loading receipts...</td>
                </tr>
              ) : filteredReceipts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">No receipts found</td>
                </tr>
              ) : (
                filteredReceipts.map((receipt) => (
                  <tr key={receipt.receiptId} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-bold text-emerald-600">#{receipt.receiptId.slice(0, 8)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{new Date(receipt.createdAt).toLocaleDateString()}</div>
                      <div className="text-xs text-gray-500">{new Date(receipt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3 h-3 text-gray-400" />
                        <span className="text-sm text-gray-900">{receipt.customerPhone || 'Walk-in'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-gray-900">{receipt.totalAmount.toLocaleString()} ETB</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-bold uppercase bg-gray-100 text-gray-600">
                        {receipt.paymentMethod}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setSelectedReceipt(receipt)}
                        className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipt Detail Modal */}
      <AnimatePresence>
        {selectedReceipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedReceipt(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden print:shadow-none print:rounded-none"
            >
              <div className="p-8">
                {/* Receipt Header */}
                <div className="text-center mb-8">
                  <ReceiptIcon className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
                  <h2 className="text-xl font-bold text-gray-900 uppercase tracking-widest">{selectedReceipt.shopName}</h2>
                  <p className="text-xs text-gray-500 mt-1 uppercase tracking-tighter">Digital Receipt</p>
                </div>

                {/* Receipt Info */}
                <div className="space-y-1 text-xs text-gray-500 mb-8 border-y border-dashed border-gray-200 py-4">
                  <div className="flex justify-between">
                    <span>Receipt No:</span>
                    <span className="font-mono font-bold text-gray-900">#{selectedReceipt.receiptId.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date:</span>
                    <span className="font-medium text-gray-900">{new Date(selectedReceipt.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment:</span>
                    <span className="font-medium text-gray-900 uppercase">{selectedReceipt.paymentMethod}</span>
                  </div>
                  {selectedReceipt.customerPhone && (
                    <div className="flex justify-between">
                      <span>Customer:</span>
                      <span className="font-medium text-gray-900">{selectedReceipt.customerPhone}</span>
                    </div>
                  )}
                </div>

                {/* Items */}
                <div className="space-y-4 mb-8">
                  {selectedReceipt.items.map((item, i) => (
                    <div key={i} className="flex justify-between items-start text-sm">
                      <div className="flex-1">
                        <p className="font-bold text-gray-900">{item.productName}</p>
                        <p className="text-xs text-gray-500">{item.quantity} x {item.price.toLocaleString()} ETB</p>
                      </div>
                      <p className="font-bold text-gray-900">{(item.quantity * item.price).toLocaleString()} ETB</p>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="border-t-2 border-gray-900 pt-4 mb-8">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">TOTAL</span>
                    <span className="text-2xl font-black text-gray-900">{selectedReceipt.totalAmount.toLocaleString()} ETB</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="text-center space-y-2 mb-8">
                  <p className="text-sm font-bold text-gray-900 italic">Thank you for your business!</p>
                  <p className="text-[10px] text-gray-400">SmartShop Ethiopia - Digital POS System</p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 print:hidden">
                  <button
                    onClick={handlePrint}
                    className="flex-1 bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
                  >
                    <Printer className="w-4 h-4" />
                    Print
                  </button>
                  <button
                    onClick={() => setSelectedReceipt(null)}
                    className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:shadow-none, .print\\:shadow-none * {
            visibility: visible;
          }
          .print\\:shadow-none {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Receipts;
