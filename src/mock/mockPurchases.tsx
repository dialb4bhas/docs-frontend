import type { WeeklyPurchases } from '../types';

export const mockData: WeeklyPurchases = {
  weekStart: '2025-10-26',
  weekEnd: '2025-11-01',
  totalAmount: 130.87,
  daysWithPurchases: 3,
  totalDays: 7,
  purchases: {
    '2025-11-01': [
      {
        receiptId: 'mock-receipt-0',
        merchant: 'Weekend Store',
        total: 45.67,
        timestamp: '2025-11-01T09:00:00.000Z',
        items: [
          { itemId: 'mock-item-0-1', itemName: 'Weekend Special', itemCost: 25.67 },
          { itemId: 'mock-item-0-2', itemName: 'Fresh Produce', itemCost: 20.00 },
        ],
      },
    ],
    '2025-11-03': [
      {
        receiptId: 'mock-receipt-1',
        merchant: 'Woolworths',
        total: 85.20,
        timestamp: '2025-11-03T10:00:00.000Z',
        items: [
          { itemId: 'mock-item-1-1', itemName: 'Spicy Chicken Drumsticks 3pk', itemCost: 12.50 },
          { itemId: 'mock-item-1-2', itemName: 'Paseo 3 Ply T/tissue 24pk Value', itemCost: 8.00 },
          { itemId: 'mock-item-1-3', itemName: 'S/Magnum Honeycomb Crunch 4pk', itemCost: 9.70 },
        ],
      },
    ],

  },
};