import { Product } from '../types';
import { getApiUrl } from './storageService';

const PRODUCTS_KEY = 'tokosheet_products';

// Data awal kosong sesuai permintaan
const INITIAL_PRODUCTS: Product[] = [];

// Helper untuk parse data dari Sheet
const parseSheetData = (data: any[]): Product[] => {
  return data
    .filter((row: any) => row[0] && row[1]) // Pastikan ID dan Nama ada
    .map((row: any) => ({
      id: String(row[0]),
      name: String(row[1]),
      price: Number(row[2]) || 0,
      category: String(row[3])
    }));
};

export const fetchProducts = async (): Promise<Product[]> => {
  const apiUrl = getApiUrl();

  // 1. Coba fetch dari Google Sheet jika ada URL
  if (apiUrl) {
    try {
      const separator = apiUrl.includes('?') ? '&' : '?';
      const url = `${apiUrl}${separator}type=products&t=${Date.now()}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Network response was not ok');
      
      const json = await response.json();
      if (json.status === 'success' && Array.isArray(json.data)) {
        const products = parseSheetData(json.data);
        // Update cache lokal
        localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
        return products;
      }
    } catch (error) {
      console.error("Gagal mengambil produk dari Sheet, menggunakan cache lokal:", error);
    }
  }

  // 2. Fallback ke LocalStorage (Cache atau Offline)
  const stored = localStorage.getItem(PRODUCTS_KEY);
  if (stored) {
    return JSON.parse(stored);
  }

  return [];
};

export const syncProductsToCloud = async (products: Product[]): Promise<boolean> => {
  // Simpan ke LocalStorage dulu agar UI cepat
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));

  const apiUrl = getApiUrl();
  if (apiUrl) {
    try {
      // Mengirim seluruh list produk untuk direplace di Sheet (agar support edit/delete)
      const payload = {
        action: 'update_products',
        data: products.map(p => [p.id, p.name, p.price, p.category])
      };

      await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      return true;
    } catch (error) {
      console.error("Gagal sinkronisasi produk ke cloud:", error);
      return false; // Gagal sync cloud, tapi lokal tersimpan
    }
  }
  return true; // Sukses (karena mode offline dianggap sukses simpan lokal)
};

// Fungsi Helper sync wrapper (opsional untuk backward compatibility logic)
export const saveProductList = async (products: Product[]) => {
    return await syncProductsToCloud(products);
};