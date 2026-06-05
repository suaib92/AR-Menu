'use client';

import { useState, Suspense, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ShoppingBag, Info, ArrowLeft, X, CheckCircle2, Clock, ChefHat, Truck, Receipt, QrCode } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { getApiUrl, getImageUrl } from '@/utils/api';

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
  
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [orderHistory, setOrderHistory] = useState<any[]>([]);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [activeItem, setActiveItem] = useState<any | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<any | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  
  // User Details for Checkout
  const [customerName, setCustomerName] = useState('');
  const [customerTable, setCustomerTable] = useState('');
  
  // Theme state
  const [primaryColor, setPrimaryColor] = useState('#8b5cf6'); // Default purple
  const [restaurantName, setRestaurantName] = useState('AR Smart Menu');
  const [restaurantSettings, setRestaurantSettings] = useState<any>(null);

  // Load saved user details & cart on mount
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

    // Fire analytics beacons (best-effort, fire-and-forget)
    try {
      const pathParts = window.location.pathname.split('/');
      const currentRestaurantId = pathParts[pathParts.length - 1];
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
      
      // Fetch Settings (Theme & Name)
      try {
        const pathParts = window.location.pathname.split('/');
        const currentRestaurantId = pathParts[pathParts.length - 1];
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

      // Fetch Menu Items
      try {
        const pathParts = window.location.pathname.split('/');
        const currentRestaurantId = pathParts[pathParts.length - 1];
        
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

  // Fetch Order History Live Polling
  const fetchOrderHistory = async () => {
    if (!customerName || !customerTable) return;
    try {
      const apiUrl = getApiUrl();
      const pathParts = window.location.pathname.split('/');
      const currentRestaurantId = pathParts[pathParts.length - 1];
      
      const url = `${apiUrl}/orders/public/${currentRestaurantId}?name=${encodeURIComponent(customerName)}&table=${encodeURIComponent(customerTable)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setOrderHistory(data);
      }
    } catch (e) {
      console.error("Failed to fetch history", e);
    }
  };

  useEffect(() => {
    if (isHistoryOpen) {
      fetchOrderHistory();
      const interval = setInterval(fetchOrderHistory, 5000); // Poll every 5s
      return () => clearInterval(interval);
    }
  }, [isHistoryOpen, customerName, customerTable]);

  // Helper to parse price (e.g., '₹599' -> 599)
  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      const priceNum = parseInt(item.price.replace(/[^0-9]/g, ''));
      return total + priceNum;
    }, 0);
  };

  const handleCheckout = async () => {
    if (!customerName.trim() || !customerTable.trim()) {
      alert("Please enter your name and table number!");
      return;
    }

    try {
      // Get the restaurant ID from the URL path (e.g., /menu/12345)
      const pathParts = window.location.pathname.split('/');
      const currentRestaurantId = pathParts[pathParts.length - 1];

      const apiUrl = getApiUrl();
      
      const res = await fetch(`${apiUrl}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          restaurantId: currentRestaurantId,
          customerName: customerName,
          tableNumber: customerTable,
          items: cartItems,
          totalAmount: calculateTotal(),
        }),
      });

      // Save to local storage for future orders
      localStorage.setItem('arMenuCustomer', JSON.stringify({
        name: customerName,
        table: customerTable
      }));

      // Play success chime
      playSuccessSound();

      setOrderPlaced(true);
      setTimeout(() => {
        setCartItems([]);
        localStorage.removeItem('arMenuCart'); // Clear cart cache after success
        setOrderPlaced(false);
        setIsCartOpen(false);
        setIsHistoryOpen(true); // Automatically open history to show live status!
        // Do not clear name and table, let them stay for next time!
      }, 3000);
    } catch (error) {
      console.error('Failed to place order:', error);
      alert('Failed to place order. Please try again.');
    }
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
            className="absolute inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
          {/* Drawer */}
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute bottom-0 left-0 right-0 elegant-drawer rounded-t-[2rem] p-6 z-50 max-h-[85vh] flex flex-col"
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
                <p className="text-gray-400">The kitchen is preparing your meal.</p>
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
                  <input 
                    type="text" 
                    placeholder="Your Name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-black/60 border border-white/5 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-white/20 transition-all"
                  />
                  <input 
                    type="text" 
                    placeholder="Table Number (e.g. 5)"
                    value={customerTable}
                    onChange={(e) => setCustomerTable(e.target.value)}
                    className="w-full bg-black/60 border border-white/5 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-white/20 transition-all"
                  />
                </div>

                <div className="pt-2 space-y-5 pb-4">
                  <div className="flex justify-between items-end px-2">
                    <span className="text-gray-400 font-medium">Grand Total</span>
                    <span className="font-bold text-3xl text-white">₹{calculateTotal()}</span>
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCheckout}
                    disabled={!customerName || !customerTable}
                    className="w-full bg-white text-black font-bold text-lg rounded-xl py-4 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                  >
                    Place Order
                  </motion.button>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  // Order History JSX Element
  const historyDrawerJSX = (
    <AnimatePresence>
      {isHistoryOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setIsHistoryOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
          <motion.div 
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute bottom-0 left-0 right-0 elegant-drawer rounded-t-[2rem] p-6 z-50 max-h-[85vh] flex flex-col"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Clock className="w-6 h-6 text-purple-400" />
                Live Orders
              </h2>
              <button 
                onClick={() => setIsHistoryOpen(false)}
                className="bg-white/10 w-10 h-10 rounded-full flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4">
              {orderHistory.length === 0 ? (
                <div className="text-gray-500 py-12 text-center font-medium">No previous orders found for you.</div>
              ) : (
                orderHistory.map(order => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    key={order._id} 
                    className="elegant-panel p-5 rounded-2xl relative overflow-hidden"
                  >
                    {/* Minimal status indicator line */}
                    {order.status === 'preparing' && <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500" />}
                    {order.status === 'delivering' && <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />}
                    {order.status === 'pending' && <div className="absolute top-0 left-0 w-1 h-full bg-purple-500" />}
                    {order.status === 'completed' && <div className="absolute top-0 left-0 w-1 h-full bg-green-500" />}
                    {order.status === 'paid' && <div className="absolute top-0 left-0 w-1 h-full bg-gray-600" />}
                    
                    <div className="flex justify-between items-start mb-4 pl-3">
                      <div>
                        <div className="font-bold flex items-center gap-2 mb-1 text-sm">
                          {order.status === 'pending' && <><span className="text-purple-400">Kitchen Received</span></>}
                          {order.status === 'preparing' && <><span className="text-yellow-400">Preparing...</span></>}
                          {order.status === 'delivering' && <><span className="text-blue-400">On the Way!</span></>}
                          {order.status === 'completed' && <><span className="text-green-400">Served</span></>}
                          {order.status === 'paid' && <><span className="text-gray-400">Bill Settled</span></>}
                        </div>
                        <span className="text-gray-500 text-xs font-medium">Ordered at {new Date(order.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <span className="font-bold text-lg text-white">₹{order.totalAmount}</span>
                    </div>
                    <div className="space-y-1.5 pl-3">
                      {order.items.map((item: any, i: number) => (
                        <div key={i} className="text-sm text-gray-400">
                          {item.name}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  // Calculate Payment Requested Details
  const paymentRequestedOrders = orderHistory.filter(o => o.status === 'payment_requested');
  const paymentVerifyingOrders = orderHistory.filter(o => o.status === 'payment_verifying');
  const activePaymentOrders = [...paymentRequestedOrders, ...paymentVerifyingOrders];
  const hasPaymentRequest = activePaymentOrders.length > 0;
  
  const isVerifying = paymentVerifyingOrders.length > 0;
  const paymentGrandTotal = activePaymentOrders.reduce((sum, o) => {
    const price = typeof o.totalAmount === 'number' ? o.totalAmount : parseInt(o.totalAmount.toString().replace(/[^0-9]/g, ''));
    return sum + price;
  }, 0);

  // UPI Link Generation - fetched server-side for security
  const [upiLink, setUpiLink] = useState('');
  const [isGeneratingUpi, setIsGeneratingUpi] = useState(false);

  useEffect(() => {
    if (!hasPaymentRequest) return;
    const generateUpiLink = async () => {
      setIsGeneratingUpi(true);
      try {
        const apiUrl = getApiUrl();
        const pathParts = window.location.pathname.split('/');
        const currentRestaurantId = pathParts[pathParts.length - 1];
        const res = await fetch(`${apiUrl}/payment/upi-link`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            restaurantId: currentRestaurantId,
            amount: paymentGrandTotal,
            customerName,
            tableNumber: customerTable,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setUpiLink(data.upiLink);
        }
      } catch (e) {
        console.error('Failed to generate UPI link', e);
      } finally {
        setIsGeneratingUpi(false);
      }
    };
    generateUpiLink();
  }, [hasPaymentRequest, paymentGrandTotal]);

  const handleMarkAsPaid = async () => {
    try {
      const apiUrl = getApiUrl();
      // Update all payment_requested orders to payment_verifying
      for (const order of paymentRequestedOrders) {
        await fetch(`${apiUrl}/orders/${order._id}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'payment_verifying' })
        });
      }
      fetchOrderHistory(); // Refresh the list
    } catch (e) {
      console.error("Failed to mark as paid", e);
    }
  };

  const paymentModalJSX = (
    <AnimatePresence>
      {hasPaymentRequest && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
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
            
            {isVerifying ? (
              <>
                <h2 className="text-2xl font-bold mb-4 tracking-tight text-white">Verifying Payment...</h2>
                <p className="text-gray-400 mb-8 font-medium">Please wait while the restaurant confirms your payment.</p>
                <div className="flex justify-center mb-6">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold mb-1 tracking-tight">Bill Generated</h2>
                <p className="text-gray-400 mb-6 font-medium">Table {customerTable} • {customerName}</p>
                
                {/* Order Items Breakdown */}
                <div className="w-full bg-[#111] rounded-2xl p-5 mb-6 border border-white/5 max-h-[25vh] overflow-y-auto">
                  {activePaymentOrders.map(order => (
                    <div key={order._id} className="space-y-3">
                      {order.items.map((item: any, i: number) => (
                        <div key={i} className="flex justify-between items-center text-sm">
                          <span className="text-gray-300">{item.name}</span>
                          <span className="text-gray-400">{item.price}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                  <div className="border-t border-white/10 mt-4 pt-4 flex justify-between items-center font-bold">
                    <span className="text-gray-300">Total</span>
                    <span className="text-white text-lg">₹{paymentGrandTotal}</span>
                  </div>
                </div>

                <motion.a 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  href={upiLink}
                  className="w-full bg-white text-black font-bold text-lg rounded-xl py-4 flex items-center justify-center gap-3 transition-colors mb-3"
                >
                  <QrCode className="w-5 h-5" />
                  Pay via UPI App
                </motion.a>
                
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleMarkAsPaid}
                  className="w-full bg-[#111] border border-white/10 text-white font-bold text-lg rounded-xl py-4 flex items-center justify-center transition-colors"
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
              className="w-11 h-11 rounded-full flex items-center justify-center bg-[#1a1a1a] border border-white/10 hover:bg-[#222] transition-colors"
            >
              <Clock className="w-5 h-5 text-gray-300" />
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
                      {item.price}
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
