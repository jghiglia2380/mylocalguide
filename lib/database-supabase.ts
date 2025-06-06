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
  State, City, CityWithState, VenueWithLocation,
  Hotel, HotelWithLocation, HotelFeature, HotelWithFeatures, AffiliateLink, HotelSearchFilters,
  Neighborhood, NeighborhoodWithTags, NeighborhoodTag, NeighborhoodGuide, NeighborhoodStats, NeighborhoodSearchFilters
};

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
    .select(`
      *,
      cities!inner(name, slug),
      states!cities(name, code, slug)
    `)
    .eq('city_id', cityId)
    .eq('active', true)
    .order('popularity_score', { ascending: false })
    .order('aggregate_rating', { ascending: false });
    
  if (limit) {
    query = query.limit(limit);
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
      cities!inner(name, slug),
      states!cities(name, code, slug)
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
      cities!inner(name, slug),
      states!cities(name, code, slug)
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