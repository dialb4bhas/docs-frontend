import { getAuthHeaders } from '../context/session';
import { fetchAuthSession } from 'aws-amplify/auth';
import type { WeeklyPurchases, YearlySummary, MonthlySummary, UserItemStatsResponse, UserSummaryStats, GlobalItemStats, UserCategoryStatsResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://apis.betafactory.info/docs/v1';
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.MODE === 'development';

// Mock data imports
import { mockData } from '../mock/mockPurchases';
import { mockYearlySummary } from '../mock/mockYearlySummary';
import { mockMonthlySummary } from '../mock/mockMonthlySummary';
import { mockItemStats } from '../mock/mockItemStats';

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

  private async mockRequest(endpoint: string, filters?: any, limit?: number, nextToken?: string) {
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

    if (endpoint.includes('/user-stats/items')) {
      let items = [...mockItemStats];
      
      // Simulate different data based on period
      const period = filters?.period;
      if (period?.startsWith('last-')) {
        const months = parseInt(period.split('-')[1]);
        items = items.map(item => ({
          ...item,
          totalSpent: item.totalSpent * (months / 12),
          purchaseCount: Math.ceil(item.purchaseCount * (months / 12))
        }));
      } else if (period?.includes('-') && period !== 'current-year') {
        // Specific month (e.g., '2024-03')
        items = items.map(item => ({
          ...item,
          totalSpent: item.totalSpent * 0.1,
          purchaseCount: Math.ceil(item.purchaseCount * 0.1)
        }));
      } else if (period && period !== 'current-year' && !period.includes('-')) {
        // Specific year (e.g., '2024')
        const year = parseInt(period);
        if (year < new Date().getFullYear()) {
          items = items.map(item => ({
            ...item,
            totalSpent: item.totalSpent * 0.8,
            purchaseCount: Math.ceil(item.purchaseCount * 0.8)
          }));
        }
      }
      
      const page = nextToken ? parseInt(nextToken) : 0;
      const pageSize = limit || 20;
      const start = page * pageSize;
      const paginatedItems = items.slice(start, start + pageSize);
      const hasMore = start + pageSize < items.length;
      
      return {
        timeFilter: {
          period: filters?.period || 'current-year',
          range: ['2024-01', '2024-02', '2024-03']
        },
        items: paginatedItems,
        hasMore,
        nextToken: hasMore ? (page + 1).toString() : undefined
      };
    }

    if (endpoint.includes('/user-stats/categories')) {
      return {
        userId: 'mock-user',
        totalSpent: 450.23,
        categories: [
          {
            category: 'Fruits',
            totalSpent: 147.60,
            itemCount: 3,
            avgSpentPerItem: 49.20,
            topItems: [
              { shortLabel: 'Bananas', totalSpent: 99.01 },
              { shortLabel: 'Avocado', totalSpent: 22.43 }
            ]
          },
          {
            category: 'Dairy',
            totalSpent: 134.75,
            itemCount: 2,
            avgSpentPerItem: 67.38,
            topItems: [
              { shortLabel: 'Milk', totalSpent: 89.45 },
              { shortLabel: 'Eggs', totalSpent: 45.30 }
            ]
          }
        ]
      };
    }

    if (endpoint.includes('/user-stats/summary')) {
      return {
        year: '2025',
        totalSpent: 450.23,
        totalUniqueItems: 25,
        avgSpentPerItem: 18.01,
        topItems: [
          { shortLabel: 'Banana', totalSpent: 99.01, purchaseCount: 14 }
        ]
      };
    }

    if (endpoint.includes('/item-stats')) {
      const itemName = new URLSearchParams(endpoint.split('?')[1]).get('itemName') || 'Unknown Item';
      return {
        itemName,
        totalSpent: 12345.67,
        totalPurchases: 456,
        avgCost: 27.05,
        lastUpdated: '2024-01-15T10:30:00'
      };
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

  async updateReceiptDate(receiptId: string, newDate: string, oldDate: string) {
    if (USE_MOCK) {
      console.log('Mock: Update receipt date', { receiptId, newDate, oldDate });
      return {};
    }

    return this.request(`/receipts`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldDate: oldDate, newDate: newDate, receiptId : receiptId })
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

  async getUserItemStats(limit: number = 20, nextToken?: string, period?: string): Promise<UserItemStatsResponse> {
    if (USE_MOCK) {
      return this.mockRequest('/user-stats/items', { period }, limit, nextToken);
    }
    const params = new URLSearchParams({ limit: limit.toString() });
    if (nextToken) params.append('nextToken', nextToken);
    if (period) params.append('period', period);
    return this.request(`/user-stats/items?${params}`);
  }

  async getUserSummaryStats(): Promise<UserSummaryStats> {
    if (USE_MOCK) {
      return this.mockRequest('/user-stats/summary');
    }
    return this.request('/user-stats/summary');
  }

  async getGlobalItemStats(itemName: string): Promise<GlobalItemStats> {
    if (USE_MOCK) {
      return this.mockRequest(`/item-stats?itemName=${encodeURIComponent(itemName)}`);
    }
    return this.request(`/item-stats?itemName=${encodeURIComponent(itemName)}`);
  }

  async getUserCategoryStats(period?: string): Promise<UserCategoryStatsResponse> {
    if (USE_MOCK) {
      return this.mockRequest('/user-stats/categories', { period });
    }
    const params = new URLSearchParams();
    if (period) params.append('period', period);
    return this.request(`/user-stats/categories?${params}`);
  }
}

export const apiService = new ApiService();