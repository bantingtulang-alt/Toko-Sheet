
export interface Transaction {
  id: string;
  date: string;
  productName: string;
  category: string;
  quantity: number;
  price: number;
  total: number;
  paymentMethod: 'Cash' | 'QRIS' | 'Transfer';
  cupId?: string; // Menyimpan ID cup yang digunakan
}

export interface Purchase {
  id: string;
  date: string;
  itemName: string;
  quantity: number;
  price: number;
  total: number;
  supplier: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
}

export interface CupItem {
  id: string;
  name: string;
  stock: number;
}

export enum UserRole {
  ADMIN = 'ADMIN',
  CASHIER = 'CASHIER'
}

export enum TabView {
  DASHBOARD = 'DASHBOARD',
  INPUT = 'INPUT',
  PURCHASE = 'PURCHASE',
  SHEET = 'SHEET',
  AI_ANALYSIS = 'AI_ANALYSIS',
  ADMIN_PANEL = 'ADMIN_PANEL'
}

export interface AnalysisState {
  isLoading: boolean;
  result: string | null;
  error: string | null;
}
