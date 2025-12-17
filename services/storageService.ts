import { Transaction, Purchase } from '../types';

const STORAGE_KEY = 'tokosheet_data';
const PURCHASE_KEY = 'tokosheet_purchases';
const API_URL_KEY = 'tokosheet_api_url';

// Helper untuk mendapatkan URL
export const getApiUrl = (): string => {
  return localStorage.getItem(API_URL_KEY) || '';
};

export const saveApiUrl = (url: string) => {
  localStorage.setItem(API_URL_KEY, url);
};

// --- DATA FETCHING (SALES) ---

export const fetchTransactions = async (): Promise<Transaction[]> => {
  const apiUrl = getApiUrl();

  // Mode Online (Google Sheet)
  if (apiUrl) {
    try {
      const separator = apiUrl.includes('?') ? '&' : '?';
      // Default type is sales if not specified by script, but we send explicit type just in case script updates
      const urlWithCacheBuster = `${apiUrl}${separator}type=sales&t=${Date.now()}`;

      const response = await fetch(urlWithCacheBuster);
      
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        throw new Error("URL mengembalikan HTML. Pastikan 'Who has access' diatur ke 'Anyone' saat Deploy.");
      }

      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
      
      const data = await response.json();
      
      if (data.status === 'success' && Array.isArray(data.data)) {
        return data.data
          .filter((row: any) => row[0] && row[2]) 
          .map((row: any) => ({
            id: String(row[0]),
            date: String(row[1]),
            productName: String(row[2]),
            category: String(row[3]),
            quantity: Number(row[4]) || 0,
            price: Number(row[5]) || 0,
            total: Number(row[6]) || 0,
            paymentMethod: row[7] || 'Cash' // Col 7 is payment method
          }))
          .reverse(); 
      }
      return [];
    } catch (error) {
      console.error("Fetch Transactions Error:", error);
      throw error; 
    }
  } 
  
  // Mode Offline (LocalStorage)
  else {
    return new Promise((resolve) => {
      const data = localStorage.getItem(STORAGE_KEY);
      resolve(data ? JSON.parse(data) : []);
    });
  }
};

// --- DATA FETCHING (PURCHASES) ---

export const fetchPurchases = async (): Promise<Purchase[]> => {
  const apiUrl = getApiUrl();

  if (apiUrl) {
    try {
      const separator = apiUrl.includes('?') ? '&' : '?';
      // Request type=purchases
      const urlWithCacheBuster = `${apiUrl}${separator}type=purchases&t=${Date.now()}`;

      const response = await fetch(urlWithCacheBuster);
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
      
      const data = await response.json();
      
      if (data.status === 'success' && Array.isArray(data.data)) {
        return data.data
          .filter((row: any) => row[0] && row[2])
          .map((row: any) => ({
            id: String(row[0]),
            date: String(row[1]),
            itemName: String(row[2]),
            supplier: String(row[3]), // Assuming col 4 is supplier
            quantity: Number(row[4]) || 0,
            price: Number(row[5]) || 0,
            total: Number(row[6]) || 0
          }))
          .reverse();
      }
      return [];
    } catch (error) {
      console.error("Fetch Purchases Error:", error);
      return []; // Return empty on error to avoid breaking UI
    }
  } else {
    return new Promise((resolve) => {
      const data = localStorage.getItem(PURCHASE_KEY);
      resolve(data ? JSON.parse(data) : []);
    });
  }
};

// --- DATA SAVING ---

export const addTransaction = async (transaction: Transaction): Promise<void> => {
  const apiUrl = getApiUrl();

  if (apiUrl) {
    const payload = {
      action: 'add_sale', 
      data: [
        transaction.id,
        transaction.date,
        transaction.productName,
        transaction.category,
        transaction.quantity,
        transaction.price,
        transaction.total,
        transaction.paymentMethod // Add payment method to end of array
      ]
    };

    await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
  } else {
    const current = await fetchTransactions();
    const updated = [transaction, ...current];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }
};

export const addPurchase = async (purchase: Purchase): Promise<void> => {
  const apiUrl = getApiUrl();

  if (apiUrl) {
    const payload = {
      action: 'add_purchase',
      data: [
        purchase.id,
        purchase.date,
        purchase.itemName,
        purchase.supplier,
        purchase.quantity,
        purchase.price,
        purchase.total
      ]
    };

    await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
  } else {
    const current = await fetchPurchases();
    const updated = [purchase, ...current];
    localStorage.setItem(PURCHASE_KEY, JSON.stringify(updated));
  }
};

export const seedInitialData = () => {
  if (!localStorage.getItem(STORAGE_KEY) && !getApiUrl()) {
    const initialData: Transaction[] = [
      { id: '1', date: '2023-10-25T08:30:00', productName: 'Kopi Susu Gula Aren', category: 'Minuman', quantity: 2, price: 18000, total: 36000, paymentMethod: 'Cash' },
      { id: '2', date: '2023-10-25T09:15:00', productName: 'Roti Bakar Coklat', category: 'Makanan', quantity: 1, price: 15000, total: 15000, paymentMethod: 'QRIS' },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
  }
};