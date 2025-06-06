import { getDatabase, getCityBySlug } from './database';

interface NeighborhoodTier {
  name: string;
  slug: string;
  tier: 1 | 2 | 3; // 1=Major, 2=Notable, 3=Directory
  region_name: string;
  region_slug: string;
  description?: string;
  characteristics?: string[];
  best_for?: string[];
  price_level?: 'budget' | 'mid-range' | 'upscale' | 'luxury';
  walkability?: 'low' | 'medium' | 'high';
  safety?: 'exercise-caution' | 'generally-safe' | 'very-safe';
  transit_access?: 'limited' | 'good' | 'excellent';
  content_priority: 'high' | 'medium' | 'low';
  search_volume_estimate: number;
  sort_order: number;
}

interface CityRegion {
  name: string;
  slug: string;
  description: string;
  sort_order: number;
}

const tieredNeighborhoodData: Record<string, {
  regions: CityRegion[];
  neighborhoods: NeighborhoodTier[];
}> = {
  // San Francisco, CA
  'san-francisco': {
    regions: [
      { name: 'Central & Downtown', slug: 'central-downtown', description: 'The heart of SF with business, shopping, and tourist attractions', sort_order: 1 },
      { name: 'Northern Waterfront', slug: 'northern-waterfront', description: 'Upscale areas near the bay with beautiful views', sort_order: 2 },
      { name: 'Western Neighborhoods', slug: 'western-neighborhoods', description: 'Residential areas near Golden Gate Park and the ocean', sort_order: 3 },
      { name: 'Central & Eastern Hills', slug: 'central-eastern-hills', description: 'Hip neighborhoods with great food and nightlife', sort_order: 4 },
      { name: 'Southern Neighborhoods', slug: 'southern-neighborhoods', description: 'Diverse residential and emerging areas', sort_order: 5 }
    ],
    neighborhoods: [
      // Tier 1: Major Tourist/High-Traffic (8 neighborhoods)
      { name: 'Mission District', slug: 'mission-district', tier: 1, region_name: 'Central & Eastern Hills', region_slug: 'central-eastern-hills', 
        description: 'Vibrant Latino neighborhood known for incredible taquerias, street art murals, and bustling nightlife scene.',
        characteristics: ['Street art', 'Latino culture', 'Foodie paradise', 'Nightlife hub'],
        best_for: ['Authentic Mexican food', 'Bar hopping', 'Art lovers', 'Young professionals'],
        price_level: 'mid-range', walkability: 'high', safety: 'generally-safe', transit_access: 'excellent',
        content_priority: 'high', search_volume_estimate: 12000, sort_order: 1 },
      
      { name: 'Castro', slug: 'castro', tier: 1, region_name: 'Central & Eastern Hills', region_slug: 'central-eastern-hills',
        description: 'Historic LGBTQ+ neighborhood with rainbow crosswalks, iconic bars, and strong community spirit.',
        characteristics: ['LGBTQ+ history', 'Rainbow flag', 'Community-focused', 'Historic'],
        best_for: ['LGBTQ+ travelers', 'History buffs', 'Community events', 'Inclusive nightlife'],
        price_level: 'mid-range', walkability: 'high', safety: 'very-safe', transit_access: 'good',
        content_priority: 'high', search_volume_estimate: 8500, sort_order: 2 },
      
      { name: 'North Beach', slug: 'north-beach', tier: 1, region_name: 'Central & Downtown', region_slug: 'central-downtown',
        description: 'Little Italy meets Beat Generation. Historic Italian neighborhood with legendary cafes and City Lights Bookstore.',
        characteristics: ['Italian heritage', 'Beat history', 'Literary scene', 'Family-owned businesses'],
        best_for: ['Italian food', 'Coffee culture', 'Literary tours', 'Family dining'],
        price_level: 'mid-range', walkability: 'high', safety: 'very-safe', transit_access: 'good',
        content_priority: 'high', search_volume_estimate: 7200, sort_order: 3 },
      
      { name: 'SoMa', slug: 'soma', tier: 1, region_name: 'Central & Downtown', region_slug: 'central-downtown',
        description: 'South of Market - tech hub with modern restaurants, rooftop bars, and cutting-edge nightlife.',
        characteristics: ['Tech scene', 'Modern architecture', 'Upscale dining', 'Rooftop bars'],
        best_for: ['Business travelers', 'Modern cuisine', 'Tech networking', 'Upscale nightlife'],
        price_level: 'upscale', walkability: 'medium', safety: 'generally-safe', transit_access: 'excellent',
        content_priority: 'high', search_volume_estimate: 9500, sort_order: 4 },
      
      { name: 'Chinatown', slug: 'chinatown', tier: 1, region_name: 'Central & Downtown', region_slug: 'central-downtown',
        description: 'Oldest Chinatown in North America with authentic dim sum, traditional markets, and cultural landmarks.',
        characteristics: ['Chinese culture', 'Traditional markets', 'Authentic cuisine', 'Historic temples'],
        best_for: ['Authentic Chinese food', 'Cultural experiences', 'Dim sum', 'Budget dining'],
        price_level: 'budget', walkability: 'high', safety: 'generally-safe', transit_access: 'excellent',
        content_priority: 'high', search_volume_estimate: 6800, sort_order: 5 },
      
      { name: 'Haight-Ashbury', slug: 'haight-ashbury', tier: 1, region_name: 'Central & Eastern Hills', region_slug: 'central-eastern-hills',
        description: 'Birthplace of the 1960s hippie movement with vintage shops, head shops, and counterculture history.',
        characteristics: ['Hippie history', 'Vintage shopping', 'Counterculture', 'Music venues'],
        best_for: ['Music lovers', 'Vintage shopping', '60s culture', 'Alternative scene'],
        price_level: 'mid-range', walkability: 'high', safety: 'generally-safe', transit_access: 'good',
        content_priority: 'high', search_volume_estimate: 5900, sort_order: 6 },
      
      { name: 'Marina District', slug: 'marina-district', tier: 1, region_name: 'Northern Waterfront', region_slug: 'northern-waterfront',
        description: 'Upscale waterfront neighborhood popular with young professionals. Great brunch spots and bay views.',
        characteristics: ['Waterfront', 'Young professionals', 'Brunch culture', 'Bay views'],
        best_for: ['Brunch', 'Young crowd', 'Waterfront walks', 'Upscale casual dining'],
        price_level: 'upscale', walkability: 'medium', safety: 'very-safe', transit_access: 'limited',
        content_priority: 'high', search_volume_estimate: 4800, sort_order: 7 },
      
      { name: 'Financial District', slug: 'financial-district', tier: 1, region_name: 'Central & Downtown', region_slug: 'central-downtown',
        description: 'Business center with upscale lunch spots, happy hour bars, and convenient transit access.',
        characteristics: ['Business district', 'Lunch spots', 'Happy hour', 'Transit hub'],
        best_for: ['Business meals', 'After-work drinks', 'Quick lunches', 'Hotel stays'],
        price_level: 'upscale', walkability: 'high', safety: 'very-safe', transit_access: 'excellent',
        content_priority: 'high', search_volume_estimate: 5200, sort_order: 8 },

      // Tier 2: Notable Local Neighborhoods (12 neighborhoods)
      { name: 'Noe Valley', slug: 'noe-valley', tier: 2, region_name: 'Central & Eastern Hills', region_slug: 'central-eastern-hills',
        description: 'Family-friendly neighborhood with boutique shopping and cozy cafes.',
        price_level: 'upscale', walkability: 'high', safety: 'very-safe', transit_access: 'good',
        content_priority: 'medium', search_volume_estimate: 2800, sort_order: 9 },
      
      { name: 'Cole Valley', slug: 'cole-valley', tier: 2, region_name: 'Central & Eastern Hills', region_slug: 'central-eastern-hills',
        description: 'Quiet residential area near UCSF with local cafes and small businesses.',
        price_level: 'upscale', walkability: 'medium', safety: 'very-safe', transit_access: 'good',
        content_priority: 'medium', search_volume_estimate: 1200, sort_order: 10 },
      
      { name: 'Glen Park', slug: 'glen-park', tier: 2, region_name: 'Southern Neighborhoods', region_slug: 'southern-neighborhoods',
        description: 'Village-like community with a small town feel within the city.',
        price_level: 'upscale', walkability: 'medium', safety: 'very-safe', transit_access: 'good',
        content_priority: 'medium', search_volume_estimate: 1500, sort_order: 11 },
      
      { name: 'Inner Richmond', slug: 'inner-richmond', tier: 2, region_name: 'Western Neighborhoods', region_slug: 'western-neighborhoods',
        description: 'Diverse neighborhood with excellent Asian restaurants and proximity to Golden Gate Park.',
        price_level: 'mid-range', walkability: 'medium', safety: 'generally-safe', transit_access: 'good',
        content_priority: 'medium', search_volume_estimate: 2100, sort_order: 12 },
      
      { name: 'Inner Sunset', slug: 'inner-sunset', tier: 2, region_name: 'Western Neighborhoods', region_slug: 'western-neighborhoods',
        description: 'Fog-kissed neighborhood with great Asian food and proximity to Golden Gate Park.',
        price_level: 'mid-range', walkability: 'medium', safety: 'generally-safe', transit_access: 'good',
        content_priority: 'medium', search_volume_estimate: 1800, sort_order: 13 },
      
      { name: 'Bernal Heights', slug: 'bernal-heights', tier: 2, region_name: 'Southern Neighborhoods', region_slug: 'southern-neighborhoods',
        description: 'Hip residential area with a village atmosphere and great views from Bernal Heights Park.',
        price_level: 'mid-range', walkability: 'medium', safety: 'generally-safe', transit_access: 'limited',
        content_priority: 'medium', search_volume_estimate: 1600, sort_order: 14 },
      
      { name: 'Russian Hill', slug: 'russian-hill', tier: 2, region_name: 'Central & Downtown', region_slug: 'central-downtown',
        description: 'Upscale residential area with steep streets, beautiful views, and Lombard Street.',
        price_level: 'luxury', walkability: 'medium', safety: 'very-safe', transit_access: 'good',
        content_priority: 'medium', search_volume_estimate: 2300, sort_order: 15 },
      
      { name: 'Pacific Heights', slug: 'pacific-heights', tier: 2, region_name: 'Northern Waterfront', region_slug: 'northern-waterfront',
        description: 'Prestigious neighborhood with Victorian mansions and upscale shopping on Fillmore Street.',
        price_level: 'luxury', walkability: 'medium', safety: 'very-safe', transit_access: 'limited',
        content_priority: 'medium', search_volume_estimate: 1900, sort_order: 16 },
      
      { name: 'Potrero Hill', slug: 'potrero-hill', tier: 2, region_name: 'Southern Neighborhoods', region_slug: 'southern-neighborhoods',
        description: 'Sunny neighborhood with tech companies, dog parks, and a growing food scene.',
        price_level: 'upscale', walkability: 'medium', safety: 'generally-safe', transit_access: 'limited',
        content_priority: 'medium', search_volume_estimate: 1400, sort_order: 17 },
      
      { name: 'Hayes Valley', slug: 'hayes-valley', tier: 2, region_name: 'Central & Downtown', region_slug: 'central-downtown',
        description: 'Trendy neighborhood with designer boutiques, farm-to-table restaurants, and the Opera House.',
        price_level: 'upscale', walkability: 'high', safety: 'generally-safe', transit_access: 'excellent',
        content_priority: 'medium', search_volume_estimate: 2000, sort_order: 18 },
      
      { name: 'Union Square', slug: 'union-square', tier: 2, region_name: 'Central & Downtown', region_slug: 'central-downtown',
        description: 'Shopping and theater district with major department stores and hotels.',
        price_level: 'upscale', walkability: 'high', safety: 'generally-safe', transit_access: 'excellent',
        content_priority: 'medium', search_volume_estimate: 3200, sort_order: 19 },
      
      { name: 'Fillmore', slug: 'fillmore', tier: 2, region_name: 'Northern Waterfront', region_slug: 'northern-waterfront',
        description: 'Historic jazz district with a rich African American heritage and vibrant music scene.',
        price_level: 'mid-range', walkability: 'medium', safety: 'generally-safe', transit_access: 'good',
        content_priority: 'medium', search_volume_estimate: 1300, sort_order: 20 },

      // Tier 3: Directory Only (20+ neighborhoods)
      { name: 'Outer Richmond', slug: 'outer-richmond', tier: 3, region_name: 'Western Neighborhoods', region_slug: 'western-neighborhoods',
        description: 'Residential area near the ocean with affordable dining and proximity to beaches.',
        content_priority: 'low', search_volume_estimate: 800, sort_order: 21 },
      
      { name: 'Outer Sunset', slug: 'outer-sunset', tier: 3, region_name: 'Western Neighborhoods', region_slug: 'western-neighborhoods',
        description: 'Foggy residential neighborhood near Ocean Beach with a laid-back vibe.',
        content_priority: 'low', search_volume_estimate: 700, sort_order: 22 },
      
      { name: 'Excelsior', slug: 'excelsior', tier: 3, region_name: 'Southern Neighborhoods', region_slug: 'southern-neighborhoods',
        description: 'Diverse residential area with affordable housing and growing food scene.',
        content_priority: 'low', search_volume_estimate: 400, sort_order: 23 },
      
      { name: 'Visitacion Valley', slug: 'visitacion-valley', tier: 3, region_name: 'Southern Neighborhoods', region_slug: 'southern-neighborhoods',
        description: 'Affordable residential neighborhood in the southern part of the city.',
        content_priority: 'low', search_volume_estimate: 200, sort_order: 24 },
      
      { name: 'Bayview', slug: 'bayview', tier: 3, region_name: 'Southern Neighborhoods', region_slug: 'southern-neighborhoods',
        description: 'Historically African American neighborhood undergoing revitalization.',
        content_priority: 'low', search_volume_estimate: 600, sort_order: 25 },
      
      { name: 'Hunters Point', slug: 'hunters-point', tier: 3, region_name: 'Southern Neighborhoods', region_slug: 'southern-neighborhoods',
        description: 'Waterfront industrial area with growing arts community.',
        content_priority: 'low', search_volume_estimate: 300, sort_order: 26 },
      
      { name: 'Diamond Heights', slug: 'diamond-heights', tier: 3, region_name: 'Central & Eastern Hills', region_slug: 'central-eastern-hills',
        description: 'Residential hilltop neighborhood with panoramic city views.',
        content_priority: 'low', search_volume_estimate: 250, sort_order: 27 },
      
      { name: 'Twin Peaks', slug: 'twin-peaks', tier: 3, region_name: 'Central & Eastern Hills', region_slug: 'central-eastern-hills',
        description: 'Residential area around the famous Twin Peaks hills with scenic views.',
        content_priority: 'low', search_volume_estimate: 900, sort_order: 28 },
      
      { name: 'Presidio Heights', slug: 'presidio-heights', tier: 3, region_name: 'Northern Waterfront', region_slug: 'northern-waterfront',
        description: 'Upscale residential area near the Presidio park.',
        content_priority: 'low', search_volume_estimate: 350, sort_order: 29 },
      
      { name: 'Sea Cliff', slug: 'sea-cliff', tier: 3, region_name: 'Western Neighborhoods', region_slug: 'western-neighborhoods',
        description: 'Exclusive oceanfront neighborhood with expensive homes.',
        content_priority: 'low', search_volume_estimate: 400, sort_order: 30 }
    ]
  },

  // New York City, NY
  'new-york-city': {
    regions: [
      { name: 'Lower Manhattan', slug: 'lower-manhattan', description: 'Historic downtown with Wall Street, SoHo, and trendy neighborhoods', sort_order: 1 },
      { name: 'Midtown', slug: 'midtown', description: 'The heart of NYC with Times Square, Theater District, and business centers', sort_order: 2 },
      { name: 'Upper Manhattan', slug: 'upper-manhattan', description: 'Upscale residential areas and cultural institutions', sort_order: 3 },
      { name: 'Brooklyn', slug: 'brooklyn', description: 'Hip boroughs with diverse neighborhoods and artisanal culture', sort_order: 4 },
      { name: 'Outer Boroughs', slug: 'outer-boroughs', description: 'Queens, Bronx, and Staten Island neighborhoods', sort_order: 5 }
    ],
    neighborhoods: [
      // Tier 1: Major Tourist/High-Traffic
      { name: 'SoHo', slug: 'soho', tier: 1, region_name: 'Lower Manhattan', region_slug: 'lower-manhattan',
        description: 'Cast-iron architecture meets high-end shopping and trendy restaurants in this fashion-forward neighborhood.',
        characteristics: ['Cast-iron buildings', 'Designer shopping', 'Art galleries', 'Trendy restaurants'],
        best_for: ['Shopping', 'Architecture tours', 'Gallery hopping', 'Instagram spots'],
        price_level: 'luxury', walkability: 'high', safety: 'very-safe', transit_access: 'excellent',
        content_priority: 'high', search_volume_estimate: 15000, sort_order: 1 },
      
      { name: 'Greenwich Village', slug: 'greenwich-village', tier: 1, region_name: 'Lower Manhattan', region_slug: 'lower-manhattan',
        description: 'Historic bohemian neighborhood with tree-lined streets, intimate jazz clubs, and cozy cafes.',
        characteristics: ['Historic charm', 'Jazz scene', 'Bohemian culture', 'Tree-lined streets'],
        best_for: ['Jazz music', 'Coffee culture', 'Historic walks', 'Intimate dining'],
        price_level: 'upscale', walkability: 'high', safety: 'very-safe', transit_access: 'excellent',
        content_priority: 'high', search_volume_estimate: 12000, sort_order: 2 },
      
      { name: 'Lower East Side', slug: 'lower-east-side', tier: 1, region_name: 'Lower Manhattan', region_slug: 'lower-manhattan',
        description: 'Former immigrant neighborhood now hip area with speakeasies, vintage shops, and diverse food scene.',
        characteristics: ['Immigrant history', 'Speakeasies', 'Vintage shopping', 'Diverse food'],
        best_for: ['Nightlife', 'Food tours', 'Vintage shopping', 'Cultural history'],
        price_level: 'mid-range', walkability: 'high', safety: 'generally-safe', transit_access: 'excellent',
        content_priority: 'high', search_volume_estimate: 8500, sort_order: 3 },
      
      { name: 'Williamsburg', slug: 'williamsburg', tier: 1, region_name: 'Brooklyn', region_slug: 'brooklyn',
        description: 'Brooklyn hipster capital with artisanal everything, rooftop bars, and Manhattan skyline views.',
        characteristics: ['Hipster culture', 'Artisanal food', 'Rooftop bars', 'Manhattan views'],
        best_for: ['Craft beer', 'Artisanal food', 'Rooftop dining', 'Young crowd'],
        price_level: 'mid-range', walkability: 'high', safety: 'generally-safe', transit_access: 'good',
        content_priority: 'high', search_volume_estimate: 10000, sort_order: 4 },
      
      { name: 'Chelsea', slug: 'chelsea', tier: 1, region_name: 'Lower Manhattan', region_slug: 'lower-manhattan',
        description: 'Art district with world-class galleries, the High Line park, and innovative restaurants.',
        characteristics: ['Art galleries', 'High Line', 'Modern architecture', 'Innovation'],
        best_for: ['Art lovers', 'Gallery walks', 'Modern cuisine', 'Architecture'],
        price_level: 'upscale', walkability: 'high', safety: 'very-safe', transit_access: 'excellent',
        content_priority: 'high', search_volume_estimate: 9200, sort_order: 5 },
      
      { name: 'East Village', slug: 'east-village', tier: 1, region_name: 'Lower Manhattan', region_slug: 'lower-manhattan',
        description: 'Punk rock history meets diverse food scene in this edgy, eclectic neighborhood.',
        characteristics: ['Punk history', 'Diverse food', 'Alternative culture', 'Live music'],
        best_for: ['Music venues', 'Diverse cuisine', 'Alternative scene', 'Late-night eats'],
        price_level: 'mid-range', walkability: 'high', safety: 'generally-safe', transit_access: 'excellent',
        content_priority: 'high', search_volume_estimate: 7800, sort_order: 6 },

      // Tier 2: Notable neighborhoods
      { name: 'Tribeca', slug: 'tribeca', tier: 2, region_name: 'Lower Manhattan', region_slug: 'lower-manhattan',
        description: 'Upscale neighborhood with cobblestone streets and celebrity residents.',
        price_level: 'luxury', walkability: 'high', safety: 'very-safe', transit_access: 'excellent',
        content_priority: 'medium', search_volume_estimate: 4200, sort_order: 7 },
      
      { name: 'Nolita', slug: 'nolita', tier: 2, region_name: 'Lower Manhattan', region_slug: 'lower-manhattan',
        description: 'North of Little Italy with boutique shopping and trendy cafes.',
        price_level: 'upscale', walkability: 'high', safety: 'very-safe', transit_access: 'excellent',
        content_priority: 'medium', search_volume_estimate: 3100, sort_order: 8 },
      
      { name: 'Upper West Side', slug: 'upper-west-side', tier: 2, region_name: 'Upper Manhattan', region_slug: 'upper-manhattan',
        description: 'Family-friendly area near Central Park with cultural institutions.',
        price_level: 'upscale', walkability: 'high', safety: 'very-safe', transit_access: 'excellent',
        content_priority: 'medium', search_volume_estimate: 5600, sort_order: 9 },
      
      { name: 'Upper East Side', slug: 'upper-east-side', tier: 2, region_name: 'Upper Manhattan', region_slug: 'upper-manhattan',
        description: 'Upscale residential area with museums and high-end shopping.',
        price_level: 'luxury', walkability: 'high', safety: 'very-safe', transit_access: 'excellent',
        content_priority: 'medium', search_volume_estimate: 4800, sort_order: 10 },

      // Tier 3: Directory only
      { name: 'Chinatown', slug: 'chinatown', tier: 3, region_name: 'Lower Manhattan', region_slug: 'lower-manhattan',
        description: 'Traditional Chinese enclave with authentic cuisine and markets.',
        content_priority: 'low', search_volume_estimate: 2100, sort_order: 11 },
      
      { name: 'Little Italy', slug: 'little-italy', tier: 3, region_name: 'Lower Manhattan', region_slug: 'lower-manhattan',
        description: 'Historic Italian neighborhood with traditional restaurants.',
        content_priority: 'low', search_volume_estimate: 1800, sort_order: 12 },
      
      { name: 'Park Slope', slug: 'park-slope', tier: 3, region_name: 'Brooklyn', region_slug: 'brooklyn',
        description: 'Family-friendly Brooklyn neighborhood with brownstones.',
        content_priority: 'low', search_volume_estimate: 3200, sort_order: 13 },
      
      { name: 'DUMBO', slug: 'dumbo', tier: 3, region_name: 'Brooklyn', region_slug: 'brooklyn',
        description: 'Down Under Manhattan Bridge Overpass with waterfront views.',
        content_priority: 'low', search_volume_estimate: 2800, sort_order: 14 }
    ]
  },

  // Continue pattern for other cities...
  'los-angeles': {
    regions: [
      { name: 'Westside', slug: 'westside', description: 'Upscale beach communities and shopping areas', sort_order: 1 },
      { name: 'Central LA', slug: 'central-la', description: 'Downtown, Hollywood, and entertainment districts', sort_order: 2 },
      { name: 'South LA', slug: 'south-la', description: 'Diverse communities with rich cultural heritage', sort_order: 3 },
      { name: 'San Fernando Valley', slug: 'san-fernando-valley', description: 'Suburban communities in the valley', sort_order: 4 }
    ],
    neighborhoods: [
      // Tier 1
      { name: 'Venice', slug: 'venice', tier: 1, region_name: 'Westside', region_slug: 'westside',
        description: 'Bohemian beach town with boardwalk performers, street art, and eclectic dining scene.',
        price_level: 'mid-range', walkability: 'medium', safety: 'exercise-caution', transit_access: 'limited',
        content_priority: 'high', search_volume_estimate: 8500, sort_order: 1 },
      
      { name: 'Beverly Hills', slug: 'beverly-hills', tier: 1, region_name: 'Westside', region_slug: 'westside',
        description: 'Luxury shopping and dining destination famous for Rodeo Drive and celebrity spotting.',
        price_level: 'luxury', walkability: 'medium', safety: 'very-safe', transit_access: 'limited',
        content_priority: 'high', search_volume_estimate: 12000, sort_order: 2 },
      
      { name: 'Santa Monica', slug: 'santa-monica', tier: 1, region_name: 'Westside', region_slug: 'westside',
        description: 'Beach city with the famous pier, Third Street Promenade, and healthy California cuisine.',
        price_level: 'upscale', walkability: 'high', safety: 'very-safe', transit_access: 'good',
        content_priority: 'high', search_volume_estimate: 15000, sort_order: 3 },
      
      { name: 'West Hollywood', slug: 'west-hollywood', tier: 1, region_name: 'Central LA', region_slug: 'central-la',
        description: 'LGBTQ+ friendly area with trendy restaurants, nightlife, and the famous Sunset Strip.',
        price_level: 'upscale', walkability: 'medium', safety: 'generally-safe', transit_access: 'limited',
        content_priority: 'high', search_volume_estimate: 7200, sort_order: 4 },
      
      { name: 'Hollywood', slug: 'hollywood', tier: 1, region_name: 'Central LA', region_slug: 'central-la',
        description: 'Entertainment capital with Walk of Fame, historic theaters, and tourist attractions.',
        price_level: 'mid-range', walkability: 'medium', safety: 'exercise-caution', transit_access: 'good',
        content_priority: 'high', search_volume_estimate: 11000, sort_order: 5 },

      // Tier 2
      { name: 'Manhattan Beach', slug: 'manhattan-beach', tier: 2, region_name: 'Westside', region_slug: 'westside',
        description: 'Upscale beach community with volleyball culture and family-friendly atmosphere.',
        content_priority: 'medium', search_volume_estimate: 2800, sort_order: 6 },
      
      { name: 'Melrose', slug: 'melrose', tier: 2, region_name: 'Central LA', region_slug: 'central-la',
        description: 'Trendy shopping district with vintage stores and hip restaurants.',
        content_priority: 'medium', search_volume_estimate: 3200, sort_order: 7 },

      // Tier 3
      { name: 'Hermosa Beach', slug: 'hermosa-beach', tier: 3, region_name: 'Westside', region_slug: 'westside',
        description: 'Party beach town with volleyball and nightlife.',
        content_priority: 'low', search_volume_estimate: 1500, sort_order: 8 },
      
      { name: 'Redondo Beach', slug: 'redondo-beach', tier: 3, region_name: 'Westside', region_slug: 'westside',
        description: 'Family beach community with pier and seafood restaurants.',
        content_priority: 'low', search_volume_estimate: 1200, sort_order: 9 }
    ]
  }
};

export function seedTieredNeighborhoods(): number {
  const db = getDatabase();
  let totalSeeded = 0;
  let totalRegions = 0;

  for (const [citySlug, cityData] of Object.entries(tieredNeighborhoodData)) {
    const city = getCityBySlug(citySlug);
    if (!city) {
      console.log(`City ${citySlug} not found, skipping`);
      continue;
    }

    console.log(`\n🏙️ Seeding tiered neighborhoods for ${city.name}...`);

    // First, seed regions
    const insertRegion = db.prepare(`
      INSERT OR REPLACE INTO neighborhood_regions (
        name, slug, city_id, description, sort_order
      ) VALUES (?, ?, ?, ?, ?)
    `);

    for (const region of cityData.regions) {
      try {
        insertRegion.run(region.name, region.slug, city.id, region.description, region.sort_order);
        totalRegions++;
        console.log(`  📍 Region: ${region.name}`);
      } catch (error) {
        console.error(`  ✗ Failed to insert region ${region.name}:`, error);
      }
    }

    // Then seed neighborhoods
    const insertNeighborhood = db.prepare(`
      INSERT OR REPLACE INTO neighborhoods (
        name, slug, city_id, description, characteristics, best_for, 
        price_level, walkability, safety, transit_access, tier, region_name, region_slug,
        content_priority, search_volume_estimate, sort_order, featured, active,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);

    for (const neighborhood of cityData.neighborhoods) {
      try {
        insertNeighborhood.run(
          neighborhood.name,
          neighborhood.slug,
          city.id,
          neighborhood.description || `${neighborhood.name} neighborhood in ${city.name}`,
          neighborhood.characteristics ? JSON.stringify(neighborhood.characteristics) : null,
          neighborhood.best_for ? JSON.stringify(neighborhood.best_for) : null,
          neighborhood.price_level || null,
          neighborhood.walkability || null,
          neighborhood.safety || null,
          neighborhood.transit_access || null,
          neighborhood.tier,
          neighborhood.region_name,
          neighborhood.region_slug,
          neighborhood.content_priority,
          neighborhood.search_volume_estimate,
          neighborhood.sort_order,
          neighborhood.tier === 1, // featured if tier 1
          true // active
        );
        totalSeeded++;
        
        const tierLabel = neighborhood.tier === 1 ? '🌟 Major' : neighborhood.tier === 2 ? '📍 Notable' : '📝 Directory';
        console.log(`    ${tierLabel}: ${neighborhood.name} (${neighborhood.content_priority} priority)`);
      } catch (error) {
        console.error(`  ✗ Failed to insert ${neighborhood.name}:`, error);
      }
    }
  }

  console.log(`\n✅ Successfully seeded:`);
  console.log(`   ${totalRegions} regions`);
  console.log(`   ${totalSeeded} neighborhoods across ${Object.keys(tieredNeighborhoodData).length} cities`);
  
  return totalSeeded;
}

// Export data for other uses
export { tieredNeighborhoodData };

// Run seeder if called directly
if (require.main === module) {
  seedTieredNeighborhoods();
}