import React, { useState } from 'react';
import { UserRole } from '../types';
import { Shield, User, Lock, Store } from 'lucide-react';

interface LoginProps {
  onLogin: (role: UserRole) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [showAdminInput, setShowAdminInput] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Ambil PIN dari localStorage, jika tidak ada gunakan default '1234'
    const storedPin = localStorage.getItem('tokosheet_admin_pin') || '1234';
    
    if (pin === storedPin) {
      onLogin(UserRole.ADMIN);
    } else {
      setError('PIN Salah!');
      setPin('');
    }
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-blue-600 px-6 text-white">
      <div className="mb-8 flex flex-col items-center animate-bounce-short">
        <div className="bg-white p-4 rounded-full bg-opacity-20 mb-4">
          <Store size={48} className="text-white" />
        </div>
        <h1 className="text-3xl font-bold">TokoSheet AI</h1>
        <p className="text-blue-200">Aplikasi Kasir Cerdas</p>
      </div>

      <div className="w-full max-w-sm space-y-4">
        {/* Kasir Login */}
        {!showAdminInput && (
          <button
            onClick={() => onLogin(UserRole.CASHIER)}
            className="w-full bg-white text-blue-600 py-4 rounded-2xl font-bold text-lg shadow-lg hover:bg-blue-50 transition-all flex items-center justify-center space-x-3 active:scale-95"
          >
            <User size={24} />
            <span>Masuk sebagai Kasir</span>
          </button>
        )}

        {/* Admin Login Toggle */}
        {!showAdminInput ? (
          <button
            onClick={() => setShowAdminInput(true)}
            className="w-full bg-blue-700 bg-opacity-50 border border-blue-400 text-white py-4 rounded-2xl font-semibold text-lg hover:bg-opacity-70 transition-all flex items-center justify-center space-x-3"
          >
            <Shield size={24} />
            <span>Masuk Admin</span>
          </button>
        ) : (
          <div className="bg-white rounded-2xl p-6 text-gray-800 shadow-xl animate-fade-in">
            <h2 className="text-xl font-bold mb-4 text-center">Login Admin</h2>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Masukkan PIN</label>
                <div className="relative">
                  <input
                    type="password"
                    value={pin}
                    onChange={(e) => {
                      setPin(e.target.value);
                      setError('');
                    }}
                    placeholder="****"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl tracking-widest font-bold"
                    autoFocus
                  />
                  <Lock size={20} className="absolute left-3 top-4 text-gray-400" />
                </div>
                {error && <p className="text-red-500 text-xs mt-2 text-center">{error}</p>}
              </div>
              
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors"
              >
                Masuk
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setShowAdminInput(false);
                  setPin('');
                  setError('');
                }}
                className="w-full text-gray-500 text-sm py-2 hover:underline"
              >
                Kembali
              </button>
            </form>
          </div>
        )}
      </div>
      
      <p className="mt-12 text-blue-200 text-xs">v1.1.0 • Powered by Gemini AI</p>
    </div>
  );
};

export default Login;