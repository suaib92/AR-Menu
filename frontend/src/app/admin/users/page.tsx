'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, Calendar } from 'lucide-react';
import { getApiUrl } from '@/utils/api';

type AdminUser = {
  _id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'owner' | 'manager' | 'staff' | 'customer';
  restaurantId?: string;
  createdAt: string;
};

const ROLE_COLORS: Record<string, string> = {
  super_admin: '#ef4444',
  owner: '#a855f7',
  manager: '#3b82f6',
  staff: '#22c55e',
  customer: '#6b7280',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<string>('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 25;

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const apiUrl = getApiUrl();
      const token = localStorage.getItem('token') || '';
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) params.set('search', search);
      if (role) params.set('role', role);
      const res = await fetch(`${apiUrl}/analytics/admin/users?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setUsers(json.data || []);
        setTotal(json.total || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, role]);

  useEffect(() => {
    const t = setTimeout(fetchUsers, 250);
    return () => clearTimeout(t);
  }, [fetchUsers]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1">Users</h1>
        <p className="text-gray-400 text-sm sm:text-base">
          {total.toLocaleString('en-IN')} account{total === 1 ? '' : 's'} across the platform
        </p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name or email..."
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
        <select
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            setPage(1);
          }}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
        >
          <option value="">All roles</option>
          <option value="super_admin">Super Admin</option>
          <option value="owner">Owner</option>
          <option value="manager">Manager</option>
          <option value="staff">Staff</option>
          <option value="customer">Customer</option>
        </select>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-gray-500 border-b border-white/5 bg-white/[0.02]">
                <th className="py-3 px-5 font-medium">User</th>
                <th className="py-3 px-5 font-medium">Email</th>
                <th className="py-3 px-5 font-medium">Role</th>
                <th className="py-3 px-5 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/5 last:border-0">
                    <td className="py-4 px-5" colSpan={4}>
                      <div className="h-4 bg-white/5 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-16 text-center text-gray-500">
                    <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p>No users match your filters.</p>
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const roleColor = ROLE_COLORS[u.role] ?? '#6b7280';
                  return (
                    <tr
                      key={u._id}
                      className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                            style={{
                              backgroundColor: `${roleColor}22`,
                              color: roleColor,
                            }}
                          >
                            {u.name?.[0]?.toUpperCase() ?? '?'}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium truncate">{u.name}</div>
                            <div className="text-xs text-gray-500 font-mono truncate">
                              {u._id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-5 text-gray-300 truncate max-w-[260px]">
                        {u.email}
                      </td>
                      <td className="py-3 px-5">
                        <span
                          className="text-xs font-semibold px-2.5 py-1 rounded-full capitalize"
                          style={{ backgroundColor: `${roleColor}22`, color: roleColor }}
                        >
                          {u.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-gray-400 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(u.createdAt).toLocaleDateString('en-IN', {
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
    </div>
  );
}
