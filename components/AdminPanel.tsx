
import React, { useState, useEffect } from 'react';
import { Product, UserRole, CupItem } from '../types';
import { fetchProducts, saveProductList } from '../services/productService';
import { getApiUrl, saveApiUrl, fetchAdminPin, fetchCashierPin, fetchCupItems, saveCupList, saveSetting, resetData } from '../services/storageService';
import { Plus, Trash2, Edit2, LogOut, RefreshCw, Loader2, Key, Lock, ChevronDown, ChevronUp, Package, Link as LinkIcon, Coffee, Trash, AlertTriangle, ShieldCheck, User, X } from 'lucide-react';

interface AdminPanelProps {
  onLogout: () => void;
  onRefreshApp: () => Promise<void>;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout, onRefreshApp }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [showConfigForm, setShowConfigForm] = useState(false);
  const [apiUrl, setApiUrl] = useState('');
  const [showTutorial, setShowTutorial] = useState(false);

  const [showProductForm, setShowProductForm] = useState(false);
  const [formData, setFormData] = useState<Product>({ id: '', name: '', price: 0, category: 'Teh' });

  // Security States
  const [showSecurityForm, setShowSecurityForm] = useState(false);
  const [pins, setPins] = useState({ admin: '', cashier: '' });
  const [securityTab, setSecurityTab] = useState<'ADMIN' | 'CASHIER'>('CASHIER');

  // Cup States
  const [showCupForm, setShowCupForm] = useState(false);
  const [cupItems, setCupItems] = useState<CupItem[]>([]);
  const [newCup, setNewCup] = useState({ name: '', stock: '' });

  const [showDangerZone, setShowDangerZone] = useState(false);

  useEffect(() => {
    loadInitialAdminData();
  }, []);

  const loadInitialAdminData = async () => {
    setIsLoading(true);
    const [prodData, cups, aPin, cPin] = await Promise.all([
      fetchProducts(),
      fetchCupItems(),
      fetchAdminPin(),
      fetchCashierPin()
    ]);
    setProducts(prodData);
    setCupItems(cups);
    setPins({ admin: aPin, cashier: cPin });
    setApiUrl(getApiUrl());
    setIsLoading(false);
  };

  const handleSaveConfig = async () => {
    if (!apiUrl.trim()) return alert('Masukkan URL Web App!');
    setIsSaving(true);
    try {
      saveApiUrl(apiUrl);
      await onRefreshApp();
      await loadInitialAdminData();
      alert('Konfigurasi disimpan!');
      setShowConfigForm(false);
    } catch (error) { alert('Gagal memperbarui data.'); }
    finally { setIsSaving(false); }
  };

  const handleAddCup = async () => {
    if (!newCup.name.trim() || !newCup.stock) return alert('Nama dan stok wajib diisi!');
    setIsSaving(true);
    const updatedCups = [...cupItems, { 
      id: Date.now().toString(), 
      name: newCup.name, 
      stock: parseInt(newCup.stock) 
    }];
    const success = await saveCupList(updatedCups);
    if (success) {
      setCupItems(updatedCups);
      setNewCup({ name: '', stock: '' });
    } else alert('Gagal simpan ke cloud.');
    setIsSaving(false);
  };

  const handleDeleteCup = async (id: string) => {
    if (!confirm('Hapus jenis cup ini?')) return;
    setIsSaving(true);
    const updatedCups = cupItems.filter(c => c.id !== id);
    const success = await saveCupList(updatedCups);
    if (success) setCupItems(updatedCups);
    setIsSaving(false);
  };

  const handleUpdatePin = async () => {
    const targetKey = securityTab === 'ADMIN' ? 'ADMIN_PIN' : 'CASHIER_PIN';
    const targetValue = securityTab === 'ADMIN' ? pins.admin : pins.cashier;
    if (!targetValue || targetValue.length < 4) return alert('PIN minimal 4 digit!');
    setIsSaving(true);
    const success = await saveSetting(targetKey as any, targetValue);
    if (success) {
      alert(`PIN ${securityTab} berhasil diperbarui!`);
      setShowSecurityForm(false);
    } else alert('Gagal memperbarui PIN ke cloud.');
    setIsSaving(false);
  };

  const handleReset = async (type: 'sales' | 'purchases') => {
    const confirmMsg = type === 'sales' ? 'HAPUS SEMUA DATA PENJUALAN?' : 'HAPUS SEMUA DATA PEMBELIAN?';
    if (!window.confirm(confirmMsg)) return;
    if (!window.confirm('PERINGATAN AKHIR: Data di Google Sheet akan dikosongkan secara permanen. Lanjutkan?')) return;

    setIsSaving(true);
    try {
      const success = await resetData(type);
      if (success) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        await onRefreshApp();
        alert(`Data ${type === 'sales' ? 'Penjualan' : 'Pembelian'} berhasil dibersihkan!`);
      } else {
        alert('Gagal me-reset Cloud.');
      }
    } catch (error) {
      console.error(error);
      alert('Terjadi kesalahan sinkronisasi.');
    } finally {
      setIsSaving(false);
    }
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

  var sheetName = type === 'purchases' ? 'Purchases' : (type === 'products' ? 'Products' : (type === 'cups' ? 'Cups' : 'Transactions'));
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    if(type === 'purchases') sheet.appendRow(['ID', 'Date', 'Item Name', 'Supplier', 'Qty', 'Price', 'Total']);
    else if (type === 'products') sheet.appendRow(['ID', 'Name', 'Price', 'Category']);
    else if (type === 'cups') sheet.appendRow(['ID', 'Name', 'Stock']);
    else sheet.appendRow(['ID', 'Date', 'Product', 'Category', 'Qty', 'Price', 'Total', 'Payment Method']);
  }

  var data = sheet.getDataRange().getValues();
  if (data.length > 0) data.shift(); // Remove header
  return ContentService.createTextOutput(JSON.stringify({status: 'success', data: data})).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var payload = JSON.parse(e.postData.contents);
    var action = payload.action; 
    
    // UPDATE SETTING
    if (action === 'update_setting') {
      var sheet = ss.getSheetByName('Settings');
      if (!sheet) sheet = ss.insertSheet('Settings');
      var data = sheet.getDataRange().getValues();
      var found = false;
      for(var i=0; i<data.length; i++) {
        if(data[i][0] === payload.key) {
           sheet.getRange(i+1, 2).setValue(payload.value);
           found = true; break;
        }
      }
      if(!found) sheet.appendRow([payload.key, payload.value]);
      return ContentService.createTextOutput(JSON.stringify({status: 'success'})).setMimeType(ContentService.MimeType.JSON);
    }

    // UPDATE CUPS (SHEET MANDIRI)
    if (action === 'update_cups') {
      var sheet = ss.getSheetByName('Cups');
      if (!sheet) sheet = ss.insertSheet('Cups');
      sheet.clear();
      sheet.appendRow(['ID', 'Name', 'Stock']);
      if (payload.data && payload.data.length > 0) sheet.getRange(2, 1, payload.data.length, payload.data[0].length).setValues(payload.data);
      return ContentService.createTextOutput(JSON.stringify({status: 'success'})).setMimeType(ContentService.MimeType.JSON);
    }

    // RESET DATA
    if (action === 'reset_data') {
      var sheetName = (payload.type === 'purchases') ? 'Purchases' : 'Transactions';
      var sheet = ss.getSheetByName(sheetName);
      if (sheet) {
        var lr = sheet.getLastRow();
        if (lr > 1) {
          sheet.deleteRows(2, lr - 1);
          SpreadsheetApp.flush();
        }
      }
      return ContentService.createTextOutput(JSON.stringify({status: 'success'})).setMimeType(ContentService.MimeType.JSON);
    }

    // UPDATE PRODUCTS
    if (action === 'update_products') {
      var sheet = ss.getSheetByName('Products');
      if (!sheet) sheet = ss.insertSheet('Products');
      sheet.clear();
      sheet.appendRow(['ID', 'Name', 'Price', 'Category']);
      if (payload.data && payload.data.length > 0) sheet.getRange(2, 1, payload.data.length, payload.data[0].length).setValues(payload.data);
      return ContentService.createTextOutput(JSON.stringify({status: 'success'})).setMimeType(ContentService.MimeType.JSON);
    }

    // ADD RECORD
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

  return (
    <div className="p-4 pb-24 h-full flex flex-col bg-gray-50 overflow-y-auto no-scrollbar relative">
      {isSaving && (
          <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center backdrop-blur-sm">
            <div className="bg-white p-4 rounded-xl shadow-xl flex items-center space-x-3">
                <Loader2 className="animate-spin text-blue-600" />
                <span className="font-bold text-gray-700">Sinkronisasi Cloud...</span>
            </div>
          </div>
      )}

      <header className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Admin Panel</h1>
          <p className="text-gray-500 text-sm">Kelola Toko & Inventori</p>
        </div>
        <button onClick={onLogout} className="p-2 bg-red-50 text-red-600 rounded-lg"><LogOut size={20} /></button>
      </header>

      {/* 1. Google Sheet Connection */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-4 overflow-hidden">
        <button onClick={() => setShowConfigForm(!showConfigForm)} className="w-full p-4 flex justify-between items-center bg-gray-50">
          <div className="flex items-center text-gray-700 font-bold text-sm"><LinkIcon size={16} className="mr-2 text-green-600"/> Koneksi Cloud</div>
          {showConfigForm ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {showConfigForm && (
          <div className="p-4 border-t border-gray-100">
             <input type="text" value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} placeholder="Web App URL" className="w-full text-xs p-2 border border-gray-300 rounded-lg mb-3 outline-none"/>
             <div className="flex justify-between items-center">
                <button onClick={() => setShowTutorial(!showTutorial)} className="text-xs text-blue-600 underline">Tutorial Script Baru</button>
                <button onClick={handleSaveConfig} className="bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-bold">Simpan</button>
             </div>
             {showTutorial && (
              <div className="mt-4 bg-gray-50 p-3 rounded-lg border text-[10px] space-y-2 overflow-x-auto">
                <p className="font-bold text-red-600 mb-2 underline">WAJIB: Timpa kode lama di Apps Script untuk mendukung Sheet 'Cups' terpisah:</p>
                <pre className="bg-gray-800 text-gray-100 p-2 rounded">{appScriptCode}</pre>
                <button onClick={() => {
                  navigator.clipboard.writeText(appScriptCode);
                  alert('Kode baru berhasil disalin!');
                }} className="text-blue-600 font-bold mt-2">Salin Kode</button>
              </div>
             )}
          </div>
        )}
      </div>

      {/* 2. Keamanan PIN */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-4 overflow-hidden">
        <button onClick={() => setShowSecurityForm(!showSecurityForm)} className="w-full p-4 flex justify-between items-center bg-gray-50">
          <div className="flex items-center text-gray-700 font-bold text-sm"><ShieldCheck size={16} className="mr-2 text-purple-600"/> Keamanan & PIN</div>
          {showSecurityForm ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {showSecurityForm && (
          <div className="p-4 border-t border-gray-100 space-y-4">
             <div className="flex p-1 bg-gray-100 rounded-lg mb-2">
                <button onClick={() => setSecurityTab('CASHIER')} className={`flex-1 py-1.5 text-[10px] font-bold rounded-md ${securityTab === 'CASHIER' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500'}`}>PIN Kasir</button>
                <button onClick={() => setSecurityTab('ADMIN')} className={`flex-1 py-1.5 text-[10px] font-bold rounded-md ${securityTab === 'ADMIN' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500'}`}>PIN Admin</button>
             </div>
             <div className="space-y-2">
                <div className="relative">
                  <input type="password" inputMode="numeric" value={securityTab === 'ADMIN' ? pins.admin : pins.cashier} onChange={(e) => setPins({...pins, [securityTab.toLowerCase()]: e.target.value})} className="w-full border-b border-gray-200 py-2 pl-8 outline-none text-sm font-bold tracking-widest" placeholder="Minimal 4 Angka"/>
                  <Lock size={14} className="absolute left-1 top-3 text-gray-300" />
                </div>
                <button onClick={handleUpdatePin} className="w-full bg-purple-600 text-white py-2 rounded-lg text-xs font-bold shadow-md shadow-purple-100">Update PIN {securityTab}</button>
             </div>
          </div>
        )}
      </div>

      {/* 3. Kelola Cup (Database Sheet) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-4 overflow-hidden">
        <button onClick={() => setShowCupForm(!showCupForm)} className="w-full p-4 flex justify-between items-center bg-gray-50">
          <div className="flex items-center text-gray-700 font-bold text-sm"><Coffee size={16} className="mr-2 text-blue-500"/> Stok Cup (Database)</div>
          {showCupForm ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {showCupForm && (
          <div className="p-4 border-t border-gray-100 space-y-4">
             <div className="bg-blue-50 p-3 rounded-lg space-y-2 border border-blue-100">
                <p className="text-[10px] font-bold text-blue-700 uppercase">Tambah Jenis Cup</p>
                <div className="grid grid-cols-2 gap-2">
                   <input type="text" placeholder="Nama Cup" value={newCup.name} onChange={e => setNewCup({...newCup, name: e.target.value})} className="bg-white border-b border-blue-200 px-2 py-1 text-xs outline-none" />
                   <input type="number" placeholder="Stok" value={newCup.stock} onChange={e => setNewCup({...newCup, stock: e.target.value})} className="bg-white border-b border-blue-200 px-2 py-1 text-xs outline-none" />
                </div>
                <button onClick={handleAddCup} className="w-full bg-blue-600 text-white py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center"><Plus size={12} className="mr-1"/> Tambah Cup</button>
             </div>

             <div className="space-y-2">
                {cupItems.length === 0 ? <p className="text-center text-[10px] text-gray-400 py-2">Belum ada jenis cup.</p> : cupItems.map(cup => (
                   <div key={cup.id} className="flex justify-between items-center p-2 rounded-lg border border-gray-50 bg-gray-50">
                      <div>
                         <div className="text-xs font-bold text-gray-800">{cup.name}</div>
                         <div className={`text-[10px] font-bold ${cup.stock < 10 ? 'text-red-600' : 'text-blue-600'}`}>Sisa: {cup.stock}</div>
                      </div>
                      <button onClick={() => handleDeleteCup(cup.id)} className="text-red-500 p-1 hover:bg-red-50 rounded"><Trash2 size={14}/></button>
                   </div>
                ))}
             </div>
          </div>
        )}
      </div>

      {/* 4. Zona Bahaya */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-4 overflow-hidden">
        <button onClick={() => setShowDangerZone(!showDangerZone)} className="w-full p-4 flex justify-between items-center bg-red-50 text-red-700">
          <div className="flex items-center font-bold text-sm"><AlertTriangle size={16} className="mr-2"/> Zona Bahaya</div>
          {showDangerZone ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {showDangerZone && (
          <div className="p-4 border-t border-red-100 space-y-3">
             <button 
                onClick={() => handleReset('sales')} 
                disabled={isSaving}
                className="w-full flex items-center justify-center space-x-2 py-3 border border-red-200 text-red-600 rounded-xl text-xs font-bold active:bg-red-50 transition-colors"
             >
                <Trash size={14} /> <span>Kosongkan Lembar Penjualan</span>
             </button>
             <button 
                onClick={() => handleReset('purchases')} 
                disabled={isSaving}
                className="w-full flex items-center justify-center space-x-2 py-3 border border-red-200 text-red-600 rounded-xl text-xs font-bold active:bg-red-50 transition-colors"
             >
                <Trash size={14} /> <span>Kosongkan Lembar Pembelian</span>
             </button>
          </div>
        )}
      </div>

      {/* 5. Product Management */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
        <button onClick={() => setShowProductForm(!showProductForm)} className="w-full p-4 flex justify-between items-center bg-gray-50">
          <div className="flex items-center text-gray-700 font-bold text-sm"><Package size={16} className="mr-2 text-orange-500"/> Kelola Produk</div>
          {showProductForm ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {showProductForm && (
          <form onSubmit={async (e) => {
            e.preventDefault();
            setIsSaving(true);
            const newItem = { ...formData, id: editingId || Date.now().toString() };
            const updatedList = editingId ? products.map(p => p.id === editingId ? newItem : p) : [...products, newItem];
            setProducts(updatedList);
            await saveProductList(updatedList);
            setEditingId(null); setFormData({ id: '', name: '', price: 0, category: 'Teh' });
            setShowProductForm(false); setIsSaving(false);
          }} className="p-4 bg-white space-y-3 border-t border-gray-100">
            <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border-b py-1 outline-none text-sm" placeholder="Nama Produk" required />
            <div className="grid grid-cols-2 gap-4">
              <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full border-b py-1 outline-none text-sm">
                <option value="Teh">Teh</option><option value="Kopi">Kopi</option><option value="Susu">Susu</option><option value="Coklat">Coklat</option><option value="Makanan">Makanan</option><option value="Lainnya">Lainnya</option>
              </select>
              <input type="number" value={formData.price || ''} onChange={e => setFormData({...formData, price: parseInt(e.target.value) || 0})} className="w-full border-b py-1 outline-none text-sm" placeholder="Harga (Rp)" required />
            </div>
            <div className="flex space-x-2 pt-2">
              <button type="button" onClick={() => setShowProductForm(false)} className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm">Batal</button>
              <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold">{editingId ? 'Simpan' : 'Tambah'}</button>
            </div>
          </form>
        )}
      </div>

      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col min-h-[300px]">
        <div className="p-3 border-b bg-gray-50 flex justify-between items-center text-xs text-gray-500 font-bold uppercase tracking-wider">Daftar Menu ({products.length})</div>
        <div className="overflow-y-auto flex-1 p-2 space-y-2">
          {products.map(product => (
            <div key={product.id} className="flex justify-between items-center p-3 rounded-lg border border-gray-100">
              <div><div className="font-bold text-gray-800 text-sm">{product.name}</div><div className="text-[10px] text-gray-500">{product.category} • Rp {product.price.toLocaleString('id-ID')}</div></div>
              <div className="flex space-x-2">
                <button onClick={() => { setEditingId(product.id); setFormData(product); setShowProductForm(true); }} className="p-2 text-blue-600 bg-blue-50 rounded-lg"><Edit2 size={16} /></button>
                <button onClick={async () => { if (confirm('Hapus produk?')) { const updated = products.filter(p => p.id !== product.id); setProducts(updated); await saveProductList(updated); } }} className="p-2 text-red-600 bg-red-50 rounded-lg"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
