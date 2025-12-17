import React, { useState, useEffect } from 'react';
import { TabView, Transaction, Purchase, UserRole } from './types';
import NavBar from './components/NavBar';
import Dashboard from './components/Dashboard';
import InputForm from './components/InputForm';
import SheetView from './components/SheetView';
import AIAnalyst from './components/AIAnalyst';
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';
import PurchaseView from './components/PurchaseView';
import { fetchTransactions, addTransaction, seedInitialData, fetchPurchases } from './services/storageService';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabView>(TabView.DASHBOARD);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Auth State
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [salesData, purchaseData] = await Promise.all([
        fetchTransactions(),
        fetchPurchases()
      ]);
      setTransactions(salesData);
      setPurchases(purchaseData);
    } catch (error) {
      console.error("Gagal memuat data", error);
      alert("Gagal memuat data. Cek koneksi internet atau konfigurasi API URL.");
    } finally {
      setIsLoading(false);
    }
  };

  // Load initial data
  useEffect(() => {
    seedInitialData();
    loadData();
  }, []);

  const handleSaveTransaction = async (transaction: Transaction) => {
    try {
      await addTransaction(transaction);
      await loadData(); // Reload data
      setActiveTab(TabView.DASHBOARD);
    } catch (e) {
      alert("Gagal menyimpan data penjualan!");
    }
  };

  const handleLogin = (role: UserRole) => {
    setUserRole(role);
    setActiveTab(TabView.DASHBOARD);
  };

  const handleLogout = () => {
    setUserRole(null);
    setActiveTab(TabView.DASHBOARD);
  };

  // Render Login jika belum login
  if (!userRole) {
    return <Login onLogin={handleLogin} />;
  }

  const renderContent = () => {
    if (isLoading && transactions.length === 0 && purchases.length === 0) {
      return (
        <div className="h-screen flex flex-col justify-center items-center text-blue-600">
          <Loader2 size={48} className="animate-spin mb-4" />
          <p>Memuat data...</p>
        </div>
      );
    }

    switch (activeTab) {
      case TabView.DASHBOARD:
        return <Dashboard transactions={transactions} purchases={purchases} onLogout={handleLogout} userRole={userRole} />;
      case TabView.INPUT:
        return <InputForm onSave={handleSaveTransaction} />;
      case TabView.PURCHASE:
        return <PurchaseView purchases={purchases} onReload={loadData} />;
      case TabView.SHEET:
        return <SheetView transactions={transactions} purchases={purchases} onReload={loadData} />;
      case TabView.AI_ANALYSIS:
        return <AIAnalyst transactions={transactions} purchases={purchases} />;
      case TabView.ADMIN_PANEL:
        // Double check role
        if (userRole === UserRole.ADMIN) {
           return <AdminPanel onLogout={handleLogout} />;
        }
        return <Dashboard transactions={transactions} purchases={purchases} onLogout={handleLogout} userRole={userRole} />;
      default:
        return <Dashboard transactions={transactions} purchases={purchases} onLogout={handleLogout} userRole={userRole} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center">
      <div className="w-full max-w-md bg-white min-h-screen relative shadow-2xl overflow-hidden">
        <main className="h-full overflow-y-auto no-scrollbar">
          {renderContent()}
        </main>
        <NavBar activeTab={activeTab} onTabChange={setActiveTab} userRole={userRole} />
      </div>
    </div>
  );
};

export default App;