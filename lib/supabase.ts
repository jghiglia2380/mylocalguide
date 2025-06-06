import { createClient } from '@supabase/supabase-js';

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create clients
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false
  }
});

// Admin client for server-side operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Database types
export interface VenueDB {
  id: number;
  external_id?: string;
  source?: string;
  name: string;
  slug?: string;
  address?: string;
  neighborhood_id?: number;
  city_id?: number;
  latitude?: number;
  longitude?: number;
  category?: string;
  subcategory?: string;
  cuisine_type?: string;
  description?: string;
  phone?: string;
  website?: string;
  email?: string;
  hours?: any;
  price_range?: number;
  google_rating?: number;
  google_review_count?: number;
  yelp_rating?: number;
  yelp_review_count?: number;
  tripadvisor_rating?: number;
  tripadvisor_review_count?: number;
  foursquare_rating?: number;
  foursquare_review_count?: number;
  aggregate_rating?: number;
  total_reviews?: number;
  popularity_score?: number;
  features?: any;
  atmosphere_tags?: string[];
  demographic_tags?: string[];
  amenities?: string[];
  photos?: any;
  cover_photo_url?: string;
  verified?: boolean;
  claimed?: boolean;
  permanently_closed?: boolean;
  featured?: boolean;
  active?: boolean;
  last_updated?: string;
  created_at?: string;
}

// Helper functions
export async function getVenuesByCity(cityId: number, limit = 100) {
  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .eq('city_id', cityId)
    .eq('active', true)
    .order('aggregate_rating', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

export async function getVenuesByNeighborhood(neighborhoodId: number) {
  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .eq('neighborhood_id', neighborhoodId)
    .eq('active', true)
    .order('aggregate_rating', { ascending: false });

  if (error) throw error;
  return data;
}

export async function searchVenues(query: string, cityId?: number) {
  let queryBuilder = supabase
    .from('venues')
    .select('*')
    .or(`name.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`)
    .eq('active', true);

  if (cityId) {
    queryBuilder = queryBuilder.eq('city_id', cityId);
  }

  const { data, error } = await queryBuilder
    .order('aggregate_rating', { ascending: false })
    .limit(50);

  if (error) throw error;
  return data;
}

export async function getNearbyVenues(lat: number, lng: number, radiusMeters = 1000) {
  const { data, error } = await supabase.rpc('nearby_venues', {
    lat,
    lng,
    radius_meters: radiusMeters,
    limit_count: 20
  });

  if (error) throw error;
  return data;
}

export async function bulkInsertVenues(venues: Partial<VenueDB>[]) {
  const { data, error } = await supabaseAdmin
    .from('venues')
    .upsert(venues, {
      onConflict: 'external_id,source',
      ignoreDuplicates: false
    });

  if (error) throw error;
  return data;
}

export async function updateVenueRatings(venueId: number, ratings: {
  google_rating?: number;
  google_review_count?: number;
  yelp_rating?: number;
  yelp_review_count?: number;
  tripadvisor_rating?: number;
  tripadvisor_review_count?: number;
  foursquare_rating?: number;
  foursquare_review_count?: number;
}) {
  // Calculate aggregate rating
  const ratingValues = [
    ratings.google_rating,
    ratings.yelp_rating,
    ratings.tripadvisor_rating,
    ratings.foursquare_rating
  ].filter((r): r is number => r !== undefined && r !== null && r > 0);

  const reviewCounts = [
    ratings.google_review_count || 0,
    ratings.yelp_review_count || 0,
    ratings.tripadvisor_review_count || 0,
    ratings.foursquare_review_count || 0
  ];

  const aggregate_rating = ratingValues.length > 0
    ? ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length
    : null;

  const total_reviews = reviewCounts.reduce((a, b) => a + b, 0);

  const { data, error } = await supabaseAdmin
    .from('venues')
    .update({
      ...ratings,
      aggregate_rating,
      total_reviews,
      last_updated: new Date().toISOString()
    })
    .eq('id', venueId);

  if (error) throw error;
  return data;
}