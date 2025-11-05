import { getAuthHeaders } from '../context/session';
import { fetchAuthSession } from 'aws-amplify/auth';
import type { WeeklyPurchases, YearlySummary, MonthlySummary } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://apis.betafactory.info/docs/v1';
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.MODE === 'development';

// Mock data imports
import { mockData } from '../mock/mockPurchases';
import { mockYearlySummary } from '../mock/mockYearlySummary';
import { mockMonthlySummary } from '../mock/mockMonthlySummary';

class ApiService {
  private async request(endpoint: string, options: RequestInit = {}) {
    if (USE_MOCK) {
      return this.mockRequest(endpoint);
    }

    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: { ...headers, ...options.headers }
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  private async mockRequest(endpoint: string) {
    await new Promise(resolve => setTimeout(resolve, 500));

    if (endpoint.includes('/upload')) {
      return {
        merchant: 'Mock Store',
        purchaseDate: '2024-01-15',
        items: [{ itemName: 'Mock Item', itemCost: 10.99 }],
        totalItems: 1,
        processingTimeMs: 1200
      };
    }

    if (endpoint.includes('/purchases/summary')) {
      return endpoint.includes('month') ? mockMonthlySummary : mockYearlySummary;
    }

    if (endpoint.includes('/purchases')) {
      return JSON.parse(JSON.stringify(mockData));
    }

    return {};
  }

  async uploadDocument(file: File, docType: string) {
    if (USE_MOCK) {
      return this.mockRequest('/upload');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', docType);

    const session = await fetchAuthSession();
    const headers: HeadersInit = {};
    const idToken = session.tokens?.idToken?.toString();
    if (idToken) {
      headers['Authorization'] = `Bearer ${idToken}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      headers: headers,
      body: formData
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  async getPurchases(date: string): Promise<WeeklyPurchases> {
    return this.request(`/purchases?date=${date}`);
  }

  async getSummary(year: number, month?: number): Promise<YearlySummary | MonthlySummary> {
    const monthParam = month ? `&month=${month}` : '';
    return this.request(`/purchases/summary?year=${year}${monthParam}`);
  }

  async updateItem(itemId: string, itemName: string, itemCost: number) {
    if (USE_MOCK) {
      console.log('Mock: Update item', { itemId, itemName, itemCost });
      return {};
    }

    return this.request('/items', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId, itemName, itemCost })
    });
  }

  async deleteItem(itemId: string) {
    if (USE_MOCK) {
      console.log('Mock: Delete item', itemId);
      return {};
    }

    return this.request('/items', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId })
    });
  }

  async updateReceiptDate(receiptId: string, newDate: string) {
    if (USE_MOCK) {
      console.log('Mock: Update receipt date', { receiptId, newDate });
      return {};
    }

    return this.request(`/receipts/${receiptId}/date`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newDate })
    });
  }

  async deleteReceipt(receiptId: string, purchaseDate?: string) {
    if (USE_MOCK) {
      console.log('Mock: Delete receipt', { receiptId, purchaseDate });
      return {};
    }

    return this.request(`/receipts/${receiptId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: purchaseDate ? JSON.stringify({ purchaseDate }) : undefined
    });
  }
}

export const apiService = new ApiService();