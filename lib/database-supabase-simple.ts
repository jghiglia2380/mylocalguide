import { supabase, supabaseAdmin } from './supabase';

// Simple working version without broken JOINs
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
    query = query.limit(50000);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
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