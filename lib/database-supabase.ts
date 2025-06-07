import { supabase, supabaseAdmin, VenueDB } from './supabase';

// Import types (don't re-export to avoid conflicts)
import type { State, City, CityWithState, VenueWithLocation, NeighborhoodWithLocation } from './types/location';
import type { Hotel, HotelWithLocation, HotelFeature, HotelWithFeatures, AffiliateLink, HotelSearchFilters } from './types/hotel';
import type { 
  Neighborhood, 
  NeighborhoodWithTags, 
  NeighborhoodTag, 
  NeighborhoodGuide, 
  NeighborhoodStats,
  NeighborhoodSearchFilters
} from './types/neighborhood';

// Re-export specific types to avoid conflicts
export type {
  State, City, CityWithState, VenueWithLocation, NeighborhoodWithLocation,
  Hotel, HotelWithLocation, HotelFeature, HotelWithFeatures, AffiliateLink, HotelSearchFilters,
  Neighborhood, NeighborhoodWithTags, NeighborhoodTag, NeighborhoodGuide, NeighborhoodStats, NeighborhoodSearchFilters
};

// Export Venue interface for compatibility
export interface Venue {
  id: number;
  name: string;
  address: string;
  neighborhood: string;
  category: string;
  subcategory: string;
  description: string;
  phone?: string;
  website?: string;
  hours?: string;
  price_range: number; // 1-4 scale
  atmosphere_tags: string; // JSON array
  demographic_tags: string; // JSON array
  feature_tags: string; // JSON array
  lat?: number;
  lng?: number;
  created_at: string;
  updated_at: string;
  featured: boolean;
  active: boolean;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  parent_id?: number;
  description: string;
  seo_title: string;
  meta_description: string;
}

export interface NeighborhoodDB {
  id: number;
  name: string;
  slug: string;
  city: string;
  description: string;
  boundary_coords?: string; // JSON
}

export interface Tag {
  id: number;
  name: string;
  type: 'atmosphere' | 'demographic' | 'feature';
  color: string;
  description: string;
}

export interface VenueTag {
  venue_id: number;
  tag_id: number;
}

// Mock the getDatabase function for compatibility
export function getDatabase() {
  console.log('Using Supabase database');
  return {
    prepare: () => ({
      all: () => [],
      get: () => null,
      run: () => ({ lastInsertRowid: 0 })
    })
  };
}

// Venue operations
export async function getAllVenues() {
  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .eq('active', true)
    .order('featured', { ascending: false })
    .order('name');
    
  if (error) throw error;
  return data || [];
}

export async function getVenuesByCategory(category: string) {
  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .eq('category', category)
    .eq('active', true)
    .order('featured', { ascending: false })
    .order('name');
    
  if (error) throw error;
  return data || [];
}

export async function getVenuesByNeighborhood(neighborhoodName: string) {
  // First get the neighborhood ID
  const { data: neighborhood } = await supabase
    .from('neighborhoods')
    .select('id')
    .eq('name', neighborhoodName)
    .single();
    
  if (!neighborhood) return [];
  
  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .eq('neighborhood_id', neighborhood.id)
    .eq('active', true)
    .order('featured', { ascending: false })
    .order('name');
    
  if (error) throw error;
  return data || [];
}

export async function getFeaturedVenues() {
  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .eq('featured', true)
    .eq('active', true)
    .order('name');
    
  if (error) throw error;
  return data || [];
}

export async function insertVenue(venue: any) {
  const { data, error } = await supabaseAdmin
    .from('venues')
    .insert({
      ...venue,
      atmosphere_tags: JSON.parse(venue.atmosphere_tags || '[]'),
      demographic_tags: JSON.parse(venue.demographic_tags || '[]'),
      features: JSON.parse(venue.feature_tags || '[]'),
    })
    .select()
    .single();
    
  if (error) throw error;
  return { lastInsertRowid: data.id };
}

// State operations
export async function getAllStates() {
  const { data, error } = await supabase
    .from('states')
    .select('*')
    .order('name');
    
  if (error) throw error;
  return data || [];
}

export async function getStateBySlug(slug: string) {
  const { data, error } = await supabase
    .from('states')
    .select('*')
    .eq('slug', slug)
    .single();
    
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

// City operations
export async function getCitiesByState(stateCode: string) {
  const { data, error } = await supabase
    .from('cities')
    .select('*')
    .eq('state_code', stateCode)
    .order('is_capital', { ascending: false })
    .order('is_major_tourist_city', { ascending: false })
    .order('name');
    
  if (error) throw error;
  return data || [];
}

export async function getCityBySlug(slug: string) {
  const { data, error } = await supabase
    .from('cities')
    .select(`
      *,
      states!inner(name, slug)
    `)
    .eq('slug', slug)
    .single();
    
  if (error && error.code !== 'PGRST116') throw error;
  
  if (data) {
    return {
      ...data,
      state_name: data.states.name,
      state_slug: data.states.slug
    };
  }
  return undefined;
}

export async function getVenuesByCity(cityId: number, limit?: number) {
  let query = supabase
    .from('venues')
    .select('*')
    .eq('city_id', cityId)
    .eq('active', true)
    .order('popularity_score', { ascending: false })
    .order('aggregate_rating', { ascending: false });
    
  if (limit) {
    query = query.limit(limit);
  } else {
    // Set high limit to get all venues (Supabase defaults to 1000)
    query = query.limit(50000);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  
  // Transform to match expected format
  return (data || []).map(venue => ({
    ...venue,
    city_name: venue.cities.name,
    city_slug: venue.cities.slug,
    state_name: venue.states.name,
    state_code: venue.states.code,
    state_slug: venue.states.slug
  }));
}

export async function getCapitalCities() {
  const { data, error } = await supabase
    .from('cities')
    .select(`
      *,
      states!inner(name, slug)
    `)
    .eq('is_capital', true)
    .order('states.name');
    
  if (error) throw error;
  
  return (data || []).map(city => ({
    ...city,
    state_name: city.states.name,
    state_slug: city.states.slug
  }));
}

export async function getTouristCities() {
  const { data, error } = await supabase
    .from('cities')
    .select(`
      *,
      states!inner(name, slug)
    `)
    .eq('is_major_tourist_city', true)
    .order('states.name')
    .order('name');
    
  if (error) throw error;
  
  return (data || []).map(city => ({
    ...city,
    state_name: city.states.name,
    state_slug: city.states.slug
  }));
}

// Neighborhood operations
export async function getNeighborhoodsByCity(cityId: number) {
  const { data, error } = await supabase
    .from('neighborhoods')
    .select(`
      *,
      
      
    `)
    .eq('city_id', cityId)
    .order('name');
    
  if (error) throw error;
  
  return (data || []).map(n => ({
    ...n,
    city_name: n.cities.name,
    city_slug: n.cities.slug,
    state_name: n.states.name,
    state_code: n.states.code,
    state_slug: n.states.slug
  }));
}

// Search operations
export async function searchVenuesByCity(cityId: number, query: string) {
  const { data, error } = await supabase
    .from('venues')
    .select(`
      *,
      
      
    `)
    .eq('city_id', cityId)
    .or(`name.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`)
    .order('aggregate_rating', { ascending: false })
    .limit(20);
    
  if (error) throw error;
  
  return (data || []).map(venue => ({
    ...venue,
    city_name: venue.cities.name,
    city_slug: venue.cities.slug,
    state_name: venue.states.name,
    state_code: venue.states.code,
    state_slug: venue.states.slug
  }));
}

// Export dummy functions for compatibility
export function initializeDatabase() {
  console.log('Database initialization handled by Supabase');
}

export function seedDatabase() {
  console.log('Use /api/supabase-migrate endpoint to seed data');
  return 0;
}

// Additional functions needed by pages
export async function getVenuesByCityAndCategory(cityId: number, category: string) {
  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .eq('city_id', cityId)
    .eq('category', category)
    .eq('active', true)
    .order('popularity_score', { ascending: false })
    .order('aggregate_rating', { ascending: false });
    
  if (error) throw error;
  
  return (data || []).map(venue => ({
    ...venue,
    city_name: venue.cities.name,
    city_slug: venue.cities.slug,
    state_name: venue.states.name,
    state_code: venue.states.code,
    state_slug: venue.states.slug
  }));
}

export async function getVenuesByCityAndNeighborhood(cityId: number, neighborhoodName: string) {
  // First get the neighborhood ID
  const { data: neighborhood } = await supabase
    .from('neighborhoods')
    .select('id')
    .eq('city_id', cityId)
    .eq('name', neighborhoodName)
    .single();
    
  if (!neighborhood) return [];
  
  const { data, error } = await supabase
    .from('venues')
    .select(`
      *,
      
      
    `)
    .eq('city_id', cityId)
    .eq('neighborhood_id', neighborhood.id)
    .eq('active', true)
    .order('popularity_score', { ascending: false })
    .order('aggregate_rating', { ascending: false });
    
  if (error) throw error;
  
  return (data || []).map(venue => ({
    ...venue,
    city_name: venue.cities.name,
    city_slug: venue.cities.slug,
    state_name: venue.states.name,
    state_code: venue.states.code,
    state_slug: venue.states.slug
  }));
}

export async function getNeighborhoodBySlug(slug: string) {
  const { data, error } = await supabase
    .from('neighborhoods')
    .select(`
      *,
      
      
    `)
    .eq('slug', slug)
    .eq('active', true)
    .single();
    
  if (error && error.code !== 'PGRST116') throw error;
  
  if (data) {
    return {
      ...data,
      city_name: data.cities.name,
      city_slug: data.cities.slug,
      state_name: data.states.name,
      state_code: data.states.code,
      state_slug: data.states.slug
    };
  }
  return undefined;
}

export async function getNeighborhoodsByCityWithFilters(cityId: number, filters?: NeighborhoodSearchFilters) {
  let query = supabase
    .from('neighborhoods')
    .select(`
      *,
      
      
    `)
    .eq('city_id', cityId)
    .eq('active', true);

  if (filters?.price_level) {
    query = query.eq('price_level', filters.price_level);
  }

  if (filters?.walkability) {
    query = query.eq('walkability', filters.walkability);
  }

  if (filters?.safety) {
    query = query.eq('safety', filters.safety);
  }

  if (filters?.transit_access) {
    query = query.eq('transit_access', filters.transit_access);
  }

  if (filters?.featured !== undefined) {
    query = query.eq('featured', filters.featured);
  }

  query = query.order('featured', { ascending: false }).order('name');

  const { data, error } = await query;
  
  if (error) throw error;
  
  return (data || []).map(n => ({
    ...n,
    city_name: n.cities.name,
    city_slug: n.cities.slug,
    state_name: n.states.name,
    state_code: n.states.code,
    state_slug: n.states.slug
  }));
}

export async function getNeighborhoodWithTags(slug: string) {
  const neighborhood = await getNeighborhoodBySlug(slug);
  if (!neighborhood) return undefined;

  const tags = await getNeighborhoodTags(neighborhood.id);
  
  return {
    ...neighborhood,
    description: neighborhood.description || '',
    tags,
    characteristics_parsed: parseCharacteristics(neighborhood.characteristics),
    best_for_parsed: parseBestFor(neighborhood.best_for),
    featured: neighborhood.featured ?? false,
    active: neighborhood.active ?? true
  };
}

export async function getNeighborhoodTags(neighborhoodId: number) {
  const { data, error } = await supabase
    .from('neighborhood_tags')
    .select(`
      *,
      neighborhood_neighborhood_tags!inner(neighborhood_id)
    `)
    .eq('neighborhood_neighborhood_tags.neighborhood_id', neighborhoodId)
    .order('category')
    .order('name');
    
  if (error) throw error;
  return data || [];
}

export async function getNeighborhoodStats(neighborhoodId: number) {
  // Get neighborhood details first
  const { data: neighborhood } = await supabase
    .from('neighborhoods')
    .select('name, city_id')
    .eq('id', neighborhoodId)
    .single();
    
  if (!neighborhood) {
    return {
      venue_count: 0,
      hotel_count: 0,
      restaurant_count: 0,
      bar_count: 0,
      cafe_count: 0,
      activity_count: 0,
      avg_price_level: 2.5,
      top_categories: []
    };
  }

  // Get venue stats
  const { data: venues } = await supabase
    .from('venues')
    .select('category')
    .eq('neighborhood_id', neighborhoodId)
    .eq('active', true);

  const venueStats = venues?.reduce((acc, venue) => {
    acc[venue.category] = (acc[venue.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  // Get hotel count for the city
  const { count: hotelCount } = await supabase
    .from('hotels')
    .select('*', { count: 'exact', head: true })
    .eq('city_id', neighborhood.city_id)
    .eq('active', true);

  const totalVenues = Object.values(venueStats).reduce((sum, count) => sum + count, 0);
  const restaurantCount = venueStats['Restaurants'] || venueStats['restaurants'] || 0;
  const barCount = venueStats['Bars & Nightlife'] || venueStats['bars'] || 0;
  const cafeCount = venueStats['Cafes & Coffee'] || venueStats['cafes'] || 0;
  const activityCount = venueStats['Activities'] || venueStats['activities'] || 0;

  const topCategories = Object.entries(venueStats)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    venue_count: totalVenues,
    hotel_count: hotelCount || 0,
    restaurant_count: restaurantCount,
    bar_count: barCount,
    cafe_count: cafeCount,
    activity_count: activityCount,
    avg_price_level: 2.5,
    top_categories: topCategories
  };
}

export async function getFeaturedNeighborhoods(limit = 10) {
  const { data, error } = await supabase
    .from('neighborhoods')
    .select(`
      *,
      
      
    `)
    .eq('featured', true)
    .eq('active', true)
    .order('city_name')
    .order('name')
    .limit(limit);
    
  if (error) throw error;
  
  return (data || []).map(n => ({
    ...n,
    city_name: n.cities.name,
    city_slug: n.cities.slug,
    state_name: n.states.name,
    state_code: n.states.code,
    state_slug: n.states.slug
  }));
}

export async function searchNeighborhoods(query: string, cityId?: number) {
  let q = supabase
    .from('neighborhoods')
    .select(`
      *,
      
      
    `)
    .eq('active', true)
    .or(`name.ilike.%${query}%,description.ilike.%${query}%,characteristics.ilike.%${query}%,best_for.ilike.%${query}%`);

  if (cityId) {
    q = q.eq('city_id', cityId);
  }

  const { data, error } = await q
    .order('featured', { ascending: false })
    .order('name')
    .limit(20);
    
  if (error) throw error;
  
  return (data || []).map(n => ({
    ...n,
    city_name: n.cities.name,
    city_slug: n.cities.slug,
    state_name: n.states.name,
    state_code: n.states.code,
    state_slug: n.states.slug
  }));
}

// Hotel functions
export async function getAllHotels() {
  const { data, error } = await supabase
    .from('hotels')
    .select('*')
    .eq('active', true)
    .order('featured', { ascending: false })
    .order('star_rating', { ascending: false })
    .order('name');
    
  if (error) throw error;
  return data || [];
}

export async function getHotelsByCity(cityId: number, filters?: HotelSearchFilters) {
  let query = supabase
    .from('hotels')
    .select(`
      *,
      
      
    `)
    .eq('city_id', cityId)
    .eq('active', true);

  if (filters?.price_range) {
    query = query.eq('price_range', filters.price_range);
  }

  if (filters?.star_rating) {
    query = query.gte('star_rating', filters.star_rating);
  }

  // Sort by
  const sortBy = filters?.sort_by || 'featured';
  const sortOrder = filters?.sort_order || 'desc';
  
  switch (sortBy) {
    case 'price':
      query = query.order('avg_nightly_rate', { ascending: sortOrder === 'asc' });
      break;
    case 'rating':
      query = query.order('star_rating', { ascending: sortOrder === 'asc' });
      break;
    case 'name':
      query = query.order('name', { ascending: sortOrder === 'asc' });
      break;
    default:
      query = query.order('featured', { ascending: false })
        .order('star_rating', { ascending: false })
        .order('name');
  }

  const { data, error } = await query;
  
  if (error) throw error;
  
  return (data || []).map(hotel => ({
    ...hotel,
    city_name: hotel.cities.name,
    city_slug: hotel.cities.slug,
    state_name: hotel.states.name,
    state_code: hotel.states.code,
    state_slug: hotel.states.slug
  }));
}

export async function getHotelBySlug(slug: string) {
  const { data, error } = await supabase
    .from('hotels')
    .select(`
      *,
      
      
    `)
    .eq('slug', slug)
    .eq('active', true)
    .single();
    
  if (error && error.code !== 'PGRST116') throw error;
  
  if (data) {
    return {
      ...data,
      city_name: data.cities.name,
      city_slug: data.cities.slug,
      state_name: data.states.name,
      state_code: data.states.code,
      state_slug: data.states.slug
    };
  }
  return undefined;
}

export async function getHotelById(id: number) {
  const { data, error } = await supabase
    .from('hotels')
    .select(`
      *,
      
      
    `)
    .eq('id', id)
    .eq('active', true)
    .single();
    
  if (error && error.code !== 'PGRST116') throw error;
  
  if (data) {
    return {
      ...data,
      city_name: data.cities.name,
      city_slug: data.cities.slug,
      state_name: data.states.name,
      state_code: data.states.code,
      state_slug: data.states.slug
    };
  }
  return undefined;
}

export async function getHotelFeatures() {
  const { data, error } = await supabase
    .from('hotel_features')
    .select('*')
    .order('category')
    .order('name');
    
  if (error) throw error;
  return data || [];
}

export async function getHotelFeaturesById(hotelId: number) {
  const { data, error } = await supabase
    .from('hotel_features')
    .select(`
      *,
      hotel_hotel_features!inner(hotel_id)
    `)
    .eq('hotel_hotel_features.hotel_id', hotelId)
    .order('category')
    .order('name');
    
  if (error) throw error;
  return data || [];
}

export async function getHotelWithFeatures(slug: string) {
  const hotel = await getHotelBySlug(slug);
  if (!hotel) return undefined;

  const features = await getHotelFeaturesById(hotel.id);
  return { ...hotel, features };
}

export async function getFeaturedHotels(limit = 10) {
  const { data, error } = await supabase
    .from('hotels')
    .select(`
      *,
      
      
    `)
    .eq('featured', true)
    .eq('active', true)
    .order('star_rating', { ascending: false })
    .order('name')
    .limit(limit);
    
  if (error) throw error;
  
  return (data || []).map(hotel => ({
    ...hotel,
    city_name: hotel.cities.name,
    city_slug: hotel.cities.slug,
    state_name: hotel.states.name,
    state_code: hotel.states.code,
    state_slug: hotel.states.slug
  }));
}

export async function getHotelsByPriceRange(priceRange: 'budget' | 'mid-range' | 'luxury', limit = 20) {
  const { data, error } = await supabase
    .from('hotels')
    .select(`
      *,
      
      
    `)
    .eq('price_range', priceRange)
    .eq('active', true)
    .order('star_rating', { ascending: false })
    .order('name')
    .limit(limit);
    
  if (error) throw error;
  
  return (data || []).map(hotel => ({
    ...hotel,
    city_name: hotel.cities.name,
    city_slug: hotel.cities.slug,
    state_name: hotel.states.name,
    state_code: hotel.states.code,
    state_slug: hotel.states.slug
  }));
}

export async function searchHotels(query: string, cityId?: number) {
  let q = supabase
    .from('hotels')
    .select(`
      *,
      
      
    `)
    .eq('active', true)
    .or(`name.ilike.%${query}%,address.ilike.%${query}%,description.ilike.%${query}%`);

  if (cityId) {
    q = q.eq('city_id', cityId);
  }

  const { data, error } = await q
    .order('star_rating', { ascending: false })
    .order('name')
    .limit(20);
    
  if (error) throw error;
  
  return (data || []).map(hotel => ({
    ...hotel,
    city_name: hotel.cities.name,
    city_slug: hotel.cities.slug,
    state_name: hotel.states.name,
    state_code: hotel.states.code,
    state_slug: hotel.states.slug
  }));
}

// Affiliate link functions
export async function getAffiliateLinksForHotel(hotelId: number) {
  const { data, error } = await supabase
    .from('affiliate_links')
    .select('*')
    .eq('entity_type', 'hotel')
    .eq('entity_id', hotelId)
    .eq('active', true)
    .order('commission_rate', { ascending: false });
    
  if (error) throw error;
  return data || [];
}

export async function createAffiliateLink(link: Omit<AffiliateLink, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabaseAdmin
    .from('affiliate_links')
    .insert(link)
    .select()
    .single();
    
  if (error) throw error;
  return data.id;
}

export async function trackAffiliateClick(affiliateLinkId: number, userIp?: string, userAgent?: string, referrer?: string) {
  const { error } = await supabase
    .from('affiliate_clicks')
    .insert({
      affiliate_link_id: affiliateLinkId,
      user_ip: userIp || null,
      user_agent: userAgent || null,
      referrer: referrer || null
    });
    
  if (error) throw error;
}

export async function insertHotel(hotel: Omit<Hotel, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabaseAdmin
    .from('hotels')
    .insert(hotel)
    .select()
    .single();
    
  if (error) throw error;
  return data.id;
}

// Helper functions for parsing
function parseCharacteristics(characteristics: string | null): string[] {
  if (!characteristics) return [];
  try {
    return JSON.parse(characteristics);
  } catch {
    return [];
  }
}

function parseBestFor(bestFor: string | null): string[] {
  if (!bestFor) return [];
  try {
    return JSON.parse(bestFor);
  } catch {
    return [];
  }
}