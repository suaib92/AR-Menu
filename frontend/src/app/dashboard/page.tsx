'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { IndianRupee, QrCode, ScanEye, UtensilsCrossed, Clock, CheckCircle2, ChefHat, Truck } from 'lucide-react';
import { useLiveOrders } from '@/hooks/useLiveOrders';
import { getApiUrl } from '@/utils/api';

export default function DashboardPage() {
  const [activeMenuItemsCount, setActiveMenuItemsCount] = useState(0);
  const [menuError, setMenuError] = useState('');
  const { orders, loading, error: ordersError } = useLiveOrders();
  const [isMenuLoading, setIsMenuLoading] = useState(true);

  // Calculate Revenue and Recent Orders from the live hook
  const paidOrders = orders.filter((o) => o.status === 'paid' || o.status === 'completed');
  const totalRevenue = paidOrders.reduce((sum, o) => {
    const price = typeof o.totalAmount === 'number' ? o.totalAmount : parseInt(o.totalAmount.toString().replace(/[^0-9]/g, ''));
    return sum + (price || 0);
  }, 0);
  
  const recentOrders = orders.slice(0, 5);

  useEffect(() => {
    const fetchMenuStats = async () => {
      try {
        const apiUrl = getApiUrl();
        const token = localStorage.getItem('token') || '';
        const menuRes = await fetch(`${apiUrl}/menu/items`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (menuRes.ok) {
          const menuItems = await menuRes.json();
          const activeCount = menuItems.filter((m: any) => m.status === 'Active').length;
          setActiveMenuItemsCount(activeCount);
        }
      } catch (error) {
        setMenuError('Could not load menu stats');
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setIsMenuLoading(false);
      }
    };
    fetchMenuStats();
  }, []);
  const isLoadingAll = loading || isMenuLoading;
  const connectionError = menuError || ordersError;

  const stats = [
    { name: 'Total Revenue', value: `₹${totalRevenue.toLocaleString()}`, icon: IndianRupee, change: '+12.5%', trend: 'up' },
    { name: 'Active Menu Items', value: activeMenuItemsCount.toString(), icon: UtensilsCrossed, change: '+2', trend: 'up' },
    { name: 'AR Views Today', value: '892', icon: ScanEye, change: '+5.4%', trend: 'up' },
    { name: 'Active QR Codes', value: '34', icon: QrCode, change: '0%', trend: 'neutral' },
  ];

  return (
    <div className="space-y-8 relative">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Overview</h1>
        <p className="text-gray-400">Welcome back. Here's what's happening today.</p>
        {connectionError && (
          <div className="mt-4 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
            <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse shrink-0" />
            {connectionError} — check the backend is running and disable browser extensions like Urban VPN Proxy that may block local requests.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                <stat.icon className="w-5 h-5 text-gray-300" />
              </div>
              <span className={`text-sm font-medium ${
                stat.trend === 'up' ? 'text-green-400' : 'text-gray-400'
              }`}>
                {isLoadingAll ? '...' : stat.change}
              </span>
            </div>
            <h3 className="text-gray-400 text-sm font-medium mb-1">{stat.name}</h3>
            <div className="text-2xl font-bold">{isLoadingAll ? '...' : stat.value}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6 h-96 flex flex-col"
        >
          <h3 className="font-semibold mb-6">Revenue Over Time</h3>
          <div className="flex-1 border border-white/5 rounded-xl bg-white/[0.02] flex items-center justify-center text-gray-500">
            {/* Hardcoded chart placeholder for MVP */}
            <div className="flex items-end gap-2 h-40">
              {[40, 70, 45, 90, 65, 120, 80].map((h, i) => (
                <div key={i} className="w-12 bg-purple-500/50 rounded-t-sm" style={{ height: `${h}%` }}></div>
              ))}
            </div>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/5 border border-white/10 rounded-2xl p-6 h-96 flex flex-col"
        >
          <h3 className="font-semibold mb-6">Recent Orders</h3>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {loading ? (
              <div className="text-gray-500 text-center py-10">Loading orders...</div>
            ) : recentOrders.length === 0 ? (
              <div className="text-gray-500 text-center py-10">No recent orders found.</div>
            ) : (
              recentOrders.map(order => (
                <div key={order._id} className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm truncate max-w-[120px]">{order.customerName}</span>
                    <span className="font-bold text-purple-400">₹{order.totalAmount}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    {order.status === 'pending' && <span className="text-purple-400 bg-purple-500/10 px-2 py-1 rounded">Received</span>}
                    {order.status === 'preparing' && <span className="text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded">Preparing</span>}
                    {order.status === 'delivering' && <span className="text-blue-400 bg-blue-500/10 px-2 py-1 rounded">Delivering</span>}
                    {order.status === 'paid' && <span className="text-gray-400 bg-gray-500/10 px-2 py-1 rounded">Paid</span>}
                    <span className="text-gray-500">Table {order.tableNumber}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
