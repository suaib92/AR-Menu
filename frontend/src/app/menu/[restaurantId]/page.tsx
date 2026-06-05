'use client';

import { useState, Suspense, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ShoppingBag, Info, ArrowLeft, X, CheckCircle2, Clock, ChefHat, Truck, Receipt, QrCode, Lock, RefreshCw, RotateCcw, Plus } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';
import { getApiUrl, getImageUrl } from '@/utils/api';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { ITicket, IOrder } from '@/types';

// --- Web Audio API Synth Sounds ---
const playTone = (frequency: number, type: OscillatorType, duration: number, vol = 0.1) => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    
    gainNode.gain.setValueAtTime(vol, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  } catch (e) {
    console.error("Audio API not supported or blocked", e);
  }
};

const playPopSound = () => {
  playTone(800, 'sine', 0.1, 0.2);
  setTimeout(() => playTone(1200, 'sine', 0.1, 0.1), 50);
};

const playSuccessSound = () => {
  playTone(440, 'sine', 0.2, 0.2);   // A4
  setTimeout(() => playTone(554, 'sine', 0.2, 0.2), 150); // C#5
  setTimeout(() => playTone(659, 'sine', 0.4, 0.2), 300); // E5
};

// Disable SSR for 3D Viewer since it uses WebGL/Three.js
const FoodViewer3D = dynamic(() => import('@/components/FoodViewer3D'), { ssr: false });

// Removed MOCK_MENU array because it's now fetched from the database!

function CustomerMenuContent() {
  const searchParams = useSearchParams();
  const confirm = useConfirm();
  
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [activeItem, setActiveItem] = useState<any | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<any | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');

  // User Details for Checkout
  const [customerName, setCustomerName] = useState('');
  const [customerTable, setCustomerTable] = useState('');
  // Once a ticket is created, name + table are locked to that ticket.
  // "Switch table" unlocks the table field (a new ticket will be created).
  const [isLocked, setIsLocked] = useState(false);

  // Multi-ticket state. A device may have created/joined many tickets across
  // different tables and sessions. `currentTicket` is the one the cart is
  // actively adding to (derived from `arMenuCurrentTicket` + the latest fetch).
  const [userTickets, setUserTickets] = useState<Array<ITicket & { orders: IOrder[] }>>([]);
  const [currentTicket, setCurrentTicket] = useState<ITicket | null>(null);
  // The ticket currently shown in the per-ticket UPI modal (null = closed).
  const [payingTicket, setPayingTicket] = useState<ITicket & { orders: IOrder[] } | null>(null);
  
  // Theme state
  const [primaryColor, setPrimaryColor] = useState('#8b5cf6'); // Default purple
  const [restaurantName, setRestaurantName] = useState('AR Smart Menu');
  const [restaurantSettings, setRestaurantSettings] = useState<any>(null);

  // Helper: get the current restaurantId from URL
  const getCurrentRestaurantId = useCallback(() => {
    const pathParts = window.location.pathname.split('/');
    return pathParts[pathParts.length - 1];
  }, []);

  // Helper: get or create a stable session id (one per browser session)
  const getOrCreateSessionId = useCallback(() => {
    let sid = sessionStorage.getItem('arMenuSessionId');
    if (!sid) {
      sid = `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem('arMenuSessionId', sid);
    }
    return sid;
  }, []);

  // Load saved user details, ticket, and cart on mount
  useEffect(() => {
    // Load Customer Name & Table
    const savedCustomer = localStorage.getItem('arMenuCustomer');
    if (savedCustomer) {
      const data = JSON.parse(savedCustomer);
      if (data.name) setCustomerName(data.name);
      if (data.table) setCustomerTable(data.table);
    }

    // Load Cart Items
    const savedCart = localStorage.getItem('arMenuCart');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }

    // Pre-allocate session id
    getOrCreateSessionId();

    // Fire analytics beacons (best-effort, fire-and-forget)
    try {
      const currentRestaurantId = getCurrentRestaurantId();
      const qrId = searchParams?.get('qr');
      const apiUrl = getApiUrl();

      // menu_open ping
      fetch(`${apiUrl}/analytics/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: currentRestaurantId,
          viewType: 'menu_open',
        }),
        keepalive: true,
      }).catch(() => {});

      // qr_scan ping (one-shot per session per id)
      if (qrId) {
        const key = `arMenu.qrScanned.${qrId}`;
        if (!sessionStorage.getItem(key)) {
          sessionStorage.setItem(key, '1');
          fetch(`${apiUrl}/qr/${qrId}/scan`, { method: 'POST' }).catch(() => {});
        }
      }
    } catch {
      /* swallow analytics errors */
    }

    const fetchData = async () => {
      const apiUrl = getApiUrl();
      const currentRestaurantId = getCurrentRestaurantId();
      
      // Fetch Settings (Theme & Name)
      try {
        const settingsRes = await fetch(`${apiUrl}/settings/public/${currentRestaurantId}`);
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          setRestaurantSettings(settingsData);
          if (settingsData.themeColor) setPrimaryColor(settingsData.themeColor);
          if (settingsData.restaurantName) setRestaurantName(settingsData.restaurantName);
        }
      } catch (e) {
        console.error("Failed to fetch settings", e);
      }

      // QR scan → prefill table from QR metadata
      const qrId = searchParams?.get('qr');
      if (qrId) {
        try {
          const qrRes = await fetch(`${apiUrl}/qr/${qrId}`);
          if (qrRes.ok) {
            const qr = await qrRes.json();
            if (qr.tableNumber) {
              setCustomerTable((prev) => prev || qr.tableNumber);
            }
          }
        } catch (e) {
          console.error('Failed to fetch QR details', e);
        }
      }

      // --- Multi-ticket migration + restore ---
      // Old single-ticket key (arMenuTicket) is migrated once into the new
      // array (arMenuTickets) + pointer (arMenuCurrentTicket), then ignored.
      const oldSingle = localStorage.getItem('arMenuTicket');
      if (oldSingle && !localStorage.getItem('arMenuTickets')) {
        try {
          const list = JSON.parse(localStorage.getItem('arMenuTickets') || '[]');
          if (!list.includes(oldSingle)) list.push(oldSingle);
          localStorage.setItem('arMenuTickets', JSON.stringify(list));
          localStorage.setItem('arMenuCurrentTicket', oldSingle);
        } catch {
          /* ignore */
        }
        localStorage.removeItem('arMenuTicket');
      }

      // Pull every ticket this session has ever created/joined. This is the
      // single source of truth — survives localStorage wipes and shows the
      // user their full bill history across all tables they've been on.
      const sessionId = getOrCreateSessionId();
      try {
        const tRes = await fetch(`${apiUrl}/tickets/by-session/${sessionId}`);
        if (tRes.ok) {
          const tData = await tRes.json();
          const tickets: Array<ITicket & { orders: IOrder[] }> = tData.tickets || [];
          setUserTickets(tickets);

          // Persist the discovered ids so other tabs/devices on the same
          // session can be reconciled even if the network drops.
          localStorage.setItem(
            'arMenuTickets',
            JSON.stringify(tickets.map((t) => t._id))
          );

          // Pick the most recent open ticket as current; if none, fall back
          // to whatever the user previously selected; otherwise null (fresh).
          const storedCurrent = localStorage.getItem('arMenuCurrentTicket');
          const matched =
            (storedCurrent && tickets.find((t) => t._id === storedCurrent)) || null;
          const mostRecentOpen = tickets.find((t) => t.status === 'open') || null;
          const nextCurrent =
            (matched && matched.status === 'open' ? matched : null) ||
            mostRecentOpen;
          if (nextCurrent) {
            setCurrentTicket(nextCurrent);
            setIsLocked(true);
            localStorage.setItem('arMenuCurrentTicket', nextCurrent._id);
            if (nextCurrent.primaryName) setCustomerName(nextCurrent.primaryName);
            if (nextCurrent.tableNumber) setCustomerTable(nextCurrent.tableNumber);
          } else {
            // No open ticket — clear pointer so the cart is unlocked.
            localStorage.removeItem('arMenuCurrentTicket');
          }
        }
      } catch (e) {
        console.error('Failed to fetch session tickets', e);
      }

      // Fetch Menu Items
      try {
        const menuRes = await fetch(`${apiUrl}/menu/items/restaurant/${currentRestaurantId}`);
        if (menuRes.ok) {
          const data = await menuRes.json();
          setMenuItems(data);
        }
      } catch (e) {
        console.error("Failed to fetch menu", e);
      } finally {
        setIsLoadingMenu(false);
      }
    };

    fetchData();
  }, []);

  // When active item changes, reset variant selection
  useEffect(() => {
    if (activeItem?.variants?.length > 0) {
      setSelectedVariant(activeItem.variants[0]);
    } else {
      setSelectedVariant(null);
    }
  }, [activeItem]);

  // Save Cart to Local Storage on Change
  useEffect(() => {
    localStorage.setItem('arMenuCart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Fire ar_session analytics when an item is opened in the 3D viewer
  useEffect(() => {
    if (!activeItem?._id) return;
    const key = `arMenu.arSession.${activeItem._id}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    try {
      const pathParts = window.location.pathname.split('/');
      const restaurantId = pathParts[pathParts.length - 1];
      const apiUrl = getApiUrl();
      fetch(`${apiUrl}/analytics/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId,
          itemId: activeItem._id,
          viewType: 'ar_session',
        }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      /* swallow */
    }
  }, [activeItem?._id]);

  // Fetch user tickets (multi-ticket history) — single session lookup
  const fetchUserTickets = async () => {
    try {
      const apiUrl = getApiUrl();
      const sessionId = getOrCreateSessionId();
      const res = await fetch(`${apiUrl}/tickets/by-session/${sessionId}`);
      if (!res.ok) return;
      const data = await res.json();
      const tickets: Array<ITicket & { orders: IOrder[] }> = data.tickets || [];
      setUserTickets(tickets);
      localStorage.setItem(
        'arMenuTickets',
        JSON.stringify(tickets.map((t) => t._id))
      );

      // Refresh the current ticket in case its total/status changed server-side
      const storedCurrent = localStorage.getItem('arMenuCurrentTicket');
      const matched = (storedCurrent && tickets.find((t) => t._id === storedCurrent)) || null;
      if (matched) {
        setCurrentTicket(matched);
        if (matched.status === 'closed') {
          // Auto-unlock if the current ticket was closed while we were away
          setIsLocked(false);
          localStorage.removeItem('arMenuCurrentTicket');
        }
      } else {
        // Our current ticket no longer exists (e.g. server cleanup) — pick
        // the most recent open one, otherwise null.
        const mostRecentOpen = tickets.find((t) => t.status === 'open') || null;
        if (mostRecentOpen) {
          setCurrentTicket(mostRecentOpen);
          setIsLocked(true);
          localStorage.setItem('arMenuCurrentTicket', mostRecentOpen._id);
        } else {
          setCurrentTicket(null);
          setIsLocked(false);
        }
      }
    } catch (e) {
      console.error('Failed to fetch user tickets', e);
    }
  };

  useEffect(() => {
    if (isHistoryOpen) {
      fetchUserTickets();
      const interval = setInterval(fetchUserTickets, 5000); // Poll every 5s
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHistoryOpen]);

  // Helper to parse price (e.g., '₹599' -> 599)
  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      const priceNum = parseInt(item.price.replace(/[^0-9]/g, ''));
      return total + priceNum;
    }, 0);
  };

  // Total of the current ticket (everything already ordered + this cart)
  const ticketGrandTotal = (currentTicket?.totalAmount ?? 0) + calculateTotal();

  // How many of the user's tickets are waiting for the customer to pay
  const pendingBillCount = userTickets.filter((t) =>
    t.orders.some(
      (o) => o.status === 'payment_requested' || o.status === 'payment_verifying'
    )
  ).length;

  const handleCheckout = async () => {
    if (!customerName.trim() || !customerTable.trim()) {
      toast.error('Please enter your name and table number.');
      return;
    }

    try {
      const currentRestaurantId = getCurrentRestaurantId();
      const apiUrl = getApiUrl();
      const sessionId = getOrCreateSessionId();

      const res = await fetch(`${apiUrl}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: currentRestaurantId,
          customerName,
          tableNumber: customerTable,
          items: cartItems,
          totalAmount: calculateTotal(),
          sessionId,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to place order');
      }

      const newOrder = await res.json();

      // Persist the ticket id so subsequent orders append to the same bill.
      if (newOrder.ticketId) {
        // Add to the user's ticket list (no-op if already there)
        const list = readTicketList();
        if (!list.includes(newOrder.ticketId)) {
          list.push(newOrder.ticketId);
          writeTicketList(list);
        }
        localStorage.setItem('arMenuCurrentTicket', newOrder.ticketId);
        setIsLocked(true);

        // Optimistic refresh of the current ticket
        try {
          const tRes = await fetch(`${apiUrl}/tickets/${newOrder.ticketId}`);
          if (tRes.ok) {
            const tData = await tRes.json();
            if (tData.ticket) setCurrentTicket(tData.ticket);
          }
        } catch { /* noop */ }

        // Refresh the full ticket list so "Your Bill" reflects the new one
        fetchUserTickets();
      }

      // Save name + table for future
      localStorage.setItem('arMenuCustomer', JSON.stringify({
        name: customerName,
        table: customerTable,
      }));

      playSuccessSound();
      setOrderPlaced(true);
      setTimeout(() => {
        setCartItems([]);
        localStorage.removeItem('arMenuCart');
        setOrderPlaced(false);
        setIsCartOpen(false);
        setIsHistoryOpen(true); // open history to show live status
      }, 3000);
    } catch (error) {
      console.error('Failed to place order:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to place order. Please try again.');
    }
  };

  // "Switch table" — unlock the table field, start a new ticket on next order.
  // The previous ticket stays in the user's history (arMenuTickets) so it
  // can still be paid/viewed from "Your Bill".
  const handleSwitchTable = async () => {
    const ok = await confirm({
      title: 'Start a new bill on a different table?',
      description: `Your current bill at Table ${currentTicket?.tableNumber || customerTable} will stay in your history. The next order will be billed separately on the new table.`,
      confirmText: 'Switch table',
      cancelText: 'Stay here',
    });
    if (!ok) return;
    localStorage.removeItem('arMenuCurrentTicket');
    setCurrentTicket(null);
    setIsLocked(false);
    setCustomerTable('');
    setIsCartOpen(false);
    toast.success('Table cleared. Add items again to start a new bill.');
  };

  // "Resume" — make an older ticket the one the cart is adding to. Locks
  // the form fields back to that ticket's name + table.
  const handleResumeTicket = (ticketId: string) => {
    const ticket = userTickets.find((t) => t._id === ticketId);
    if (!ticket) return;
    if (ticket.status === 'closed') {
      toast.error('This bill is already settled.');
      return;
    }
    localStorage.setItem('arMenuCurrentTicket', ticket._id);
    setCurrentTicket(ticket);
    setIsLocked(true);
    setCustomerName(ticket.primaryName);
    setCustomerTable(ticket.tableNumber);
    setIsHistoryOpen(false);
    setIsCartOpen(true);
    toast.success(`Resumed Table ${ticket.tableNumber} bill`);
  };

  // "Sign out" — clear all local identity and start fresh
  const handleSignOut = async () => {
    const ok = await confirm({
      title: 'Clear your local session?',
      description: 'Your name, cart, and ticket pointers will be removed from this device. Existing orders are not affected.',
      confirmText: 'Clear',
      destructive: true,
    });
    if (!ok) return;
    localStorage.removeItem('arMenuCustomer');
    localStorage.removeItem('arMenuCart');
    localStorage.removeItem('arMenuTickets');
    localStorage.removeItem('arMenuCurrentTicket');
    setCustomerName('');
    setCustomerTable('');
    setCartItems([]);
    setIsLocked(false);
    setCurrentTicket(null);
    setIsCartOpen(false);
    toast.success('Session cleared');
  };

  // --- localStorage helpers for the multi-ticket list ---
  const readTicketList = (): string[] => {
    try {
      const raw = localStorage.getItem('arMenuTickets');
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
    } catch {
      return [];
    }
  };
  const writeTicketList = (list: string[]) => {
    localStorage.setItem('arMenuTickets', JSON.stringify(list));
  };

  // Cart Drawer JSX Element (not a component to prevent input focus loss!)
  const cartDrawerJSX = (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
          {/* Drawer */}
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 elegant-drawer rounded-t-[2rem] p-6 z-50 max-h-[85vh] flex flex-col"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <ShoppingBag className="w-6 h-6 text-purple-400" />
                Your Order
              </h2>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="bg-white/10 w-10 h-10 rounded-full flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {orderPlaced ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-12 text-center"
              >
                <div className="w-20 h-20 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Order Placed!</h3>
                <p className="text-gray-400">Added to Table {customerTable} • {customerName}</p>
              </motion.div>
            ) : cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <ShoppingBag className="w-12 h-12 mb-4 opacity-50" />
                <p>Your cart is empty.</p>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-4">
                  {cartItems.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex justify-between items-center elegant-panel p-4 rounded-2xl"
                    >
                      <div className="flex items-center gap-3">
                        {item.imageUrl ? (
                        <img src={getImageUrl(item.imageUrl)} className="w-10 h-10 rounded-xl object-cover" alt="" />
                      ) : (
                        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-xl">🍽️</div>
                      )}
                        <div>
                          <h4 className="font-bold text-white tracking-tight">{item.name}</h4>
                          <p className="text-sm font-medium" style={{ color: primaryColor }}>{item.price}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setCartItems(items => items.filter((_, i) => i !== index))}
                        className="text-red-400 text-sm font-semibold hover:text-red-300 px-3 py-1.5 transition-colors"
                      >
                        Remove
                      </button>
                    </motion.div>
                  ))}
                </div>

                <div className="elegant-panel p-5 rounded-2xl space-y-4 mb-4">
                  {/* Ticket context banner — only shown when we have a ticket */}
                  {currentTicket && (
                    <div className="flex items-center gap-2 text-xs text-purple-300 bg-purple-500/10 border border-purple-500/20 px-3 py-2 rounded-lg">
                      <Lock className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        Adding to Table {currentTicket.tableNumber} • {currentTicket.primaryName}'s bill
                      </span>
                    </div>
                  )}

                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Your Name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      disabled={isLocked}
                      className="w-full bg-black/60 border border-white/5 rounded-xl pl-4 pr-10 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-white/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                    {isLocked && (
                      <Lock className="w-4 h-4 text-text-muted absolute right-3 top-1/2 -translate-y-1/2" />
                    )}
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Table Number (e.g. 5)"
                      value={customerTable}
                      onChange={(e) => setCustomerTable(e.target.value)}
                      disabled={isLocked}
                      className="w-full bg-black/60 border border-white/5 rounded-xl pl-4 pr-10 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-white/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                    {isLocked && (
                      <Lock className="w-4 h-4 text-text-muted absolute right-3 top-1/2 -translate-y-1/2" />
                    )}
                  </div>

                  {/* Switch table — only when locked to a ticket */}
                  {isLocked && (
                    <button
                      onClick={handleSwitchTable}
                      className="w-full text-xs text-text-muted hover:text-white flex items-center justify-center gap-1.5 py-1.5 transition-colors"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Switch to a different table
                    </button>
                  )}
                </div>

                <div className="pt-2 space-y-3 pb-4">
                  {/* Bill-so-far breakdown when there's an existing ticket */}
                  {currentTicket && currentTicket.totalAmount > 0 && (
                    <div className="px-2 space-y-1">
                      <div className="flex justify-between text-sm text-text-muted">
                        <span>Bill so far (already ordered)</span>
                        <span>₹{currentTicket.totalAmount}</span>
                      </div>
                      <div className="flex justify-between text-sm text-text-muted">
                        <span>This cart</span>
                        <span>₹{calculateTotal()}</span>
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between items-end px-2">
                    <span className="text-gray-400 font-medium">
                      {currentTicket ? 'New total' : 'Grand Total'}
                    </span>
                    <span className="font-bold text-3xl text-white">₹{ticketGrandTotal}</span>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCheckout}
                    disabled={!customerName || !customerTable}
                    className="w-full bg-white text-black font-bold text-lg rounded-xl py-4 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                  >
                    {currentTicket ? 'Add to bill' : 'Place Order'}
                  </motion.button>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  // Order History JSX Element — one card per ticket, newest first
  const historyDrawerJSX = (
    <AnimatePresence>
      {isHistoryOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setIsHistoryOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 elegant-drawer rounded-t-[2rem] p-6 z-50 max-h-[85vh] flex flex-col"
          >
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Clock className="w-6 h-6 text-purple-400" />
                Your Bills
              </h2>
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="bg-white/10 w-10 h-10 rounded-full flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-text-muted text-sm mb-4">
              All your bills across tables. Tap "Pay Now" to settle any open one.
            </p>

            <div className="flex-1 overflow-y-auto space-y-4 -mx-1 px-1">
              {userTickets.length === 0 ? (
                <div className="text-gray-500 py-12 text-center font-medium">
                  No bills yet. Place an order to start one.
                </div>
              ) : (
                userTickets.map(ticket => {
                  const isCurrent = currentTicket?._id === ticket._id && ticket.status === 'open';
                  const isClosed = ticket.status === 'closed';
                  const hasPayable = ticket.orders.some(
                    (o) => o.status === 'payment_requested' || o.status === 'payment_verifying'
                  );
                  const latestOrder = ticket.orders[ticket.orders.length - 1];
                  const orderCount = ticket.orders.length;
                  const itemCount = ticket.orders.reduce(
                    (sum, o) => sum + (o.items?.length || 0),
                    0
                  );
                  const lastStatus = latestOrder?.status;

                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={ticket._id}
                      className={`elegant-panel rounded-2xl relative overflow-hidden ${
                        isClosed ? 'opacity-70' : ''
                      }`}
                    >
                      {/* Status indicator line */}
                      <div
                        className={`absolute top-0 left-0 w-1 h-full ${
                          lastStatus === 'preparing' ? 'bg-yellow-500' :
                          lastStatus === 'delivering' ? 'bg-blue-500' :
                          lastStatus === 'pending' ? 'bg-purple-500' :
                          lastStatus === 'completed' ? 'bg-green-500' :
                          lastStatus === 'paid' ? 'bg-gray-600' :
                          lastStatus === 'payment_requested' ? 'bg-orange-500' :
                          lastStatus === 'payment_verifying' ? 'bg-cyan-500' :
                          'bg-white/10'
                        }`}
                      />

                      <div className="p-5 pl-6">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <h3 className="text-lg font-bold">Table {ticket.tableNumber}</h3>
                              {isCurrent && (
                                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300 bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 rounded-full">
                                  Current
                                </span>
                              )}
                              {isClosed && (
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                                  Settled
                                </span>
                              )}
                            </div>
                            <p className="text-text-muted text-xs">
                              {ticket.primaryName} • {orderCount} order{orderCount === 1 ? '' : 's'} • {itemCount} item{itemCount === 1 ? '' : 's'}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-[11px] text-text-subtle uppercase tracking-wider font-semibold">Bill</div>
                            <div className="text-xl font-bold">₹{ticket.totalAmount}</div>
                          </div>
                        </div>

                        {/* Latest status line */}
                        {latestOrder && !isClosed && (
                          <div className="text-xs font-semibold mb-3 flex items-center gap-1.5">
                            {lastStatus === 'pending' && <span className="text-purple-400">● Kitchen received</span>}
                            {lastStatus === 'preparing' && <span className="text-yellow-400">● Preparing</span>}
                            {lastStatus === 'delivering' && <span className="text-blue-400">● On the way</span>}
                            {lastStatus === 'completed' && <span className="text-green-400">● Served</span>}
                            {lastStatus === 'payment_requested' && <span className="text-orange-400 animate-pulse">● Bill sent — pay now</span>}
                            {lastStatus === 'payment_verifying' && <span className="text-cyan-400 animate-pulse">● Verifying payment</span>}
                            <span className="text-text-subtle">· last update {new Date(latestOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        )}

                        {/* Per-ticket actions */}
                        <div className="flex gap-2 mt-3">
                          {!isClosed && hasPayable && (
                            <button
                              onClick={() => handlePayTicket(ticket)}
                              className="flex-1 bg-orange-500/15 border border-orange-500/40 text-orange-300 font-semibold rounded-xl py-2.5 flex items-center justify-center gap-2 hover:bg-orange-500/25 transition-colors text-sm"
                            >
                              <Receipt className="w-4 h-4" />
                              Pay Now · ₹{ticket.totalAmount}
                            </button>
                          )}
                          {!isClosed && !isCurrent && (
                            <button
                              onClick={() => handleResumeTicket(ticket._id)}
                              className="flex-1 bg-white/5 border border-white/10 text-white font-semibold rounded-xl py-2.5 flex items-center justify-center gap-2 hover:bg-white/10 transition-colors text-sm"
                            >
                              <RotateCcw className="w-4 h-4" />
                              Add more items
                            </button>
                          )}
                          {isCurrent && !isClosed && (
                            <div className="flex-1 bg-purple-500/10 border border-purple-500/20 text-purple-300 font-medium rounded-xl py-2.5 flex items-center justify-center gap-2 text-sm">
                              <Plus className="w-4 h-4" />
                              Cart adds here
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  // --- Per-ticket UPI flow (replaces the old global one) ---
  const [payingUpiLink, setPayingUpiLink] = useState('');
  const [isGeneratingUpi, setIsGeneratingUpi] = useState(false);

  const handlePayTicket = async (ticket: ITicket & { orders: IOrder[] }) => {
    setPayingTicket(ticket);
    setPayingUpiLink('');
    setIsGeneratingUpi(true);
    try {
      const apiUrl = getApiUrl();
      const currentRestaurantId = getCurrentRestaurantId();
      const res = await fetch(`${apiUrl}/payment/upi-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: currentRestaurantId,
          amount: ticket.totalAmount,
          customerName: ticket.primaryName,
          tableNumber: ticket.tableNumber,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setPayingUpiLink(data.upiLink);
      }
    } catch (e) {
      console.error('Failed to generate UPI link', e);
    } finally {
      setIsGeneratingUpi(false);
    }
  };

  const handleMarkTicketPaid = async () => {
    if (!payingTicket) return;
    try {
      const apiUrl = getApiUrl();
      const ordersToMark = payingTicket.orders.filter((o) => o.status !== 'paid');
      await Promise.all(
        ordersToMark.map((order) =>
          fetch(`${apiUrl}/orders/${order._id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'payment_verifying' }),
          })
        )
      );
      // Close the ticket so the table can re-open later
      await fetch(`${apiUrl}/tickets/${payingTicket._id}/close`, { method: 'POST' });
      toast.success('Marked as paid. The restaurant will confirm shortly.');
      setPayingTicket(null);
      setPayingUpiLink('');
      fetchUserTickets();
    } catch (e) {
      console.error('Failed to mark as paid', e);
      toast.error('Could not mark as paid. Please try again.');
    }
  };

  // The paying ticket in "verifying" state shows a spinner, otherwise a UPI link
  const payingIsVerifying = !!payingTicket && payingTicket.orders.some((o) => o.status === 'payment_verifying');

  const paymentModalJSX = (
    <AnimatePresence>
      {payingTicket && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => { setPayingTicket(null); setPayingUpiLink(''); }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm elegant-panel text-white rounded-3xl p-8 z-[101] shadow-2xl flex flex-col items-center text-center"
          >
            <div className="w-16 h-16 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center mb-6">
              <Receipt className="w-8 h-8" />
            </div>

            {payingIsVerifying ? (
              <>
                <h2 className="text-2xl font-bold mb-4 tracking-tight text-white">Verifying Payment...</h2>
                <p className="text-gray-400 mb-8 font-medium">Please wait while the restaurant confirms your payment.</p>
                <div className="flex justify-center mb-6">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold mb-1 tracking-tight">Pay your bill</h2>
                <p className="text-gray-400 mb-6 font-medium">
                  Table {payingTicket.tableNumber} • {payingTicket.primaryName}
                </p>

                <div className="w-full bg-[#111] rounded-2xl p-5 mb-6 border border-white/5 max-h-[25vh] overflow-y-auto">
                  {payingTicket.orders.flatMap((order) =>
                    order.items.map((item: any, i: number) => (
                      <div key={`${order._id}-${i}`} className="flex justify-between items-center text-sm py-0.5">
                        <span className="text-gray-300">
                          {item.quantity && item.quantity > 1 ? `${item.quantity}× ` : ''}{item.name}
                        </span>
                        <span className="text-gray-400">{item.price}</span>
                      </div>
                    ))
                  )}
                  <div className="border-t border-white/10 mt-3 pt-3 flex justify-between items-center font-bold">
                    <span className="text-gray-300">Total</span>
                    <span className="text-white text-lg">₹{payingTicket.totalAmount}</span>
                  </div>
                </div>

                {payingUpiLink ? (
                  <motion.a
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    href={payingUpiLink}
                    className="w-full bg-white text-black font-bold text-lg rounded-xl py-4 flex items-center justify-center gap-3 transition-colors mb-3"
                  >
                    <QrCode className="w-5 h-5" />
                    Pay via UPI App
                  </motion.a>
                ) : (
                  <div className="w-full bg-white/10 text-white/60 font-medium rounded-xl py-4 flex items-center justify-center gap-2 mb-3">
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    {isGeneratingUpi ? 'Preparing payment link…' : 'Payment link unavailable'}
                  </div>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleMarkTicketPaid}
                  disabled={!payingUpiLink}
                  className="w-full bg-[#111] border border-white/10 text-white font-bold text-lg rounded-xl py-4 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  I have paid
                </motion.button>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  // 1. Menu List View
  if (!activeItem) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white p-6 pb-24 font-outfit">
        <header className="flex items-center justify-between mb-12 mt-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              {restaurantName}
            </h1>
          </div>
          
          <div className="flex gap-4">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsHistoryOpen(true)}
              aria-label="View your bills"
              className="w-11 h-11 rounded-full flex items-center justify-center bg-[#1a1a1a] border border-white/10 hover:bg-[#222] transition-colors relative"
            >
              <Clock className="w-5 h-5 text-gray-300" />
              {pendingBillCount > 0 && (
                <span
                  className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1.5 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-[#0a0a0a]"
                  aria-label={`${pendingBillCount} bill${pendingBillCount === 1 ? '' : 's'} awaiting payment`}
                >
                  {pendingBillCount}
                </span>
              )}
            </motion.button>
            <motion.button 
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsCartOpen(true)}
              className="w-11 h-11 rounded-full flex items-center justify-center relative bg-white text-black transition-colors"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartItems.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold border-2 border-[#0a0a0a]">
                  {cartItems.length}
                </span>
              )}
            </motion.button>
          </div>
        </header>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-400">Menu</h2>
          </div>
          
          {/* Category Filter Chips */}
          {menuItems.length > 0 && (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-6 px-6">
              {['All', ...Array.from(new Set(menuItems.map(i => i.category)))].map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`whitespace-nowrap px-5 py-2.5 rounded-full font-semibold transition-all ${
                    activeCategory === cat 
                      ? 'bg-white text-black' 
                      : 'bg-[#1a1a1a] text-gray-400 border border-white/10 hover:bg-[#222]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
          
          {isLoadingMenu ? (
            <div className="flex justify-center items-center py-20">
              <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            </div>
          ) : menuItems.length === 0 ? (
            <div className="text-gray-500 text-center py-16 font-medium bg-[#111] rounded-2xl border border-white/5">No items available yet.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(activeCategory === 'All' ? menuItems : menuItems.filter(i => i.category === activeCategory)).map((item, i) => (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setActiveItem(item);
                    setDetailsOpen(false); // Reset details state
                  }}
                  className="bg-[#111] border border-white/5 p-4 rounded-[1.5rem] flex items-center gap-4 cursor-pointer hover:bg-[#151515] transition-colors"
                >
                  {item.imageUrl ? (
                    <img src={getImageUrl(item.imageUrl)} className="w-20 h-20 rounded-xl object-cover shrink-0" alt="" />
                  ) : (
                    <div className="w-20 h-20 bg-[#1a1a1a] rounded-xl flex items-center justify-center text-3xl shrink-0">🍽️</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-white mb-1">{item.name}</h3>
                    <p className="font-semibold text-gray-300">
                      {item.variants && item.variants.length > 0
                        ? `From ${item.variants.reduce((min, v) => {
                            const minNum = parseInt(String(min.price).replace(/[^0-9]/g, ''), 10) || Infinity;
                            const vNum = parseInt(String(v.price).replace(/[^0-9]/g, ''), 10) || Infinity;
                            return vNum < minNum ? v : min;
                          }).price}`
                        : item.price}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
        
        {cartDrawerJSX}
        {historyDrawerJSX}
        {paymentModalJSX}
      </div>
    );
  }

  // 2. AR Viewer Detail View
  return (
    <div className="fixed inset-0 bg-[#0a0a0a] text-white flex flex-col overflow-hidden font-outfit">
      {/* Top Bar */}
      <header className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-6 pointer-events-none">
        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={() => setActiveItem(null)}
          className="w-11 h-11 rounded-full flex items-center justify-center bg-[#111] border border-white/10 pointer-events-auto hover:bg-[#222] transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </motion.button>
        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsCartOpen(true)}
          className="w-11 h-11 rounded-full flex items-center justify-center relative bg-white pointer-events-auto transition-colors"
        >
          <ShoppingBag className="w-5 h-5 text-black" />
          {cartItems.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold border-2 border-[#0a0a0a]">
              {cartItems.length}
            </span>
          )}
        </motion.button>
      </header>

      {/* Cart Overlay */}
      {cartDrawerJSX}
      {historyDrawerJSX}
      {paymentModalJSX}

      {/* Food 3D/Image Viewer */}
      <div className="flex-1 relative flex items-center justify-center bg-[#0a0a0a]">
        {activeItem.imageUrl ? (
          <FoodViewer3D imageSrc={getImageUrl(activeItem.imageUrl)} />
        ) : (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className="text-[10rem] relative z-10"
          >
            🍽️
          </motion.div>
        )}
      </div>

      {/* Bottom Details Card */}
      <motion.div 
        className="absolute bottom-0 left-0 right-0 elegant-drawer rounded-t-[2rem] p-8 z-20"
        initial={{ y: "100%" }}
        animate={{ y: detailsOpen ? 0 : "calc(100% - 100px)" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
      >
        <div 
          className="flex flex-col items-center cursor-pointer pb-2"
          onClick={() => setDetailsOpen(!detailsOpen)}
        >
          <div className="w-12 h-1.5 bg-white/20 rounded-full mb-6" />
          <div className="w-full flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <div className="pr-4">
                <h2 className="text-2xl font-bold tracking-tight text-white mb-1">{activeItem.name}</h2>
                <p className="font-semibold text-xl text-gray-300">
                  {selectedVariant ? selectedVariant.price : activeItem.price}
                </p>
              </div>
              <motion.div 
                animate={{ rotate: detailsOpen ? 180 : 0 }}
                className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center shrink-0 border border-white/5"
              >
                <ChevronUp className="w-5 h-5 text-gray-400" />
              </motion.div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {detailsOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 space-y-8 overflow-hidden"
            >
              <p className="text-gray-400 leading-relaxed text-base font-medium">
                {activeItem.description}
              </p>

              <div className="flex items-center gap-3">
                <div className="bg-[#1a1a1a] border border-white/5 px-4 py-2.5 rounded-xl flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">{activeItem.calories}</span>
                </div>
                <div className="bg-[#1a1a1a] border border-white/5 px-4 py-2.5 rounded-xl flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">{activeItem.time}</span>
                </div>
              </div>

              {/* Variant Selector */}
              {activeItem.variants && activeItem.variants.length > 0 && (
                <div className="space-y-3 pt-2">
                  <p className="text-sm font-bold text-white uppercase tracking-wider">Choose Size</p>
                  <div className="flex flex-wrap gap-3">
                    {activeItem.variants.map((variant: any, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedVariant(variant)}
                        className={`px-5 py-3 rounded-xl border font-semibold transition-all flex items-center gap-2 ${
                          selectedVariant?.name === variant.name 
                            ? 'bg-purple-600/20 border-purple-500 text-white' 
                            : 'bg-[#1a1a1a] border-white/10 text-gray-400 hover:bg-[#222]'
                        }`}
                      >
                        {selectedVariant?.name === variant.name && <CheckCircle2 className="w-4 h-4 text-purple-400" />}
                        {variant.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  playPopSound();
                  
                  // Create a copy so we don't mutate the original
                  const cartItemToAdd = { ...activeItem };
                  if (selectedVariant) {
                    cartItemToAdd.name = `${activeItem.name} (${selectedVariant.name})`;
                    cartItemToAdd.price = selectedVariant.price;
                  }
                  
                  setCartItems(prev => [...prev, cartItemToAdd]);
                  
                  // Optional: Close details after adding
                  setDetailsOpen(false);
                }}
                className="w-full bg-white text-black font-bold text-lg rounded-xl py-4 flex justify-center items-center mt-6"
              >
                Add to Cart
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

export default function CustomerMenuPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>}>
      <CustomerMenuContent />
    </Suspense>
  );
}
