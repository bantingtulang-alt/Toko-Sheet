import React, { useState } from 'react';
import { UserRole } from '../types';
import { Shield, User, Lock, Store, Loader2 } from 'lucide-react';
import { fetchAdminPin, fetchCashierPin } from '../services/storageService';

interface LoginProps {
  onLogin: (role: UserRole) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [showInput, setShowInput] = useState<UserRole | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(false);

  const handleLoginAttempt = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsChecking(true);
    setError('');
    
    try {
        const storedPin = showInput === UserRole.ADMIN 
            ? await fetchAdminPin() 
            : await fetchCashierPin();
        
        if (pin === storedPin) {
            onLogin(showInput as UserRole);
        } else {
            setError('PIN Salah!');
            setPin('');
        }
    } catch (err) {
        setError('Gagal verifikasi. Cek koneksi.');
    } finally {
        setIsChecking(false);
    }
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-blue-600 px-6 text-white">
      <div className="mb-8 flex flex-col items-center">
        <div className="bg-white p-4 rounded-full bg-opacity-20 mb-4 shadow-xl">
          <Store size={48} className="text-white" />
        </div>
        <h1 className="text-3xl font-bold">TokoSheet AI</h1>
        <p className="text-blue-200">Aplikasi Kasir Cerdas</p>
      </div>

      <div className="w-full max-w-sm space-y-4">
        {!showInput ? (
          <>
            <button
              onClick={() => setShowInput(UserRole.CASHIER)}
              className="w-full bg-white text-blue-600 py-4 rounded-2xl font-bold text-lg shadow-lg hover:bg-blue-50 transition-all flex items-center justify-center space-x-3 active:scale-95"
            >
              <User size={24} />
              <span>Masuk Kasir</span>
            </button>
            <button
              onClick={() => setShowInput(UserRole.ADMIN)}
              className="w-full bg-blue-700 bg-opacity-50 border border-blue-400 text-white py-4 rounded-2xl font-semibold text-lg hover:bg-opacity-70 transition-all flex items-center justify-center space-x-3"
            >
              <Shield size={24} />
              <span>Masuk Admin</span>
            </button>
          </>
        ) : (
          <div className="bg-white rounded-2xl p-6 text-gray-800 shadow-xl animate-fade-in">
            <h2 className="text-xl font-bold mb-4 text-center">
                {showInput === UserRole.ADMIN ? 'Login Admin' : 'Login Kasir'}
            </h2>
            <form onSubmit={handleLoginAttempt} className="space-y-4">
              <div>
                <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2 text-center">
                    Masukkan PIN {showInput === UserRole.ADMIN ? 'Admin' : 'Kasir'}
                </label>
                <div className="relative">
                  <input
                    type="password"
                    inputMode="numeric"
                    value={pin}
                    onChange={(e) => {
                      setPin(e.target.value);
                      setError('');
                    }}
                    placeholder="****"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl tracking-widest font-bold"
                    autoFocus
                    disabled={isChecking}
                  />
                  <Lock size={20} className="absolute left-3 top-4 text-gray-400" />
                </div>
                {error && <p className="text-red-500 text-xs mt-2 text-center font-medium">{error}</p>}
              </div>
              
              <button
                type="submit"
                disabled={isChecking}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                {isChecking ? <Loader2 className="animate-spin" size={20} /> : "Verifikasi"}
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setShowInput(null);
                  setPin('');
                  setError('');
                }}
                disabled={isChecking}
                className="w-full text-gray-400 text-xs py-2 hover:underline"
              >
                Ganti Role
              </button>
            </form>
          </div>
        )}
      </div>
      
      <p className="mt-12 text-blue-200 text-xs">v1.4.1 • Cloud Security Ready</p>
    </div>
  );
};

export default Login;