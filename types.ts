export interface ItineraryItem {
  id: string;
  day: string;
  time: string;
  title: string;
  description: string;
  type: 'temple' | 'food' | 'transport' | 'shopping' | 'hotel' | 'activity' | 'attraction';
  image?: string;
  tag?: string;
  note?: string;
  location?: string;
  lat?: number;
  lng?: number;
  image_url?: string;
  isCompleted?: boolean;
  created_at?: string;
}

export interface ExpenseItem {
  id: string;
  title: string;
  date: string;
  time: string;
  category: string;
  amount: number;
  currency: 'THB' | 'TWD' | 'USD';
  location?: string;
  payment_type: 'public' | 'self';
  owner_id: string;
  created_at?: string;
}

export interface RecommendationItem {
  id: string;
  title: string;
  description: string;
  rating: number;
  reviews: string;
  price: number;
  image: string;
  tag: string;
  isTop?: boolean;
}

export interface ChecklistItem {
  id: string;
  text: string;
  description?: string;
  isChecked: boolean;
  isImportant?: boolean;
}

export interface MustBuyItem {
  id: string;
  item_name: string;
  price: string | number;
  location_ref?: string;
  visibility: 'public' | 'private';
  owner_id: string;
  image_url?: string;
  created_at?: string;
}

export interface ChecklistStatus {
  item_id: string;
  owner_id: string;
  is_checked: boolean;
  updated_at?: string;
}

export interface Budget {
  id: string;
  budget_type: 'public' | 'self';
  amount: number;
  owner_id: string;
  updated_at?: string;
}