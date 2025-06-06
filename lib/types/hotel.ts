export interface Hotel {
  id: number;
  name: string;
  slug: string;
  address: string;
  city_id: number;
  latitude?: number;
  longitude?: number;
  star_rating?: number;
  description?: string;
  amenities?: string; // JSON array
  photos?: string; // JSON array
  website?: string;
  phone?: string;
  email?: string;
  price_range?: 'budget' | 'mid-range' | 'luxury';
  avg_nightly_rate?: number;
  total_rooms?: number;
  booking_url?: string;
  tripadvisor_id?: string;
  google_place_id?: string;
  booking_com_id?: string;
  expedia_id?: string;
  hotels_com_id?: string;
  agoda_id?: string;
  featured: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface HotelWithLocation extends Hotel {
  city_name: string;
  city_slug: string;
  state_name: string;
  state_code: string;
  state_slug: string;
}

export interface HotelFeature {
  id: number;
  name: string;
  category: 'room' | 'property' | 'service' | 'location';
  icon?: string;
  description?: string;
}

export interface HotelWithFeatures extends HotelWithLocation {
  features: HotelFeature[];
}

export interface AffiliateLink {
  id: number;
  entity_type: 'hotel' | 'venue' | 'activity';
  entity_id: number;
  affiliate_network: 'booking_com' | 'hotels_com' | 'expedia' | 'agoda' | 'tripadvisor';
  affiliate_id: string;
  base_url: string;
  tracking_params?: string; // JSON object
  commission_rate?: number;
  cookie_duration?: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AffiliateClick {
  id: number;
  affiliate_link_id: number;
  user_ip?: string;
  user_agent?: string;
  referrer?: string;
  clicked_at: string;
}

export interface HotelSearchFilters {
  city_id?: number;
  price_range?: 'budget' | 'mid-range' | 'luxury';
  star_rating?: number;
  features?: string[];
  sort_by?: 'price' | 'rating' | 'name' | 'distance';
  sort_order?: 'asc' | 'desc';
}

export interface HotelBookingWidget {
  hotel: Hotel;
  affiliate_links: AffiliateLink[];
  check_in?: string;
  check_out?: string;
  guests?: number;
  rooms?: number;
}

export type AffiliateNetwork = {
  name: string;
  display_name: string;
  logo?: string;
  commission_rate: string;
  cookie_duration: number;
  pros: string[];
  booking_flow: string;
};

export const AFFILIATE_NETWORKS: Record<string, AffiliateNetwork> = {
  booking_com: {
    name: 'booking_com',
    display_name: 'Booking.com',
    logo: '🏨',
    commission_rate: '25-40%',
    cookie_duration: 30,
    pros: ['Largest inventory', 'Free cancellation', 'Best prices'],
    booking_flow: 'Direct to property page'
  },
  hotels_com: {
    name: 'hotels_com',
    display_name: 'Hotels.com',
    logo: '🏪',
    commission_rate: '4-6%',
    cookie_duration: 7,
    pros: ['Rewards program', 'Collect nights for free stays', 'Price match'],
    booking_flow: 'Search results page'
  },
  expedia: {
    name: 'expedia',
    display_name: 'Expedia',
    logo: '✈️',
    commission_rate: '2-6%',
    cookie_duration: 14,
    pros: ['Flight + Hotel packages', 'Member prices', 'Rewards points'],
    booking_flow: 'Package deals page'
  },
  agoda: {
    name: 'agoda',
    display_name: 'Agoda',
    logo: '🌏',
    commission_rate: '4-7%',
    cookie_duration: 30,
    pros: ['Strong in Asia', 'Local insights', 'Flash deals'],
    booking_flow: 'Direct booking'
  }
};