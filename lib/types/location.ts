export interface State {
  id: number;
  code: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface City {
  id: number;
  name: string;
  slug: string;
  state_code: string;
  is_capital: boolean;
  is_major_tourist_city: boolean;
  population?: number;
  latitude: number;
  longitude: number;
  timezone?: string;
  created_at: string;
  updated_at: string;
}

export interface CityWithState extends City {
  state_name: string;
  state_slug: string;
}

export interface VenueWithLocation {
  id: number;
  name: string;
  description?: string;
  address: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  website?: string;
  rating?: number;
  price_level?: number;
  category: string;
  neighborhood: string;
  city_id: number;
  google_place_id?: string;
  yelp_id?: string;
  venue_score?: number;
  photos?: string;
  hours?: string;
  last_updated?: string;
  data_source?: string;
  created_at: string;
  updated_at: string;
  // Location fields from joins
  city_name: string;
  city_slug: string;
  state_name: string;
  state_code: string;
  state_slug: string;
}

export interface NeighborhoodWithLocation {
  id: number;
  name: string;
  slug: string;
  description?: string;
  city_id: number;
  created_at: string;
  updated_at: string;
  // Location fields from joins
  city_name: string;
  city_slug: string;
  state_name: string;
  state_code: string;
  state_slug: string;
}