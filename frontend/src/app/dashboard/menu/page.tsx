'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { getApiUrl, getImageUrl } from '@/utils/api';
import { Plus, Search, Edit2, Trash2, X, Box, Upload, Loader2, Camera, Sparkles } from 'lucide-react';
import { IMenuItem } from '@/types';

export default function MenuManagementPage() {
  const [items, setItems] = useState<IMenuItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingItem, setEditingItem] = useState<IMenuItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState('');
  const photoFileInputRef = useRef<HTMLInputElement>(null);
  const manualFileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: 'Mains',
    description: '',
    calories: '',
    time: '',
    status: 'Active',
    imageUrl: '',
    variants: [] as { name: string, price: string }[]
  });

  const resetForm = () => {
    setFormData({ name: '', price: '', category: 'Mains', description: '', calories: '', time: '', status: 'Active', imageUrl: '', variants: [] });
    setEditingItem(null);
  };

  const fetchItems = async () => {
    try {
      setIsLoading(true);
      setFetchError('');
      const apiUrl = getApiUrl();
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`${apiUrl}/menu/items`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      } else {
        const err = await res.json().catch(() => ({}));
        setFetchError(err.message || `Server returned ${res.status}`);
      }
    } catch (error) {
      setFetchError('Could not connect to server');
      console.error("Failed to fetch menu items", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      const apiUrl = getApiUrl();
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`${apiUrl}/menu/items/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        setItems(items.filter(item => item._id !== id));
        toast.success('Item deleted successfully');
      } else {
        toast.error('Failed to delete item');
      }
    } catch (error) {
      console.error("Failed to delete item", error);
      toast.error('Failed to delete item');
    }
  };

  const handleEditItem = (item: IMenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      price: item.price.toString(),
      category: item.category,
      description: item.description,
      calories: item.calories || '',
      time: item.time || '',
      status: item.status || 'Active',
      imageUrl: item.imageUrl || '',
      variants: item.variants || []
    });
    setIsAddModalOpen(true);
  };

  const handleAnalyzeFood = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    setAnalysisStatus('Uploading photo...');
    try {
      const apiUrl = getApiUrl();
      const token = localStorage.getItem('token') || '';
      const formPayload = new FormData();
      formPayload.append('image', file);

      setAnalysisStatus('AI is scanning your dish...');
      const res = await fetch(`${apiUrl}/menu/analyze-food`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formPayload
      });

      if (res.ok) {
        const data = await res.json();
        
        // Auto-fill form
        setFormData(prev => ({
          ...prev,
          name: data.name || prev.name,
          description: data.description || prev.description,
          category: data.category || prev.category,
          price: data.price ? data.price.toString() : prev.price,
          calories: data.calories || prev.calories,
          time: data.time || prev.time,
          imageUrl: data.imageUrl || prev.imageUrl,
          variants: data.variants || prev.variants
        }));
        
        toast.success('Menu item auto-filled by AI!');
      } else {
        const err = await res.json();
        toast.error(err.message || 'AI analysis failed. Try again.');
      }
    } catch (err) {
      toast.error('Connection error. Is the backend running?');
    } finally {
      setIsAnalyzing(false);
      setAnalysisStatus('');
      if (photoFileInputRef.current) photoFileInputRef.current.value = '';
    }
  };

  const handleManualUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const toastId = toast.loading('Uploading image...');
    
    try {
      const apiUrl = getApiUrl();
      const token = localStorage.getItem('token') || '';
      const formPayload = new FormData();
      formPayload.append('image', file);

      const res = await fetch(`${apiUrl}/menu/upload-image`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formPayload
      });

      if (res.ok) {
        const data = await res.json();
        setFormData(prev => ({ ...prev, imageUrl: data.imageUrl }));
        toast.success('Image uploaded successfully!', { id: toastId });
      } else {
        const err = await res.json();
        toast.error(err.message || 'Upload failed.', { id: toastId });
      }
    } catch (err) {
      toast.error('Connection error.', { id: toastId });
    } finally {
      setIsUploading(false);
      if (manualFileInputRef.current) manualFileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const apiUrl = getApiUrl();
      const token = localStorage.getItem('token') || '';
      
      const method = editingItem ? 'PUT' : 'POST';
      const url = editingItem ? `${apiUrl}/menu/items/${editingItem._id}` : `${apiUrl}/menu/items`;

      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        const savedItem = await res.json();
        if (editingItem) {
          setItems(items.map(i => i._id === savedItem._id ? savedItem : i));
          toast.success('Menu item updated successfully');
        } else {
          setItems([savedItem, ...items]);
          toast.success('Menu item added successfully');
        }
        setIsAddModalOpen(false);
        resetForm();
      } else {
        toast.error(`Failed to ${editingItem ? 'update' : 'add'} menu item`);
      }
    } catch (error) {
      console.error("Failed to save item", error);
      toast.error(`Failed to ${editingItem ? 'update' : 'add'} menu item`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Menu Items</h1>
          <p className="text-gray-400">Manage your AR menu items, pricing, and 3D models.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsAddModalOpen(true); }}
          className="bg-white text-black font-semibold rounded-xl px-6 py-3 flex items-center gap-2 hover:bg-gray-200 transition-colors shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Add New Item
        </button>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
        {/* Toolbar */}
        <div className="p-6 border-b border-white/10 flex flex-col sm:flex-row gap-4 justify-between items-center bg-white/[0.02]">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
            />
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 flex-1 sm:flex-none"
            >
              <option value="all">All Categories</option>
              <option value="Mains">Mains</option>
              <option value="Sides">Sides</option>
              <option value="Beverages">Beverages</option>
              <option value="Desserts">Desserts</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-gray-400 text-sm">
                <th className="p-6 font-medium">Item Name</th>
                <th className="p-6 font-medium">Category</th>
                <th className="p-6 font-medium">Price</th>
                <th className="p-6 font-medium">Status</th>
                <th className="p-6 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {fetchError ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center">
                    <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
                      <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse shrink-0" />
                      {fetchError}. Make sure the backend is running and disable extensions like Urban VPN Proxy.
                    </div>
                  </td>
                </tr>
              ) : isLoading ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-gray-400">Loading menu items from database...</td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-gray-400">No menu items found. Click "Add New Item" to create one.</td>
                </tr>
              ) : (
                filteredItems.map((item, i) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={item._id} 
                    className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group"
                  >
                    <td className="p-6 font-medium flex items-center gap-3">
                      {item.imageUrl ? (
                        <img src={getImageUrl(item.imageUrl)} className="w-10 h-10 rounded-xl object-cover" alt="" />
                      ) : (
                        <span className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-lg">🍽️</span>
                      )}
                      {item.name}
                    </td>
                    <td className="p-6 text-gray-400">{item.category}</td>
                    <td className="p-6">{item.price}</td>
                    <td className="p-6">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        item.status === 'Active' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 
                        'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-6 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEditItem(item)}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(item._id)}
                          className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-gray-400 hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Item Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
              onClick={() => setIsAddModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-[#111] border border-white/10 rounded-3xl p-8 z-50 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">{editingItem ? 'Edit Menu Item' : 'Add Menu Item'}</h2>
                <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* AI Food Analyzer (Moved to top) */}
                <div className="mb-6 p-4 rounded-xl border border-dashed border-purple-500/40 bg-purple-500/5">
                  <p className="text-sm text-purple-300 font-semibold mb-3 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" /> AI Magic — Auto-fill from Photo
                  </p>
                  {/* Hidden photo picker */}
                  <input
                    ref={photoFileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    capture="environment"
                    onChange={handleAnalyzeFood}
                    className="hidden"
                    id="photo-capture-input"
                  />
                  {isAnalyzing ? (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative overflow-hidden rounded-xl bg-[#0f0f1a] border border-purple-500/30 p-5 shadow-[0_0_30px_rgba(168,85,247,0.15)]"
                    >
                      {/* Sweeping laser scanner effect */}
                      <motion.div 
                        animate={{ top: ['-10%', '110%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent shadow-[0_0_10px_rgba(168,85,247,0.8)] opacity-60 z-0"
                      />
                      
                      <div className="relative z-10 flex items-center gap-4">
                        {/* Premium Double Spinner */}
                        <div className="relative w-12 h-12 rounded-full flex items-center justify-center bg-purple-500/10 shrink-0">
                          <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                          <div className="absolute inset-0 border-2 border-purple-500/20 border-t-purple-400 rounded-full animate-[spin_1.5s_linear_infinite_reverse]" />
                        </div>
                        
                        <div>
                          <p className="font-bold text-white tracking-wide text-sm">{analysisStatus}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="flex gap-1 shrink-0">
                              <motion.span animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0 }} className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                              <motion.span animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                              <motion.span animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                            </span>
                            <p className="text-xs text-purple-300 font-medium">Extracting rich metadata...</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => photoFileInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-purple-500/20"
                    >
                      <Camera className="w-5 h-5" />
                      Take Photo & Auto-fill Details
                    </button>
                  )}
                  <p className="text-xs text-gray-500 mt-3 text-center">Instantly writes name, description, category, calories, and time based on the image.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm text-gray-400 mb-1">Item Name</label>
                    <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500" placeholder="E.g. Margherita Pizza" />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Price (with symbol)</label>
                    <input required type="text" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500" placeholder="₹499" />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Category</label>
                    <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500">
                      <option value="Mains">Mains</option>
                      <option value="Sides">Sides</option>
                      <option value="Beverages">Beverages</option>
                      <option value="Desserts">Desserts</option>
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm text-gray-400 mb-1">Description</label>
                    <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 min-h-[100px]" placeholder="Delicious classic pizza..." />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Prep Time</label>
                    <input type="text" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500" placeholder="15-20 min" />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Calories</label>
                    <input type="text" value={formData.calories} onChange={e => setFormData({...formData, calories: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500" placeholder="350 kcal" />
                  </div>

                  <div className="col-span-2 mt-2">
                    <label className="block text-sm text-gray-400 mb-1">Food Photo URL (for 3D viewer)</label>
                    <div className="flex gap-2">
                      <input type="url" value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500" placeholder="https://example.com/dish.jpg" />
                      
                      <input
                        ref={manualFileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleManualUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        disabled={isUploading}
                        onClick={() => manualFileInputRef.current?.click()}
                        className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors flex items-center gap-2 whitespace-nowrap"
                      >
                        {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        Upload
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1.5">Paste a URL, upload manually here, or use the AI Auto-fill button at the top.</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Status</label>
                    <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500">
                      <option value="Active">Active</option>
                      <option value="Draft">Draft</option>
                    </select>
                  </div>
                  
                  <div className="col-span-2 mt-4 pt-4 border-t border-white/10">
                    <div className="flex justify-between items-center mb-3">
                      <label className="block text-sm font-semibold text-white">Item Sizes / Variants (Optional)</label>
                      <button 
                        type="button" 
                        onClick={() => setFormData({...formData, variants: [...formData.variants, { name: '', price: '' }]})}
                        className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                      >
                        <Plus className="w-3 h-3" /> Add Size
                      </button>
                    </div>
                    {formData.variants.length === 0 ? (
                      <p className="text-xs text-gray-500 italic">No variants. The base price will be used.</p>
                    ) : (
                      <div className="space-y-3">
                        {formData.variants.map((v, idx) => (
                          <div key={idx} className="flex gap-2 items-center">
                            <input 
                              type="text" 
                              placeholder="e.g. Large" 
                              value={v.name}
                              onChange={(e) => {
                                const newV = [...formData.variants];
                                newV[idx].name = e.target.value;
                                setFormData({...formData, variants: newV});
                              }}
                              className="flex-1 bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500" 
                            />
                            <input 
                              type="text" 
                              placeholder="₹399" 
                              value={v.price}
                              onChange={(e) => {
                                const newV = [...formData.variants];
                                newV[idx].price = e.target.value;
                                setFormData({...formData, variants: newV});
                              }}
                              className="w-1/3 bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500" 
                            />
                            <button 
                              type="button" 
                              onClick={() => {
                                const newV = [...formData.variants];
                                newV.splice(idx, 1);
                                setFormData({...formData, variants: newV});
                              }}
                              className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <button disabled={isSubmitting} type="submit" className="w-full mt-6 bg-white text-black font-bold text-lg rounded-xl py-4 hover:bg-gray-200 transition-colors shadow-lg active:scale-95 disabled:opacity-50">
                  {isSubmitting ? 'Saving...' : (editingItem ? 'Update Menu Item' : 'Save Menu Item')}
                </button>

              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
