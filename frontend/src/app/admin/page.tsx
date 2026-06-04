'use client';

import { motion } from 'framer-motion';
import { Building2, IndianRupee, Users } from 'lucide-react';

export default function AdminPage() {
  const stats = [
    { name: 'Total MRR', value: '₹4,52,310', icon: IndianRupee, change: '+15.2%', trend: 'up' },
    { name: 'Active Tenants', value: '86', icon: Building2, change: '+4', trend: 'up' },
    { name: 'Total Users', value: '4,521', icon: Users, change: '+12.5%', trend: 'up' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Platform Overview</h1>
        <p className="text-gray-400">Global analytics across all restaurants.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <stat.icon className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-sm font-medium text-green-400">
                {stat.change}
              </span>
            </div>
            <h3 className="text-gray-400 text-sm font-medium mb-1">{stat.name}</h3>
            <div className="text-2xl font-bold">{stat.value}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
