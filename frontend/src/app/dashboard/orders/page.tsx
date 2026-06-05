'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChefHat, CheckCircle2, Clock, MapPin, Volume2, VolumeX, UtensilsCrossed } from 'lucide-react';
import { useLiveOrders } from '@/hooks/useLiveOrders';

export default function LiveOrdersPage() {
  // Default to false so the user MUST click the button to enable it (satisfying browser autoplay policies)
  const [soundEnabled, setSoundEnabled] = useState(false);
  const { orders, loading, error, updateOrderStatus } = useLiveOrders(soundEnabled);
  
  if (loading) {
    return <div className="p-8 text-gray-400 animate-pulse">Loading live orders...</div>;
  }
  
  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-6 py-4 rounded-2xl text-sm flex items-center gap-3">
          <span className="w-3 h-3 bg-red-400 rounded-full animate-pulse shrink-0" />
          <span>{error}. Make sure the backend is running and disable extensions like Urban VPN Proxy that may block local requests.</span>
        </div>
      </div>
    );
  }

  const paymentVerifying = orders.filter(o => o.status === 'payment_verifying');
  const activeOrders = orders.filter(o => ['pending', 'preparing', 'delivering'].includes(o.status));
  const servedOrders = orders.filter(o => ['completed', 'payment_requested'].includes(o.status));
  const paidOrders = orders.filter(o => o.status === 'paid');

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      <div className="flex justify-between items-center bg-purple-500/10 border border-purple-500/20 p-6 rounded-3xl">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
            <ChefHat className="w-8 h-8 text-purple-400" />
            Live Kitchen Orders
          </h1>
          <p className="text-purple-300">Orders placed by customers via the AR Menu will instantly appear here.</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-3 rounded-xl transition-all ${soundEnabled ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-500/20 text-gray-500'}`}
          >
            {soundEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
          </button>
          <div className={`font-bold text-2xl w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${paymentVerifying.length > 0 ? 'bg-red-500 text-white shadow-red-500/20 animate-pulse' : 'bg-purple-500 text-white shadow-purple-500/20'}`}>
            {paymentVerifying.length > 0 ? '!' : activeOrders.length}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* ACTIVE ORDERS */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white mb-4 border-b border-white/10 pb-2 flex items-center justify-between">
            Active Orders
            {paymentVerifying.length > 0 && (
              <span className="text-xs bg-red-500/20 text-red-400 px-3 py-1 rounded-full animate-pulse border border-red-500/50">
                {paymentVerifying.length} Verification Pending
              </span>
            )}
          </h2>
          
          <AnimatePresence>
            {/* PAYMENT VERIFYING ORDERS AT TOP */}
            {paymentVerifying.map(order => (
              <motion.div 
                key={order._id}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/10 border border-red-500/30 p-6 rounded-2xl shadow-lg relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-2 h-full bg-red-500 shadow-[0_0_15px_#ef4444] animate-pulse" />
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="w-4 h-4 text-red-400" />
                      <span className="font-bold text-lg text-red-400">Table {order.tableNumber}</span>
                      {order.customerName && (
                        <span className="text-gray-400 text-sm">({order.customerName})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-red-300">
                      <Clock className="w-3 h-3" />
                      <span>Customer states they have paid via UPI</span>
                    </div>
                  </div>
                  <span className="font-bold text-2xl text-red-400">₹{order.totalAmount}</span>
                </div>
                
                <button 
                  onClick={() => updateOrderStatus(order._id, 'paid')}
                  className="w-full bg-red-500 text-white font-bold rounded-xl py-3 flex items-center justify-center gap-2 hover:bg-red-600 transition-colors shadow-lg"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Confirm Payment Received
                </button>
              </motion.div>
            ))}

            {/* NORMAL ACTIVE ORDERS */}
            {activeOrders.length === 0 && paymentVerifying.length === 0 ? (
              <div className="text-gray-500 p-8 text-center bg-white/5 rounded-2xl border border-white/5 border-dashed">
                No active orders at the moment.
              </div>
            ) : (
              activeOrders.map(order => (
                <motion.div 
                  key={order._id}
                  initial={{ opacity: 0, scale: 0.8, rotate: -2 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="bg-white/10 border border-white/20 p-6 rounded-2xl shadow-lg relative overflow-hidden"
                >
                  <motion.div 
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute top-0 left-0 w-2 h-full bg-purple-500 shadow-[0_0_15px_#a855f7]" 
                  />
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="w-4 h-4 text-purple-400" />
                        <span className="font-bold text-lg text-purple-400">Table {order.tableNumber}</span>
                        {order.customerName && (
                          <span className="text-gray-400 text-sm">({order.customerName})</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(order.createdAt).toLocaleTimeString()}</span>
                      </div>
                    </div>
                    <span className="font-bold text-xl">₹{order.totalAmount}</span>
                  </div>
                  
                  <div className="space-y-2 mb-6">
                    {order.items.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between items-center text-gray-200">
                        <span>1x {item.name}</span>
                        <span className="text-gray-400 text-sm">{item.price}</span>
                      </div>
                    ))}
                  </div>

                  {order.status === 'pending' ? (
                    <button 
                      onClick={() => updateOrderStatus(order._id, 'preparing')}
                      className="w-full bg-yellow-500/20 text-yellow-400 font-bold border border-yellow-500/50 rounded-xl py-3 flex items-center justify-center gap-2 hover:bg-yellow-500/30 transition-colors"
                    >
                      <ChefHat className="w-5 h-5" />
                      Start Preparing
                    </button>
                  ) : order.status === 'preparing' ? (
                    <button 
                      onClick={() => updateOrderStatus(order._id, 'delivering')}
                      className="w-full bg-blue-500/20 text-blue-400 font-bold border border-blue-500/50 rounded-xl py-3 flex items-center justify-center gap-2 hover:bg-blue-500/30 transition-colors"
                    >
                      <UtensilsCrossed className="w-5 h-5" />
                      Send to Table
                    </button>
                  ) : (
                    <button 
                      onClick={() => updateOrderStatus(order._id, 'completed')}
                      className="w-full bg-green-500/20 text-green-400 font-bold border border-green-500/50 rounded-xl py-3 flex items-center justify-center gap-2 hover:bg-green-500/30 transition-colors"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      Mark as Served
                    </button>
                  )}
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* SERVED ORDERS */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-300 mb-4 border-b border-white/10 pb-2">Served (Awaiting Payment)</h2>
          <div className="space-y-4">
            {servedOrders.length === 0 ? (
              <div className="text-gray-600 p-8 text-center bg-white/5 rounded-2xl border border-white/5 border-dashed">
                No orders waiting for payment.
              </div>
            ) : (
              servedOrders.map(order => (
                <div key={order._id} className="bg-white/10 border border-white/20 p-5 rounded-2xl">
                  <div className="flex justify-between items-start mb-3">
                    <span className="font-bold text-white">Table {order.tableNumber}</span>
                    <span className="font-bold text-gray-300">₹{order.totalAmount}</span>
                  </div>
                  <div className="text-sm text-gray-400 mb-4">
                    {order.items.length} items served.
                  </div>
                  {order.status === 'completed' ? (
                    <button 
                      onClick={() => updateOrderStatus(order._id, 'payment_requested')}
                      className="w-full bg-white text-black font-bold border border-white/50 rounded-xl py-2 flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
                    >
                      Send Bill to Table
                    </button>
                  ) : (
                    <div className="w-full bg-white/5 text-gray-400 font-medium rounded-xl py-2 flex items-center justify-center border border-white/5">
                      Bill Sent - Waiting...
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* COMPLETED ORDERS */}
          <h2 className="text-xl font-bold text-gray-500 mt-8 mb-4 border-b border-white/10 pb-2">Completed & Paid</h2>
          <div className="space-y-4 opacity-50">
            {paidOrders.length === 0 ? (
              <div className="text-gray-600 p-8 text-center bg-white/5 rounded-2xl border border-white/5 border-dashed">
                No paid orders yet.
              </div>
            ) : (
              paidOrders.map(order => (
                <div key={order._id} className="bg-white/5 border border-white/10 p-5 rounded-2xl">
                  <div className="flex justify-between items-start mb-3">
                    <span className="font-bold text-gray-400">Table {order.tableNumber}</span>
                    <span className="font-bold text-gray-500">₹{order.totalAmount}</span>
                  </div>
                  <div className="text-sm text-gray-500 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-gray-400" />
                    Paid & Closed
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
