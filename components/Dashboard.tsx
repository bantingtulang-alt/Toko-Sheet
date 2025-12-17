import React, { useMemo } from 'react';
import { Transaction, Purchase, UserRole } from '../types';
import { TrendingUp, ShoppingBag, DollarSign, LogOut, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface DashboardProps {
  transactions: Transaction[];
  purchases: Purchase[];
  onLogout: () => void;
  userRole: UserRole | null;
}

const Dashboard: React.FC<DashboardProps> = ({ transactions, purchases, onLogout, userRole }) => {
  const totalRevenue = transactions.reduce((sum, t) => sum + t.total, 0);
  const totalItems = transactions.reduce((sum, t) => sum + t.quantity, 0);
  const totalExpense = purchases.reduce((sum, p) => sum + p.total, 0);
  
  const today = new Date().toISOString().split('T')[0];
  const todayRevenue = transactions
    .filter(t => t.date.startsWith(today))
    .reduce((sum, t) => sum + t.total, 0);

  // Combine and sort activities
  const recentActivity = useMemo(() => {
    const sales = transactions.map(t => ({
      id: t.id,
      name: t.productName,
      desc: `${t.quantity} item`,
      total: t.total,
      date: t.date,
      type: 'sale'
    }));

    const expenses = purchases.map(p => ({
      id: p.id,
      name: p.itemName,
      desc: p.supplier,
      total: p.total,
      date: p.date,
      type: 'expense'
    }));

    return [...sales, ...expenses]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10); // Show top 10
  }, [transactions, purchases]);

  return (
    <div className="p-4 space-y-6 pb-24">
      <header className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Ringkasan Toko</h1>
          <p className="text-gray-500 text-sm flex items-center gap-1">
            Halo, <span className="font-semibold text-blue-600">{userRole === UserRole.ADMIN ? 'Admin' : 'Kasir'}</span>
          </p>
        </div>
        <button 
          onClick={onLogout}
          className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center space-x-1 text-xs font-bold"
        >
          <LogOut size={16} />
          <span>Keluar</span>
        </button>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-600 text-white p-4 rounded-2xl shadow-lg col-span-2 relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10">
             <DollarSign size={100} />
          </div>
          <div className="flex items-center space-x-2 mb-2">
            <DollarSign size={20} className="text-blue-200" />
            <span className="text-sm font-medium text-blue-100">Saldo</span>
          </div>
          <div className="text-3xl font-bold z-10 relative">
            Rp {(totalRevenue - totalExpense).toLocaleString('id-ID')}
          </div>
          <div className="text-xs text-blue-200 mt-1">
            Omzet: Rp {totalRevenue.toLocaleString('id-ID')}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center space-x-2 mb-2">
            <ShoppingBag size={18} className="text-orange-500" />
            <span className="text-xs font-medium text-gray-500">Terjual</span>
          </div>
          <div className="text-xl font-bold text-gray-800">{totalItems} item</div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp size={18} className="text-green-500" />
            <span className="text-xs font-medium text-gray-500">Omzet Hari Ini</span>
          </div>
          <div className="text-xl font-bold text-gray-800">
            Rp {todayRevenue.toLocaleString('id-ID')}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-3">Aktivitas Terakhir</h2>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {recentActivity.length === 0 ? (
            <div className="p-4 text-center text-gray-400 text-sm">Belum ada aktivitas.</div>
          ) : (
            recentActivity.map((item, idx) => (
              <div key={`${item.type}-${item.id}`} className={`p-4 flex justify-between items-center ${idx !== recentActivity.length -1 ? 'border-b border-gray-50' : ''}`}>
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${item.type === 'sale' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    {item.type === 'sale' ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800 text-sm">{item.name}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(item.date).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})} • {item.desc}
                    </div>
                  </div>
                </div>
                <div className={`font-bold text-sm ${item.type === 'sale' ? 'text-green-600' : 'text-red-600'}`}>
                  {item.type === 'sale' ? '+' : '-'}Rp {item.total.toLocaleString('id-ID')}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;