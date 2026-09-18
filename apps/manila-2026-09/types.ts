export interface TripTheme {
  appLabel?: string;
  shortName?: string;
  icon192Url?: string;
  icon512Url?: string;
  faviconUrl?: string;
  themeColor?: string;
  tokens?: Record<string, string>;
}

export interface Trip {
  id: string;
  slug: string;
  join_code: string;
  title: string;
  subtitle?: string;
  group_no?: string;
  foreign_group_no?: string;
  leader_name?: string;
  leader_phone?: string;
  badge?: string;
  luggage_tag?: string;
  start_date: string;
  end_date: string;
  timezone: string;
  currency: string;
  exchange_rate?: number;
  weather_lat?: number;
  weather_lng?: number;
  sos: { label: string; phone: string }[];
  theme?: TripTheme;
}

export interface TripDay {
  id: string;
  trip_id: string;
  day_key: string;
  day_index: number;
  calendar_date?: string;
  date_num?: string;
  month_label?: string;
  weekday_label?: string;
  weather_note?: string;
  reminder?: string;
}

export interface ItineraryItem {
  id: string;
  trip_id?: string;
  stable_key?: string;
  day: string;
  day_key?: string;
  time: string;
  title: string;
  description: string;
  type: string;
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
  currency: 'THB' | 'TWD' | 'USD' | 'PHP';
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
  itinerary_item_id?: string | null;
  visibility: 'public' | 'private';
  owner_id: string;
  image_url?: string;
  note?: string | null;
  created_at?: string;
}

export interface GuideLink {
  id: string;
  trip_id: string;
  itinerary_item_id?: string | null;
  location_ref?: string | null;
  title: string;
  url: string;
  source?: string | null;
  owner_id: string;
  created_at?: string;
}

export interface ChecklistStatus {
  item_id: string;
  owner_id: string;
  is_checked: boolean;
  updated_at?: string;
}

export interface FlightInfo {
  label?: string;
  flight_no?: string;
  route?: string;
  time?: string;
  date?: string;
  note?: string;
}

export interface Traveler {
  id: string;
  trip_id: string;
  user_id?: string | null;
  display_name: string;
  photo_url?: string | null;
  outbound: FlightInfo;
  inbound: FlightInfo;
  sort_order: number;
}

export interface Budget {
  id: string;
  budget_type: 'public' | 'self';
  amount: number;
  owner_id: string;
  updated_at?: string;
}