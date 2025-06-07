import { supabase, supabaseAdmin } from './supabase';

// Simple working version without broken JOINs
export async function getVenuesByCity(cityId: number, limit?: number) {
  if (limit) {
    // If limit specified, use normal query
    const { data, error } = await supabase
      .from('venues')
      .select('*')
      .eq('city_id', cityId)
      .eq('active', true)
      .order('popularity_score', { ascending: false })
      .order('aggregate_rating', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  }
  
  // Get ALL venues using pagination to bypass 1000 limit
  let allVenues: any[] = [];
  let start = 0;
  const pageSize = 1000;
  
  while (true) {
    const { data, error } = await supabase
      .from('venues')
      .select('*, neighborhoods(id, name)')
      .eq('city_id', cityId)
      .eq('active', true)
      .range(start, start + pageSize - 1);
    
    if (error) throw error;
    if (!data || data.length === 0) break;
    
    allVenues = allVenues.concat(data);
    
    if (data.length < pageSize) break; // Last page
    start += pageSize;
  }
  
  return allVenues;
}

export async function getCityBySlug(slug: string) {
  const { data, error } = await supabase
    .from('cities')
    .select('*')
    .eq('slug', slug)
    .single();
    
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function getNeighborhoodsByCityWithFilters(cityId: number) {
  const { data, error } = await supabase
    .from('neighborhoods')
    .select('*')
    .eq('city_id', cityId)
    .eq('active', true)
    .order('name');
    
  if (error) throw error;
  return data || [];
}

// Minimal exports to prevent crashes
export async function getAllStates() {
  const { data, error } = await supabase.from('states').select('*').order('name');
  if (error) throw error;
  return data || [];
}

export async function getCapitalCities() {
  const { data, error } = await supabase.from('cities').select('*').eq('is_capital', true);
  if (error) throw error;
  return data || [];
}

export async function getTouristCities() {
  const { data, error } = await supabase.from('cities').select('*').eq('is_major_tourist_city', true);
  if (error) throw error;
  return data || [];
}

export async function getStateBySlug(slug: string) {
  const { data, error } = await supabase.from('states').select('*').eq('slug', slug).single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function getCitiesByState(stateCode: string) {
  const { data, error } = await supabase.from('cities').select('*').eq('state_code', stateCode).order('name');
  if (error) throw error;
  return data || [];
}

export async function getVenuesByCityAndCategory(cityId: number, category: string) {
  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .eq('city_id', cityId)
    .eq('category', category)
    .eq('active', true)
    .limit(50000);
  if (error) throw error;
  return data || [];
}

export async function getHotelsByCity(cityId: number) {
  const { data, error } = await supabase.from('hotels').select('*').eq('city_id', cityId).eq('active', true);
  if (error) throw error;
  return data || [];
}

export async function getVenuesByCityAndNeighborhood(cityId: number, neighborhoodName: string) {
  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .eq('city_id', cityId)
    .eq('active', true)
    .limit(50000);
  if (error) throw error;
  return data || [];
}

export async function getNeighborhoodsByCity(cityId: number) {
  const { data, error } = await supabase.from('neighborhoods').select('*').eq('city_id', cityId).order('name');
  if (error) throw error;
  return data || [];
}

export async function getNeighborhoodWithTags() {
  return null;
}

export async function getNeighborhoodStats() {
  return null;
}