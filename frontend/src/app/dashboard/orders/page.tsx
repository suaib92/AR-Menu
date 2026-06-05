'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChefHat, CheckCircle2, Clock, MapPin, Volume2, VolumeX, UtensilsCrossed, Receipt, Archive } from 'lucide-react';
import { useLiveOrders } from '@/hooks/useLiveOrders';
import { useScreenWakeLock } from '@/hooks/useScreenWakeLock';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';

type Tab = 'active' | 'served' | 'paid';

export default function LiveOrdersPage() {
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [tab, setTab] = useState<Tab>('active');
  const { orders, loading, error, updateOrderStatus } = useLiveOrders(soundEnabled);
  useScreenWakeLock(true);

  if (loading) {
    return (
      <div className="space-y-4 max-w-5xl mx-auto">
        <div className="h-10 w-64 bg-white/[0.06] rounded-xl animate-pulse" />
        <div className="h-12 w-96 bg-white/[0.06] rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-48 bg-white/[0.04] border border-white/[0.06] rounded-2xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-6 py-4 rounded-2xl text-sm flex items-center gap-3">
          <span className="w-3 h-3 bg-red-400 rounded-full animate-pulse shrink-0" />
          <span>{error}. Make sure the backend is running.</span>
        </div>
      </div>
    );
  }

  const paymentVerifying = orders.filter((o) => o.status === 'payment_verifying');
  const activeOrders = orders.filter((o) =>
    ['pending', 'preparing', 'delivering'].includes(o.status)
  );
  const servedOrders = orders.filter((o) =>
    ['completed', 'payment_requested'].includes(o.status)
  );
  const paidOrders = orders.filter((o) => o.status === 'paid');

  const tabs: { id: Tab; label: string; icon: typeof ChefHat; count: number }[] = [
    { id: 'active', label: 'Active', icon: ChefHat, count: activeOrders.length + paymentVerifying.length },
    { id: 'served', label: 'Served', icon: Receipt, count: servedOrders.length },
    { id: 'paid', label: 'Paid', icon: Archive, count: paidOrders.length },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-white/[0.04] border border-white/[0.08] backdrop-blur p-6 rounded-3xl">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1 flex items-center gap-3">
            <ChefHat className="w-7 h-7 text-brand" />
            Live Kitchen
          </h1>
          <p className="text-text-muted text-sm">
            Orders appear here the moment a customer places them via the AR menu.
          </p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={() => setSoundEnabled((s) => !s)}
            aria-label={soundEnabled ? 'Mute new-order alerts' : 'Enable new-order alerts'}
            aria-pressed={soundEnabled}
            className={`p-3 rounded-xl transition-colors border ${
              soundEnabled
                ? 'bg-brand/15 text-brand border-brand/30'
                : 'bg-white/[0.04] text-text-muted border-white/[0.08] hover:text-white'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
          <div
            className={`font-bold text-2xl w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
              paymentVerifying.length > 0
                ? 'bg-danger text-white shadow-danger/30 animate-pulse'
                : 'bg-brand text-white shadow-brand/30'
            }`}
          >
            {paymentVerifying.length > 0 ? '!' : activeOrders.length}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 p-1.5 bg-white/[0.04] border border-white/[0.08] rounded-2xl w-full sm:w-fit">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-text-muted hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full ${
                  isActive ? 'bg-white/10' : 'bg-white/5'
                }`}
              >
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'active' && (
          <motion.div
            key="active"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {paymentVerifying.map((order) => (
              <motion.div
                key={order._id}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-danger/10 border border-danger/30 p-5 rounded-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1.5 h-full bg-danger shadow-[0_0_12px_var(--color-danger)] animate-pulse" />
                <div className="flex justify-between items-start mb-3 gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="w-4 h-4 text-danger shrink-0" />
                      <span className="font-bold text-base text-danger">Table {order.tableNumber}</span>
                      {order.customerName && (
                        <span className="text-text-muted text-xs truncate">({order.customerName})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-danger/80">
                      <Clock className="w-3 h-3" />
                      Customer says they paid via UPI
                    </div>
                  </div>
                  <span className="font-bold text-xl text-danger shrink-0">₹{order.totalAmount}</span>
                </div>
                <button
                  onClick={() => updateOrderStatus(order._id, 'paid')}
                  className="w-full bg-danger text-white font-bold rounded-xl py-2.5 flex items-center justify-center gap-2 hover:bg-danger/90 transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Confirm payment
                </button>
              </motion.div>
            ))}

              {activeOrders.length === 0 && paymentVerifying.length === 0 ? (
                <div className="col-span-full">
                  <EmptyState
                    icon={ChefHat}
                    title="No active orders"
                    description="When a customer places an order from the AR menu, it will appear here in real time."
                  />
                </div>
              ) : (
                activeOrders.map((order) => (
                  <motion.div
                    key={order._id}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ type: 'spring', stiffness: 280, damping: 24 }}
                    className="bg-white/[0.05] border border-white/15 p-5 rounded-2xl relative overflow-hidden"
                  >
                    {/* Ticket badge — indicates this order is part of a multi-order bill */}
                    {order.ticketId && (
                      <div className="absolute top-3 right-3 text-[10px] font-semibold uppercase tracking-wider text-purple-300/80 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full">
                        Ticket
                      </div>
                    )}
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-brand shadow-[0_0_12px_var(--color-brand)]" />
                  <div className="flex justify-between items-start mb-3 gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="w-4 h-4 text-brand shrink-0" />
                        <span className="font-bold text-base text-brand">Table {order.tableNumber}</span>
                        {order.customerName && (
                          <span className="text-text-muted text-xs truncate">({order.customerName})</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={order.status} />
                        <span className="text-[11px] text-text-muted">
                          {new Date(order.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                    <span className="font-bold text-xl shrink-0">₹{order.totalAmount}</span>
                  </div>

                  <div className="space-y-1.5 mb-4 text-sm">
                    {order.items.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between items-center text-text-default">
                        <span className="truncate">
                          {item.quantity && item.quantity > 1 ? `${item.quantity}× ` : ''}
                          {item.name}
                        </span>
                        <span className="text-text-muted text-xs shrink-0 ml-2">₹{item.price}</span>
                      </div>
                    ))}
                  </div>

                  {order.status === 'pending' ? (
                    <button
                      onClick={() => updateOrderStatus(order._id, 'preparing')}
                      className="w-full bg-warning/15 text-warning border border-warning/30 font-semibold rounded-xl py-2.5 flex items-center justify-center gap-2 hover:bg-warning/25 transition-colors"
                    >
                      <ChefHat className="w-4 h-4" />
                      Start preparing
                    </button>
                  ) : order.status === 'preparing' ? (
                    <button
                      onClick={() => updateOrderStatus(order._id, 'delivering')}
                      className="w-full bg-info/15 text-info border border-info/30 font-semibold rounded-xl py-2.5 flex items-center justify-center gap-2 hover:bg-info/25 transition-colors"
                    >
                      <UtensilsCrossed className="w-4 h-4" />
                      Send to table
                    </button>
                  ) : (
                    <button
                      onClick={() => updateOrderStatus(order._id, 'completed')}
                      className="w-full bg-success/15 text-success border border-success/30 font-semibold rounded-xl py-2.5 flex items-center justify-center gap-2 hover:bg-success/25 transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Mark as served
                    </button>
                  )}
                </motion.div>
              ))
            )}
          </motion.div>
        )}

        {tab === 'served' && (
          <motion.div
            key="served"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {servedOrders.length === 0 ? (
              <div className="col-span-full">
                <EmptyState
                  icon={Receipt}
                  title="No orders waiting for payment"
                  description="Tables that have been served and billed will appear here."
                />
              </div>
            ) : (
              servedOrders.map((order) => (
                <div
                  key={order._id}
                  className="bg-white/[0.04] border border-white/[0.08] p-5 rounded-2xl"
                >
                  <div className="flex justify-between items-start mb-3 gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="w-4 h-4 text-text-muted shrink-0" />
                        <span className="font-bold text-base">Table {order.tableNumber}</span>
                        {order.customerName && (
                          <span className="text-text-muted text-xs truncate">({order.customerName})</span>
                        )}
                      </div>
                      <StatusBadge status={order.status} />
                    </div>
                    <span className="font-bold text-xl text-text-default shrink-0">₹{order.totalAmount}</span>
                  </div>
                  <div className="text-xs text-text-muted mb-3">
                    {order.items.length} item{order.items.length === 1 ? '' : 's'} served
                  </div>
                  {order.status === 'completed' ? (
                    <button
                      onClick={() => updateOrderStatus(order._id, 'payment_requested')}
                      className="w-full bg-white text-black font-semibold rounded-xl py-2.5 flex items-center justify-center gap-2 hover:bg-white/90 transition-colors"
                    >
                      <Receipt className="w-4 h-4" />
                      Send bill to table
                    </button>
                  ) : (
                    <div className="w-full bg-white/[0.04] text-text-muted font-medium rounded-xl py-2.5 flex items-center justify-center border border-white/[0.06]">
                      Bill sent — waiting for payment
                    </div>
                  )}
                </div>
              ))
            )}
          </motion.div>
        )}

        {tab === 'paid' && (
          <motion.div
            key="paid"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {paidOrders.length === 0 ? (
              <div className="col-span-full">
                <EmptyState
                  icon={Archive}
                  title="No paid orders yet"
                  description="Completed, paid orders will be archived here for your records."
                />
              </div>
            ) : (
              paidOrders.map((order) => (
                <div
                  key={order._id}
                  className="bg-white/[0.03] border border-white/[0.06] p-5 rounded-2xl"
                >
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="w-4 h-4 text-text-muted shrink-0" />
                        <span className="font-bold text-sm text-text-default">Table {order.tableNumber}</span>
                      </div>
                      <StatusBadge status="completed" />
                    </div>
                    <span className="font-bold text-lg text-text-muted shrink-0">₹{order.totalAmount}</span>
                  </div>
                  <div className="text-xs text-text-muted flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Paid & closed
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
