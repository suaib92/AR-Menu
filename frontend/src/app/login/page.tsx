'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('http://127.0.0.1:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // Save token and user info (ideally in context/store, using localStorage for simplicity here)
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data));
        
        // Redirect to dashboard
        router.push('/dashboard');
      } else {
        setError(data.message || 'Failed to login');
      }
    } catch (err) {
      setError('Network error, please try again later');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col md:flex-row">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="flex items-center gap-2 mb-12">
            <Sparkles className="w-6 h-6 text-purple-500" />
            <span className="font-bold text-xl tracking-tight">AR Smart Menu</span>
          </div>
          
          <h1 className="text-3xl font-bold mb-2">Welcome back</h1>
          <p className="text-gray-400 mb-8">Sign in to your restaurant dashboard.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="you@restaurant.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="••••••••"
                required
              />
            </div>
            
            <button disabled={isLoading} type="submit" className="w-full bg-white text-black font-semibold rounded-xl px-4 py-3 mt-6 flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors disabled:opacity-70">
              {isLoading ? 'Signing in...' : (
                <>Sign In <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <p className="text-center text-gray-400 mt-8 text-sm">
            Don't have an account? <Link href="/register" className="text-white hover:text-purple-400 transition-colors">Sign up</Link>
          </p>
        </motion.div>
      </div>

      {/* Right side - Image/Decoration */}
      <div className="hidden md:flex flex-1 bg-white/5 border-l border-white/10 relative items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-black pointer-events-none" />
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative z-10 p-12 text-center"
        >
          <div className="bg-white/10 border border-white/20 p-8 rounded-3xl backdrop-blur-md">
            <h2 className="text-3xl font-bold mb-4">Elevate your dining experience.</h2>
            <p className="text-gray-300 max-w-md mx-auto">Access your analytics, manage your 3D menu items, and generate AR QR codes all in one place.</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
