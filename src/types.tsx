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

export interface UserItemStats {
  itemName: string;
  shortLabel: string;
  category: string;
  totalSpent: number;
  purchaseCount: number;
  avgCost: number;
  lastPurchase: string;
  monthlyBreakdown: Record<string, number>;
}

export interface UserItemStatsResponse {
  timeFilter: {
    period: string;
    range: string[];
  };
  items: UserItemStats[];
  hasMore: boolean;
  nextToken?: string;
}

export interface CategoryTopItem {
  shortLabel: string;
  totalSpent: number;
}

export interface CategoryStats {
  category: string;
  totalSpent: number;
  itemCount: number;
  avgSpentPerItem: number;
  topItems: CategoryTopItem[];
}

export interface UserCategoryStatsResponse {
  userId: string;
  totalSpent: number;
  categories: CategoryStats[];
}

export interface TopItem {
  shortLabel: string;
  totalSpent: number;
  purchaseCount: number;
}

export interface UserSummaryStats {
  year: string;
  totalSpent: number;
  totalUniqueItems: number;
  avgSpentPerItem: number;
  topItems: TopItem[];
}

export interface GlobalItemStats {
  itemName: string;
  totalSpent: number;
  totalPurchases: number;
  avgCost: number;
  lastUpdated: string;
}