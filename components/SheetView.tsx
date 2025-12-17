import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, Purchase } from '../types';
import { RefreshCw, Search, Calculator, ArrowUpRight, ArrowDownLeft, Filter } from 'lucide-react';
import { getApiUrl } from '../services/storageService';

interface SheetViewProps {
  transactions: Transaction[];
  purchases: Purchase[];
  onReload: () => void;
}

type Period = 'all' | 'today' | 'month';

const SheetView: React.FC<SheetViewProps> = ({ transactions, purchases, onReload }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'sales' | 'purchases'>('sales');
  const [filterPeriod, setFilterPeriod] = useState<Period>('all');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    setIsConnected(!!getApiUrl());
  }, []);

  const handleReload = async () => {
    setIsRefreshing(true);
    await onReload();
    setIsRefreshing(false);
  };

  // Filter Logic
  const filteredData = useMemo(() => {
    let data: any[] = viewMode === 'sales' ? transactions : purchases;
    
    // 1. Filter Period
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const monthStr = now.toISOString().slice(0, 7);

    if (filterPeriod === 'today') {
      data = data.filter(d => d.date.startsWith(todayStr));
    } else if (filterPeriod === 'month') {
      data = data.filter(d => d.date.startsWith(monthStr));
    }

    // 2. Search Filter
    const lower = searchTerm.toLowerCase();
    if (!lower) return data;

    if (viewMode === 'sales') {
      return (data as Transaction[]).filter(t => 
        t.productName.toLowerCase().includes(lower) || 
        t.category.toLowerCase().includes(lower) ||
        t.id.toLowerCase().includes(lower) ||
        t.paymentMethod?.toLowerCase().includes(lower)
      );
    } else {
      return (data as Purchase[]).filter(p => 
        p.itemName.toLowerCase().includes(lower) || 
        p.supplier.toLowerCase().includes(lower) ||
        p.id.toLowerCase().includes(lower)
      );
    }
  }, [transactions, purchases, searchTerm, viewMode, filterPeriod]);

  // Calculate Totals
  const totalAmount = filteredData.reduce((acc, item) => acc + item.total, 0);
  const totalQty = filteredData.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="p-4 pb-24 h-screen flex flex-col">
      <header className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Database</h1>
            <p className="text-gray-500 text-sm">
              {isConnected ? 'Terhubung ke Google Sheet' : 'Penyimpanan Lokal'}
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
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex space-x-2 mb-3">
          {/* Filter Period Dropdown */}
          <div className="relative min-w-[110px]">
            <select
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value as Period)}
                className="w-full appearance-none bg-white border border-gray-200 text-gray-700 text-sm py-2 pl-3 pr-8 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            >
                <option value="today">Hari Ini</option>
                <option value="month">Bulan Ini</option>
                <option value="all">Semua</option>
            </select>
            <Filter size={14} className="absolute right-2.5 top-3 text-gray-400 pointer-events-none" />
          </div>

          {/* Search Input */}
          <div className="relative flex-1">
            <input
                type="text"
                placeholder={viewMode === 'sales' ? "Cari produk..." : "Cari item..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
          </div>
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
                    <div className="flex flex-col items-center justify-center">
                        <span className="mb-1">Tidak ada data.</span>
                        <span className="text-xs text-gray-300">Cek filter waktu atau kata kunci.</span>
                    </div>
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
                <span className="text-xs">
                    {filterPeriod === 'today' ? 'Total Hari Ini' : filterPeriod === 'month' ? 'Total Bulan Ini' : 'Total Semua'}:
                </span>
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