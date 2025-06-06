export interface FunFact {
  id: number;
  title: string;
  fact: string;
  category: FunFactCategory;
  location_type: 'neighborhood' | 'city' | 'venue' | 'street' | 'landmark';
  location_id?: number;
  location_name?: string;
  city_id: number;
  latitude?: number;
  longitude?: number;
  source?: string;
  verified: boolean;
  fun_rating: 1 | 2 | 3 | 4 | 5; // How interesting/fun
  tourist_appeal: 1 | 2 | 3 | 4 | 5; // Tourist interest level
  local_knowledge: boolean; // Insider knowledge
  photo_url?: string;
  related_venue_names?: string; // JSON array
  tags?: string; // JSON array
  created_at: string;
  updated_at: string;
}

export interface FunFactWithLocation extends FunFact {
  city_name: string;
  city_slug: string;
  state_name: string;
  state_code: string;
  state_slug: string;
  category_icon?: string;
  category_color?: string;
}

export type FunFactCategory = 
  | 'History'
  | 'Culture' 
  | 'Food'
  | 'Architecture'
  | 'Celebrity'
  | 'Quirky'
  | 'Hidden'
  | 'Film & TV'
  | 'Music'
  | 'Street Art';

export interface FunFactCategoryInfo {
  id: number;
  name: string;
  icon: string;
  description: string;
  color: string;
}

export interface FunFactFilters {
  city_id?: number;
  neighborhood_id?: number;
  category?: FunFactCategory;
  location_type?: FunFact['location_type'];
  min_fun_rating?: number;
  min_tourist_appeal?: number;
  local_knowledge_only?: boolean;
  verified_only?: boolean;
  near_location?: {
    latitude: number;
    longitude: number;
    radius_km?: number;
  };
}

// Utility functions
export function parseRelatedVenues(related_venue_names?: string): string[] {
  if (!related_venue_names) return [];
  try {
    return JSON.parse(related_venue_names);
  } catch {
    return [];
  }
}

export function parseTags(tags?: string): string[] {
  if (!tags) return [];
  try {
    return JSON.parse(tags);
  } catch {
    return [];
  }
}

// Category styling
export const FUN_FACT_CATEGORY_STYLES: Record<FunFactCategory, { bg: string; text: string; border: string }> = {
  'History': { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300' },
  'Culture': { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
  'Food': { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
  'Architecture': { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' },
  'Celebrity': { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
  'Quirky': { bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-300' },
  'Hidden': { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
  'Film & TV': { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' },
  'Music': { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' },
  'Street Art': { bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-300' }
};

// Fun rating indicators
export const FUN_RATING_LABELS = {
  1: '😐 Mildly interesting',
  2: '🙂 Pretty cool',
  3: '😊 Fun to know',
  4: '🤩 Really cool!',
  5: '🤯 Mind-blowing!'
};

// Tourist appeal indicators  
export const TOURIST_APPEAL_LABELS = {
  1: '👥 Local interest only',
  2: '🏘️ Neighborhood curiosity',
  3: '🏙️ City visitor interest',
  4: '✈️ Tourist magnet',
  5: '🌟 Must-know for visitors'
};

// Sample fun fact for testing
export const SAMPLE_FUN_FACTS: Omit<FunFact, 'id' | 'created_at' | 'updated_at'>[] = [
  {
    title: "The Mission District's Mural Origins",
    fact: "The Mission District's famous murals started in the 1970s when Chicano artists began painting political messages on Balmy Alley. What began as protest art is now a world-renowned outdoor gallery with over 100 murals.",
    category: 'Street Art',
    location_type: 'neighborhood',
    location_name: 'Mission District',
    city_id: 1, // San Francisco
    latitude: 37.7599,
    longitude: -122.4148,
    source: 'SF Chronicle Archives',
    verified: true,
    fun_rating: 4,
    tourist_appeal: 5,
    local_knowledge: false,
    related_venue_names: JSON.stringify(['Balmy Alley', 'Clarion Alley']),
    tags: JSON.stringify(['murals', 'chicano', 'political art', 'street art'])
  },
  {
    title: "Castro's Rainbow Crosswalks Secret",
    fact: "The Castro's rainbow crosswalks aren't just painted - they're made of thermoplastic strips that are heat-welded to the asphalt. They're replaced every 2-3 years and cost about $40,000 each time, funded by the Castro Merchants Association.",
    category: 'Culture',
    location_type: 'neighborhood', 
    location_name: 'Castro',
    city_id: 1,
    latitude: 37.7609,
    longitude: -122.4350,
    verified: true,
    fun_rating: 3,
    tourist_appeal: 4,
    local_knowledge: true,
    tags: JSON.stringify(['lgbt', 'rainbow', 'crosswalks', 'pride'])
  }
];

export default FunFact;