import React, { useEffect, useState } from 'react';

const SplashScreen: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [shouldRender, setShouldRender] = useState(true);

  useEffect(() => {
    // Mulai animasi keluar setelah 2.5 detik
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2500);

    // Hapus dari DOM setelah animasi fade-out selesai (total 3 detik)
    const removeTimer = setTimeout(() => {
      setShouldRender(false);
    }, 3000);

    return () => {
      clearTimeout(timer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!shouldRender) return null;

  // Menggunakan URL direct download dari Google Drive ID yang diberikan
  const imageUrl = "Splas_Screen.png";

  return (
    <div 
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#c1e0ff] transition-opacity duration-500 ease-in-out ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#c1e0ff] to-white opacity-50"></div>

      <div className="relative z-10 flex flex-col items-center px-6">
        {/* Gambar Splash Screen Baru */}
        <div className="w-64 h-auto mb-8 animate-[bounce_3s_infinite] drop-shadow-2xl">
          <img 
            src={imageUrl} 
            alt="TokoSheet Splash" 
            className="w-full h-full object-contain scale-110 animate-[pulse_2s_infinite]"
            onError={(e) => {
              // Fallback jika direct link Google Drive terblokir CORS (biasanya untuk demo lokal bisa butuh proxy)
              console.error("Gagal memuat gambar splash screen");
            }}
          />
        </div>

        {/* Branding */}
        <div className="text-center transform translate-y-4 animate-[slideUp_0.8s_ease-out_forwards]">
          <h1 className="text-4xl font-extrabold text-blue-800 tracking-tight">
            TokoSheet <span className="text-orange-500">AI</span>
          </h1>
          <p className="text-blue-600/70 font-medium mt-1">Smart POS Solution</p>
        </div>

        {/* Loading Bar Anim */}
        <div className="mt-12 w-32 h-1.5 bg-blue-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-600 animate-[loading_2s_ease-in-out_infinite]"></div>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes loading {
          0% { width: 0%; transform: translateX(-100%); }
          50% { width: 70%; transform: translateX(50%); }
          100% { width: 0%; transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;