'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  IndianRupee,
  QrCode,
  ScanEye,
  UtensilsCrossed,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useLiveOrders } from '@/hooks/useLiveOrders';
import { getApiUrl } from '@/utils/api';

type Trend = { pct: number | null; direction: 'up' | 'down' | 'neutral' };
type DayPoint = { label: string; revenue: number; ar: number };

type Overview = {
  totalRevenue: number;
  todayRevenue: number;
  yesterdayRevenue: number;
  revenueTrend: Trend;
  arViewsToday: number;
  arViewsYesterday: number;
  arTrend: Trend;
  qrScansToday: number;
  qrScansYesterday: number;
  qrTrend: Trend;
  orderCountToday: number;
  revenueChart: DayPoint[];
  arChart: DayPoint[];
};

const formatTrend = (t: Trend): string => {
  if (t.pct === null) return '—';
  const sign = t.direction === 'up' ? '+' : t.direction === 'down' ? '−' : '';
  return `${sign}${Math.abs(t.pct).toFixed(1)}%`;
};

const TrendIcon = ({ t }: { t: Trend }) => {
  if (t.direction === 'up') return <TrendingUp className="w-3 h-3" />;
  if (t.direction === 'down') return <TrendingDown className="w-3 h-3" />;
  return <Minus className="w-3 h-3" />;
};

const trendColor = (t: Trend) =>
  t.direction === 'up'
    ? 'text-green-400 bg-green-500/10'
    : t.direction === 'down'
    ? 'text-red-400 bg-red-500/10'
    : 'text-gray-400 bg-white/5';

export default function DashboardPage() {
  const [activeMenuItemsCount, setActiveMenuItemsCount] = useState(0);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [isMenuLoading, setIsMenuLoading] = useState(true);
  const [isOverviewLoading, setIsOverviewLoading] = useState(true);
  const [menuError, setMenuError] = useState('');
  const { orders, loading, error: ordersError } = useLiveOrders();

  const fetchOverview = useCallback(async () => {
    try {
      const apiUrl = getApiUrl();
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`${apiUrl}/analytics/overview`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setOverview(await res.json());
      }
    } catch (e) {
      console.error('overview fetch failed', e);
    } finally {
      setIsOverviewLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchMenuStats = async () => {
      try {
        const apiUrl = getApiUrl();
        const token = localStorage.getItem('token') || '';
        const menuRes = await fetch(`${apiUrl}/menu/items`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (menuRes.ok) {
          const menuItems = await menuRes.json();
          const activeCount = menuItems.filter(
            (m: { status?: string }) => m.status === 'Active'
          ).length;
          setActiveMenuItemsCount(activeCount);
        }
      } catch (error) {
        setMenuError('Could not load menu stats');
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setIsMenuLoading(false);
      }
    };
    fetchMenuStats();
    fetchOverview();
    const id = setInterval(fetchOverview, 30_000);
    return () => clearInterval(id);
  }, [fetchOverview]);

  const recentOrders = orders.slice(0, 5);
  const connectionError = menuError || ordersError;
  const isLoading = isMenuLoading || isOverviewLoading || loading;

  const stats = [
    {
      name: 'Total Revenue (7d)',
      value: `₹${(overview?.totalRevenue ?? 0).toLocaleString('en-IN')}`,
      icon: IndianRupee,
      trend: overview?.revenueTrend ?? { pct: null, direction: 'neutral' as const },
    },
    {
      name: 'Active Menu Items',
      value: activeMenuItemsCount.toString(),
      icon: UtensilsCrossed,
      trend: { pct: null, direction: 'neutral' as const },
    },
    {
      name: 'AR Views Today',
      value: (overview?.arViewsToday ?? 0).toLocaleString('en-IN'),
      icon: ScanEye,
      trend: overview?.arTrend ?? { pct: null, direction: 'neutral' as const },
    },
    {
      name: 'QR Scans Today',
      value: (overview?.qrScansToday ?? 0).toLocaleString('en-IN'),
      icon: QrCode,
      trend: overview?.qrTrend ?? { pct: null, direction: 'neutral' as const },
    },
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
              <span
                className={`text-xs font-semibold px-2 py-1 rounded-full inline-flex items-center gap-1 ${trendColor(
                  stat.trend
                )}`}
              >
                <TrendIcon t={stat.trend} />
                {formatTrend(stat.trend)}
              </span>
            </div>
            <h3 className="text-gray-400 text-sm font-medium mb-1">{stat.name}</h3>
            <div className="text-2xl font-bold">{isLoading ? '...' : stat.value}</div>
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Revenue — Last 7 Days</h3>
            <span className="text-xs text-gray-400">
              Today: ₹{(overview?.todayRevenue ?? 0).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="flex-1 rounded-xl bg-white/[0.02] border border-white/5 p-2">
            {overview && overview.revenueChart.some((d) => d.revenue > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={overview.revenueChart} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a855f7" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="label" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0b0b12',
                      border: '1px solid #ffffff20',
                      borderRadius: 8,
                      color: '#fff',
                    }}
                    formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Revenue']}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#a855f7" strokeWidth={2} fill="url(#rev)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                {isOverviewLoading ? 'Loading chart…' : 'No revenue data yet — process a paid order to see your trend.'}
              </div>
            )}
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
              recentOrders.map((order) => (
                <div
                  key={order._id}
                  className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col gap-2"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm truncate max-w-[120px]">
                      {order.customerName}
                    </span>
                    <span className="font-bold text-purple-400">₹{order.totalAmount}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    {order.status === 'pending' && (
                      <span className="text-purple-400 bg-purple-500/10 px-2 py-1 rounded">
                        Received
                      </span>
                    )}
                    {order.status === 'preparing' && (
                      <span className="text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded">
                        Preparing
                      </span>
                    )}
                    {order.status === 'delivering' && (
                      <span className="text-blue-400 bg-blue-500/10 px-2 py-1 rounded">
                        Delivering
                      </span>
                    )}
                    {order.status === 'paid' && (
                      <span className="text-gray-400 bg-gray-500/10 px-2 py-1 rounded">
                        Paid
                      </span>
                    )}
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
