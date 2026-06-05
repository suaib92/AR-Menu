'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Download, QrCode, Plus, Trash2, ScanLine, X } from 'lucide-react';
import { getApiUrl } from '@/utils/api';

type QrCodeRow = {
  _id: string;
  label: string;
  tableNumber?: string;
  targetUrl: string;
  scanCount: number;
  lastScannedAt?: string;
  createdAt: string;
};

export default function QRCodePage() {
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState<string>('');
  const [qrCodes, setQrCodes] = useState<QrCodeRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  // create form state
  const [newLabel, setNewLabel] = useState('Table QR');
  const [newTable, setNewTable] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchQrCodes = useCallback(async () => {
    try {
      const apiUrl = getApiUrl();
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`${apiUrl}/qr`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setQrCodes(await res.json());
      }
    } catch (e) {
      console.error('QR list fetch failed', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const userString = localStorage.getItem('user');
    if (userString) {
      const user = JSON.parse(userString);
      if (user.restaurantId) {
        setRestaurantId(user.restaurantId);
        setRestaurantName(user.restaurantName || 'Restaurant');
      }
    }
  }, []);

  useEffect(() => {
    if (restaurantId) fetchQrCodes();
  }, [restaurantId, fetchQrCodes]);

  const buildTargetUrl = (id: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const encodedName = encodeURIComponent(restaurantName);
    return `${origin}/menu/${restaurantId}?name=${encodedName}&qr=${id}`;
  };

  const handleCreate = async () => {
    if (!newLabel.trim()) return;
    setCreating(true);
    try {
      const apiUrl = getApiUrl();
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`${apiUrl}/qr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          label: newLabel.trim(),
          tableNumber: newTable.trim() || undefined,
          // placeholder; we re-build it client-side using the returned _id
          targetUrl: `${typeof window !== 'undefined' ? window.location.origin : ''}/menu/${restaurantId}`,
        }),
      });
      if (res.ok) {
        const created: QrCodeRow = await res.json();
        // patch targetUrl to include ?qr=<id> and persist
        const realUrl = buildTargetUrl(created._id);
        await fetch(`${apiUrl}/qr/${created._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ targetUrl: realUrl }),
        });
        setShowCreate(false);
        setNewLabel('Table QR');
        setNewTable('');
        await fetchQrCodes();
      }
    } catch (e) {
      console.error('QR create failed', e);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this QR code? Existing prints will stop tracking.')) return;
    try {
      const apiUrl = getApiUrl();
      const token = localStorage.getItem('token') || '';
      await fetch(`${apiUrl}/qr/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchQrCodes();
    } catch (e) {
      console.error('QR delete failed', e);
    }
  };

  const handleDownload = (id: string) => {
    const svg = document.getElementById(`qr-${id}`);
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `QR_${id}.png`;
      link.href = pngFile;
      link.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  if (!restaurantId) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center text-gray-400">
          Loading restaurant data...
        </div>
      </div>
    );
  }

  const totalScans = qrCodes.reduce((sum, q) => sum + q.scanCount, 0);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">QR Codes</h1>
          <p className="text-gray-400">
            {qrCodes.length} active · {totalScans.toLocaleString('en-IN')} total scans
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-white text-black font-semibold px-5 py-2.5 rounded-xl inline-flex items-center gap-2 hover:bg-gray-200 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New QR code
        </button>
      </div>

      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">New QR code</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Label</label>
                <input
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="e.g. Window Table 4"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Table number (optional)</label>
                <input
                  value={newTable}
                  onChange={(e) => setNewTable(e.target.value)}
                  placeholder="e.g. 4"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 text-sm rounded-lg text-gray-300 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !newLabel.trim()}
                className="px-4 py-2 text-sm rounded-lg bg-purple-500 text-white font-semibold hover:bg-purple-400 disabled:opacity-50"
              >
                {creating ? 'Creating…' : 'Create'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading ? (
        <div className="text-gray-400 text-center py-12">Loading QR codes…</div>
      ) : qrCodes.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center text-gray-400">
          <QrCode className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="mb-4">No QR codes yet.</p>
          <button
            onClick={() => setShowCreate(true)}
            className="text-purple-400 hover:underline text-sm"
          >
            Create your first QR
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {qrCodes.map((qr) => (
            <motion.div
              key={qr._id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col items-center"
            >
              <div className="bg-white p-3 rounded-xl mb-4">
                <QRCodeSVG
                  id={`qr-${qr._id}`}
                  value={buildTargetUrl(qr._id)}
                  size={150}
                  level="H"
                  includeMargin={true}
                  fgColor="#000000"
                  bgColor="#ffffff"
                />
              </div>
              <div className="text-center w-full">
                <div className="font-semibold truncate">{qr.label}</div>
                {qr.tableNumber && (
                  <div className="text-xs text-gray-400 mb-2">Table {qr.tableNumber}</div>
                )}
                <div className="inline-flex items-center gap-1 text-xs text-gray-300 bg-white/5 px-2 py-1 rounded-full mb-4">
                  <ScanLine className="w-3 h-3" />
                  {qr.scanCount.toLocaleString('en-IN')} scans
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownload(qr._id)}
                    className="flex-1 bg-white text-black text-sm font-semibold py-2 rounded-lg inline-flex items-center justify-center gap-1.5 hover:bg-gray-200"
                  >
                    <Download className="w-3.5 h-3.5" />
                    PNG
                  </button>
                  <button
                    onClick={() => handleDelete(qr._id)}
                    className="bg-white/5 text-red-400 text-sm font-semibold py-2 px-3 rounded-lg hover:bg-red-500/10"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
