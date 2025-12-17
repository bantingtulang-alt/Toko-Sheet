import React, { useState, useEffect } from 'react';
import { Purchase } from '../types';
import { addPurchase } from '../services/storageService';
import { Loader2, Plus, ShoppingBag, DollarSign, Archive } from 'lucide-react';

interface PurchaseViewProps {
  purchases: Purchase[];
  onReload: () => void;
}

const PurchaseView: React.FC<PurchaseViewProps> = ({ purchases, onReload }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    itemName: '',
    supplier: '',
    quantity: '',
    price: ''
  });

  const totalPurchases = purchases.reduce((sum, p) => sum + p.total, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.itemName || !formData.quantity || !formData.price) return;

    setIsSubmitting(true);
    try {
      const qty = parseInt(formData.quantity);
      const prc = parseInt(formData.price);
      
      const newPurchase: Purchase = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        itemName: formData.itemName,
        supplier: formData.supplier || '-',
        quantity: qty,
        price: prc,
        total: qty * prc
      };

      await addPurchase(newPurchase);
      setFormData({ itemName: '', supplier: '', quantity: '', price: '' });
      onReload(); // Refresh data
      alert('Pembelian berhasil disimpan!');
    } catch (error) {
      console.error(error);
      alert('Gagal menyimpan pembelian.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-h-screen bg-gray-50 pb-24">
      <header className="bg-white p-4 border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <h1 className="text-xl font-bold text-gray-800 flex items-center">
          <ShoppingBag className="mr-2 text-orange-500" size={24} />
          Pembelian Stok
        </h1>
        <p className="text-xs text-gray-500 mt-1">Catat pengeluaran belanja toko</p>
      </header>

      <div className="overflow-y-auto no-scrollbar flex-1 p-4 space-y-6">
        
        {/* Total Card */}
        <div className="bg-orange-500 text-white p-4 rounded-xl shadow-lg flex justify-between items-center">
          <div>
            <p className="text-orange-100 text-xs font-medium mb-1">Total Pengeluaran</p>
            <h2 className="text-2xl font-bold">Rp {totalPurchases.toLocaleString('id-ID')}</h2>
          </div>
          <div className="bg-white bg-opacity-20 p-2 rounded-lg">
            <Archive size={24} className="text-white" />
          </div>
        </div>

        {/* Input Form */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-700 mb-3 text-sm">Tambah Pembelian Baru</h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Nama Barang</label>
              <input
                type="text"
                value={formData.itemName}
                onChange={e => setFormData({...formData, itemName: e.target.value})}
                placeholder="Misal: Gula Pasir 1kg"
                className="w-full border-b border-gray-300 py-2 focus:border-orange-500 outline-none text-sm font-medium"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
               <div>
                <label className="text-xs text-gray-500 block mb-1">Jumlah</label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={e => setFormData({...formData, quantity: e.target.value})}
                  placeholder="0"
                  className="w-full border-b border-gray-300 py-2 focus:border-orange-500 outline-none text-sm font-medium"
                  required
                />
              </div>
               <div>
                <label className="text-xs text-gray-500 block mb-1">Harga Satuan (Rp)</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={e => setFormData({...formData, price: e.target.value})}
                  placeholder="0"
                  className="w-full border-b border-gray-300 py-2 focus:border-orange-500 outline-none text-sm font-medium"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500 block mb-1">Supplier / Toko (Opsional)</label>
              <input
                type="text"
                value={formData.supplier}
                onChange={e => setFormData({...formData, supplier: e.target.value})}
                placeholder="Nama Toko"
                className="w-full border-b border-gray-300 py-2 focus:border-orange-500 outline-none text-sm font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 bg-orange-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-orange-700 flex items-center justify-center shadow-md shadow-orange-200 transition-all active:scale-95"
            >
              {isSubmitting ? <Loader2 className="animate-spin" /> : <><Plus size={18} className="mr-2"/> Simpan Pembelian</>}
            </button>
          </form>
        </div>

        {/* Recent List */}
        <div>
           <h3 className="font-bold text-gray-700 mb-3 text-sm">Riwayat Belanja</h3>
           <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
             {purchases.length === 0 ? (
               <div className="p-6 text-center text-gray-400 text-xs">Belum ada data pembelian.</div>
             ) : (
               purchases.map((p, idx) => (
                 <div key={p.id} className={`p-3 flex justify-between items-center ${idx !== purchases.length -1 ? 'border-b border-gray-50' : ''}`}>
                    <div>
                      <div className="font-semibold text-gray-800 text-sm">{p.itemName}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(p.date).toLocaleDateString('id-ID')} • {p.supplier}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {p.quantity} x Rp {p.price.toLocaleString('id-ID')}
                      </div>
                    </div>
                    <div className="font-bold text-orange-600 text-sm">
                       -Rp {p.total.toLocaleString('id-ID')}
                    </div>
                 </div>
               ))
             )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseView;