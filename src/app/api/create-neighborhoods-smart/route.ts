import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@lib/supabase';

// Comprehensive SF neighborhood mapping using street ranges and zip codes
const SF_NEIGHBORHOOD_MAPPING = [
  {
    name: 'The Mission',
    slug: 'mission',
    description: 'Vibrant Latino culture, street art, and the best restaurants per capita in SF',
    criteria: {
      zipCodes: ['94110'],
      streets: [
        // Major Mission streets
        { name: 'Mission St', ranges: [{ start: 2000, end: 4000 }] },
        { name: 'Valencia St', ranges: [{ start: 500, end: 1500 }] },
        { name: '16th St', ranges: [{ start: 2800, end: 3800 }] },
        { name: '18th St', ranges: [{ start: 2800, end: 3800 }] },
        { name: '20th St', ranges: [{ start: 2800, end: 3800 }] },
        { name: '24th St', ranges: [{ start: 2800, end: 3800 }] },
        { name: 'Guerrero St', ranges: [{ start: 500, end: 1500 }] },
        { name: 'Dolores St', ranges: [{ start: 500, end: 1500 }] }
      ],
      keywords: ['Mission District', 'Mission', 'La Mission']
    }
  },
  {
    name: 'Castro',
    slug: 'castro',
    description: 'Historic LGBTQ+ neighborhood with great dining and nightlife',
    criteria: {
      zipCodes: ['94114'],
      streets: [
        { name: 'Castro St', ranges: [{ start: 200, end: 600 }] },
        { name: 'Market St', ranges: [{ start: 2100, end: 2400 }] },
        { name: '18th St', ranges: [{ start: 2200, end: 2800 }] },
        { name: 'Collingwood St', ranges: [{ start: 100, end: 500 }] }
      ],
      keywords: ['Castro', 'Castro District']
    }
  },
  {
    name: 'Marina District',
    slug: 'marina',
    description: 'Upscale waterfront neighborhood with fitness culture and restaurants',
    criteria: {
      zipCodes: ['94123'],
      streets: [
        { name: 'Chestnut St', ranges: [{ start: 2000, end: 3500 }] },
        { name: 'Union St', ranges: [{ start: 2000, end: 3500 }] },
        { name: 'Fillmore St', ranges: [{ start: 1900, end: 2500 }] },
        { name: 'Marina Blvd', ranges: [{ start: 1, end: 500 }] }
      ],
      keywords: ['Marina', 'Marina District']
    }
  },
  {
    name: 'North Beach',
    slug: 'north-beach',
    description: 'Italian heritage, authentic delis, and classic San Francisco atmosphere',
    criteria: {
      zipCodes: ['94133'],
      streets: [
        { name: 'Columbus Ave', ranges: [{ start: 200, end: 1000 }] },
        { name: 'Stockton St', ranges: [{ start: 200, end: 1000 }] },
        { name: 'Grant Ave', ranges: [{ start: 200, end: 800 }] },
        { name: 'Broadway', ranges: [{ start: 200, end: 800 }] }
      ],
      keywords: ['North Beach', 'Little Italy']
    }
  },
  {
    name: 'Chinatown',
    slug: 'chinatown',
    description: 'Authentic Chinese cuisine and traditional tea houses',
    criteria: {
      zipCodes: ['94108'],
      streets: [
        { name: 'Grant Ave', ranges: [{ start: 600, end: 1200 }] },
        { name: 'Kearny St', ranges: [{ start: 600, end: 1200 }] },
        { name: 'Stockton St', ranges: [{ start: 600, end: 1200 }] }
      ],
      keywords: ['Chinatown']
    }
  },
  {
    name: 'SoMa',
    slug: 'soma',
    description: 'South of Market tech hub with modern restaurants and rooftop bars',
    criteria: {
      zipCodes: ['94103', '94105', '94107'],
      streets: [
        { name: 'Howard St', ranges: [{ start: 200, end: 2000 }] },
        { name: 'Folsom St', ranges: [{ start: 200, end: 2000 }] },
        { name: 'Bryant St', ranges: [{ start: 200, end: 2000 }] },
        { name: 'Brannan St', ranges: [{ start: 200, end: 2000 }] }
      ],
      keywords: ['SoMa', 'South of Market']
    }
  },
  {
    name: 'Financial District',
    slug: 'financial',
    description: 'Business district with upscale dining and happy hour spots',
    criteria: {
      zipCodes: ['94104', '94111'],
      streets: [
        { name: 'Montgomery St', ranges: [{ start: 1, end: 800 }] },
        { name: 'California St', ranges: [{ start: 1, end: 800 }] },
        { name: 'Battery St', ranges: [{ start: 1, end: 600 }] }
      ],
      keywords: ['Financial District', 'FiDi']
    }
  },
  {
    name: 'Haight-Ashbury',
    slug: 'haight',
    description: 'Bohemian culture, vintage shops, and eclectic dining scene',
    criteria: {
      zipCodes: ['94117'],
      streets: [
        { name: 'Haight St', ranges: [{ start: 1000, end: 2000 }] },
        { name: 'Ashbury St', ranges: [{ start: 1, end: 500 }] },
        { name: 'Divisadero St', ranges: [{ start: 1500, end: 2000 }] }
      ],
      keywords: ['Haight', 'Haight-Ashbury']
    }
  },
  {
    name: 'Nob Hill',
    slug: 'nob-hill', 
    description: 'Elegant neighborhood with fine dining and classic cocktail bars',
    criteria: {
      zipCodes: ['94109'],
      streets: [
        { name: 'California St', ranges: [{ start: 800, end: 1800 }] },
        { name: 'Sacramento St', ranges: [{ start: 800, end: 1800 }] },
        { name: 'Powell St', ranges: [{ start: 800, end: 1200 }] }
      ],
      keywords: ['Nob Hill']
    }
  },
  {
    name: 'Pacific Heights',
    slug: 'pacific-heights',
    description: 'Upscale residential area with fine dining',
    criteria: {
      zipCodes: ['94115'],
      streets: [
        { name: 'Fillmore St', ranges: [{ start: 1800, end: 2800 }] },
        { name: 'Union St', ranges: [{ start: 1800, end: 2500 }] },
        { name: 'Pacific Ave', ranges: [{ start: 1800, end: 2800 }] }
      ],
      keywords: ['Pacific Heights']
    }
  }
];

function mapAddressToNeighborhood(address: string): string | null {
  if (!address) return null;
  
  const addressUpper = address.toUpperCase();
  
  // First try zip code matching (most accurate)
  for (const neighborhood of SF_NEIGHBORHOOD_MAPPING) {
    for (const zipCode of neighborhood.criteria.zipCodes) {
      if (addressUpper.includes(zipCode)) {
        return neighborhood.name;
      }
    }
  }
  
  // Then try keyword matching
  for (const neighborhood of SF_NEIGHBORHOOD_MAPPING) {
    for (const keyword of neighborhood.criteria.keywords) {
      if (addressUpper.includes(keyword.toUpperCase())) {
        return neighborhood.name;
      }
    }
  }
  
  // Finally try street number ranges
  for (const neighborhood of SF_NEIGHBORHOOD_MAPPING) {
    for (const street of neighborhood.criteria.streets) {
      const streetRegex = new RegExp(`(\\d+)\\s+${street.name.replace(/\s/g, '\\s+')}`, 'i');
      const match = address.match(streetRegex);
      
      if (match) {
        const streetNumber = parseInt(match[1]);
        for (const range of street.ranges) {
          if (streetNumber >= range.start && streetNumber <= range.end) {
            return neighborhood.name;
          }
        }
      }
    }
  }
  
  return null; // Return null if no match found
}

export async function POST(request: NextRequest) {
  try {
    const { confirm = false } = await request.json();
    
    if (!confirm) {
      return NextResponse.json({
        warning: 'This will create neighborhoods and intelligently map all venues using geospatial logic',
        details: 'Uses zip codes, street ranges, and keywords for accurate mapping',
        instructions: 'Send { confirm: true } to proceed'
      });
    }
    
    console.log('🗺️ Creating neighborhoods with smart mapping...');
    
    // Get SF city ID
    const { data: sfCity } = await supabaseAdmin
      .from('cities')
      .select('id')
      .eq('name', 'San Francisco')
      .single();
    
    if (!sfCity) {
      throw new Error('San Francisco city not found');
    }
    
    // Create neighborhoods
    const neighborhoodsToCreate = SF_NEIGHBORHOOD_MAPPING.map(n => ({
      name: n.name,
      slug: n.slug,
      description: n.description,
      city_id: sfCity.id,
      active: true
    }));
    
    const { data: insertedNeighborhoods, error: neighborhoodError } = await supabaseAdmin
      .from('neighborhoods')
      .upsert(neighborhoodsToCreate, {
        onConflict: 'slug,city_id',
        ignoreDuplicates: false
      })
      .select();
    
    if (neighborhoodError) {
      throw neighborhoodError;
    }
    
    // Create neighborhood map
    const neighborhoodMap = new Map(
      insertedNeighborhoods?.map(n => [n.name, n.id]) || []
    );
    
    // Get all venues without neighborhoods
    const { data: venues } = await supabaseAdmin
      .from('venues')
      .select('id, name, address')
      .is('neighborhood_id', null);
    
    let mappedCount = 0;
    let unmappedCount = 0;
    const mappingResults: any[] = [];
    
    for (const venue of venues || []) {
      const neighborhoodName = mapAddressToNeighborhood(venue.address);
      
      if (neighborhoodName && neighborhoodMap.has(neighborhoodName)) {
        const neighborhoodId = neighborhoodMap.get(neighborhoodName);
        
        const { error } = await supabaseAdmin
          .from('venues')
          .update({ neighborhood_id: neighborhoodId })
          .eq('id', venue.id);
        
        if (!error) {
          mappedCount++;
          mappingResults.push({
            venue: venue.name,
            neighborhood: neighborhoodName,
            address: venue.address
          });
        }
      } else {
        unmappedCount++;
      }
    }
    
    // Get final neighborhood counts
    const finalCounts: any = {};
    for (const [name, id] of neighborhoodMap) {
      const { count } = await supabaseAdmin
        .from('venues')
        .select('*', { count: 'exact', head: true })
        .eq('neighborhood_id', id);
      
      finalCounts[name] = count;
    }
    
    return NextResponse.json({
      success: true,
      message: 'Smart neighborhood mapping completed',
      data: {
        neighborhoodsCreated: insertedNeighborhoods?.length || 0,
        venuesMapped: mappedCount,
        venuesUnmapped: unmappedCount,
        finalCounts,
        sampleMappings: mappingResults.slice(0, 10)
      }
    });
    
  } catch (error: any) {
    console.error('Smart mapping error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Smart mapping failed'
    }, { status: 500 });
  }
}