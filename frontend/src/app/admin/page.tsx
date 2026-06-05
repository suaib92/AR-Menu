'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  IndianRupee,
  Building2,
  Users,
  ShoppingBag,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  XCircle,
  Activity,
  PieChart as PieIcon,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { getApiUrl } from '@/utils/api';

type AdminOverview = {
  totalRestaurants: number;
  activeRestaurants: number;
  restaurantsTrend: { pct: number | null; direction: 'up' | 'down' | 'neutral' };
  totalUsers: number;
  totalOrders: number;
  todayOrders: number;
  yesterdayOrders: number;
  ordersTrend: { pct: number | null; direction: 'up' | 'down' | 'neutral' };
  totalRevenue: number;
  recentRestaurants: {
    _id: string;
    name: string;
    subscriptionPlan?: string;
    subscriptionStatus?: string;
    isActive: boolean;
    createdAt: string;
  }[];
  planDistribution: { plan: string; count: number }[];
  orderChart: { label: string; orders: number; revenue: number }[];
};

const PLAN_COLOR: Record<string, string> = {
  Free: '#6b7280',
  Starter: '#3b82f6',
  Pro: '#a855f7',
  Enterprise: '#22c55e',
  free: '#6b7280',
  starter: '#3b82f6',
  pro: '#a855f7',
  enterprise: '#22c55e',
};

const formatTrend = (t: AdminOverview['restaurantsTrend']): string => {
  if (t.pct === null) return '—';
  const sign = t.direction === 'up' ? '+' : t.direction === 'down' ? '−' : '';
  return `${sign}${Math.abs(t.pct).toFixed(1)}%`;
};

const TrendPill = ({ t }: { t: AdminOverview['restaurantsTrend'] }) => {
  const color =
    t.direction === 'up'
      ? 'text-green-400 bg-green-500/10'
      : t.direction === 'down'
      ? 'text-red-400 bg-red-500/10'
      : 'text-gray-400 bg-white/5';
  const Icon =
    t.direction === 'up' ? ArrowUpRight : t.direction === 'down' ? ArrowDownRight : Activity;
  return (
    <span
      className={`text-xs font-semibold px-2 py-1 rounded-full inline-flex items-center gap-1 ${color}`}
    >
      <Icon className="w-3 h-3" />
      {formatTrend(t)}
    </span>
  );
};

export default function AdminPage() {
  const [data, setData] = useState<AdminOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOverview = useCallback(async () => {
    try {
      const apiUrl = getApiUrl();
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`${apiUrl}/analytics/admin/overview`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 403) {
        setError('You do not have super-admin access.');
        return;
      }
      if (!res.ok) {
        setError('Failed to load admin overview.');
        return;
      }
      setData(await res.json());
    } catch (e) {
      console.error(e);
      setError('Could not reach the server.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
    const id = setInterval(fetchOverview, 60_000);
    return () => clearInterval(id);
  }, [fetchOverview]);

  const kpis = [
    {
      name: 'Platform Revenue (30d)',
      value: `₹${(data?.totalRevenue ?? 0).toLocaleString('en-IN')}`,
      icon: IndianRupee,
      trend: null as AdminOverview['restaurantsTrend'] | null,
      color: 'text-emerald-400 bg-emerald-500/10',
    },
    {
      name: 'Restaurants',
      value: (data?.totalRestaurants ?? 0).toLocaleString('en-IN'),
      sub: `${data?.activeRestaurants ?? 0} active`,
      icon: Building2,
      trend: data?.restaurantsTrend ?? null,
      color: 'text-blue-400 bg-blue-500/10',
    },
    {
      name: 'Total Users',
      value: (data?.totalUsers ?? 0).toLocaleString('en-IN'),
      icon: Users,
      trend: null,
      color: 'text-purple-400 bg-purple-500/10',
    },
    {
      name: 'Orders Today',
      value: (data?.todayOrders ?? 0).toLocaleString('en-IN'),
      sub: `${(data?.totalOrders ?? 0).toLocaleString('en-IN')} all-time`,
      icon: ShoppingBag,
      trend: data?.ordersTrend ?? null,
      color: 'text-orange-400 bg-orange-500/10',
    },
  ];

  const hasOrderData =
    data && data.orderChart.some((d) => d.orders > 0 || d.revenue > 0);

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1">Platform Overview</h1>
        <p className="text-gray-400 text-sm sm:text-base">
          Global analytics across all restaurants.
        </p>
        {error && (
          <div className="mt-4 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.name}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${kpi.color}`}>
                <kpi.icon className="w-4.5 h-4.5" />
              </div>
              {kpi.trend && <TrendPill t={kpi.trend} />}
            </div>
            <h3 className="text-gray-400 text-xs sm:text-sm font-medium mb-1">{kpi.name}</h3>
            <div className="text-xl sm:text-2xl font-bold">
              {isLoading ? '...' : kpi.value}
            </div>
            {kpi.sub && !isLoading && (
              <div className="text-xs text-gray-500 mt-1">{kpi.sub}</div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-5 h-80 sm:h-96 flex flex-col"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm sm:text-base">Orders — Last 7 Days</h3>
            <span className="text-xs text-gray-400">
              {data?.todayOrders ?? 0} today · {data?.yesterdayOrders ?? 0} yesterday
            </span>
          </div>
          <div className="flex-1 rounded-xl bg-white/[0.02] border border-white/5 p-2">
            {hasOrderData ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={data!.orderChart}
                  margin={{ top: 10, right: 8, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="orders" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: '#9ca3af', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#9ca3af', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={36}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0b0b12',
                      border: '1px solid #ffffff20',
                      borderRadius: 8,
                      color: '#fff',
                    }}
                    formatter={(v, n) => [v, n === 'orders' ? 'Orders' : 'Revenue ₹']}
                  />
                  <Area
                    type="monotone"
                    dataKey="orders"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="url(#orders)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                {isLoading ? 'Loading chart…' : 'No orders in the last 7 days yet.'}
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32 }}
          className="bg-white/5 border border-white/10 rounded-2xl p-5 h-80 sm:h-96 flex flex-col"
        >
          <div className="flex items-center gap-2 mb-3">
            <PieIcon className="w-4 h-4 text-blue-400" />
            <h3 className="font-semibold text-sm sm:text-base">Plan Distribution</h3>
          </div>
          <div className="flex-1 rounded-xl bg-white/[0.02] border border-white/5 p-2">
            {data && data.planDistribution.some((p) => p.count > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.planDistribution}
                    dataKey="count"
                    nameKey="plan"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {data.planDistribution.map((p) => (
                      <Cell
                        key={p.plan}
                        fill={PLAN_COLOR[p.plan] ?? '#6b7280'}
                        stroke="#0b0b12"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0b0b12',
                      border: '1px solid #ffffff20',
                      borderRadius: 8,
                      color: '#fff',
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    wrapperStyle={{ fontSize: 12, color: '#9ca3af' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                {isLoading ? 'Loading…' : 'No tenants yet.'}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Recent tenants */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white/5 border border-white/10 rounded-2xl p-5"
      >
        <h3 className="font-semibold mb-4 text-sm sm:text-base">Recent Tenants</h3>
        <div className="overflow-x-auto -mx-2 px-2">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-gray-500 border-b border-white/5">
                <th className="py-2 pr-4 font-medium">Name</th>
                <th className="py-2 pr-4 font-medium">Plan</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 pr-4 font-medium">Subs</th>
                <th className="py-2 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    Loading tenants…
                  </td>
                </tr>
              ) : !data || data.recentRestaurants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    No tenants yet.
                  </td>
                </tr>
              ) : (
                data.recentRestaurants.map((r) => (
                  <tr
                    key={r._id}
                    className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]"
                  >
                    <td className="py-3 pr-4 font-medium">{r.name}</td>
                    <td className="py-3 pr-4">
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${PLAN_COLOR[r.subscriptionPlan ?? ''] ?? '#6b7280'}20`,
                          color: PLAN_COLOR[r.subscriptionPlan ?? ''] ?? '#9ca3af',
                        }}
                      >
                        {r.subscriptionPlan ?? 'Free'}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      {r.isActive ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-red-400">
                          <XCircle className="w-3.5 h-3.5" />
                          Disabled
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-4 capitalize text-gray-300">
                      {r.subscriptionStatus ?? '—'}
                    </td>
                    <td className="py-3 text-gray-400">
                      {new Date(r.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
