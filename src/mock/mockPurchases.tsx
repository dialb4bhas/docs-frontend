import type { WeeklyPurchases } from '../types';

export const mockData: WeeklyPurchases = {
  weekStart: '2025-11-03',
  weekEnd: '2025-11-09',
  totalAmount: 123.45,
  daysWithPurchases: 2,
  totalDays: 7,
  purchases: {
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
    '2025-11-05': [
      {
        receiptId: 'mock-receipt-2',
        merchant: 'Supermarket',
        total: 48.25,
        timestamp: '2025-11-05T14:30:00.000Z',
        items: [
          { itemId: 'mock-item-2-1', itemName: 'Milk 2L', itemCost: 4.50 },
          { itemId: 'mock-item-2-2', itemName: 'Bread', itemCost: 3.75 },
          { itemId: 'mock-item-2-3', itemName: 'Special Discount', itemCost: -10.00 },
          { itemId: 'mock-item-2-4', itemName: 'Coffee Beans', itemCost: 50.00 },
        ],
      },
      {
        receiptId: 'mock-receipt-3',
        merchant: 'Cafe',
        total: -10.00,
        timestamp: '2025-11-05T15:00:00.000Z',
        items: [
          { itemId: 'mock-item-3-1', itemName: 'Refunded Coffee', itemCost: -10.00 },
        ],
      },
    ],
  },
};