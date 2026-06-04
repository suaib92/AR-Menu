'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, UtensilsCrossed, QrCode, Settings, LogOut, Sparkles, Menu, ClipboardList, CreditCard, BellRing } from 'lucide-react';
import { motion } from 'framer-motion';
import { getApiUrl } from '@/utils/api';

// Helper function to convert VAPID public key
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsGranted, setNotificationsGranted] = useState(false);

  // Screen Wake Lock to prevent the screen from turning off automatically
  useEffect(() => {
    let wakeLock: any = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await (navigator as any).wakeLock.request('screen');
          console.log('Screen Wake Lock is active');
        }
      } catch (err) {
        console.error('Failed to acquire wake lock:', err);
      }
    };

    requestWakeLock();

    // Re-request wake lock when document becomes visible again
    const handleVisibilityChange = () => {
      if (wakeLock !== null && document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLock !== null) {
        wakeLock.release().then(() => {
          console.log('Screen Wake Lock released');
        });
      }
    };
  }, []);

  useEffect(() => {
    // Check if already granted
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        setNotificationsGranted(true);
      }
    }
  }, []);

  const handleSubscribe = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert("Push notifications are not supported by your browser.");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setNotificationsGranted(true);
        
        // Register service worker
        const register = await navigator.serviceWorker.register('/sw.js');
        
        // Wait for SW to be active
        await navigator.serviceWorker.ready;
        
        // Subscribe to Push
        const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
        const subscription = await register.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
        });

        // Send to backend
        const token = localStorage.getItem('token') || '';
        await fetch(`${getApiUrl()}/notifications/subscribe`, {
          method: 'POST',
          body: JSON.stringify(subscription),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        alert("Subscribed to Push Notifications successfully!");
      }
    } catch (error) {
      console.error("Error subscribing to push notifications:", error);
      alert("Failed to subscribe to push notifications.");
    }
  };

  const navigation = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Live Orders', href: '/dashboard/orders', icon: ClipboardList },
    { name: 'Billing', href: '/dashboard/billing', icon: CreditCard },
    { name: 'Menu Items', href: '/dashboard/menu', icon: UtensilsCrossed },
    { name: 'QR Codes', href: '/dashboard/qr', icon: QrCode },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 bg-white/10 rounded-md">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white/5 border-r border-white/10 backdrop-blur-xl transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-2 h-16 px-6 border-b border-white/10">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <span className="font-bold tracking-tight">AR Smart Menu</span>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                    ${isActive ? 'bg-purple-500/20 text-purple-400' : 'text-gray-400 hover:text-white hover:bg-white/5'}
                  `}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-white/10 space-y-2">
            {!notificationsGranted && (
              <button 
                onClick={handleSubscribe}
                className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-purple-400 hover:text-white hover:bg-purple-500/20 bg-purple-500/10 transition-colors border border-purple-500/20"
              >
                <BellRing className="w-5 h-5" />
                Enable Push Alerts
              </button>
            )}
            <button className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 lg:p-12 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
