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

export interface YearlySummaryItem {
  month: number;
  monthName: string;
  totalAmount: number;
  receiptCount: number;
  itemCount: number;
}

export interface YearlySummary {
  year: number;
  summaries: YearlySummaryItem[];
}

export interface MonthlySummaryItem {
  date: string;
  dayName: string;
  totalAmount: number;
  receiptCount: number;
  itemCount: number;
}

export interface MonthlySummary {
  year: number;
  month: number;
  dailySummaries: MonthlySummaryItem[];
}