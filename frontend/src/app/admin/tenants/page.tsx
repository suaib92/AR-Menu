'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Building2, Search, CheckCircle2, XCircle, Calendar, ArrowUpRight } from 'lucide-react';
import { getApiUrl } from '@/utils/api';

type Tenant = {
  _id: string;
  name: string;
  subscriptionPlan?: string;
  subscriptionStatus?: string;
  isActive: boolean;
  createdAt: string;
};

const PLAN_COLORS: Record<string, string> = {
  Free: '#6b7280',
  free: '#6b7280',
  Starter: '#3b82f6',
  starter: '#3b82f6',
  Pro: '#a855f7',
  pro: '#a855f7',
  Enterprise: '#22c55e',
  enterprise: '#22c55e',
};

export default function AdminTenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [includeInactive, setIncludeInactive] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 25;

  const fetchTenants = useCallback(async () => {
    setIsLoading(true);
    try {
      const apiUrl = getApiUrl();
      const token = localStorage.getItem('token') || '';
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        includeInactive: includeInactive ? 'true' : 'false',
      });
      if (search) params.set('search', search);
      const res = await fetch(`${apiUrl}/restaurant?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setTenants(json.data || []);
        setTotal(json.total || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, includeInactive]);

  useEffect(() => {
    const t = setTimeout(fetchTenants, 250);
    return () => clearTimeout(t);
  }, [fetchTenants]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1">Tenants</h1>
        <p className="text-gray-400 text-sm sm:text-base">
          {total.toLocaleString('en-IN')} restaurant{total === 1 ? '' : 's'} on the platform
        </p>
      </div>

      {/* Toolbar */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name..."
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
        <label className="inline-flex items-center gap-2 text-sm text-gray-300 cursor-pointer select-none px-3">
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(e) => {
              setIncludeInactive(e.target.checked);
              setPage(1);
            }}
            className="rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500"
          />
          Include disabled
        </label>
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-gray-500 border-b border-white/5 bg-white/[0.02]">
                <th className="py-3 px-5 font-medium">Restaurant</th>
                <th className="py-3 px-5 font-medium">Plan</th>
                <th className="py-3 px-5 font-medium">Status</th>
                <th className="py-3 px-5 font-medium">Subscription</th>
                <th className="py-3 px-5 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/5 last:border-0">
                    <td className="py-4 px-5" colSpan={5}>
                      <div className="h-4 bg-white/5 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : tenants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-gray-500">
                    <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p>No tenants match your filters.</p>
                  </td>
                </tr>
              ) : (
                tenants.map((t) => {
                  const planColor = PLAN_COLORS[t.subscriptionPlan ?? ''] ?? '#6b7280';
                  return (
                    <tr
                      key={t._id}
                      className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium truncate">{t.name}</div>
                            <div className="text-xs text-gray-500 font-mono truncate">
                              {t._id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-5">
                        <span
                          className="text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={{ backgroundColor: `${planColor}22`, color: planColor }}
                        >
                          {t.subscriptionPlan ?? 'Free'}
                        </span>
                      </td>
                      <td className="py-3 px-5">
                        {t.isActive ? (
                          <span className="inline-flex items-center gap-1.5 text-xs text-green-400">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs text-red-400">
                            <XCircle className="w-3.5 h-3.5" />
                            Disabled
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-5 capitalize text-gray-300">
                        {t.subscriptionStatus ?? '—'}
                      </td>
                      <td className="py-3 px-5 text-gray-400 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(t.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > limit && (
          <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between text-sm text-gray-400">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Prev
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </motion.div>

      <div className="text-xs text-gray-500 inline-flex items-center gap-1.5">
        <ArrowUpRight className="w-3 h-3" />
        Tip: tenant management actions (suspend, change plan) coming next.
      </div>
    </div>
  );
}
