'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('http://127.0.0.1:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password, restaurantName }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data));
        router.push('/dashboard');
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      setError('Network error, please try again later');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col md:flex-row-reverse">
      {/* Left side - Form (but visually right due to row-reverse) */}
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
          
          <h1 className="text-3xl font-bold mb-2">Create an account</h1>
          <p className="text-gray-400 mb-8">Start your free trial and build your AR menu.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Your Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="John Doe"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Restaurant</label>
                <input 
                  type="text" 
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="The French Laundry"
                  required
                />
              </div>
            </div>
            
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
            
            <button type="submit" className="w-full bg-white text-black font-semibold rounded-xl px-4 py-3 mt-6 flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors">
              Create Account <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <p className="text-center text-gray-400 mt-8 text-sm">
            Already have an account? <Link href="/login" className="text-white hover:text-purple-400 transition-colors">Sign in</Link>
          </p>
        </motion.div>
      </div>

      {/* Right side - Image/Decoration */}
      <div className="hidden md:flex flex-1 bg-white/5 border-r border-white/10 relative items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-bl from-pink-500/20 to-black pointer-events-none" />
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative z-10 p-12 text-center"
        >
          <div className="bg-white/10 border border-white/20 p-8 rounded-3xl backdrop-blur-md">
            <h2 className="text-3xl font-bold mb-4">Join the revolution.</h2>
            <p className="text-gray-300 max-w-md mx-auto">Get started in minutes. No credit card required for the 14-day trial.</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
