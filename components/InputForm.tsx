
import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, Product, CupItem } from '../types';
import { fetchProducts } from '../services/productService';
import { fetchCupItems, saveCupList } from '../services/storageService';
import { Save, Loader2, Minus, Plus, Coffee, CupSoda, Trash2, ShoppingCart, Utensils, Package, Search, Wallet, QrCode, Smartphone, X, Check } from 'lucide-react';

interface InputFormProps {
  onSave: (transaction: Transaction) => Promise<void>;
}

interface CartItem {
  productName: string;
  category: string;
  price: number;
  quantity: number;
}

const InputForm: React.FC<InputFormProps> = ({ onSave }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [menuItems, setMenuItems] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'QRIS' | 'Transfer'>('Cash');
  
  // Cup Selection States
  const [cupItems, setCupItems] = useState<CupItem[]>([]);
  const [showCupModal, setShowCupModal] = useState(false);
  const [selectedCupId, setSelectedCupId] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoadingProducts(true);
      const [products, cups] = await Promise.all([
        fetchProducts(),
        fetchCupItems()
      ]);
      setMenuItems(products);
      setCupItems(cups);
      setIsLoadingProducts(false);
    };
    loadData();
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(menuItems.map(p => p.category));
    return ['Semua', ...Array.from(cats)];
  }, [menuItems]);

  const filteredItems = useMemo(() => {
    if (selectedCategory === 'Semua') return menuItems;
    return menuItems.filter(item => item.category === selectedCategory);
  }, [menuItems, selectedCategory]);

  const addToCart = (item: Product) => {
    setCart((prevCart) => {
      const existingItemIndex = prevCart.findIndex((cartItem) => cartItem.productName === item.name);
      if (existingItemIndex > -1) {
        const newCart = [...prevCart];
        newCart[existingItemIndex].quantity += 1;
        return newCart;
      } else {
        return [...prevCart, { productName: item.name, category: item.category, price: item.price, quantity: 1 }];
      }
    });
  };

  const updateQuantity = (productName: string, delta: number) => {
    setCart((prevCart) => {
      return prevCart.map(item => {
        if (item.productName === productName) return { ...item, quantity: Math.max(0, item.quantity + delta) };
        return item;
      }).filter(item => item.quantity > 0);
    });
  };

  const calculateTotal = useMemo(() => cart.reduce((total, item) => total + (item.price * item.quantity), 0), [cart]);
  const totalItemsInCart = useMemo(() => cart.reduce((a, b) => a + b.quantity, 0), [cart]);

  const handleOpenCupModal = () => {
    if (cart.length === 0) return;
    if (cupItems.length === 0) {
      alert("Belum ada jenis cup yang ditambahkan di Admin Panel.");
      return;
    }
    setShowCupModal(true);
  };

  const handleCheckout = async () => {
    if (!selectedCupId) return alert("Pilih jenis cup terlebih dahulu!");
    
    const chosenCup = cupItems.find(c => c.id === selectedCupId);
    if (!chosenCup || chosenCup.stock < totalItemsInCart) {
      alert(`Stok ${chosenCup?.name || 'Cup'} tidak mencukupi! Sisa: ${chosenCup?.stock || 0}`);
      return;
    }

    setIsSaving(true);
    try {
      const batchId = Date.now().toString();
      for (const item of cart) {
        const newTransaction: Transaction = {
          id: batchId + Math.random().toString().slice(2, 5),
          date: new Date().toISOString(),
          productName: item.productName,
          category: item.category,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity,
          paymentMethod: paymentMethod,
          cupId: selectedCupId
        };
        await onSave(newTransaction);
      }
      
      // Update Stok Cup di Database Sheet
      const updatedCups = cupItems.map(c => 
        c.id === selectedCupId ? { ...c, stock: c.stock - totalItemsInCart } : c
      );
      await saveCupList(updatedCups);
      setCupItems(updatedCups);

      setCart([]);
      setPaymentMethod('Cash');
      setSelectedCupId(null);
      setShowCupModal(false);
      alert('Transaksi berhasil!');
    } catch (error) {
      alert('Gagal menyimpan data.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-4 pt-4 pb-2 border-b border-gray-200 shadow-sm z-10">
        <div className="flex justify-between items-center mb-3">
          <h1 className="text-lg font-bold text-gray-800">Kasir</h1>
          <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-[10px] font-bold">
            {filteredItems.length} Produk
          </div>
        </div>
        <div className="flex overflow-x-auto no-scrollbar space-x-2 pb-1">
          {categories.map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat)} className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-medium transition-all ${selectedCategory === cat ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>{cat}</button>
          ))}
        </div>
      </div>

      {/* Menu Grid */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-3 pb-40">
        {isLoadingProducts ? (
           <div className="flex justify-center items-center h-40"><Loader2 className="animate-spin text-blue-600" /></div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {filteredItems.map((item) => {
              const qtyInCart = cart.find(c => c.productName === item.name)?.quantity || 0;
              return (
                <button key={item.id} onClick={() => addToCart(item)} className={`p-2 rounded-xl border transition-all flex flex-col items-center justify-between relative h-28 ${qtyInCart > 0 ? 'bg-blue-50 border-blue-500' : 'bg-white border-gray-200'}`}>
                  {qtyInCart > 0 && <div className="absolute top-1 right-1 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{qtyInCart}</div>}
                  <div className={`mt-1 p-2 rounded-full ${qtyInCart > 0 ? 'bg-blue-100 text-blue-600' : 'bg-gray-50 text-gray-400'}`}><Coffee size={20}/></div>
                  <div className="w-full text-center">
                    <div className="font-semibold text-[11px] text-gray-800 leading-tight line-clamp-2">{item.name}</div>
                    <div className="text-[10px] font-bold text-blue-600">Rp {item.price.toLocaleString('id-ID')}</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Checkout Bar */}
      <div className={`fixed bottom-[60px] left-0 right-0 bg-white border-t border-gray-200 shadow-2xl transition-transform duration-300 z-20 ${cart.length === 0 ? 'translate-y-[120%]' : 'translate-y-0'}`}>
        <div className="px-4 pb-4 pt-4">
          <div className="mb-3">
             <p className="text-[10px] font-bold text-gray-400 mb-2 uppercase">Metode Pembayaran</p>
             <div className="grid grid-cols-3 gap-2">
                {['Cash', 'QRIS', 'Transfer'].map((m) => (
                  <button key={m} onClick={() => setPaymentMethod(m as any)} className={`flex flex-col items-center justify-center p-2 rounded-lg border text-[10px] font-bold ${paymentMethod === m ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>{m}</button>
                ))}
             </div>
          </div>
          <div className="flex justify-between items-end mb-3 border-t border-gray-100 pt-3">
             <div><p className="text-xs text-gray-500">Total Bayar</p><div className="text-xl font-bold text-blue-700">Rp {calculateTotal.toLocaleString('id-ID')}</div></div>
             <button onClick={() => setCart([])} className="text-xs text-red-500 font-medium underline">Hapus Keranjang</button>
          </div>
          <button onClick={handleOpenCupModal} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-sm shadow-lg">Lanjutkan Pembayaran ({totalItemsInCart} Item)</button>
        </div>
      </div>

      {/* MODAL PILIH CUP */}
      {showCupModal && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-end justify-center animate-fade-in backdrop-blur-sm">
           <div className="bg-white w-full max-w-md rounded-t-[2.5rem] p-6 pb-8 shadow-2xl animate-slide-up">
              <div className="flex justify-between items-center mb-6">
                 <div>
                    <h3 className="text-lg font-bold text-gray-800">Pilih Jenis Cup</h3>
                    <p className="text-xs text-gray-500">Dibutuhkan: {totalItemsInCart} Cup</p>
                 </div>
                 <button onClick={() => setShowCupModal(false)} className="p-2 bg-gray-100 rounded-full text-gray-500"><X size={20}/></button>
              </div>

              <div className="space-y-3 mb-8 max-h-[40vh] overflow-y-auto no-scrollbar">
                 {cupItems.map(cup => (
                    <button 
                       key={cup.id}
                       disabled={cup.stock < totalItemsInCart}
                       onClick={() => setSelectedCupId(cup.id)}
                       className={`w-full p-4 rounded-2xl border-2 transition-all flex justify-between items-center ${
                          selectedCupId === cup.id ? 'border-blue-500 bg-blue-50' : 'border-gray-100 bg-gray-50'
                       } ${cup.stock < totalItemsInCart ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                    >
                       <div className="text-left">
                          <div className={`font-bold ${selectedCupId === cup.id ? 'text-blue-700' : 'text-gray-700'}`}>{cup.name}</div>
                          <div className={`text-xs ${cup.stock < 10 ? 'text-red-500 font-bold' : 'text-gray-500'}`}>Stok Tersedia: {cup.stock}</div>
                       </div>
                       {selectedCupId === cup.id && <div className="bg-blue-600 p-1 rounded-full text-white"><Check size={14}/></div>}
                    </button>
                 ))}
              </div>

              <button 
                onClick={handleCheckout}
                disabled={!selectedCupId || isSaving}
                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-sm shadow-xl flex items-center justify-center disabled:bg-gray-300 transition-all active:scale-95"
              >
                {isSaving ? <Loader2 className="animate-spin mr-2" size={18} /> : "Konfirmasi & Bayar"}
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default InputForm;
