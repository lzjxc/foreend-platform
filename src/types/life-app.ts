// Life App types — travel, rental, accommodation

// ==================== Shared ====================

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

// ==================== Travel ====================

export interface TravelPreferences {
  pace?: 'relaxed' | 'moderate' | 'intensive';
  interests?: string[];
  accommodation_budget_per_night?: number | null;
  include_attractions?: string[];
  exclude_attractions?: string[];
  dietary_requirements?: string[];
}

export interface TravelPlanInput {
  title: string;
  start_date: string;
  end_date: string;
  departure_city: string;
  cities: string[];
  city_nights: Record<string, number>;
  adults: number;
  children: number;
  children_ages: number[];
  transport_mode: 'public_transit' | 'car' | 'coach';
  preferences: TravelPreferences;
}

export type TravelPlanStatus = 'pending' | 'generating' | 'searching_accommodation' | 'completed' | 'failed';

export interface TravelPlanSummary {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  cities: string[];
  status: TravelPlanStatus;
  confirmed: boolean;
  created_at: string | null;
}

export interface Activity {
  id: string;
  time: string;
  name: string;
  type: 'attraction' | 'meal' | 'transport' | 'rest';
  price_adult: number;
  child_free: boolean;
  duration_min: number;
  child_friendly_rating: number;
  address: string | null;
  notes: string | null;
  booking_url: string | null;
  confirmed: boolean;
  booked_at: string | null;
  booking_required: boolean;
}

export interface DayItinerary {
  date: string;
  day_number: number;
  city: string;
  theme: string;
  activities: Activity[];
}

export interface TransportLeg {
  id: string;
  from_city: string;
  to_city: string;
  mode: string;
  operator: string | null;
  departure_time: string | null;
  duration_min: number;
  price_total: number;
  child_free: boolean;
  confirmed: boolean;
  booked_at: string | null;
  notes: string | null;
}

export interface Accommodation {
  id: string;
  city: string;
  checkin: string;
  checkout: string;
  name: string | null;
  price: number | null;
  rating: number | null;
  location: string | null;
  type_desc: string | null;
  booking_url: string | null;
  cancellation_policy: string | null;
  confirmed: boolean;
  booked_at: string | null;
}

export interface BudgetSummary {
  accommodation: number;
  transport: number;
  attractions: number;
  dining_estimate: number;
  currency: string;
}

export interface TravelPlan extends TravelPlanSummary {
  departure_city: string;
  city_nights: Record<string, number>;
  adults: number;
  children: number;
  transport_legs: TransportLeg[];
  accommodations: Accommodation[];
  total_budget: BudgetSummary | null;
  days: DayItinerary[];
  error_message: string | null;
  completed_at: string | null;
}

// ==================== Rental ====================

export type SearchStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface RentalSearchInput {
  location: string;
  location_identifier: string;
  max_price: number;
  min_bedrooms: number;
  property_types: string[];
  dont_show: string[];
  radius: number;
}

export interface RentalSearchResult {
  id: string;
  status: SearchStatus;
  location: string;
  max_price: number;
  total_found: number;
  error_message: string | null;
  created_at: string | null;
  completed_at: string | null;
}

export interface PropertySummary {
  id: string;
  title: string;
  address: string;
  price_pcm: number;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  source_url: string;
  listing_date: string | null;
  created_at: string | null;
}

export interface Property extends PropertySummary {
  price_pw: number | null;
  size_sqft: string | null;
  furnish_type: string | null;
  available_date: string | null;
  deposit: string | null;
  min_tenancy: string | null;
  council_tax_band: string | null;
  epc_rating: string | null;
  nearest_station: string | null;
  has_garden: boolean;
  has_parking: boolean;
  description: string | null;
  key_features: string[];
  agent_name: string | null;
  agent_phone: string | null;
  images: string[];
  is_valid: boolean;
}

// ==================== Accommodation ====================

export interface AccommodationSearchInput {
  destination: string;
  checkin: string;
  checkout: string;
  adults: number;
  children: number;
  children_ages: number[];
  rooms: number;
  max_price_total: number | null;
  sort_by: 'price' | 'rating' | 'distance';
  min_rating: number | null;
}

export interface AccommodationSearchResult {
  id: string;
  status: SearchStatus;
  destination: string;
  checkin: string;
  checkout: string;
  total_found: number;
  sold_out_percentage: number | null;
  error_message: string | null;
  created_at: string | null;
  completed_at: string | null;
}

export interface ListingSummary {
  id: string;
  name: string;
  total_price: number;
  price_per_night: number;
  rating: number | null;
  review_count: number;
  distance_from_centre: string | null;
  has_free_cancellation: boolean;
  breakfast_included: boolean;
  booking_url: string;
}

export interface Listing extends ListingSummary {
  currency: string;
  location_rating: number | null;
  property_type: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  sleeps: number | null;
  has_kitchen: boolean;
  has_free_parking: boolean;
  has_free_wifi: boolean;
  child_stays_free: boolean;
  has_pool: boolean;
  has_hot_tub: boolean;
  pets_allowed: boolean;
  images: string[];
  is_valid: boolean | null;
}
