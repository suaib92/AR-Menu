import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { getApiUrl } from '@/utils/api';
import { IOrder } from '../types';

export function useLiveOrders(soundEnabled: boolean = false) {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const previousActiveIds = useRef<Set<string>>(new Set());
  const previousVerifyingIds = useRef<Set<string>>(new Set());
  const isFirstFetch = useRef(true);
  
  const soundEnabledRef = useRef(soundEnabled);
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  // Play sound function for new orders
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      oscillator.start();
      setTimeout(() => oscillator.stop(), 500);
    } catch (e) {
      console.log('Audio context not supported');
    }
  };

  const fetchOrders = async (isInitialFetch = false) => {
    try {
      const token = localStorage.getItem('token') || '';
      const apiUrl = getApiUrl();
      
      const res = await fetch(`${apiUrl}/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (res.ok) {
        const data: IOrder[] = await res.json();
        
        // Sound and TTS Logic for Dashboard tracking
        if (soundEnabledRef.current) {
          const activeOrders = data.filter(o => o.status === 'pending');
          const verifyingOrders = data.filter(o => o.status === 'payment_verifying');
          
          if (!isFirstFetch.current) {
            let shouldPlay = false;
            let speakText = "";
            
            // Find if there are any new active orders
            const newActiveOrders = activeOrders.filter(o => !previousActiveIds.current.has(o._id));
            const newVerifyingOrders = verifyingOrders.filter(o => !previousVerifyingIds.current.has(o._id));
            
            if (newActiveOrders.length > 0) {
              shouldPlay = true;
              const latestOrder = newActiveOrders[0];
              
              // Build a string of the items ordered
              const itemCounts: Record<string, number> = {};
              latestOrder.items.forEach((item: any) => {
                itemCounts[item.name] = (itemCounts[item.name] || 0) + 1;
              });
              
              const itemSummary = Object.entries(itemCounts)
                .map(([name, count]) => `${count} ${name}`)
                .join(', ');

              speakText = `New order received for ${latestOrder.customerName || 'Guest'} at Table ${latestOrder.tableNumber}. They ordered: ${itemSummary}.`;
            } else if (newVerifyingOrders.length > 0) {
              shouldPlay = true;
              const latestOrder = newVerifyingOrders[0];
              speakText = `Payment verification requested for Table ${latestOrder.tableNumber}`;
            }

            if (shouldPlay) {
              console.log('🔔 Triggering notification for:', speakText);
              playBeep();
              if ('speechSynthesis' in window && speakText) {
                // Ensure voices are loaded (sometimes required by Chrome)
                window.speechSynthesis.getVoices();
                
                // Fix for Chrome bug where speech queue freezes
                window.speechSynthesis.cancel();
                
                setTimeout(() => {
                  const msg = new SpeechSynthesisUtterance(speakText);
                  msg.rate = 1.0;
                  msg.pitch = 1.2;
                  
                  // Fix for garbage collection
                  (window as any).currentUtterance = msg;
                  
                  console.log('🗣️ Speaking now:', speakText);
                  window.speechSynthesis.speak(msg);
                }, 50); // slight delay after cancel() to prevent cancelling the new utterance
              }
            }
          }
          previousActiveIds.current = new Set(activeOrders.map(o => o._id));
          previousVerifyingIds.current = new Set(verifyingOrders.map(o => o._id));
        }
        
        isFirstFetch.current = false;

        setOrders(data);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(true); // Initial fetch
    const interval = setInterval(() => fetchOrders(false), 3000);
    return () => clearInterval(interval);
  }, []);

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const token = localStorage.getItem('token') || '';
      const apiUrl = getApiUrl();
      
      await fetch(`${apiUrl}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      
      toast.success(`Order status updated to ${status}`);
      await fetchOrders(false); 
    } catch (err) {
      console.error('Failed to update status:', err);
      toast.error('Failed to update order status');
    }
  };

  return { orders, loading, updateOrderStatus };
}
