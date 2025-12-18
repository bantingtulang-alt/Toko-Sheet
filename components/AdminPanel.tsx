import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { fetchProducts, saveProductList } from '../services/productService';
import { getApiUrl, saveApiUrl, fetchAdminPin, fetchCashierPin, saveSetting } from '../services/storageService';
import { Plus, Trash2, Edit2, LogOut, RefreshCw, Loader2, Key, Lock, ChevronDown, ChevronUp, Package, Link as LinkIcon, Check, Copy, User } from 'lucide-react';

interface AdminPanelProps {
  onLogout: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [showConfigForm, setShowConfigForm] = useState(false);
  const [apiUrl, setApiUrl] = useState('');
  const [showTutorial, setShowTutorial] = useState(false);

  const [showProductForm, setShowProductForm] = useState(false);
  const [formData, setFormData] = useState<Product>({
    id: '',
    name: '',
    price: 0,
    category: 'Teh'
  });

  const [showPinForm, setShowPinForm] = useState(false);
  const [pinData, setPinData] = useState({
    oldPin: '',
    newPin: '',
    confirmPin: ''
  });

  const [showCashierPinForm, setShowCashierPinForm] = useState(false);
  const [cashierPinData, setCashierPinData] = useState({
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

  const handleSaveConfig = () => {
    saveApiUrl(apiUrl);
    alert('Konfigurasi berhasil disimpan.');
    setShowConfigForm(false);
  };

  const appScriptCode = `
function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var type = e.parameter.type || 'sales';
  
  if (type === 'settings') {
     var sheet = ss.getSheetByName('Settings');
     if (!sheet) {
        sheet = ss.insertSheet('Settings');
        sheet.appendRow(['Key', 'Value']);
        sheet.appendRow(['ADMIN_PIN', '1234']);
        sheet.appendRow(['CASHIER_PIN', '0000']);
     }
     var data = sheet.getDataRange().getValues();
     var settings = { adminPin: '1234', cashierPin: '0000' };
     for(var i=0; i<data.length; i++) {
        if(data[i][0] === 'ADMIN_PIN') settings.adminPin = data[i][1];
        if(data[i][0] === 'CASHIER_PIN') settings.cashierPin = data[i][1];
     }
     return ContentService.createTextOutput(JSON.stringify({status: 'success', adminPin: settings.adminPin, cashierPin: settings.cashierPin}))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var sheetName = 'Transactions';
  if (type === 'purchases') sheetName = 'Purchases';
  if (type === 'products') sheetName = 'Products';

  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    if(type === 'purchases') sheet.appendRow(['ID', 'Date', 'Item Name', 'Supplier', 'Qty', 'Price', 'Total']);
    else if (type === 'products') sheet.appendRow(['ID', 'Name', 'Price', 'Category']);
    else sheet.appendRow(['ID', 'Date', 'Product', 'Category', 'Qty', 'Price', 'Total', 'Payment Method']);
  }

  var data = sheet.getDataRange().getValues();
  if (data.length > 0) data.shift();
  return ContentService.createTextOutput(JSON.stringify({status: 'success', data: data})).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var payload = JSON.parse(e.postData.contents);
    var action = payload.action; 
    
    if (action === 'update_setting') {
      var sheet = ss.getSheetByName('Settings');
      if (!sheet) {
         sheet = ss.insertSheet('Settings');
         sheet.appendRow(['Key', 'Value']);
      }
      var data = sheet.getDataRange().getValues();
      var found = false;
      for(var i=0; i<data.length; i++) {
        if(data[i][0] === payload.key) {
           sheet.getRange(i+1, 2).setValue(payload.value);
           found = true;
           break;
        }
      }
      if(!found) sheet.appendRow([payload.key, payload.value]);
      return ContentService.createTextOutput(JSON.stringify({status: 'success'})).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'update_products') {
      var sheet = ss.getSheetByName('Products');
      if (!sheet) {
        sheet = ss.insertSheet('Products');
        sheet.appendRow(['ID', 'Name', 'Price', 'Category']);
      } else {
        sheet.clear(); 
        sheet.appendRow(['ID', 'Name', 'Price', 'Category']);
      }
      if (payload.data && payload.data.length > 0) sheet.getRange(2, 1, payload.data.length, payload.data[0].length).setValues(payload.data);
      return ContentService.createTextOutput(JSON.stringify({status: 'success'})).setMimeType(ContentService.MimeType.JSON);
    }

    var sheetName = (action === 'add_purchase') ? 'Purchases' : 'Transactions';
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
       sheet = ss.insertSheet(sheetName);
       if(action === 'add_purchase') sheet.appendRow(['ID', 'Date', 'Item Name', 'Supplier', 'Qty', 'Price', 'Total']);
       else sheet.appendRow(['ID', 'Date', 'Product', 'Category', 'Qty', 'Price', 'Total', 'Payment Method']);
    }
    if (payload.data) sheet.appendRow(payload.data);
    return ContentService.createTextOutput(JSON.stringify({status: 'success'})).setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({status: 'error', message: err.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}
  `.trim();

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setFormData(product);
    setShowProductForm(true); 
    setShowPinForm(false);
    setShowConfigForm(false);
    setShowCashierPinForm(false);
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({ id: '', name: '', price: 0, category: 'Teh' });
    setShowProductForm(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Hapus produk ini?')) {
      setIsSaving(true);
      const updatedList = products.filter(p => p.id !== id);
      setProducts(updatedList);
      await saveProductList(updatedList);
      if (editingId === id) handleCancel();
      setIsSaving(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || formData.price <= 0) return;
    setIsSaving(true);
    const newItem = { ...formData, id: editingId || Date.now().toString() };
    const updatedList = editingId ? products.map(p => p.id === editingId ? newItem : p) : [...products, newItem];
    setProducts(updatedList);
    await saveProductList(updatedList);
    handleCancel();
    setIsSaving(false);
  };

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const currentStoredPin = await fetchAdminPin();
    if (pinData.oldPin !== currentStoredPin) {
      alert('PIN Lama salah!');
      setIsSaving(false);
      return;
    }
    if (pinData.newPin.length < 4) {
      alert('PIN Baru minimal 4 angka');
      setIsSaving(false);
      return;
    }
    if (pinData.newPin !== pinData.confirmPin) {
      alert('Konfirmasi PIN tidak cocok!');
      setIsSaving(false);
      return;
    }
    await saveSetting('ADMIN_PIN', pinData.newPin);
    alert('PIN Admin berhasil diubah!');
    setPinData({ oldPin: '', newPin: '', confirmPin: '' });
    setShowPinForm(false);
    setIsSaving(false);
  };

  const handleChangeCashierPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    if (cashierPinData.newPin.length < 4) {
      alert('PIN Baru minimal 4 angka');
      setIsSaving(false);
      return;
    }
    if (cashierPinData.newPin !== cashierPinData.confirmPin) {
      alert('Konfirmasi PIN tidak cocok!');
      setIsSaving(false);
      return;
    }
    await saveSetting('CASHIER_PIN', cashierPinData.newPin);
    alert('PIN Kasir berhasil diperbarui!');
    setCashierPinData({ newPin: '', confirmPin: '' });
    setShowCashierPinForm(false);
    setIsSaving(false);
  };

  return (
    <div className="p-4 pb-24 h-full flex flex-col bg-gray-50 overflow-y-auto no-scrollbar relative">
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
          <p className="text-gray-500 text-sm">Kelola Produk & Keamanan</p>
        </div>
        <button onClick={onLogout} className="p-2 bg-red-50 text-red-600 rounded-lg"><LogOut size={20} /></button>
      </header>

      {/* 1. Google Sheet Connection */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-4 overflow-hidden">
        <button onClick={() => { setShowConfigForm(!showConfigForm); setShowPinForm(false); setShowCashierPinForm(false); setShowProductForm(false); }} className="w-full p-4 flex justify-between items-center bg-gray-50">
          <div className="flex items-center text-gray-700 font-bold text-sm"><LinkIcon size={16} className="mr-2 text-green-600"/> Koneksi Google Sheet</div>
          {showConfigForm ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {showConfigForm && (
          <div className="p-4 border-t border-gray-100">
             <input type="text" value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} placeholder="Web App URL" className="w-full text-xs p-2 border border-gray-300 rounded-lg mb-3 outline-none"/>
             <div className="flex justify-between items-center">
                <button onClick={() => setShowTutorial(!showTutorial)} className="text-xs text-blue-600 underline">Tutorial Script</button>
                <button onClick={handleSaveConfig} className="bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-bold">Simpan</button>
             </div>
             {showTutorial && (
              <div className="mt-4 bg-gray-50 p-3 rounded-lg border text-[10px] space-y-2 overflow-x-auto">
                <p>Ganti kode di Apps Script Anda dengan kode ini (Mendukung Multi-PIN):</p>
                <pre className="bg-gray-800 text-gray-100 p-2 rounded">{appScriptCode}</pre>
                <button onClick={() => navigator.clipboard.writeText(appScriptCode)} className="text-blue-600 font-bold">Salin Kode</button>
              </div>
             )}
          </div>
        )}
      </div>

      {/* 2. Admin Security */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-4 overflow-hidden">
        <button onClick={() => { setShowPinForm(!showPinForm); setShowConfigForm(false); setShowCashierPinForm(false); setShowProductForm(false); }} className="w-full p-4 flex justify-between items-center bg-gray-50">
          <div className="flex items-center text-gray-700 font-bold text-sm"><Key size={16} className="mr-2 text-orange-500"/> Keamanan Admin</div>
          {showPinForm ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {showPinForm && (
          <form onSubmit={handleChangePin} className="p-4 space-y-3 animate-fade-in border-t border-gray-100">
            <input type="password" value={pinData.oldPin} onChange={(e) => setPinData({...pinData, oldPin: e.target.value})} className="w-full border-b py-2 text-sm outline-none" placeholder="PIN Admin Lama" required />
            <div className="grid grid-cols-2 gap-4">
              <input type="number" value={pinData.newPin} onChange={(e) => setPinData({...pinData, newPin: e.target.value})} className="w-full border-b py-2 text-sm outline-none" placeholder="PIN Baru" required />
              <input type="number" value={pinData.confirmPin} onChange={(e) => setPinData({...pinData, confirmPin: e.target.value})} className="w-full border-b py-2 text-sm outline-none" placeholder="Konfirmasi" required />
            </div>
            <button type="submit" className="w-full bg-orange-500 text-white py-2 rounded-lg text-xs font-bold">Update PIN Admin</button>
          </form>
        )}
      </div>

      {/* 3. Cashier Security */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-4 overflow-hidden">
        <button onClick={() => { setShowCashierPinForm(!showCashierPinForm); setShowConfigForm(false); setShowPinForm(false); setShowProductForm(false); }} className="w-full p-4 flex justify-between items-center bg-gray-50">
          <div className="flex items-center text-gray-700 font-bold text-sm"><User size={16} className="mr-2 text-blue-500"/> Keamanan Kasir</div>
          {showCashierPinForm ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {showCashierPinForm && (
          <form onSubmit={handleChangeCashierPin} className="p-4 space-y-3 animate-fade-in border-t border-gray-100">
            <div className="bg-blue-50 p-2 rounded text-[10px] text-blue-700 mb-2 font-medium">PIN Kasir digunakan saat masuk aplikasi. Admin bisa mengubahnya langsung di sini (4 angka minimal).</div>
            <div className="grid grid-cols-2 gap-4">
              <input type="number" value={cashierPinData.newPin} onChange={(e) => setCashierPinData({...cashierPinData, newPin: e.target.value})} className="w-full border-b py-2 text-sm outline-none" placeholder="PIN Kasir Baru" required />
              <input type="number" value={cashierPinData.confirmPin} onChange={(e) => setCashierPinData({...cashierPinData, confirmPin: e.target.value})} className="w-full border-b py-2 text-sm outline-none" placeholder="Konfirmasi" required />
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg text-xs font-bold">Simpan PIN Kasir</button>
          </form>
        )}
      </div>

      {/* 4. Product Management */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
        <button onClick={() => { setShowProductForm(!showProductForm); setShowConfigForm(false); setShowPinForm(false); setShowCashierPinForm(false); }} className="w-full p-4 flex justify-between items-center bg-gray-50">
          <div className="flex items-center text-gray-700 font-bold text-sm"><Package size={16} className="mr-2 text-blue-500"/> Kelola Produk</div>
          {showProductForm ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {showProductForm && (
          <form onSubmit={handleSaveProduct} className="p-4 bg-white space-y-3 border-t border-gray-100">
            <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border-b py-1 outline-none text-sm" placeholder="Nama Produk" required />
            <div className="grid grid-cols-2 gap-4">
              <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full border-b py-1 outline-none text-sm">
                <option value="Teh">Teh</option><option value="Kopi">Kopi</option><option value="Susu">Susu</option><option value="Coklat">Coklat</option><option value="Makanan">Makanan</option><option value="Lainnya">Lainnya</option>
              </select>
              <input type="number" value={formData.price || ''} onChange={e => setFormData({...formData, price: parseInt(e.target.value) || 0})} className="w-full border-b py-1 outline-none text-sm" placeholder="Harga (Rp)" required />
            </div>
            <div className="flex space-x-2 pt-2">
              <button type="button" onClick={handleCancel} className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm">Batal</button>
              <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold">{editingId ? 'Simpan' : 'Tambah'}</button>
            </div>
          </form>
        )}
      </div>

      {/* Product List */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col min-h-[300px]">
        <div className="p-3 border-b bg-gray-50 flex justify-between items-center text-xs text-gray-500 font-bold uppercase tracking-wider">Daftar Menu ({products.length})</div>
        <div className="overflow-y-auto flex-1 p-2 space-y-2">
          {isLoading ? <div className="text-center py-10 text-gray-400 text-xs">Memuat...</div> : (
            products.map(product => (
              <div key={product.id} className="flex justify-between items-center p-3 rounded-lg border border-gray-100">
                <div><div className="font-bold text-gray-800 text-sm">{product.name}</div><div className="text-[10px] text-gray-500">{product.category} • Rp {product.price.toLocaleString('id-ID')}</div></div>
                <div className="flex space-x-2">
                  <button onClick={() => handleEdit(product)} className="p-2 text-blue-600 bg-blue-50 rounded-lg"><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(product.id)} className="p-2 text-red-600 bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;