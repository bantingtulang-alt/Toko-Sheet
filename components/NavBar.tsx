import React from 'react';
import { LayoutDashboard, PlusCircle, Table, Sparkles, Settings, ShoppingCart } from 'lucide-react';
import { TabView, UserRole } from '../types';

interface NavBarProps {
  activeTab: TabView;
  onTabChange: (tab: TabView) => void;
  userRole: UserRole | null;
}

const NavBar: React.FC<NavBarProps> = ({ activeTab, onTabChange, userRole }) => {
  // Menu dasar yang bisa diakses semua role (termasuk kasir)
  const navItems = [
    { id: TabView.DASHBOARD, label: 'Beranda', icon: <LayoutDashboard size={24} /> },
    { id: TabView.INPUT, label: 'Jual', icon: <PlusCircle size={24} /> },
    { id: TabView.PURCHASE, label: 'Beli', icon: <ShoppingCart size={24} /> },
    { id: TabView.SHEET, label: 'Data', icon: <Table size={24} /> },
  ];

  // Menu khusus Admin
  if (userRole === UserRole.ADMIN) {
    navItems.push({ id: TabView.AI_ANALYSIS, label: 'Analyst', icon: <Sparkles size={24} /> });
    navItems.push({ id: TabView.ADMIN_PANEL, label: 'Admin', icon: <Settings size={24} /> });
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe z-50">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto px-1">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center w-full h-full transition-colors duration-200 ${
                isActive ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <div className={`mb-1 ${isActive ? 'scale-110 transition-transform' : ''}`}>
                {item.icon}
              </div>
              <span className="text-[9px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default NavBar;