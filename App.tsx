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
import SplashScreen from './components/SplashScreen';
import { fetchTransactions, addTransaction, seedInitialData, fetchPurchases } from './services/storageService';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabView>(TabView.DASHBOARD);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  
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
    } finally {
      setIsLoading(false);
    }
  };

  // Load initial data
  useEffect(() => {
    seedInitialData();
    loadData();
    
    // Matikan splash screen setelah delay agar transisi terasa halus
    const splashTimer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);

    return () => clearTimeout(splashTimer);
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

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center">
      {showSplash && <SplashScreen />}
      
      <div className={`w-full max-w-md bg-white min-h-screen relative shadow-2xl overflow-hidden transition-opacity duration-700 ${showSplash ? 'opacity-0' : 'opacity-100'}`}>
        <main className="h-full overflow-y-auto no-scrollbar">
          {!userRole ? (
            <Login onLogin={handleLogin} />
          ) : (
            <>
              {isLoading && transactions.length === 0 ? (
                <div className="h-screen flex flex-col justify-center items-center text-blue-600">
                  <Loader2 size={48} className="animate-spin mb-4" />
                  <p>Memperbarui data...</p>
                </div>
              ) : (
                <>
                  {activeTab === TabView.DASHBOARD && <Dashboard transactions={transactions} purchases={purchases} onLogout={handleLogout} userRole={userRole} />}
                  {activeTab === TabView.INPUT && <InputForm onSave={handleSaveTransaction} />}
                  {activeTab === TabView.PURCHASE && <PurchaseView purchases={purchases} onReload={loadData} />}
                  {activeTab === TabView.SHEET && <SheetView transactions={transactions} purchases={purchases} onReload={loadData} />}
                  {activeTab === TabView.AI_ANALYSIS && userRole === UserRole.ADMIN && <AIAnalyst transactions={transactions} purchases={purchases} />}
                  {activeTab === TabView.ADMIN_PANEL && userRole === UserRole.ADMIN && <AdminPanel onLogout={handleLogout} onRefreshApp={loadData} />}
                </>
              )}
            </>
          )}
        </main>
        {userRole && <NavBar activeTab={activeTab} onTabChange={setActiveTab} userRole={userRole} />}
      </div>
    </div>
  );
};

export default App;