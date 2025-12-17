import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, Purchase } from '../types';
import { Settings, Check, Link as LinkIcon, AlertCircle, Copy, ChevronDown, ChevronUp, RefreshCw, Search, Calculator, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { getApiUrl, saveApiUrl } from '../services/storageService';

interface SheetViewProps {
  transactions: Transaction[];
  purchases: Purchase[];
  onReload: () => void;
}

const SheetView: React.FC<SheetViewProps> = ({ transactions, purchases, onReload }) => {
  const [showConfig, setShowConfig] = useState(false);
  const [apiUrl, setApiUrl] = useState('');
  const [showTutorial, setShowTutorial] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'sales' | 'purchases'>('sales');

  useEffect(() => {
    setApiUrl(getApiUrl());
  }, []);

  const handleSaveConfig = () => {
    saveApiUrl(apiUrl);
    setShowConfig(false);
    handleReload();
  };

  const handleReload = async () => {
    setIsRefreshing(true);
    await onReload();
    setIsRefreshing(false);
  };

  // Filter Logic
  const filteredData = useMemo(() => {
    const lower = searchTerm.toLowerCase();
    
    if (viewMode === 'sales') {
      if (!searchTerm) return transactions;
      return transactions.filter(t => 
        t.productName.toLowerCase().includes(lower) || 
        t.category.toLowerCase().includes(lower) ||
        t.id.toLowerCase().includes(lower) ||
        t.paymentMethod?.toLowerCase().includes(lower)
      );
    } else {
      if (!searchTerm) return purchases;
      return purchases.filter(p => 
        p.itemName.toLowerCase().includes(lower) || 
        p.supplier.toLowerCase().includes(lower) ||
        p.id.toLowerCase().includes(lower)
      );
    }
  }, [transactions, purchases, searchTerm, viewMode]);

  // Calculate Totals
  const totalAmount = filteredData.reduce((acc, item) => acc + item.total, 0);
  const totalQty = filteredData.reduce((acc, item) => acc + item.quantity, 0);

  const appScriptCode = `
function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var type = e.parameter.type || 'sales';
  
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

  return (
    <div className="p-4 pb-24 h-screen flex flex-col">
      <header className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Database</h1>
            <p className="text-gray-500 text-sm">
              {getApiUrl() ? 'Terhubung ke Google Sheet' : 'Penyimpanan Lokal'}
            </p>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={handleReload}
              className={`p-2 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all ${isRefreshing ? 'animate-spin' : ''}`}
              title="Refresh Data"
            >
              <RefreshCw size={20} />
            </button>
            <button 
              onClick={() => setShowConfig(!showConfig)}
              className={`p-2 rounded-full ${showConfig ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}
            >
              <Settings size={20} />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-3">
          <input
            type="text"
            placeholder={viewMode === 'sales' ? "Cari produk, kategori, metode..." : "Cari item belanja atau supplier..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
        </div>

        {/* View Switcher */}
        <div className="flex p-1 bg-gray-200 rounded-lg">
          <button
            onClick={() => setViewMode('sales')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-md flex items-center justify-center transition-all ${viewMode === 'sales' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
          >
            <ArrowUpRight size={14} className="mr-1"/> Penjualan
          </button>
          <button
            onClick={() => setViewMode('purchases')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-md flex items-center justify-center transition-all ${viewMode === 'purchases' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500'}`}
          >
            <ArrowDownLeft size={14} className="mr-1"/> Pembelian
          </button>
        </div>
      </header>

      {/* Configuration Panel */}
      {showConfig && (
        <div className="bg-white border border-blue-100 rounded-xl p-4 shadow-lg mb-4 animate-fade-in z-10 relative">
          <h3 className="font-bold text-gray-800 mb-2 flex items-center">
            <LinkIcon size={16} className="mr-2 text-blue-600"/> Koneksi Google Sheet
          </h3>
          
          <div className="mb-3">
            <label className="text-xs text-gray-600 block mb-1">Web App URL</label>
            <input 
              type="text" 
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/..."
              className="w-full text-xs p-2 border rounded-lg"
            />
          </div>

          <div className="flex justify-between items-center">
             <button 
              onClick={() => setShowTutorial(!showTutorial)}
              className="text-xs text-blue-600 underline flex items-center"
             >
               {showTutorial ? 'Tutup Tutorial' : 'Cara Pasang Script (Updated)'} 
               {showTutorial ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
             </button>
             <button 
              onClick={handleSaveConfig}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center"
            >
              <Check size={14} className="mr-1"/> Simpan
            </button>
          </div>

          {/* Tutorial Section */}
          {showTutorial && (
            <div className="mt-3 bg-gray-50 p-3 rounded-lg border border-gray-200 text-xs text-gray-700 space-y-2 max-h-60 overflow-y-auto">
              <p>1. Buka Google Sheet Anda.</p>
              <p>2. Klik <b>Extensions</b> &gt; <b>Apps Script</b>.</p>
              <p>3. <b>PENTING:</b> Hapus semua kode lama, ganti dengan kode baru ini agar fitur Pembelian berjalan:</p>
              <div className="relative group">
                <pre className="bg-gray-800 text-gray-100 p-2 rounded overflow-x-auto text-[10px]">
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
              <p>6. Klik Deploy, salin <b>Web App URL</b> baru (jika berubah) dan simpan.</p>
              <p className="text-orange-600 italic">Script ini otomatis membuat sheet 'Purchases' saat Anda input pembelian pertama.</p>
            </div>
          )}
        </div>
      )}

      {/* Data Table */}
      <div className="flex-1 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto overflow-y-auto flex-1 relative">
          <table className="min-w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-100 text-gray-600 font-medium border-b border-gray-200 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3">{viewMode === 'sales' ? 'Produk' : 'Item Belanja'}</th>
                <th className="px-4 py-3">{viewMode === 'sales' ? 'Kategori' : 'Supplier'}</th>
                {viewMode === 'sales' && <th className="px-4 py-3">Metode</th>}
                <th className="px-4 py-3 text-right">Qty</th>
                <th className="px-4 py-3 text-right">Harga</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={viewMode === 'sales' ? 7 : 6} className="px-4 py-8 text-center text-gray-400">
                    {viewMode === 'sales' && transactions.length === 0 && "Belum ada penjualan."}
                    {viewMode === 'purchases' && purchases.length === 0 && "Belum ada pembelian."}
                    {(filteredData.length === 0 && (transactions.length > 0 || purchases.length > 0)) && "Data tidak ditemukan."}
                  </td>
                </tr>
              ) : (
                filteredData.map((item: any) => (
                  <tr key={item.id} className={`transition-colors ${viewMode === 'sales' ? 'hover:bg-blue-50' : 'hover:bg-orange-50'}`}>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      <div>{new Date(item.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</div>
                      <div className="text-[10px] text-gray-400">
                        {new Date(item.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {viewMode === 'sales' ? item.productName : item.itemName}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${viewMode === 'sales' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                        {viewMode === 'sales' ? item.category : item.supplier}
                      </span>
                    </td>
                    {viewMode === 'sales' && (
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 border rounded text-[10px] font-medium bg-gray-50 text-gray-600">
                          {item.paymentMethod || 'Cash'}
                        </span>
                      </td>
                    )}
                    <td className="px-4 py-3 text-right text-gray-600">{item.quantity}</td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {item.price.toLocaleString('id-ID')}
                    </td>
                    <td className={`px-4 py-3 text-right font-bold ${viewMode === 'sales' ? 'text-blue-600' : 'text-orange-600'}`}>
                      {item.total.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer Summary */}
        <div className="bg-gray-50 border-t border-gray-200 text-sm font-medium p-3 flex justify-between items-center z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
            <div className="flex items-center space-x-2 text-gray-600">
                <Calculator size={16} />
                <span>Total {viewMode === 'sales' ? 'Masuk' : 'Keluar'}:</span>
            </div>
            <div className="text-right">
                <div className={`${viewMode === 'sales' ? 'text-blue-600' : 'text-orange-600'} font-bold`}>
                  Rp {totalAmount.toLocaleString('id-ID')}
                </div>
                <div className="text-xs text-gray-500">{totalQty} item</div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SheetView;