import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@lib/supabase';

const MISSING_NEIGHBORHOODS = [
  {
    name: 'Hayes Valley',
    slug: 'hayes-valley',
    description: 'Hip neighborhood with boutiques, cafes, and modern dining',
    zipCodes: ['94102'],
    keywords: ['Hayes St', 'Octavia St', 'Hayes Valley']
  },
  {
    name: 'Richmond District',
    slug: 'richmond',
    description: 'Diverse neighborhood with authentic Asian cuisine and bookstores',
    zipCodes: ['94118'],
    keywords: ['Clement St', 'Geary Blvd', 'Richmond']
  },
  {
    name: 'Presidio',
    slug: 'presidio',
    description: 'Former military base turned park with scenic dining and recreation',
    zipCodes: ['94129'],
    keywords: ['Crissy Field', 'Presidio', 'E Beach']
  },
  {
    name: 'Tenderloin',
    slug: 'tenderloin',
    description: 'Diverse downtown neighborhood with authentic ethnic restaurants',
    zipCodes: ['94102'],
    keywords: ['Ellis St', 'Eddy St', 'Jones St', 'Tenderloin']
  },
  {
    name: 'Union Square',
    slug: 'union-square',
    description: 'Shopping and theater district with upscale dining',
    zipCodes: ['94102'],
    keywords: ['Union Square', 'Powell St', 'Cyril Magnin']
  },
  {
    name: 'West Portal',
    slug: 'west-portal',
    description: 'Quiet residential area with neighborhood restaurants',
    zipCodes: ['94127'],
    keywords: ['West Portal', 'Claremont Blvd']
  }
];

function mapUnmappedVenue(name: string, address: string): string | null {
  const addressUpper = address.toUpperCase();
  
  for (const neighborhood of MISSING_NEIGHBORHOODS) {
    // Check zip codes
    for (const zipCode of neighborhood.zipCodes) {
      if (addressUpper.includes(zipCode)) {
        // Additional keyword check for 94102 (multiple neighborhoods)
        if (zipCode === '94102') {
          const hasKeyword = neighborhood.keywords.some(keyword => 
            addressUpper.includes(keyword.toUpperCase())
          );
          if (hasKeyword) {
            return neighborhood.name;
          }
        } else {
          return neighborhood.name;
        }
      }
    }
    
    // Check keywords
    for (const keyword of neighborhood.keywords) {
      if (addressUpper.includes(keyword.toUpperCase())) {
        return neighborhood.name;
      }
    }
  }
  
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const { confirm = false } = await request.json();
    
    if (!confirm) {
      return NextResponse.json({
        warning: 'This will add 6 missing neighborhoods and map the 7 unmapped venues',
        neighborhoods: MISSING_NEIGHBORHOODS.map(n => n.name),
        instructions: 'Send { confirm: true } to proceed'
      });
    }
    
    console.log('🏘️ Adding missing neighborhoods...');
    
    // Get SF city ID
    const { data: sfCity } = await supabaseAdmin
      .from('cities')
      .select('id')
      .eq('name', 'San Francisco')
      .single();
    
    if (!sfCity) {
      throw new Error('San Francisco city not found');
    }
    
    // Create missing neighborhoods
    const neighborhoodsToCreate = MISSING_NEIGHBORHOODS.map(n => ({
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
    
    // Get all neighborhoods including new ones
    const { data: allNeighborhoods } = await supabaseAdmin
      .from('neighborhoods')
      .select('id, name')
      .eq('city_id', sfCity.id);
    
    const neighborhoodMap = new Map(
      allNeighborhoods?.map(n => [n.name, n.id]) || []
    );
    
    // Get unmapped venues
    const { data: unmappedVenues } = await supabaseAdmin
      .from('venues')
      .select('id, name, address')
      .is('neighborhood_id', null);
    
    let mappedCount = 0;
    const mappingResults: any[] = [];
    
    for (const venue of unmappedVenues || []) {
      const neighborhoodName = mapUnmappedVenue(venue.name, venue.address);
      
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
      }
    }
    
    // Get final count of unmapped venues
    const { count: stillUnmapped } = await supabaseAdmin
      .from('venues')
      .select('*', { count: 'exact', head: true })
      .is('neighborhood_id', null);
    
    return NextResponse.json({
      success: true,
      message: 'Missing neighborhoods added and venues mapped',
      data: {
        neighborhoodsAdded: insertedNeighborhoods?.length || 0,
        venuesMapped: mappedCount,
        stillUnmapped,
        mappings: mappingResults
      }
    });
    
  } catch (error: any) {
    console.error('Missing neighborhoods error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to add missing neighborhoods'
    }, { status: 500 });
  }
}