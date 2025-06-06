export interface Neighborhood {
  id: number;
  name: string;
  slug: string;
  city_id: number;
  description: string;
  characteristics?: string; // JSON array
  best_for?: string; // JSON array
  price_level?: 'budget' | 'mid-range' | 'upscale' | 'luxury';
  walkability?: 'low' | 'medium' | 'high';
  safety?: 'exercise-caution' | 'generally-safe' | 'very-safe';
  transit_access?: 'limited' | 'good' | 'excellent';
  image_url?: string;
  featured: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NeighborhoodWithLocation extends Neighborhood {
  city_name: string;
  city_slug: string;
  state_name: string;
  state_code: string;
  state_slug: string;
}

export interface NeighborhoodTag {
  id: number;
  name: string;
  category: 'vibe' | 'activity' | 'demographic' | 'price';
  color?: string;
  description?: string;
}

export interface NeighborhoodGuide {
  id: number;
  neighborhood_id: number;
  title: string;
  meta_description: string;
  intro_text?: string;
  history_section?: string;
  dining_guide?: string;
  shopping_guide?: string;
  nightlife_guide?: string;
  getting_around?: string;
  local_tips?: string;
  best_times_to_visit?: string;
  nearby_attractions?: string;
  keywords?: string; // JSON array
  featured_image_url?: string;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface NeighborhoodWithTags extends NeighborhoodWithLocation {
  tags: NeighborhoodTag[];
  characteristics_parsed: string[];
  best_for_parsed: string[];
}

export interface NeighborhoodWithGuide extends NeighborhoodWithTags {
  guide?: NeighborhoodGuide;
}

export interface NeighborhoodStats {
  venue_count: number;
  hotel_count: number;
  restaurant_count: number;
  bar_count: number;
  cafe_count: number;
  activity_count: number;
  avg_price_level: number;
  top_categories: Array<{ category: string; count: number }>;
}

export interface NeighborhoodSearchFilters {
  city_id?: number;
  price_level?: 'budget' | 'mid-range' | 'upscale' | 'luxury';
  walkability?: 'low' | 'medium' | 'high';
  safety?: 'exercise-caution' | 'generally-safe' | 'very-safe';
  transit_access?: 'limited' | 'good' | 'excellent';
  tags?: string[];
  featured?: boolean;
}

export type NeighborhoodCharacteristic = 
  | 'Street art' | 'Latino culture' | 'Foodie paradise' | 'Nightlife hub'
  | 'LGBTQ+ history' | 'Rainbow flag' | 'Community-focused' | 'Historic'
  | 'Italian heritage' | 'Beat history' | 'Literary scene' | 'Family-owned businesses'
  | 'Tech scene' | 'Modern architecture' | 'Upscale dining' | 'Rooftop bars'
  | 'Chinese culture' | 'Traditional markets' | 'Authentic cuisine' | 'Historic temples'
  | 'Hippie history' | 'Vintage shopping' | 'Counterculture' | 'Music venues'
  | 'Waterfront' | 'Young professionals' | 'Brunch culture' | 'Bay views'
  | 'Business district' | 'Lunch spots' | 'Happy hour' | 'Transit hub';

export type NeighborhoodBestFor = 
  | 'Authentic Mexican food' | 'Bar hopping' | 'Art lovers' | 'Young professionals'
  | 'LGBTQ+ travelers' | 'History buffs' | 'Community events' | 'Inclusive nightlife'
  | 'Italian food' | 'Coffee culture' | 'Literary tours' | 'Family dining'
  | 'Business travelers' | 'Modern cuisine' | 'Tech networking' | 'Upscale nightlife'
  | 'Authentic Chinese food' | 'Cultural experiences' | 'Dim sum' | 'Budget dining'
  | 'Music lovers' | 'Vintage shopping' | '60s culture' | 'Alternative scene'
  | 'Brunch' | 'Young crowd' | 'Waterfront walks' | 'Upscale casual dining'
  | 'Business meals' | 'After-work drinks' | 'Quick lunches' | 'Hotel stays';

// Utility functions for type safety
export function parseCharacteristics(characteristics?: string): string[] {
  if (!characteristics) return [];
  try {
    return JSON.parse(characteristics);
  } catch {
    return [];
  }
}

export function parseBestFor(bestFor?: string): string[] {
  if (!bestFor) return [];
  try {
    return JSON.parse(bestFor);
  } catch {
    return [];
  }
}

export function parseKeywords(keywords?: string): string[] {
  if (!keywords) return [];
  try {
    return JSON.parse(keywords);
  } catch {
    return [];
  }
}

// Safety level colors for UI
export const SAFETY_COLORS = {
  'exercise-caution': { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' },
  'generally-safe': { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
  'very-safe': { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' }
};

// Walkability icons
export const WALKABILITY_ICONS = {
  'low': '🚗',
  'medium': '🚶',
  'high': '🚶‍♂️🚶‍♀️'
};

// Transit access icons
export const TRANSIT_ICONS = {
  'limited': '🚌',
  'good': '🚇',
  'excellent': '🚊'
};

// Price level colors
export const PRICE_LEVEL_COLORS = {
  'budget': { bg: 'bg-green-100', text: 'text-green-700' },
  'mid-range': { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  'upscale': { bg: 'bg-orange-100', text: 'text-orange-700' },
  'luxury': { bg: 'bg-purple-100', text: 'text-purple-700' }
};