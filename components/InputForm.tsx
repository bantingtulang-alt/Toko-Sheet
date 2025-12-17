import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, Product } from '../types';
import { fetchProducts } from '../services/productService';
import { Save, Loader2, Minus, Plus, Coffee, CupSoda, Trash2, ShoppingCart, Utensils, Package, Search, Wallet, QrCode, Smartphone } from 'lucide-react';

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

  // Load products on mount (Async)
  useEffect(() => {
    const loadData = async () => {
      setIsLoadingProducts(true);
      const products = await fetchProducts();
      setMenuItems(products);
      setIsLoadingProducts(false);
    };
    loadData();
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(menuItems.map(p => p.category));
    // Sort specific categories if present
    const preferredOrder = ['Teh', 'Kopi', 'Susu', 'Coklat'];
    const sortedCats = Array.from(cats).sort((a, b) => {
       const indexA = preferredOrder.indexOf(a);
       const indexB = preferredOrder.indexOf(b);
       if (indexA !== -1 && indexB !== -1) return indexA - indexB;
       if (indexA !== -1) return -1;
       if (indexB !== -1) return 1;
       return a.localeCompare(b);
    });
    return ['Semua', ...sortedCats];
  }, [menuItems]);

  const filteredItems = useMemo(() => {
    if (selectedCategory === 'Semua') return menuItems;
    return menuItems.filter(item => item.category === selectedCategory);
  }, [menuItems, selectedCategory]);

  const getIcon = (category: string) => {
    const cat = category.toLowerCase();
    if (cat === 'kopi') return <Coffee size={20} />;
    if (cat === 'teh' || cat === 'susu' || cat === 'coklat') return <CupSoda size={20} />;
    return <Package size={20} />;
  };

  const addToCart = (item: Product) => {
    setCart((prevCart) => {
      const existingItemIndex = prevCart.findIndex((cartItem) => cartItem.productName === item.name);
      
      if (existingItemIndex > -1) {
        const newCart = [...prevCart];
        newCart[existingItemIndex].quantity += 1;
        return newCart;
      } else {
        return [...prevCart, {
          productName: item.name,
          category: item.category,
          price: item.price,
          quantity: 1
        }];
      }
    });
  };

  const updateQuantity = (productName: string, delta: number) => {
    setCart((prevCart) => {
      return prevCart.map(item => {
        if (item.productName === productName) {
          return { ...item, quantity: Math.max(0, item.quantity + delta) };
        }
        return item;
      }).filter(item => item.quantity > 0);
    });
  };

  const calculateTotal = useMemo(() => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  }, [cart]);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsSaving(true);

    try {
      const batchId = Date.now().toString(); // Use same ID prefix for batch tracking if needed
      for (const item of cart) {
        const newTransaction: Transaction = {
          id: batchId + Math.random().toString().slice(2, 5),
          date: new Date().toISOString(),
          productName: item.productName,
          category: item.category,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity,
          paymentMethod: paymentMethod
        };
        await onSave(newTransaction);
      }
      
      setCart([]);
      setPaymentMethod('Cash'); // Reset to default
      alert('Transaksi berhasil disimpan!');
    } catch (error) {
      console.error(error);
      alert('Gagal menyimpan data.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-h-screen bg-gray-50">
      {/* Header & Filter */}
      <div className="bg-white px-4 pt-4 pb-2 border-b border-gray-200 shadow-sm z-10">
        <div className="flex justify-between items-center mb-3">
          <h1 className="text-lg font-bold text-gray-800">Kasir</h1>
          <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
            {isLoadingProducts ? '...' : filteredItems.length} Produk
          </div>
        </div>
        
        {/* Category Scroll */}
        <div className="flex overflow-x-auto no-scrollbar space-x-2 pb-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                selectedCategory === cat 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-200' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-3 pb-40">
        {isLoadingProducts ? (
           <div className="flex flex-col justify-center items-center h-40 text-gray-400">
             <Loader2 className="animate-spin mb-2" />
             <p className="text-xs">Memuat produk...</p>
           </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {filteredItems.map((item) => {
              const cartItem = cart.find(c => c.productName === item.name);
              const quantityInCart = cartItem ? cartItem.quantity : 0;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => addToCart(item)}
                  className={`p-2 rounded-xl border transition-all flex flex-col items-center justify-between relative overflow-hidden active:scale-95 h-28 ${
                    quantityInCart > 0
                      ? 'bg-blue-50 border-blue-500 shadow-sm' 
                      : 'bg-white text-gray-600 border-gray-200 shadow-sm hover:shadow-md'
                  }`}
                >
                  {/* Badge Qty */}
                  {quantityInCart > 0 && (
                    <div className="absolute top-1 right-1 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm z-10">
                      {quantityInCart}
                    </div>
                  )}
                  
                  <div className={`mt-1 p-2 rounded-full ${quantityInCart > 0 ? 'bg-blue-100 text-blue-600' : 'bg-gray-50 text-gray-400'}`}>
                    {getIcon(item.category)}
                  </div>
                  
                  <div className="w-full text-center">
                    <div className="font-semibold text-[11px] text-gray-800 leading-tight line-clamp-2 min-h-[2.5em] flex items-center justify-center">
                      {item.name}
                    </div>
                    <div className="text-[10px] font-bold text-blue-600 mt-1">
                      Rp {item.price.toLocaleString('id-ID')}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
        
        {!isLoadingProducts && filteredItems.length === 0 && (
          <div className="text-center py-10 text-gray-400 text-xs flex flex-col items-center">
            <Package size={32} className="mb-2 opacity-50"/>
            <p>Tidak ada produk.</p>
            {menuItems.length === 0 && <p className="mt-1">Silakan tambah produk di menu Admin.</p>}
          </div>
        )}
      </div>

      {/* Cart Bottom Sheet */}
      <div className={`fixed bottom-[60px] left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] transition-transform duration-300 z-20 ${cart.length === 0 ? 'translate-y-[120%]' : 'translate-y-0'}`}>
        {/* Drag handle visual */}
        <div className="w-full flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
        </div>

        <div className="px-4 pb-4 pt-1">
          
          {/* Payment Method Selector */}
          <div className="mb-3">
             <p className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-wide">Metode Pembayaran</p>
             <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setPaymentMethod('Cash')}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${
                    paymentMethod === 'Cash' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-500'
                  }`}
                >
                  <Wallet size={18} className="mb-1" />
                  <span className="text-[10px] font-bold">Cash</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('QRIS')}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${
                    paymentMethod === 'QRIS' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-500'
                  }`}
                >
                  <QrCode size={18} className="mb-1" />
                  <span className="text-[10px] font-bold">QRIS</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('Transfer')}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${
                    paymentMethod === 'Transfer' ? 'bg-purple-50 border-purple-500 text-purple-700' : 'bg-gray-50 border-gray-200 text-gray-500'
                  }`}
                >
                  <Smartphone size={18} className="mb-1" />
                  <span className="text-[10px] font-bold">Transfer</span>
                </button>
             </div>
          </div>

          <div className="flex justify-between items-end mb-3 border-t border-gray-100 pt-3">
             <div>
                <p className="text-xs text-gray-500 mb-0.5">Total Bayar</p>
                <div className="text-xl font-bold text-blue-700">Rp {calculateTotal.toLocaleString('id-ID')}</div>
             </div>
             <div className="text-right">
                <p className="text-xs text-gray-500 mb-0.5">{cart.reduce((a,b) => a + b.quantity, 0)} Item</p>
                <button 
                  onClick={() => setCart([])}
                  className="text-xs text-red-500 font-medium underline"
                >
                  Hapus Semua
                </button>
             </div>
          </div>

          <div className="flex space-x-2">
             {/* Mini Cart Preview */}
             <div className="flex-1 flex space-x-2 overflow-x-auto no-scrollbar py-1">
                {cart.map((item) => (
                  <div key={item.productName} className="flex-shrink-0 bg-gray-50 border border-gray-200 rounded-lg p-2 flex flex-col justify-center min-w-[80px]">
                      <div className="text-[10px] font-bold text-gray-800 truncate max-w-[70px]">{item.productName}</div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-[10px] text-blue-600 font-bold">x{item.quantity}</span>
                        <div className="flex space-x-1">
                          <button onClick={() => updateQuantity(item.productName, -1)} className="p-0.5 bg-white rounded border border-gray-300 text-gray-600">
                             <Minus size={8} />
                          </button>
                           <button onClick={() => updateQuantity(item.productName, 1)} className="p-0.5 bg-white rounded border border-gray-300 text-blue-600">
                             <Plus size={8} />
                          </button>
                        </div>
                      </div>
                  </div>
                ))}
             </div>
             
             <button
                type="button"
                onClick={handleCheckout}
                disabled={isSaving}
                className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-blue-700 active:scale-95 transition-all flex items-center shadow-lg shadow-blue-200 flex-shrink-0"
              >
                {isSaving ? <Loader2 className="animate-spin" size={20} /> : "Bayar"}
              </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InputForm;