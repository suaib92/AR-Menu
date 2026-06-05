'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Save, Store, Palette, Globe } from 'lucide-react';
import { getApiUrl } from '@/utils/api';

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    restaurantName: '',
    email: '',
    upiId: '',
    themeColor: '#8b5cf6', // Default purple-500
  });

  useEffect(() => {
    const apiUrl = getApiUrl();
    const token = localStorage.getItem('token') || '';
    fetch(`${apiUrl}/settings`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        setFormData(prev => ({
          ...prev,
          restaurantName: data.restaurantName || '',
          upiId: data.upiId || '',
          themeColor: data.themeColor || '#8b5cf6',
        }));
      })
      .catch(err => console.error(err));

    // Also get email from local storage
    const userString = localStorage.getItem('user');
    if (userString) {
      const user = JSON.parse(userString);
      setFormData(prev => ({
        ...prev,
        email: user.email || '',
      }));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccess(false);

    // Update local storage
    const userString = localStorage.getItem('user');
    if (userString) {
      const user = JSON.parse(userString);
      user.restaurantName = formData.restaurantName;
      localStorage.setItem('user', JSON.stringify(user));
    }

    // Save to API
    try {
      const apiUrl = getApiUrl();
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`${apiUrl}/settings`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      if (!res.ok) {
        throw new Error('Server returned an error');
      }
      setIsLoading(false);
      setSuccess(true);
      toast.success('Settings saved successfully');
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      setIsLoading(false);
      toast.error('Failed to save settings');
    }
  };

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Settings</h1>
        <p className="text-gray-400">Manage your restaurant profile and AR menu preferences.</p>
      </div>

      <motion.form 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
        onSubmit={handleSubmit}
      >
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 space-y-6">
          <h2 className="text-xl font-semibold flex items-center gap-2 border-b border-white/10 pb-4">
            <Store className="w-5 h-5 text-purple-400" />
            General Information
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Restaurant Name</label>
              <input 
                type="text" 
                value={formData.restaurantName}
                onChange={(e) => setFormData({...formData, restaurantName: e.target.value})}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                placeholder="The French Laundry"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Contact Email</label>
              <input 
                type="email" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                disabled
              />
              <p className="text-xs text-gray-500 mt-2">Email is managed by the account owner.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">UPI ID (For Digital Payments)</label>
              <input 
                type="text" 
                value={formData.upiId}
                onChange={(e) => setFormData({...formData, upiId: e.target.value})}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                placeholder="restaurant@upi"
              />
              <p className="text-xs text-gray-500 mt-2">Customers will pay this exact UPI ID.</p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 space-y-6">
          <h2 className="text-xl font-semibold flex items-center gap-2 border-b border-white/10 pb-4">
            <Palette className="w-5 h-5 text-purple-400" />
            Menu Appearance
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Brand Color</label>
              <div className="flex items-center gap-4">
                <input 
                  type="color" 
                  value={formData.themeColor}
                  onChange={(e) => setFormData({...formData, themeColor: e.target.value})}
                  className="w-12 h-12 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                />
                <input 
                  type="text" 
                  value={formData.themeColor}
                  onChange={(e) => setFormData({...formData, themeColor: e.target.value})}
                  className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 pt-4">
          <button 
            type="submit" 
            disabled={isLoading}
            className="bg-white text-black font-semibold rounded-xl px-8 py-3 flex items-center gap-2 hover:bg-gray-200 transition-colors disabled:opacity-70"
          >
            {isLoading ? 'Saving...' : (
              <>
                <Save className="w-5 h-5" />
                Save Changes
              </>
            )}
          </button>
          
          {success && (
            <motion.span 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-green-400 text-sm font-medium"
            >
              Settings saved successfully!
            </motion.span>
          )}
        </div>
      </motion.form>
    </div>
  );
}
