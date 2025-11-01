export interface Item {
  itemName: string;
  itemCost: number;
  itemId: string;
}

export interface Purchase {
  merchant: string;
  receiptId: string;
  items: Item[];
  total: number;
  timestamp: string;
}

export interface PurchasesByDate {
  [date: string]: Purchase[];
}

export interface WeeklyPurchases {
  weekStart: string;
  weekEnd: string;
  totalDays: number;
  daysWithPurchases: number;
  totalAmount: number;
  purchases: PurchasesByDate;
}