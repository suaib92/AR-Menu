'use client';

import { motion, Variants } from 'framer-motion';
import { ArrowRight, Box, Camera, LineChart, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-purple-500/30">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-purple-500" />
          <span className="font-bold text-xl tracking-tight">AR Smart Menu</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/pricing" className="text-sm text-gray-400 hover:text-white transition-colors">Pricing</Link>
          <Link href="/login" className="text-sm font-medium hover:text-purple-400 transition-colors">Sign in</Link>
          <Link href="/register" className="text-sm font-medium bg-white text-black px-4 py-2 rounded-full hover:bg-gray-200 transition-colors">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center max-w-4xl mx-auto"
        >
          <motion.div variants={itemVariants} className="inline-block mb-6 px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-sm font-medium">
            Next-Generation Dining Experience
          </motion.div>
          <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8">
            Bring your menu to <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">life in 3D</span>
          </motion.h1>
          <motion.p variants={itemVariants} className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Transform how customers experience your food. Scan a QR code, view realistic 3D dishes on the table, and order seamlessly with our WebAR platform.
          </motion.p>
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="flex items-center gap-2 bg-white text-black px-8 py-4 rounded-full font-semibold text-lg hover:bg-gray-200 transition-all transform hover:scale-105">
              Start Free Trial <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/demo" className="flex items-center gap-2 bg-white/5 border border-white/10 text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white/10 transition-all">
              View AR Demo
            </Link>
          </motion.div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-32 grid md:grid-cols-3 gap-8"
        >
          <div className="bg-white/5 border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-colors">
            <div className="bg-purple-500/20 w-14 h-14 rounded-2xl flex items-center justify-center mb-6">
              <Camera className="w-7 h-7 text-purple-400" />
            </div>
            <h3 className="text-2xl font-semibold mb-3">No App Required</h3>
            <p className="text-gray-400 leading-relaxed">Customers simply scan a QR code at their table to instantly launch the WebAR experience right in their mobile browser.</p>
          </div>
          
          <div className="bg-white/5 border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-colors">
            <div className="bg-pink-500/20 w-14 h-14 rounded-2xl flex items-center justify-center mb-6">
              <Box className="w-7 h-7 text-pink-400" />
            </div>
            <h3 className="text-2xl font-semibold mb-3">Realistic 3D Models</h3>
            <p className="text-gray-400 leading-relaxed">Upload GLB/GLTF models of your best dishes. Customers can scale, rotate, and place them on their table before ordering.</p>
          </div>

          <div className="bg-white/5 border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-colors">
            <div className="bg-blue-500/20 w-14 h-14 rounded-2xl flex items-center justify-center mb-6">
              <LineChart className="w-7 h-7 text-blue-400" />
            </div>
            <h3 className="text-2xl font-semibold mb-3">Powerful Analytics</h3>
            <p className="text-gray-400 leading-relaxed">Track scan rates, AR interaction times, and conversion metrics in a beautiful, enterprise-grade dashboard.</p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
