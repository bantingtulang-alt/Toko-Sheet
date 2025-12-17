import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { fetchProducts, saveProductList } from '../services/productService';
import { Plus, Trash2, Edit2, LogOut, RefreshCw, Loader2, Key, Lock, ChevronDown, ChevronUp } from 'lucide-react';

interface AdminPanelProps {
  onLogout: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Product Form State
  const [formData, setFormData] = useState<Product>({
    id: '',
    name: '',
    price: 0,
    category: 'Teh'
  });

  // PIN Management State
  const [showPinForm, setShowPinForm] = useState(false);
  const [pinData, setPinData] = useState({
    oldPin: '',
    newPin: '',
    confirmPin: ''
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setIsLoading(true);
    const data = await fetchProducts();
    setProducts(data);
    setIsLoading(false);
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setFormData(product);
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({ id: '', name: '', price: 0, category: 'Teh' });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Hapus produk ini dari database?')) {
      setIsSaving(true);
      const updatedList = products.filter(p => p.id !== id);
      setProducts(updatedList); // Update UI optimistic
      
      const success = await saveProductList(updatedList);
      if (!success) alert("Gagal sinkronisasi ke cloud, tersimpan di lokal.");
      
      if (editingId === id) handleCancel();
      setIsSaving(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || formData.price <= 0) return;

    setIsSaving(true);
    const newItem = {
      ...formData,
      id: editingId || Date.now().toString()
    };

    let updatedList: Product[];
    if (editingId) {
       updatedList = products.map(p => p.id === editingId ? newItem : p);
    } else {
       updatedList = [...products, newItem];
    }

    setProducts(updatedList); // UI Update
    const success = await saveProductList(updatedList); // Cloud Sync
    
    if (success) {
      handleCancel();
    } else {
      alert("Gagal koneksi ke Google Sheet, tersimpan di lokal sementara.");
    }
    setIsSaving(false);
  };

  const handleChangePin = (e: React.FormEvent) => {
    e.preventDefault();
    const currentStoredPin = localStorage.getItem('tokosheet_admin_pin') || '1234';

    if (pinData.oldPin !== currentStoredPin) {
      alert('PIN Lama salah!');
      return;
    }

    if (pinData.newPin.length < 4) {
      alert('PIN Baru minimal 4 karakter');
      return;
    }

    if (pinData.newPin !== pinData.confirmPin) {
      alert('Konfirmasi PIN tidak cocok!');
      return;
    }

    localStorage.setItem('tokosheet_admin_pin', pinData.newPin);
    alert('PIN Admin berhasil diubah!');
    setPinData({ oldPin: '', newPin: '', confirmPin: '' });
    setShowPinForm(false);
  };

  return (
    <div className="p-4 pb-24 h-full flex flex-col bg-gray-50 overflow-y-auto no-scrollbar">
      <header className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Admin Panel</h1>
          <p className="text-gray-500 text-sm">Kelola Produk & Harga</p>
        </div>
        <div className="flex space-x-2">
            <button 
              onClick={loadProducts}
              disabled={isLoading}
              type="button"
              className={`p-2 text-gray-400 hover:text-blue-500 rounded-full hover:bg-blue-50 transition-colors ${isLoading ? 'animate-spin' : ''}`}
              title="Reload Data"
            >
              <RefreshCw size={20} />
            </button>
            <button 
              onClick={onLogout}
              className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center"
              title="Keluar"
            >
              <LogOut size={20} />
            </button>
        </div>
      </header>

      {/* Security Settings Accordion */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
        <button 
          onClick={() => setShowPinForm(!showPinForm)}
          className="w-full p-4 flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center text-gray-700 font-bold text-sm">
            <Key size={16} className="mr-2 text-orange-500"/>
            Pengaturan Keamanan
          </div>
          {showPinForm ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showPinForm && (
          <form onSubmit={handleChangePin} className="p-4 bg-white space-y-3 animate-fade-in border-t border-gray-100">
            <div>
              <label className="text-xs text-gray-500 block mb-1">PIN Lama</label>
              <div className="relative">
                <input 
                  type="password"
                  value={pinData.oldPin}
                  onChange={(e) => setPinData({...pinData, oldPin: e.target.value})}
                  className="w-full pl-8 border-b border-gray-300 py-2 text-sm focus:border-orange-500 outline-none"
                  placeholder="****"
                  required
                />
                <Lock size={14} className="absolute left-0 top-3 text-gray-400" />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 block mb-1">PIN Baru</label>
                <input 
                  type="number"
                  value={pinData.newPin}
                  onChange={(e) => setPinData({...pinData, newPin: e.target.value})}
                  className="w-full border-b border-gray-300 py-2 text-sm focus:border-orange-500 outline-none"
                  placeholder="****"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Konfirmasi</label>
                <input 
                  type="number"
                  value={pinData.confirmPin}
                  onChange={(e) => setPinData({...pinData, confirmPin: e.target.value})}
                  className="w-full border-b border-gray-300 py-2 text-sm focus:border-orange-500 outline-none"
                  placeholder="****"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full bg-orange-500 text-white py-2 rounded-lg text-sm font-bold shadow hover:bg-orange-600 transition-colors mt-2"
            >
              Ubah PIN Admin
            </button>
          </form>
        )}
      </div>

      {/* Form Tambah/Edit Produk */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 relative">
        {isSaving && (
          <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center rounded-xl">
            <Loader2 className="animate-spin text-blue-600" />
          </div>
        )}
        <h3 className="font-bold text-gray-700 mb-3 flex items-center">
          {editingId ? <Edit2 size={16} className="mr-2"/> : <Plus size={16} className="mr-2"/>}
          {editingId ? 'Edit Produk' : 'Tambah Produk Baru'}
        </h3>
        
        <form onSubmit={handleSaveProduct} className="space-y-3">
          <div>
            <label className="text-xs text-gray-500">Nama Produk</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full border-b border-gray-300 py-1 focus:border-blue-500 outline-none text-sm font-medium"
              placeholder="Contoh: Es Teh Manis"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500">Kategori</label>
              <select
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
                className="w-full border-b border-gray-300 py-1 focus:border-blue-500 outline-none text-sm bg-transparent"
              >
                <option value="Teh">Teh</option>
                <option value="Kopi">Kopi</option>
                <option value="Susu">Susu</option>
                <option value="Coklat">Coklat</option>
                <option value="Makanan">Makanan</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">Harga (Rp)</label>
              <input
                type="number"
                value={formData.price || ''}
                onChange={e => setFormData({...formData, price: parseInt(e.target.value) || 0})}
                className="w-full border-b border-gray-300 py-1 focus:border-blue-500 outline-none text-sm font-medium"
                placeholder="0"
                required
              />
            </div>
          </div>

          <div className="flex space-x-2 pt-2">
            {editingId && (
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200"
              >
                Batal
              </button>
            )}
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 shadow-md shadow-blue-200 flex justify-center items-center"
            >
               {isSaving ? "Menyimpan..." : (editingId ? 'Simpan Perubahan' : 'Tambah Produk')}
            </button>
          </div>
        </form>
      </div>

      {/* List Produk */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col min-h-[300px]">
        <div className="p-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h3 className="font-bold text-xs text-gray-500 uppercase tracking-wider">Daftar Menu ({products.length})</h3>
          <span className="text-[10px] text-gray-400 italic">Auto-sync Cloud</span>
        </div>
        <div className="overflow-y-auto flex-1 p-2 space-y-2 relative">
          {isLoading ? (
             <div className="flex justify-center items-center h-full text-gray-400">
               <Loader2 className="animate-spin mr-2" /> Memuat data...
             </div>
          ) : (
            <>
              {products.length === 0 ? (
                 <div className="text-center py-10 text-gray-400 text-sm flex flex-col items-center">
                    <LogOut className="mb-2 opacity-20" size={40} />
                    <p>Database Produk Kosong</p>
                    <p className="text-xs mt-1">Silakan tambah produk baru.</p>
                 </div>
              ) : (
                products.map(product => (
                  <div 
                    key={product.id} 
                    className={`flex justify-between items-center p-3 rounded-lg border ${editingId === product.id ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-gray-200'}`}
                  >
                    <div>
                      <div className="font-bold text-gray-800 text-sm">{product.name}</div>
                      <div className="text-xs text-gray-500">
                        {product.category} • Rp {product.price.toLocaleString('id-ID')}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(product)}
                        className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(product.id)}
                        className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;