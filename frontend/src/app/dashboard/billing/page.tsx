'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Receipt, Users, CheckCircle2, X, Send, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLiveOrders } from '@/hooks/useLiveOrders';
import { IOrder } from '@/types';
import { getApiUrl } from '@/utils/api';

export default function BillingPage() {
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const { orders, loading, updateOrderStatus } = useLiveOrders();

  const handleUpdateStatus = async (tableGroups: IOrder[], status: string) => {
    try {
      // Mark all orders in this group as requested status
      await Promise.all(tableGroups.map((order) => updateOrderStatus(order._id, status)));

      // When fully paid, close the ticket so a new one can open on the same table
      if (status === 'paid' && tableGroups[0]?.ticketId) {
        const apiUrl = getApiUrl();
        const token = localStorage.getItem('token') || '';
        await fetch(`${apiUrl}/tickets/${tableGroups[0].ticketId}/close`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
        });
      }

      setSelectedTable(null);
      toast.success('Status updated.');
    } catch (err) {
      console.error("Failed to update status:", err);
      toast.error('Failed to update status.');
    }
  };

  if (loading) {
    return <div className="p-8 text-gray-400 animate-pulse">Loading billing data...</div>;
  }

  // Filter out already paid orders
  const activeOrders = orders.filter(o => o.status !== 'paid');

  // Group by ticket when available (modern flow), else fall back to table+name
  // for legacy orders that don't have a ticketId. Either way, one card = one bill.
  const tableGroups: Record<string, any[]> = {};
  activeOrders.forEach(order => {
    const key = order.ticketId
      ? `ticket:${order.ticketId}`
      : `legacy:Table ${order.tableNumber} - ${order.customerName}`;
    if (!tableGroups[key]) {
      tableGroups[key] = [];
    }
    tableGroups[key].push(order);
  });

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="flex justify-between items-center bg-blue-500/10 border border-blue-500/20 p-6 rounded-3xl mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
            <CreditCard className="w-8 h-8 text-blue-400" />
            Billing & Checkout
          </h1>
          <p className="text-blue-300">One bill per table. Tap a card to view the itemised receipt and settle.</p>
        </div>
      </div>

      {Object.keys(tableGroups).length === 0 ? (
        <div className="text-gray-500 p-12 text-center bg-white/5 rounded-2xl border border-white/5 border-dashed">
          No active tables to bill.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(tableGroups).map(([key, groupOrders]) => {
            const tableNumber = groupOrders[0].tableNumber;
            const customerName = groupOrders[0].customerName;
            
            // Calculate grand total for this table
            const grandTotal = groupOrders.reduce((sum, o) => {
              const price = typeof o.totalAmount === 'number' ? o.totalAmount : parseInt(o.totalAmount.toString().replace(/[^0-9]/g, ''));
              return sum + price;
            }, 0);

            // Count total items
            const totalItems = groupOrders.reduce((sum, o) => sum + o.items.length, 0);

            const hasPaymentRequested = groupOrders.some(o => o.status === 'payment_requested');

            return (
              <motion.div 
                key={key}
                whileHover={{ scale: 1.02 }}
                onClick={() => setSelectedTable({ key, tableNumber, customerName, orders: groupOrders, grandTotal, hasPaymentRequested })}
                className="bg-white/10 border border-white/20 p-6 rounded-2xl shadow-lg cursor-pointer hover:bg-white/15 transition-colors relative overflow-hidden"
              >
                {hasPaymentRequested && (
                  <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute top-0 left-0 w-2 h-full bg-blue-500" />
                )}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Table {tableNumber}</h2>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Users className="w-4 h-4" />
                      <span>{customerName}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-xl font-bold">
                      {groupOrders.length} Orders
                    </div>
                    {hasPaymentRequested && <span className="text-blue-400 text-xs font-bold animate-pulse">Payment Requested</span>}
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                  <span className="text-gray-400">{totalItems} items</span>
                  <span className="text-xl font-bold text-blue-400">₹{grandTotal}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Itemized Receipt Modal */}
      <AnimatePresence>
        {selectedTable && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedTable(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#111] border border-white/20 rounded-3xl p-6 z-50 shadow-2xl max-h-[90vh] flex flex-col"
            >
              <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Receipt className="w-6 h-6 text-blue-400" />
                    Receipt
                  </h2>
                  <p className="text-gray-400">Table {selectedTable.tableNumber} ({selectedTable.customerName})</p>
                </div>
                <button onClick={() => setSelectedTable(null)} className="text-gray-400 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-6 pr-2 mb-6">
                {selectedTable.orders.map((order: any, idx: number) => (
                  <div key={order._id} className="bg-white/5 p-4 rounded-xl border border-white/5">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Order #{idx + 1}</span>
                      <span className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleTimeString()}</span>
                    </div>
                    {order.items.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between items-center text-gray-300 py-1">
                        <span>1x {item.name}</span>
                        <span>{item.price}</span>
                      </div>
                    ))}
                    <div className="mt-3 pt-2 border-t border-white/10 flex justify-between font-bold text-gray-400">
                      <span>Subtotal</span>
                      <span>₹{order.totalAmount}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-white/20 space-y-4">
                <div className="flex justify-between items-center text-xl">
                  <span className="text-gray-300 font-bold">Grand Total</span>
                  <span className="font-bold text-3xl text-blue-400">₹{selectedTable.grandTotal}</span>
                </div>
                
                {selectedTable.hasPaymentRequested ? (
                  <>
                    <div className="bg-blue-500/20 border border-blue-500/50 p-4 rounded-xl text-center mb-4">
                      <p className="text-blue-400 font-bold mb-1 flex items-center justify-center gap-2">
                        <Smartphone className="w-5 h-5" />
                        Bill Sent to Customer's Phone
                      </p>
                      <p className="text-sm text-gray-400">Waiting for UPI Payment confirmation.</p>
                    </div>
                    <button 
                      onClick={() => handleUpdateStatus(selectedTable.orders, 'paid')}
                      className="w-full bg-green-500 hover:bg-green-600 text-white font-bold rounded-2xl py-4 flex items-center justify-center gap-2 transition-colors shadow-lg shadow-green-500/20"
                    >
                      <CheckCircle2 className="w-6 h-6" />
                      Confirm Payment Received
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={() => handleUpdateStatus(selectedTable.orders, 'payment_requested')}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-2xl py-4 flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-500/20"
                    >
                      <Send className="w-6 h-6" />
                      Send Digital Bill
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus(selectedTable.orders, 'paid')}
                      className="w-full bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl py-3 flex items-center justify-center gap-2 transition-colors border border-white/10"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      Settle with Cash
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
