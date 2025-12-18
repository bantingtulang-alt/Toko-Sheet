import React, { useState, useMemo } from 'react';
import { Transaction, Purchase } from '../types';
import { analyzeSalesData } from '../services/geminiService';
import { Send, Bot, Loader2, Sparkles, Wallet, QrCode, Smartphone, TrendingUp, TrendingDown, DollarSign, X, Calendar, Filter } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface AIAnalystProps {
  transactions: Transaction[];
  purchases: Purchase[];
}

type Period = 'all' | 'today' | 'month';

const AIAnalyst: React.FC<AIAnalystProps> = ({ transactions, purchases }) => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  
  // State Filter
  const [filterPeriod, setFilterPeriod] = useState<Period>('month'); // Default bulan ini agar relevan
  
  // State untuk Modal Detail
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  // Filter Data berdasarkan Periode
  const { filteredTransactions, filteredPurchases } = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const monthStr = now.toISOString().slice(0, 7); // YYYY-MM

    const filterFn = (dateStr: string) => {
        if (filterPeriod === 'all') return true;
        if (filterPeriod === 'today') return dateStr.startsWith(todayStr);
        if (filterPeriod === 'month') return dateStr.startsWith(monthStr);
        return true;
    };

    return {
        filteredTransactions: transactions.filter(t => filterFn(t.date)),
        filteredPurchases: purchases.filter(p => filterFn(p.date))
    };
  }, [transactions, purchases, filterPeriod]);

  // Financial Calculations (Based on Filtered Data)
  const stats = useMemo(() => {
    const totalSales = filteredTransactions.reduce((sum, t) => sum + t.total, 0);
    const totalSalesCount = filteredTransactions.length;
    const totalPurchases = filteredPurchases.reduce((sum, p) => sum + p.total, 0);
    const totalPurchasesCount = filteredPurchases.length;
    const netProfit = totalSales - totalPurchases;

    const byMethod = {
      Cash: filteredTransactions.filter(t => t.paymentMethod === 'Cash').reduce((sum, t) => sum + t.total, 0),
      QRIS: filteredTransactions.filter(t => t.paymentMethod === 'QRIS').reduce((sum, t) => sum + t.total, 0),
      Transfer: filteredTransactions.filter(t => t.paymentMethod === 'Transfer').reduce((sum, t) => sum + t.total, 0),
    };

    return { totalSales, totalSalesCount, totalPurchases, totalPurchasesCount, netProfit, byMethod };
  }, [filteredTransactions, filteredPurchases]);

  const handleAnalyze = async () => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    setResponse(''); // Clear previous
    
    // Kirim data yang sudah difilter ke AI agar konteksnya sesuai periode
    const result = await analyzeSalesData(filteredTransactions, query);
    setResponse(result);
    setIsLoading(false);
  };

  const suggestions = [
    "Apa produk terlaris?",
    "Berapa rata-rata penjualan?",
    "Analisa tren penjualan",
    "Saran untuk profit?"
  ];

  // Filter transaksi untuk modal (Detail payment method)
  const methodTransactions = useMemo(() => {
    if (!selectedMethod) return [];
    return filteredTransactions.filter(t => t.paymentMethod === selectedMethod);
  }, [filteredTransactions, selectedMethod]);

  return (
    <div className="p-4 pb-24 flex flex-col h-screen max-h-screen bg-gray-50 relative">
      <header className="mb-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-2">
            <div className="p-2 bg-purple-100 rounded-lg">
            <Sparkles className="text-purple-600" size={20} />
            </div>
            <div>
                <h1 className="text-lg font-bold text-gray-800">Analyst</h1>
                <p className="text-gray-500 text-[10px]">AI Assistant</p>
            </div>
        </div>

        {/* Filter Dropdown */}
        <div className="relative">
            <select 
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value as Period)}
                className="appearance-none bg-white border border-purple-200 text-purple-700 text-[10px] font-bold py-1.5 pl-2.5 pr-7 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 shadow-sm"
            >
                <option value="today">Hari Ini</option>
                <option value="month">Bulan Ini</option>
                <option value="all">Semua</option>
            </select>
            <Filter size={12} className="absolute right-2 top-2 text-purple-500 pointer-events-none" />
        </div>
      </header>

      {/* Financial Summary Cards - 3 Columns Layout */}
      <div className="mb-4 flex-shrink-0">
        <div className="grid grid-cols-3 gap-2">
          {/* Net Profit Card */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-2.5 rounded-xl shadow-sm flex flex-col justify-between">
             <div>
                <p className="text-[9px] font-medium text-green-100 mb-0.5 truncate">Profit</p>
                <div className="text-xs font-bold truncate">Rp {stats.netProfit.toLocaleString('id-ID')}</div>
             </div>
             <div className="mt-1 flex items-center justify-end opacity-40">
                <DollarSign size={14} />
             </div>
          </div>

          {/* Sales Card */}
          <div className="bg-white p-2.5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <div>
              <p className="text-[9px] font-medium text-gray-500 mb-0.5 truncate">Penjualan</p>
              <div className="text-xs font-bold text-gray-800 truncate">Rp {stats.totalSales.toLocaleString('id-ID')}</div>
            </div>
            <div className="mt-1 flex items-center justify-between text-blue-500">
               <span className="text-[8px] font-bold">{stats.totalSalesCount}x</span>
               <TrendingUp size={14} />
            </div>
          </div>

          {/* Purchases Card */}
          <div className="bg-white p-2.5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <div>
              <p className="text-[9px] font-medium text-gray-500 mb-0.5 truncate">Pengeluaran</p>
              <div className="text-xs font-bold text-gray-800 truncate">Rp {stats.totalPurchases.toLocaleString('id-ID')}</div>
            </div>
            <div className="mt-1 flex items-center justify-between text-orange-500">
               <span className="text-[8px] font-bold">{stats.totalPurchasesCount}x</span>
               <TrendingDown size={14} />
            </div>
          </div>
        </div>

        {/* Sales by Method Breakdown */}
        <div className="bg-white p-2.5 rounded-xl shadow-sm border border-gray-100 mt-2">
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-2">Metode Pembayaran</p>
            <div className="grid grid-cols-3 gap-2">
                <button 
                    onClick={() => setSelectedMethod('Cash')}
                    className="bg-green-50 p-1.5 rounded-lg text-center border border-green-100 hover:bg-green-100 transition-colors active:scale-95"
                >
                    <Wallet size={12} className="mx-auto text-green-600 mb-0.5"/>
                    <div className="text-[8px] text-green-700 font-medium">Cash</div>
                    <div className="text-[10px] font-bold text-gray-800">{stats.byMethod.Cash.toLocaleString('id-ID')}</div>
                </button>
                <button 
                    onClick={() => setSelectedMethod('QRIS')}
                    className="bg-blue-50 p-1.5 rounded-lg text-center border border-blue-100 hover:bg-blue-100 transition-colors active:scale-95"
                >
                    <QrCode size={12} className="mx-auto text-blue-600 mb-0.5"/>
                    <div className="text-[8px] text-blue-700 font-medium">QRIS</div>
                    <div className="text-[10px] font-bold text-gray-800">{stats.byMethod.QRIS.toLocaleString('id-ID')}</div>
                </button>
                 <button 
                    onClick={() => setSelectedMethod('Transfer')}
                    className="bg-purple-50 p-1.5 rounded-lg text-center border border-purple-100 hover:bg-purple-100 transition-colors active:scale-95"
                >
                    <Smartphone size={12} className="mx-auto text-purple-600 mb-0.5"/>
                    <div className="text-[8px] text-purple-700 font-medium">Bank</div>
                    <div className="text-[10px] font-bold text-gray-800">{stats.byMethod.Transfer.toLocaleString('id-ID')}</div>
                </button>
            </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-3 overflow-y-auto relative min-h-0">
        {response ? (
          <div className="prose prose-sm max-w-none text-gray-700 text-sm">
             <div className="flex items-center space-x-2 mb-3 text-purple-600 font-bold border-b pb-2">
                <Bot size={18} />
                <span>Analisa TokoSheet</span>
             </div>
             <ReactMarkdown>{response}</ReactMarkdown>
          </div>
        ) : (
          <div className="h-full flex flex-col justify-center items-center text-center text-gray-400">
            <Bot size={28} className="mb-2 text-gray-200" />
            <p className="text-[10px]">
                Tanyakan sesuatu tentang data <br/>
                <span className="font-bold text-purple-600">
                    {filterPeriod === 'today' ? 'Hari Ini' : filterPeriod === 'month' ? 'Bulan Ini' : 'Sepanjang Waktu'}
                </span>
            </p>
          </div>
        )}
      </div>

      {/* Suggestions */}
      {!response && (
        <div className="flex overflow-x-auto space-x-2 mb-3 pb-1 no-scrollbar flex-shrink-0">
            {suggestions.map((s, i) => (
                <button 
                    key={i}
                    onClick={() => setQuery(s)}
                    className="flex-shrink-0 bg-white border border-purple-100 text-purple-600 text-[9px] px-2.5 py-1.5 rounded-full whitespace-nowrap hover:bg-purple-50"
                >
                    {s}
                </button>
            ))}
        </div>
      )}

      {/* Input Area */}
      <div className="relative flex-shrink-0">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Tanya AI...`}
          className="w-full pl-4 pr-12 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none shadow-sm text-sm"
          onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
        />
        <button
          onClick={handleAnalyze}
          disabled={isLoading || !query.trim()}
          className="absolute right-1.5 top-1.5 p-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        </button>
      </div>

      {/* MODAL POPUP */}
      {selectedMethod && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
           <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
              {/* Modal Header */}
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                  <div className="flex items-center space-x-2">
                     {selectedMethod === 'Cash' && <Wallet size={18} className="text-green-600" />}
                     {selectedMethod === 'QRIS' && <QrCode size={18} className="text-blue-600" />}
                     {selectedMethod === 'Transfer' && <Smartphone size={18} className="text-purple-600" />}
                     <h3 className="font-bold text-gray-800">
                        {selectedMethod}
                     </h3>
                  </div>
                  <button 
                    onClick={() => setSelectedMethod(null)} 
                    className="p-1 rounded-full hover:bg-gray-200 text-gray-500"
                  >
                     <X size={20} />
                  </button>
              </div>

              {/* Modal Body */}
              <div className="overflow-y-auto p-2 space-y-2 flex-1">
                 {methodTransactions.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 text-sm">
                       Tidak ada transaksi.
                    </div>
                 ) : (
                    methodTransactions.map((t, idx) => (
                       <div key={idx} className="flex justify-between items-center p-3 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                          <div className="flex items-center space-x-3">
                             <div className="bg-gray-100 p-2 rounded-lg text-gray-500">
                                <Calendar size={16} />
                             </div>
                             <div>
                                <div className="font-bold text-gray-800 text-sm">{t.productName}</div>
                                <div className="text-[10px] text-gray-500">
                                   {new Date(t.date).toLocaleString('id-ID', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })} • Qty: {t.quantity}
                                </div>
                             </div>
                          </div>
                          <div className="font-bold text-sm text-gray-700">
                             Rp {t.total.toLocaleString('id-ID')}
                          </div>
                       </div>
                    ))
                 )}
              </div>
              
              {/* Modal Footer */}
              <div className="p-3 bg-gray-50 border-t border-gray-100 text-right">
                  <span className="text-xs text-gray-500 mr-2">Total {selectedMethod}:</span>
                  <span className="font-bold text-lg text-gray-800">
                     Rp {methodTransactions.reduce((acc, curr) => acc + curr.total, 0).toLocaleString('id-ID')}
                  </span>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AIAnalyst;