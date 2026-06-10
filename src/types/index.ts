export interface Store {
  id: string;
  name: string;
  address: string;
  category: string;
  region: string;
  lastVisitDate: string;
  avgScore: number;
}

export interface OutOfStockItem {
  id: string;
  x: number;
  y: number;
  description: string;
  severity: 'high' | 'medium' | 'low';
}

export interface PriceTagCheck {
  id: string;
  name: string;
  checked: boolean;
  note?: string;
}

export interface PromoCheck {
  id: string;
  name: string;
  checked: boolean;
  note?: string;
}

export interface Score {
  tidiness: number;
  fullness: number;
  visibility: number;
  focusRatio: number;
  total: number;
  level: 'excellent' | 'good' | 'pass' | 'fail';
}

export interface RectifyTask {
  id: string;
  description: string;
  position: string;
  severity: 'urgent' | 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed' | 'reviewed';
  assignee?: string;
  deadline?: string;
  completionPhoto?: string;
  reviewResult?: 'pass' | 'fail';
  reviewDate?: string;
  reviewNote?: string;
}

export interface DisplayTemplate {
  id: string;
  name: string;
  category: string;
  image: string;
  description: string;
}

export interface ShelfRecord {
  id: string;
  storeId: string;
  storeName: string;
  storeCategory: string;
  shelfPhoto: string;
  templateId: string;
  visitDate: string;
  inspector: string;
  outOfStockItems: OutOfStockItem[];
  priceTagChecks: PriceTagCheck[];
  promoChecks: PromoCheck[];
  score: Score;
  rectifyTasks: RectifyTask[];
  notes: string;
}

export type ScoreLevel = 'excellent' | 'good' | 'pass' | 'fail';

export interface RecordFilters {
  dateRange?: {
    start: string;
    end: string;
  };
  storeId?: string;
  category?: string;
  scoreLevel?: ScoreLevel;
}
