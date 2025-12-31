
import { Transaction, Purchase, CupItem } from '../types';

const STORAGE_KEY = 'tokosheet_data';
const PURCHASE_KEY = 'tokosheet_purchases';
const API_URL_KEY = 'tokosheet_api_url';
const ADMIN_PIN_KEY = 'tokosheet_admin_pin';
const CASHIER_PIN_KEY = 'tokosheet_cashier_pin';
const CUP_STOCK_KEY = 'tokosheet_cup_stock';

export const getApiUrl = (): string => {
  return localStorage.getItem(API_URL_KEY) || '';
};

export const saveApiUrl = (url: string) => {
  localStorage.setItem(API_URL_KEY, url);
};

// --- SETTINGS MANAGEMENT (PIN ONLY) ---

export const fetchSettings = async () => {
  const apiUrl = getApiUrl();
  const defaultSettings = {
    adminPin: localStorage.getItem(ADMIN_PIN_KEY) || '1234',
    cashierPin: localStorage.getItem(CASHIER_PIN_KEY) || '0000'
  };

  if (apiUrl) {
    try {
      const separator = apiUrl.includes('?') ? '&' : '?';
      const response = await fetch(`${apiUrl}${separator}type=settings&t=${Date.now()}`);
      
      if (response.ok) {
        const json = await response.json();
        if (json.status === 'success') {
          const aPin = String(json.adminPin || defaultSettings.adminPin);
          const cPin = String(json.cashierPin || defaultSettings.cashierPin);
          
          localStorage.setItem(ADMIN_PIN_KEY, aPin);
          localStorage.setItem(CASHIER_PIN_KEY, cPin);
          
          return { adminPin: aPin, cashierPin: cPin };
        }
      }
    } catch (error) {
      console.error("Gagal ambil settings dari cloud", error);
    }
  }

  return defaultSettings;
};

export const fetchAdminPin = async (): Promise<string> => {
  const settings = await fetchSettings();
  return settings.adminPin;
};

export const fetchCashierPin = async (): Promise<string> => {
  const settings = await fetchSettings();
  return settings.cashierPin;
};

export const saveSetting = async (key: 'ADMIN_PIN' | 'CASHIER_PIN', value: string): Promise<boolean> => {
  const localKey = key === 'ADMIN_PIN' ? ADMIN_PIN_KEY : CASHIER_PIN_KEY;
  localStorage.setItem(localKey, value);
  
  const apiUrl = getApiUrl();
  if (apiUrl) {
    try {
      const payload = {
        action: 'update_setting',
        key: key,
        value: value
      };

      await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      return true;
    } catch (error) {
      console.error(`Gagal simpan ${key} ke cloud:`, error);
      return false; 
    }
  }
  return true;
};

// --- CUP STOCK MANAGEMENT (INDEPENDENT SHEET) ---

export const fetchCupItems = async (): Promise<CupItem[]> => {
  const apiUrl = getApiUrl();
  
  if (apiUrl) {
    try {
      const separator = apiUrl.includes('?') ? '&' : '?';
      const response = await fetch(`${apiUrl}${separator}type=cups&t=${Date.now()}`);
      const json = await response.json();
      if (json.status === 'success' && Array.isArray(json.data)) {
        const cups = json.data.map((row: any) => ({
          id: String(row[0]),
          name: String(row[1]),
          stock: Number(row[2]) || 0
        }));
        localStorage.setItem(CUP_STOCK_KEY, JSON.stringify(cups));
        return cups;
      }
    } catch (error) {
      console.error("Gagal fetch cups dari cloud:", error);
    }
  }

  const local = localStorage.getItem(CUP_STOCK_KEY);
  return local ? JSON.parse(local) : [];
};

export const saveCupList = async (cups: CupItem[]): Promise<boolean> => {
  localStorage.setItem(CUP_STOCK_KEY, JSON.stringify(cups));
  
  const apiUrl = getApiUrl();
  if (apiUrl) {
    try {
      const payload = {
        action: 'update_cups',
        data: cups.map(c => [c.id, c.name, c.stock])
      };

      await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      return true;
    } catch (error) {
      console.error("Gagal sinkron cups ke cloud:", error);
      return false;
    }
  }
  return true;
};

// --- DATA RESET (STABLE) ---

export const resetData = async (type: 'sales' | 'purchases'): Promise<boolean> => {
  const apiUrl = getApiUrl();
  const key = type === 'sales' ? STORAGE_KEY : PURCHASE_KEY;
  localStorage.setItem(key, JSON.stringify([]));

  if (apiUrl) {
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'reset_data', type: type })
      });
      
      const result = await response.json();
      return result.status === 'success';
    } catch (error) {
      console.error(`Error Reset Cloud:`, error);
      return false;
    }
  }
  return true;
};

// --- DATA FETCHING ---

export const fetchTransactions = async (): Promise<Transaction[]> => {
  const apiUrl = getApiUrl();
  if (apiUrl) {
    try {
      const separator = apiUrl.includes('?') ? '&' : '?';
      const response = await fetch(`${apiUrl}${separator}type=sales&t=${Date.now()}`);
      const data = await response.json();
      if (data.status === 'success' && Array.isArray(data.data)) {
        return data.data
          .filter((row: any) => row[0] && row[2]) 
          .map((row: any) => ({
            id: String(row[0]), date: String(row[1]), productName: String(row[2]),
            category: String(row[3]), quantity: Number(row[4]) || 0,
            price: Number(row[5]) || 0, total: Number(row[6]) || 0,
            paymentMethod: row[7] || 'Cash'
          })).reverse(); 
      }
      return [];
    } catch (error) { return []; }
  } else {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }
};

export const fetchPurchases = async (): Promise<Purchase[]> => {
  const apiUrl = getApiUrl();
  if (apiUrl) {
    try {
      const separator = apiUrl.includes('?') ? '&' : '?';
      const response = await fetch(`${apiUrl}${separator}type=purchases&t=${Date.now()}`);
      const data = await response.json();
      if (data.status === 'success' && Array.isArray(data.data)) {
        return data.data
          .filter((row: any) => row[0] && row[2])
          .map((row: any) => ({
            id: String(row[0]), date: String(row[1]), itemName: String(row[2]),
            supplier: String(row[3]), quantity: Number(row[4]) || 0,
            price: Number(row[5]) || 0, total: Number(row[6]) || 0
          })).reverse();
      }
      return [];
    } catch (error) { return []; }
  } else {
    const data = localStorage.getItem(PURCHASE_KEY);
    return data ? JSON.parse(data) : [];
  }
};

export const addTransaction = async (transaction: Transaction): Promise<void> => {
  const apiUrl = getApiUrl();
  if (apiUrl) {
    await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'add_sale', 
        data: [
          transaction.id, transaction.date, transaction.productName,
          transaction.category, transaction.quantity, transaction.price,
          transaction.total, transaction.paymentMethod
        ]
      })
    });
  } else {
    const current = await fetchTransactions();
    localStorage.setItem(STORAGE_KEY, JSON.stringify([transaction, ...current]));
  }
};

export const addPurchase = async (purchase: Purchase): Promise<void> => {
  const apiUrl = getApiUrl();
  if (apiUrl) {
    await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'add_purchase',
        data: [
          purchase.id, purchase.date, purchase.itemName,
          purchase.supplier, purchase.quantity, purchase.price, purchase.total
        ]
      })
    });
  } else {
    const current = await fetchPurchases();
    localStorage.setItem(PURCHASE_KEY, JSON.stringify([purchase, ...current]));
  }
};

export const seedInitialData = () => {
  if (!localStorage.getItem(STORAGE_KEY) && !getApiUrl()) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  }
};
