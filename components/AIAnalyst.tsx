import React, { useState, useMemo } from 'react';
import { Transaction, Purchase } from '../types';
import { analyzeSalesData } from '../services/geminiService';
import { Send, Bot, Loader2, Sparkles, Wallet, QrCode, Smartphone, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface AIAnalystProps {
  transactions: Transaction[];
  purchases: Purchase[];
}

const AIAnalyst: React.FC<AIAnalystProps> = ({ transactions, purchases }) => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Financial Calculations
  const stats = useMemo(() => {
    const totalSales = transactions.reduce((sum, t) => sum + t.total, 0);
    const totalSalesCount = transactions.length;
    const totalPurchases = purchases.reduce((sum, p) => sum + p.total, 0);
    const totalPurchasesCount = purchases.length;
    const netProfit = totalSales - totalPurchases;

    const byMethod = {
      Cash: transactions.filter(t => t.paymentMethod === 'Cash').reduce((sum, t) => sum + t.total, 0),
      QRIS: transactions.filter(t => t.paymentMethod === 'QRIS').reduce((sum, t) => sum + t.total, 0),
      Transfer: transactions.filter(t => t.paymentMethod === 'Transfer').reduce((sum, t) => sum + t.total, 0),
    };

    return { totalSales, totalSalesCount, totalPurchases, totalPurchasesCount, netProfit, byMethod };
  }, [transactions, purchases]);

  const handleAnalyze = async () => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    setResponse(''); // Clear previous
    
    const result = await analyzeSalesData(transactions, query);
    setResponse(result);
    setIsLoading(false);
  };

  const suggestions = [
    "Apa produk terlaris minggu ini?",
    "Berapa rata-rata penjualan harian?",
    "Analisa tren penjualan saya",
    "Saran untuk meningkatkan profit?"
  ];

  return (
    <div className="p-4 pb-24 flex flex-col h-screen max-h-screen bg-gray-50">
      <header className="mb-4 flex items-center space-x-2 flex-shrink-0">
        <div className="p-2 bg-purple-100 rounded-lg">
           <Sparkles className="text-purple-600" size={24} />
        </div>
        <div>
            <h1 className="text-xl font-bold text-gray-800">Financial Analyst</h1>
            <p className="text-gray-500 text-xs">Ringkasan & AI Assistant</p>
        </div>
      </header>

      {/* Financial Summary Cards */}
      <div className="mb-4 space-y-3 flex-shrink-0">
        {/* Net Profit - Highlighted */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-4 rounded-xl shadow-md relative overflow-hidden">
             <div className="absolute right-0 top-0 opacity-20 p-2"><DollarSign size={60}/></div>
             <p className="text-green-100 text-xs font-medium mb-1">Saldo Saat Ini</p>
             <h2 className="text-2xl font-bold">Rp {stats.netProfit.toLocaleString('id-ID')}</h2>
        </div>

        {/* Sales & Purchases Grid */}
        <div className="grid grid-cols-2 gap-3">
             {/* Total Sales */}
            <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center space-x-2 mb-1 text-blue-600">
                   <TrendingUp size={16} />
                   <p className="text-gray-500 text-[10px] font-medium">Total Penjualan</p>
                </div>
                <h2 className="text-lg font-bold text-gray-800">Rp {stats.totalSales.toLocaleString('id-ID')}</h2>
                <p className="text-[10px] text-gray-400 mt-1">{stats.totalSalesCount} Transaksi</p>
            </div>

             {/* Total Purchases */}
             <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center space-x-2 mb-1 text-orange-500">
                   <TrendingDown size={16} />
                   <p className="text-gray-500 text-[10px] font-medium">Total Pembelian</p>
                </div>
                <h2 className="text-lg font-bold text-gray-800">Rp {stats.totalPurchases.toLocaleString('id-ID')}</h2>
                 <p className="text-[10px] text-gray-400 mt-1">{stats.totalPurchasesCount} Transaksi</p>
            </div>
        </div>

        {/* Sales by Method Breakdown */}
        <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">Penjualan per Metode</p>
            <div className="grid grid-cols-3 gap-2">
                <div className="bg-gray-50 p-2 rounded-lg text-center border border-gray-100">
                    <Wallet size={16} className="mx-auto text-green-600 mb-1"/>
                    <div className="text-[10px] text-gray-500">Cash</div>
                    <div className="text-xs font-bold text-gray-800">{stats.byMethod.Cash.toLocaleString('id-ID')}</div>
                </div>
                <div className="bg-gray-50 p-2 rounded-lg text-center border border-gray-100">
                    <QrCode size={16} className="mx-auto text-blue-600 mb-1"/>
                    <div className="text-[10px] text-gray-500">QRIS</div>
                    <div className="text-xs font-bold text-gray-800">{stats.byMethod.QRIS.toLocaleString('id-ID')}</div>
                </div>
                 <div className="bg-gray-50 p-2 rounded-lg text-center border border-gray-100">
                    <Smartphone size={16} className="mx-auto text-purple-600 mb-1"/>
                    <div className="text-[10px] text-gray-500">Transfer</div>
                    <div className="text-xs font-bold text-gray-800">{stats.byMethod.Transfer.toLocaleString('id-ID')}</div>
                </div>
            </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4 overflow-y-auto relative min-h-0">
        {response ? (
          <div className="prose prose-sm max-w-none text-gray-700 text-sm">
             <div className="flex items-center space-x-2 mb-3 text-purple-600 font-bold border-b pb-2">
                <Bot size={20} />
                <span>Analisa TokoSheet</span>
             </div>
             <ReactMarkdown>{response}</ReactMarkdown>
          </div>
        ) : (
          <div className="h-full flex flex-col justify-center items-center text-center text-gray-400">
            <Bot size={32} className="mb-2 text-gray-200" />
            <p className="text-xs">Tanyakan sesuatu tentang data toko Anda.</p>
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
                    className="flex-shrink-0 bg-white border border-purple-100 text-purple-600 text-[10px] px-3 py-1.5 rounded-full whitespace-nowrap hover:bg-purple-50"
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
          placeholder="Tanya AI (misal: Produk terlaris?)"
          className="w-full pl-4 pr-12 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none shadow-sm text-sm"
          onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
        />
        <button
          onClick={handleAnalyze}
          disabled={isLoading || !query.trim()}
          className="absolute right-2 top-2 p-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </div>
    </div>
  );
};

export default AIAnalyst;