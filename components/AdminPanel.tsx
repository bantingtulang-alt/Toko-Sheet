import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { fetchProducts, saveProductList } from '../services/productService';
import { getApiUrl, saveApiUrl, fetchAdminPin, saveAdminPin } from '../services/storageService';
import { Plus, Trash2, Edit2, LogOut, RefreshCw, Loader2, Key, Lock, ChevronDown, ChevronUp, Package, Link as LinkIcon, Check, Copy } from 'lucide-react';

interface AdminPanelProps {
  onLogout: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Google Sheet Config State
  const [showConfigForm, setShowConfigForm] = useState(false);
  const [apiUrl, setApiUrl] = useState('');
  const [showTutorial, setShowTutorial] = useState(false);

  // Product Form State
  const [showProductForm, setShowProductForm] = useState(false);
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
    setApiUrl(getApiUrl());
  }, []);

  const loadProducts = async () => {
    setIsLoading(true);
    const data = await fetchProducts();
    setProducts(data);
    setIsLoading(false);
  };

  // --- Handlers Config Google Sheet ---
  const handleSaveConfig = () => {
    saveApiUrl(apiUrl);
    alert('Konfigurasi berhasil disimpan. Silakan reload data di halaman Data.');
    setShowConfigForm(false);
  };

  const appScriptCode = `
function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var type = e.parameter.type || 'sales';
  
  // -- GET SETTINGS (PIN) --
  if (type === 'settings') {
     var sheet = ss.getSheetByName('Settings');
     if (!sheet) {
        sheet = ss.insertSheet('Settings');
        sheet.appendRow(['Key', 'Value']);
        sheet.appendRow(['ADMIN_PIN', '1234']); // Default
     }
     var data = sheet.getDataRange().getValues();
     var pin = '1234';
     for(var i=0; i<data.length; i++) {
        if(data[i][0] === 'ADMIN_PIN') {
           pin = data[i][1];
           break;
        }
     }
     return ContentService.createTextOutput(JSON.stringify({status: 'success', pin: pin}))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var sheetName = 'Transactions';
  if (type === 'purchases') sheetName = 'Purchases';
  if (type === 'products') sheetName = 'Products';

  var sheet = ss.getSheetByName(sheetName);
  
  // Setup Sheet jika belum ada
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    if(type === 'purchases') {
       sheet.appendRow(['ID', 'Date', 'Item Name', 'Supplier', 'Qty', 'Price', 'Total']);
    } else if (type === 'products') {
       sheet.appendRow(['ID', 'Name', 'Price', 'Category']);
    } else {
       sheet.appendRow(['ID', 'Date', 'Product', 'Category', 'Qty', 'Price', 'Total', 'Payment Method']);
    }
  }

  var data = sheet.getDataRange().getValues();
  if (data.length > 0) data.shift(); // Hapus header
  
  return ContentService.createTextOutput(JSON.stringify({status: 'success', data: data}))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var payload = JSON.parse(e.postData.contents);
    var action = payload.action; 
    
    // -- UPDATE PIN --
    if (action === 'update_pin') {
      var sheet = ss.getSheetByName('Settings');
      if (!sheet) {
         sheet = ss.insertSheet('Settings');
         sheet.appendRow(['Key', 'Value']);
      }
      var data = sheet.getDataRange().getValues();
      var found = false;
      for(var i=0; i<data.length; i++) {
        if(data[i][0] === 'ADMIN_PIN') {
           sheet.getRange(i+1, 2).setValue(payload.pin);
           found = true;
           break;
        }
      }
      if(!found) {
         sheet.appendRow(['ADMIN_PIN', payload.pin]);
      }
      return ContentService.createTextOutput(JSON.stringify({status: 'success'}))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // -- LOGIKA UPDATE PRODUK (Overwrite) --
    if (action === 'update_products') {
      var sheet = ss.getSheetByName('Products');
      if (!sheet) {
        sheet = ss.insertSheet('Products');
        sheet.appendRow(['ID', 'Name', 'Price', 'Category']);
      } else {
        // Clear konten lama kecuali header, atau overwrite semua
        sheet.clear(); 
        sheet.appendRow(['ID', 'Name', 'Price', 'Category']);
      }
      
      // Jika ada data baru, masukkan
      if (payload.data && payload.data.length > 0) {
        // Batch operation agar cepat
        sheet.getRange(2, 1, payload.data.length, payload.data[0].length).setValues(payload.data);
      }
      return ContentService.createTextOutput(JSON.stringify({status: 'success'}))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // -- LOGIKA TRANSAKSI & PEMBELIAN (Append) --
    var sheetName = (action === 'add_purchase') ? 'Purchases' : 'Transactions';
    var sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
       sheet = ss.insertSheet(sheetName);
       if(action === 'add_purchase') {
         sheet.appendRow(['ID', 'Date', 'Item Name', 'Supplier', 'Qty', 'Price', 'Total']);
       } else {
         sheet.appendRow(['ID', 'Date', 'Product', 'Category', 'Qty', 'Price', 'Total', 'Payment Method']);
       }
    }

    if (payload.data) {
      sheet.appendRow(payload.data);
    }
    
    return ContentService.createTextOutput(JSON.stringify({status: 'success'}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({status: 'error', message: err.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
  `.trim();

  // --- Handlers Produk ---

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setFormData(product);
    setShowProductForm(true); 
    setShowPinForm(false);
    setShowConfigForm(false);
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({ id: '', name: '', price: 0, category: 'Teh' });
    setShowProductForm(false);
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
      handleCancel();
    }
    setIsSaving(false);
  };

  // --- Handlers PIN ---

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Validasi PIN Lama (Ambil dari cache atau cloud untuk memastikan)
    const currentStoredPin = await fetchAdminPin();

    if (pinData.oldPin !== currentStoredPin) {
      alert('PIN Lama salah!');
      setIsSaving(false);
      return;
    }

    if (pinData.newPin.length < 4) {
      alert('PIN Baru minimal 4 karakter');
      setIsSaving(false);
      return;
    }

    if (pinData.newPin !== pinData.confirmPin) {
      alert('Konfirmasi PIN tidak cocok!');
      setIsSaving(false);
      return;
    }

    // Simpan PIN Baru
    const success = await saveAdminPin(pinData.newPin);
    if (success) {
        alert('PIN Admin berhasil diubah dan tersimpan di database!');
    } else {
        alert('PIN tersimpan di perangkat lokal, gagal sinkronisasi ke Cloud.');
    }
    
    setPinData({ oldPin: '', newPin: '', confirmPin: '' });
    setShowPinForm(false);
    setIsSaving(false);
  };

  const toggleProductForm = () => {
    if (showProductForm) {
      setEditingId(null);
      setFormData({ id: '', name: '', price: 0, category: 'Teh' });
    }
    setShowProductForm(!showProductForm);
    setShowConfigForm(false);
    setShowPinForm(false);
  };

  return (
    <div className="p-4 pb-24 h-full flex flex-col bg-gray-50 overflow-y-auto no-scrollbar relative">
      {/* Global Saving Overlay */}
      {isSaving && (
          <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center backdrop-blur-sm">
            <div className="bg-white p-4 rounded-xl shadow-xl flex items-center space-x-3">
                <Loader2 className="animate-spin text-blue-600" />
                <span className="font-bold text-gray-700">Memproses...</span>
            </div>
          </div>
      )}

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

      {/* 1. Google Sheet Connection Accordion */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-4 overflow-hidden">
        <button 
          onClick={() => {
            setShowConfigForm(!showConfigForm);
            setShowPinForm(false);
            setShowProductForm(false);
          }}
          className="w-full p-4 flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center text-gray-700 font-bold text-sm">
            <LinkIcon size={16} className="mr-2 text-green-600"/>
            Koneksi Google Sheet
          </div>
          {showConfigForm ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showConfigForm && (
          <div className="p-4 bg-white animate-fade-in border-t border-gray-100">
             <div className="mb-3">
              <label className="text-xs text-gray-600 block mb-1">Web App URL</label>
              <input 
                type="text" 
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/..."
                className="w-full text-xs p-2 border border-gray-300 rounded-lg outline-none focus:border-green-500"
              />
            </div>

            <div className="flex justify-between items-center">
              <button 
                onClick={() => setShowTutorial(!showTutorial)}
                className="text-xs text-blue-600 underline flex items-center"
              >
                {showTutorial ? 'Tutup Tutorial' : 'Cara Pasang Script'} 
                {showTutorial ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
              </button>
              <button 
                onClick={handleSaveConfig}
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center shadow-sm hover:bg-green-700"
              >
                <Check size={14} className="mr-1"/> Simpan
              </button>
            </div>

            {/* Tutorial Section */}
            {showTutorial && (
              <div className="mt-4 bg-gray-50 p-3 rounded-lg border border-gray-200 text-xs text-gray-700 space-y-2 max-h-60 overflow-y-auto">
                <p>1. Buka Google Sheet Anda.</p>
                <p>2. Klik <b>Extensions</b> &gt; <b>Apps Script</b>.</p>
                <p>3. <b>PENTING:</b> Hapus semua kode lama, ganti dengan kode baru ini agar fitur PIN & Data berjalan:</p>
                <div className="relative group">
                  <pre className="bg-gray-800 text-gray-100 p-2 rounded overflow-x-auto text-[10px] font-mono">
                    {appScriptCode}
                  </pre>
                  <button 
                    onClick={() => navigator.clipboard.writeText(appScriptCode)}
                    className="absolute top-1 right-1 bg-white text-gray-800 p-1 rounded opacity-0 group-hover:opacity-100 shadow"
                    title="Copy Code"
                  >
                    <Copy size={12}/>
                  </button>
                </div>
                <p>4. Klik <b>Deploy</b> &gt; <b>New deployment</b>.</p>
                <p>5. Pastikan <i>Who has access</i> diatur ke <b>Anyone</b>.</p>
                <p>6. Klik Deploy, salin <b>Web App URL</b> baru (jika berubah) dan paste di kolom input di atas.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Security Settings Accordion */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-4 overflow-hidden">
        <button 
          onClick={() => {
            setShowPinForm(!showPinForm);
            setShowConfigForm(false);
            setShowProductForm(false);
          }}
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
             <div className="bg-orange-50 p-2 rounded border border-orange-100 mb-2">
                 <p className="text-[10px] text-orange-700">
                    PIN akan tersimpan di Google Sheet (Sheet "Settings"). Jika lupa, Anda bisa mengeceknya langsung di Spreadsheet.
                 </p>
             </div>
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

      {/* 3. Accordion Form Tambah/Edit Produk */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 overflow-hidden relative">
        <button 
          onClick={toggleProductForm}
          className={`w-full p-4 flex justify-between items-center transition-colors ${showProductForm ? 'bg-blue-50' : 'bg-gray-50 hover:bg-gray-100'}`}
        >
          <div className={`flex items-center font-bold text-sm ${editingId ? 'text-blue-600' : 'text-gray-700'}`}>
            {editingId ? <Edit2 size={16} className="mr-2"/> : <Package size={16} className="mr-2 text-blue-500"/>}
            {editingId ? 'Edit Produk' : 'Tambah Produk Baru'}
          </div>
          {showProductForm ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showProductForm && (
          <form onSubmit={handleSaveProduct} className="p-4 bg-white space-y-3 animate-fade-in border-t border-gray-100">
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
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 shadow-md shadow-blue-200 flex justify-center items-center"
              >
                 {isSaving ? "Menyimpan..." : (editingId ? 'Simpan Perubahan' : 'Tambah Produk')}
              </button>
            </div>
          </form>
        )}
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