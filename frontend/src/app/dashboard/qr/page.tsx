'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Download, QrCode } from 'lucide-react';

export default function QRCodePage() {
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState<string>('');
  const [menuUrl, setMenuUrl] = useState<string>('');

  useEffect(() => {
    // Get user from localStorage to construct the unique URL
    const userString = localStorage.getItem('user');
    if (userString) {
      const user = JSON.parse(userString);
      if (user.restaurantId) {
        setRestaurantId(user.restaurantId);
        setRestaurantName(user.restaurantName || 'The French Laundry');
      }
    }
  }, []);

  useEffect(() => {
    if (restaurantId) {
      const encodedName = encodeURIComponent(restaurantName);
      setMenuUrl(`${window.location.origin}/menu/${restaurantId}?name=${encodedName}`);
    }
  }, [restaurantId, restaurantName]);

  const handleDownload = () => {
    const svg = document.getElementById('qr-code-svg');
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        const pngFile = canvas.toDataURL('image/png');
        
        const downloadLink = document.createElement('a');
        downloadLink.download = `Table_QR_${restaurantId}.png`;
        downloadLink.href = `${pngFile}`;
        downloadLink.click();
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">QR Code Generator</h1>
        <p className="text-gray-400">Print this QR code and place it on your tables for customers to scan.</p>
      </div>

      {!restaurantId ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center text-gray-400">
          Loading restaurant data...
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-8 items-start">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/5 border border-white/10 p-8 rounded-3xl flex flex-col items-center justify-center text-center"
          >
            <div className="bg-white p-4 rounded-2xl mb-6 shadow-xl shadow-purple-500/10">
              <QRCodeSVG 
                id="qr-code-svg"
                value={menuUrl} 
                size={200} 
                level="H"
                includeMargin={true}
                fgColor="#000000"
                bgColor="#ffffff"
              />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-xl mb-1">Scan to see Menu</h3>
              <p className="text-sm text-gray-500 font-medium">Powered by AR Smart Menu</p>
            </div>
          </motion.div>

          <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
              <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                <QrCode className="w-5 h-5 text-purple-400" />
                Your Menu URL
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                This is the direct link to your AR customer experience.
              </p>
              <div className="bg-black/50 p-3 rounded-lg border border-white/10 font-mono text-sm break-all text-purple-300">
                {menuUrl}
              </div>
            </div>

            <button 
              onClick={handleDownload}
              className="w-full bg-white text-black font-bold text-lg rounded-xl py-4 flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors shadow-lg"
            >
              <Download className="w-5 h-5" />
              Download QR Code (PNG)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
