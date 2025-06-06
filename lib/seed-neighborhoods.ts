import { getDatabase, getCityBySlug } from './database';

interface NeighborhoodSeed {
  name: string;
  slug: string;
  description: string;
  characteristics: string[];
  best_for: string[];
  price_level: 'budget' | 'mid-range' | 'upscale' | 'luxury';
  walkability: 'low' | 'medium' | 'high';
  safety: 'exercise-caution' | 'generally-safe' | 'very-safe';
  transit_access: 'limited' | 'good' | 'excellent';
}

const neighborhoodData: Record<string, NeighborhoodSeed[]> = {
  // San Francisco, CA
  'san-francisco': [
    {
      name: 'Mission District',
      slug: 'mission-district',
      description: 'Vibrant Latino neighborhood known for incredible taquerias, street art murals, and bustling nightlife scene.',
      characteristics: ['Street art', 'Latino culture', 'Foodie paradise', 'Nightlife hub'],
      best_for: ['Authentic Mexican food', 'Bar hopping', 'Art lovers', 'Young professionals'],
      price_level: 'mid-range',
      walkability: 'high',
      safety: 'generally-safe',
      transit_access: 'excellent'
    },
    {
      name: 'Castro',
      slug: 'castro',
      description: 'Historic LGBTQ+ neighborhood with rainbow crosswalks, iconic bars, and strong community spirit.',
      characteristics: ['LGBTQ+ history', 'Rainbow flag', 'Community-focused', 'Historic'],
      best_for: ['LGBTQ+ travelers', 'History buffs', 'Community events', 'Inclusive nightlife'],
      price_level: 'mid-range',
      walkability: 'high',
      safety: 'very-safe',
      transit_access: 'good'
    },
    {
      name: 'North Beach',
      slug: 'north-beach',
      description: 'Little Italy meets Beat Generation. Historic Italian neighborhood with legendary cafes and City Lights Bookstore.',
      characteristics: ['Italian heritage', 'Beat history', 'Literary scene', 'Family-owned businesses'],
      best_for: ['Italian food', 'Coffee culture', 'Literary tours', 'Family dining'],
      price_level: 'mid-range',
      walkability: 'high',
      safety: 'very-safe',
      transit_access: 'good'
    },
    {
      name: 'SoMa',
      slug: 'soma',
      description: 'South of Market - tech hub with modern restaurants, rooftop bars, and cutting-edge nightlife.',
      characteristics: ['Tech scene', 'Modern architecture', 'Upscale dining', 'Rooftop bars'],
      best_for: ['Business travelers', 'Modern cuisine', 'Tech networking', 'Upscale nightlife'],
      price_level: 'upscale',
      walkability: 'medium',
      safety: 'generally-safe',
      transit_access: 'excellent'
    },
    {
      name: 'Chinatown',
      slug: 'chinatown',
      description: 'Oldest Chinatown in North America with authentic dim sum, traditional markets, and cultural landmarks.',
      characteristics: ['Chinese culture', 'Traditional markets', 'Authentic cuisine', 'Historic temples'],
      best_for: ['Authentic Chinese food', 'Cultural experiences', 'Dim sum', 'Budget dining'],
      price_level: 'budget',
      walkability: 'high',
      safety: 'generally-safe',
      transit_access: 'excellent'
    },
    {
      name: 'Haight-Ashbury',
      slug: 'haight-ashbury',
      description: 'Birthplace of the 1960s hippie movement with vintage shops, head shops, and counterculture history.',
      characteristics: ['Hippie history', 'Vintage shopping', 'Counterculture', 'Music venues'],
      best_for: ['Music lovers', 'Vintage shopping', '60s culture', 'Alternative scene'],
      price_level: 'mid-range',
      walkability: 'high',
      safety: 'generally-safe',
      transit_access: 'good'
    },
    {
      name: 'Marina District',
      slug: 'marina-district',
      description: 'Upscale waterfront neighborhood popular with young professionals. Great brunch spots and bay views.',
      characteristics: ['Waterfront', 'Young professionals', 'Brunch culture', 'Bay views'],
      best_for: ['Brunch', 'Young crowd', 'Waterfront walks', 'Upscale casual dining'],
      price_level: 'upscale',
      walkability: 'medium',
      safety: 'very-safe',
      transit_access: 'limited'
    },
    {
      name: 'Financial District',
      slug: 'financial-district',
      description: 'Business center with upscale lunch spots, happy hour bars, and convenient transit access.',
      characteristics: ['Business district', 'Lunch spots', 'Happy hour', 'Transit hub'],
      best_for: ['Business meals', 'After-work drinks', 'Quick lunches', 'Hotel stays'],
      price_level: 'upscale',
      walkability: 'high',
      safety: 'very-safe',
      transit_access: 'excellent'
    }
  ],

  // New York City, NY
  'new-york-city': [
    {
      name: 'SoHo',
      slug: 'soho',
      description: 'Cast-iron architecture meets high-end shopping and trendy restaurants in this fashion-forward neighborhood.',
      characteristics: ['Cast-iron buildings', 'Designer shopping', 'Art galleries', 'Trendy restaurants'],
      best_for: ['Shopping', 'Architecture tours', 'Gallery hopping', 'Instagram spots'],
      price_level: 'luxury',
      walkability: 'high',
      safety: 'very-safe',
      transit_access: 'excellent'
    },
    {
      name: 'Greenwich Village',
      slug: 'greenwich-village',
      description: 'Historic bohemian neighborhood with tree-lined streets, intimate jazz clubs, and cozy cafes.',
      characteristics: ['Historic charm', 'Jazz scene', 'Bohemian culture', 'Tree-lined streets'],
      best_for: ['Jazz music', 'Coffee culture', 'Historic walks', 'Intimate dining'],
      price_level: 'upscale',
      walkability: 'high',
      safety: 'very-safe',
      transit_access: 'excellent'
    },
    {
      name: 'Lower East Side',
      slug: 'lower-east-side',
      description: 'Former immigrant neighborhood now hip area with speakeasies, vintage shops, and diverse food scene.',
      characteristics: ['Immigrant history', 'Speakeasies', 'Vintage shopping', 'Diverse food'],
      best_for: ['Nightlife', 'Food tours', 'Vintage shopping', 'Cultural history'],
      price_level: 'mid-range',
      walkability: 'high',
      safety: 'generally-safe',
      transit_access: 'excellent'
    },
    {
      name: 'Williamsburg',
      slug: 'williamsburg',
      description: 'Brooklyn hipster capital with artisanal everything, rooftop bars, and Manhattan skyline views.',
      characteristics: ['Hipster culture', 'Artisanal food', 'Rooftop bars', 'Manhattan views'],
      best_for: ['Craft beer', 'Artisanal food', 'Rooftop dining', 'Young crowd'],
      price_level: 'mid-range',
      walkability: 'high',
      safety: 'generally-safe',
      transit_access: 'good'
    },
    {
      name: 'Chelsea',
      slug: 'chelsea',
      description: 'Art district with world-class galleries, the High Line park, and innovative restaurants.',
      characteristics: ['Art galleries', 'High Line', 'Modern architecture', 'Innovation'],
      best_for: ['Art lovers', 'Gallery walks', 'Modern cuisine', 'Architecture'],
      price_level: 'upscale',
      walkability: 'high',
      safety: 'very-safe',
      transit_access: 'excellent'
    },
    {
      name: 'East Village',
      slug: 'east-village',
      description: 'Punk rock history meets diverse food scene in this edgy, eclectic neighborhood.',
      characteristics: ['Punk history', 'Diverse food', 'Alternative culture', 'Live music'],
      best_for: ['Music venues', 'Diverse cuisine', 'Alternative scene', 'Late-night eats'],
      price_level: 'mid-range',
      walkability: 'high',
      safety: 'generally-safe',
      transit_access: 'excellent'
    }
  ],

  // Los Angeles, CA
  'los-angeles': [
    {
      name: 'Venice',
      slug: 'venice',
      description: 'Bohemian beach town with boardwalk performers, street art, and eclectic dining scene.',
      characteristics: ['Beach culture', 'Street performers', 'Street art', 'Bohemian vibe'],
      best_for: ['Beach activities', 'Street art', 'Eclectic dining', 'People watching'],
      price_level: 'mid-range',
      walkability: 'medium',
      safety: 'exercise-caution',
      transit_access: 'limited'
    },
    {
      name: 'Beverly Hills',
      slug: 'beverly-hills',
      description: 'Luxury shopping and dining destination famous for Rodeo Drive and celebrity spotting.',
      characteristics: ['Luxury shopping', 'Celebrity culture', 'High-end dining', 'Glamour'],
      best_for: ['Luxury shopping', 'Fine dining', 'Celebrity spotting', 'Luxury hotels'],
      price_level: 'luxury',
      walkability: 'medium',
      safety: 'very-safe',
      transit_access: 'limited'
    },
    {
      name: 'Santa Monica',
      slug: 'santa-monica',
      description: 'Beach city with the famous pier, Third Street Promenade, and healthy California cuisine.',
      characteristics: ['Beach pier', 'Healthy dining', 'Tourist attractions', 'Fitness culture'],
      best_for: ['Beach activities', 'Family fun', 'Healthy eating', 'Tourist attractions'],
      price_level: 'upscale',
      walkability: 'high',
      safety: 'very-safe',
      transit_access: 'good'
    },
    {
      name: 'West Hollywood',
      slug: 'west-hollywood',
      description: 'LGBTQ+ friendly area with trendy restaurants, nightlife, and the famous Sunset Strip.',
      characteristics: ['LGBTQ+ friendly', 'Nightlife', 'Sunset Strip', 'Trendy scene'],
      best_for: ['Nightlife', 'LGBTQ+ travelers', 'Music venues', 'Trendy dining'],
      price_level: 'upscale',
      walkability: 'medium',
      safety: 'generally-safe',
      transit_access: 'limited'
    },
    {
      name: 'Hollywood',
      slug: 'hollywood',
      description: 'Entertainment capital with Walk of Fame, historic theaters, and tourist attractions.',
      characteristics: ['Entertainment industry', 'Tourist attractions', 'Historic theaters', 'Walk of Fame'],
      best_for: ['Tourist attractions', 'Entertainment history', 'Theater shows', 'Movie buffs'],
      price_level: 'mid-range',
      walkability: 'medium',
      safety: 'exercise-caution',
      transit_access: 'good'
    }
  ],

  // Chicago, IL
  'chicago': [
    {
      name: 'River North',
      slug: 'river-north',
      description: 'Downtown district with upscale steakhouses, rooftop bars, and proximity to Magnificent Mile.',
      characteristics: ['Upscale dining', 'Rooftop bars', 'Business district', 'Shopping access'],
      best_for: ['Business dining', 'Steakhouses', 'Rooftop drinks', 'Shopping'],
      price_level: 'upscale',
      walkability: 'high',
      safety: 'very-safe',
      transit_access: 'excellent'
    },
    {
      name: 'Wicker Park',
      slug: 'wicker-park',
      description: 'Hip neighborhood with indie music venues, vintage shops, and artisanal coffee culture.',
      characteristics: ['Indie music', 'Vintage shopping', 'Coffee culture', 'Artistic community'],
      best_for: ['Live music', 'Coffee shops', 'Vintage shopping', 'Alternative culture'],
      price_level: 'mid-range',
      walkability: 'high',
      safety: 'generally-safe',
      transit_access: 'good'
    },
    {
      name: 'Logan Square',
      slug: 'logan-square',
      description: 'Trendy area known for craft cocktails, innovative restaurants, and vibrant food scene.',
      characteristics: ['Craft cocktails', 'Innovative dining', 'Food scene', 'Trendy bars'],
      best_for: ['Craft cocktails', 'Food scene', 'Date nights', 'Young professionals'],
      price_level: 'mid-range',
      walkability: 'high',
      safety: 'generally-safe',
      transit_access: 'good'
    },
    {
      name: 'Lincoln Park',
      slug: 'lincoln-park',
      description: 'Upscale residential area with the zoo, lakefront parks, and family-friendly restaurants.',
      characteristics: ['Family-friendly', 'Lakefront', 'Zoo access', 'Upscale residential'],
      best_for: ['Families', 'Outdoor activities', 'Lakefront walks', 'Brunch'],
      price_level: 'upscale',
      walkability: 'high',
      safety: 'very-safe',
      transit_access: 'excellent'
    }
  ],

  // Miami, FL  
  'miami': [
    {
      name: 'South Beach',
      slug: 'south-beach',
      description: 'Art Deco playground with beautiful beaches, celebrity chef restaurants, and vibrant nightlife.',
      characteristics: ['Art Deco', 'Beautiful beaches', 'Celebrity chefs', 'Nightlife'],
      best_for: ['Beach clubs', 'Fine dining', 'Nightlife', 'Instagram spots'],
      price_level: 'luxury',
      walkability: 'high',
      safety: 'generally-safe',
      transit_access: 'limited'
    },
    {
      name: 'Wynwood',
      slug: 'wynwood',
      description: 'Arts district famous for colorful murals, galleries, and trendy restaurants.',
      characteristics: ['Street art', 'Art galleries', 'Murals', 'Creative scene'],
      best_for: ['Art lovers', 'Instagram photos', 'Gallery walks', 'Creative dining'],
      price_level: 'mid-range',
      walkability: 'medium',
      safety: 'generally-safe',
      transit_access: 'limited'
    },
    {
      name: 'Little Havana',
      slug: 'little-havana',
      description: 'Cuban cultural heart with authentic cuisine, live music, and traditional cigar shops.',
      characteristics: ['Cuban culture', 'Authentic cuisine', 'Live music', 'Cigar culture'],
      best_for: ['Cuban food', 'Cultural experiences', 'Live music', 'Authentic atmosphere'],
      price_level: 'budget',
      walkability: 'medium',
      safety: 'generally-safe',
      transit_access: 'limited'
    }
  ],

  // Austin, TX
  'austin': [
    {
      name: 'Downtown',
      slug: 'downtown',
      description: 'Live music capital with honky-tonk bars, food trucks, and the famous Sixth Street.',
      characteristics: ['Live music', 'Food trucks', 'Sixth Street', 'Honky-tonks'],
      best_for: ['Live music', 'Food trucks', 'Bar hopping', 'Music festivals'],
      price_level: 'mid-range',
      walkability: 'high',
      safety: 'generally-safe',
      transit_access: 'good'
    },
    {
      name: 'South Austin',
      slug: 'south-austin',
      description: 'Keep Austin Weird headquarters with food trailers, dive bars, and local music venues.',
      characteristics: ['Food trailers', 'Dive bars', 'Local music', 'Weird culture'],
      best_for: ['Food trailers', 'Local music', 'Dive bars', 'Austin culture'],
      price_level: 'budget',
      walkability: 'medium',
      safety: 'generally-safe',
      transit_access: 'limited'
    },
    {
      name: 'East Austin',
      slug: 'east-austin',
      description: 'Hip emerging area with craft breweries, BBQ joints, and innovative restaurants.',
      characteristics: ['Craft breweries', 'BBQ culture', 'Innovation', 'Emerging scene'],
      best_for: ['Craft beer', 'BBQ', 'Innovative dining', 'Emerging food scene'],
      price_level: 'mid-range',
      walkability: 'medium',
      safety: 'generally-safe',
      transit_access: 'limited'
    }
  ]
};

export function seedNeighborhoods(): number {
  const db = getDatabase();
  let totalSeeded = 0;

  for (const [citySlug, neighborhoods] of Object.entries(neighborhoodData)) {
    const city = getCityBySlug(citySlug);
    if (!city) {
      console.log(`City ${citySlug} not found, skipping neighborhoods`);
      continue;
    }

    console.log(`Seeding neighborhoods for ${city.name}...`);

    const insertNeighborhood = db.prepare(`
      INSERT OR REPLACE INTO neighborhoods (
        name, slug, city_id, description, characteristics, best_for, 
        price_level, walkability, safety, transit_access, featured, active,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);

    for (const neighborhood of neighborhoods) {
      try {
        insertNeighborhood.run(
          neighborhood.name,
          neighborhood.slug,
          city.id,
          neighborhood.description,
          JSON.stringify(neighborhood.characteristics),
          JSON.stringify(neighborhood.best_for),
          neighborhood.price_level,
          neighborhood.walkability,
          neighborhood.safety,
          neighborhood.transit_access,
          false, // featured - can be updated later
          true   // active
        );
        totalSeeded++;
        console.log(`  ✓ ${neighborhood.name} (${neighborhood.price_level}, ${neighborhood.walkability} walkability)`);
      } catch (error) {
        console.error(`  ✗ Failed to insert ${neighborhood.name}:`, error);
      }
    }
  }

  console.log(`Successfully seeded ${totalSeeded} neighborhoods across ${Object.keys(neighborhoodData).length} cities`);
  return totalSeeded;
}

// Export neighborhood data for other uses (like content generation)
export { neighborhoodData };

// Run seeder if called directly
if (require.main === module) {
  seedNeighborhoods();
}