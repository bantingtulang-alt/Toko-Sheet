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

// --- SETTINGS MANAGEMENT (PIN & CUP STOCK) ---

export const fetchSettings = async () => {
  const apiUrl = getApiUrl();
  const defaultSettings = {
    adminPin: localStorage.getItem(ADMIN_PIN_KEY) || '1234',
    cashierPin: localStorage.getItem(CASHIER_PIN_KEY) || '0000',
    cupStock: [] as CupItem[]
  };

  const localCup = localStorage.getItem(CUP_STOCK_KEY);
  if (localCup) {
    try {
      defaultSettings.cupStock = JSON.parse(localCup);
    } catch (e) {
      defaultSettings.cupStock = [];
    }
  }

  if (apiUrl) {
    try {
      const separator = apiUrl.includes('?') ? '&' : '?';
      const response = await fetch(`${apiUrl}${separator}type=settings&t=${Date.now()}`);
      
      if (response.ok) {
        const json = await response.json();
        if (json.status === 'success') {
          const aPin = String(json.adminPin || defaultSettings.adminPin);
          const cPin = String(json.cashierPin || defaultSettings.cashierPin);
          
          let cStock: CupItem[] = [];
          if (json.cupStock) {
            try {
              cStock = typeof json.cupStock === 'string' ? JSON.parse(json.cupStock) : json.cupStock;
            } catch (e) {
              console.error("Gagal parse cupStock dari cloud", e);
            }
          }
          
          localStorage.setItem(ADMIN_PIN_KEY, aPin);
          localStorage.setItem(CASHIER_PIN_KEY, cPin);
          localStorage.setItem(CUP_STOCK_KEY, JSON.stringify(cStock));
          
          return { adminPin: aPin, cashierPin: cPin, cupStock: cStock };
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

export const fetchCupItems = async (): Promise<CupItem[]> => {
  const settings = await fetchSettings();
  return settings.cupStock;
};

export const saveSetting = async (key: 'ADMIN_PIN' | 'CASHIER_PIN' | 'CUP_STOCK', value: any): Promise<boolean> => {
  const localKey = key === 'ADMIN_PIN' ? ADMIN_PIN_KEY : (key === 'CASHIER_PIN' ? CASHIER_PIN_KEY : CUP_STOCK_KEY);
  const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
  localStorage.setItem(localKey, stringValue);
  
  const apiUrl = getApiUrl();
  if (apiUrl) {
    try {
      const payload = {
        action: 'update_setting',
        key: key,
        value: stringValue
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

// --- DATA RESET (IMPROVED) ---

export const resetData = async (type: 'sales' | 'purchases'): Promise<boolean> => {
  const apiUrl = getApiUrl();
  
  // Clear LocalStorage dulu agar UI segera update jika offline
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
      console.error(`Gagal reset ${type} di cloud:`, error);
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