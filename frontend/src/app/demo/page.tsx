'use client';

import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Smartphone, QrCode, Scan, Rotate3d } from 'lucide-react';
import Link from 'next/link';

const steps = [
  {
    icon: QrCode,
    title: '1. Scan the QR',
    description: 'Find the QR code on your table and scan it with your phone camera.',
  },
  {
    icon: Scan,
    title: '2. Browse the Menu',
    description: 'Browse through the restaurant menu with beautiful 3D previews.',
  },
  {
    icon: Rotate3d,
    title: '3. View in AR',
    description: 'Tap any item to see it in 3D. Rotate, zoom, and place it on your table.',
  },
  {
    icon: Smartphone,
    title: '4. Order & Pay',
    description: 'Add items to your cart, place your order, and pay via UPI — all from your phone.',
  },
];

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 backdrop-blur-md border-b border-white/10">
        <Link href="/" className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-purple-500" />
          <span className="font-bold text-xl tracking-tight">AR Smart Menu</span>
        </Link>
        <Link href="/login" className="text-sm font-medium hover:text-purple-400 transition-colors">
          Sign in
        </Link>
      </nav>

      <main className="pt-32 pb-20 px-6 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-20"
        >
          <h1 className="text-5xl font-extrabold tracking-tight mb-4">
            See it in action
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Experience how AR Smart Menu transforms the dining experience — from QR scan to payment.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 mb-20">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 }}
              className="bg-white/5 border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-colors"
            >
              <div className="bg-purple-500/20 w-14 h-14 rounded-2xl flex items-center justify-center mb-5">
                <step.icon className="w-7 h-7 text-purple-400" />
              </div>
              <h3 className="text-2xl font-semibold mb-2">{step.title}</h3>
              <p className="text-gray-400 leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center"
        >
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-white text-black px-8 py-4 rounded-full font-semibold text-lg hover:bg-gray-200 transition-all"
          >
            Start Free Trial <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </main>
    </div>
  );
}
