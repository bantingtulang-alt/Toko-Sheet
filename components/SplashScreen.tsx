import React, { useEffect, useState } from "react";
import { Store } from "lucide-react";
import { SPLASH_IMAGE_PATH } from "./SplashImage";

const SplashScreen: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [shouldRender, setShouldRender] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    // Log untuk debugging: membantu user melihat path mana yang sedang dicoba dimuat
    console.log("Mencoba memuat splash screen dari:", SPLASH_IMAGE_PATH);

    const timer = setTimeout(() => setIsVisible(false), 3000);
    const removeTimer = setTimeout(() => setShouldRender(false), 4000);

    return () => {
      clearTimeout(timer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center 
      bg-gradient-to-b from-[#87b9f5] via-[#a5cdff] to-[#c1e0ff]
      transition-opacity duration-1000 ease-in-out
      ${isVisible ? "opacity-100" : "opacity-0"}`}
    >
      {/* Efek Cahaya Latar Belakang */}
      <div className="absolute top-[-10%] left-[-10%] w-72 h-72 bg-white/30 rounded-full blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-400/20 rounded-full blur-[120px] animate-pulse delay-1000"></div>

      <div className="relative z-10 flex flex-col items-center w-full h-full justify-center px-6">
        
        {/* Container Gambar Utama */}
        <div className="w-full max-w-[340px] aspect-[9/16] relative flex items-center justify-center">
          {!imageError ? (
            <img
              src={SPLASH_IMAGE_PATH}
              alt="Welcome to TokoSheet AI"
              className="w-full h-full object-contain animate-[float_4s_infinite_ease-in-out] drop-shadow-[0_25px_50px_rgba(0,0,0,0.2)]"
              onLoad={(e) => {
                const img = e.target as HTMLImageElement;
                img.style.opacity = "1";
                console.log("Gambar splash screen berhasil dimuat!");
              }}
              onError={(e) => {
                setImageError(true);
                console.error(`Gagal memuat gambar di path: ${SPLASH_IMAGE_PATH}. Pastikan file ada di root folder dan namanya tepat.`);
              }}
            />
          ) : (
            // Tampilan Cadangan jika Gambar Gagal Dimuat
            <div className="flex flex-col items-center justify-center animate-[float_4s_infinite_ease-in-out]">
              <div className="bg-white/30 backdrop-blur-md p-10 rounded-full border border-white/50 shadow-2xl mb-8">
                <Store size={80} className="text-white drop-shadow-lg" />
              </div>
              <p className="text-white/60 text-xs font-medium italic">Toko Sheet AI</p>
            </div>
          )}
        </div>

        {/* Branding */}
        <div className="absolute bottom-20 flex flex-col items-center animate-[slideUp_1.2s_ease-out]">
          <div className="bg-white/20 backdrop-blur-xl px-8 py-4 rounded-[2rem] border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.1)] flex flex-col items-center">
             <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-lg">
               TokoSheet <span className="text-orange-400">AI</span>
             </h1>
             <div className="h-[2px] w-12 bg-orange-400/60 mt-1 rounded-full"></div>
          </div>
          
          <p className="text-blue-900/60 mt-4 font-bold tracking-[0.3em] text-[10px] uppercase">
            Smart Retail Solution
          </p>
          
          <div className="mt-8 w-32 h-1 bg-white/30 rounded-full overflow-hidden shadow-inner">
            <div className="h-full bg-white shadow-[0_0_8px_white] animate-[loading_2s_infinite_ease-in-out]"></div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-20px) scale(1.03); }
        }
        @keyframes slideUp {
          0% { opacity: 0; transform: translateY(40px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;