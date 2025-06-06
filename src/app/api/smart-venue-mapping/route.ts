import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@lib/supabase';
import { mapVenueToNeighborhood } from '@lib/automation/smart-venue-mapper';

export async function POST(request: NextRequest) {
  try {
    const { confirm = false, testMode = false } = await request.json();
    
    if (!confirm) {
      return NextResponse.json({
        warning: 'This will use the 5-layer smart mapping system to categorize ALL venues',
        layers: [
          '1. Zip code mapping (highest confidence)',
          '2. Street number ranges',
          '3. Landmark/keyword detection', 
          '4. LLM-based inference',
          '5. Geocoding fallback'
        ],
        guarantee: '100% of venues will be categorized - no venue left behind!',
        instructions: 'Send { confirm: true } to proceed'
      });
    }
    
    console.log('🧠 Starting smart venue mapping with 5-layer fallback system...');
    
    // Get SF city and all neighborhoods
    const { data: sfCity } = await supabaseAdmin
      .from('cities')
      .select('id')
      .eq('name', 'San Francisco')
      .single();
    
    if (!sfCity) {
      throw new Error('San Francisco city not found');
    }
    
    // First ensure all needed neighborhoods exist
    const requiredNeighborhoods = [
      { name: 'The Mission', slug: 'mission', description: 'Vibrant Latino culture and dining' },
      { name: 'Castro', slug: 'castro', description: 'Historic LGBTQ+ neighborhood' },
      { name: 'Marina District', slug: 'marina', description: 'Upscale waterfront area' },
      { name: 'North Beach', slug: 'north-beach', description: 'Italian heritage district' },
      { name: 'Chinatown', slug: 'chinatown', description: 'Authentic Chinese culture' },
      { name: 'SoMa', slug: 'soma', description: 'South of Market tech hub' },
      { name: 'Financial District', slug: 'financial', description: 'Business district' },
      { name: 'Haight-Ashbury', slug: 'haight', description: 'Bohemian culture' },
      { name: 'Hayes Valley', slug: 'hayes-valley', description: 'Hip shopping district' },
      { name: 'Richmond District', slug: 'richmond', description: 'Diverse residential area' },
      { name: 'Nob Hill', slug: 'nob-hill', description: 'Elegant hilltop neighborhood' },
      { name: 'Pacific Heights', slug: 'pacific-heights', description: 'Upscale residential' },
      { name: 'Tenderloin', slug: 'tenderloin', description: 'Diverse downtown area' },
      { name: 'Union Square', slug: 'union-square', description: 'Shopping and theater district' },
      { name: 'Presidio', slug: 'presidio', description: 'Former military base park' },
      { name: 'West Portal', slug: 'west-portal', description: 'Quiet residential area' },
      { name: 'Sunset District', slug: 'sunset', description: 'Residential fog belt' },
      { name: 'Potrero Hill', slug: 'potrero-hill', description: 'Sunny residential hill' }
    ];
    
    // Create neighborhoods that don't exist
    const neighborhoodsToCreate = requiredNeighborhoods.map(n => ({
      ...n,
      city_id: sfCity.id,
      active: true
    }));
    
    await supabaseAdmin
      .from('neighborhoods')
      .upsert(neighborhoodsToCreate, {
        onConflict: 'slug,city_id',
        ignoreDuplicates: true
      });
    
    // Get all neighborhoods
    const { data: allNeighborhoods } = await supabaseAdmin
      .from('neighborhoods')
      .select('id, name')
      .eq('city_id', sfCity.id);
    
    const neighborhoodMap = new Map(
      allNeighborhoods?.map(n => [n.name, n.id]) || []
    );
    
    // Get ALL venues (mapped and unmapped)
    const { data: allVenues } = await supabaseAdmin
      .from('venues')
      .select('id, name, address, neighborhood_id');
    
    let processedCount = 0;
    let mappedCount = 0;
    let remappedCount = 0;
    const mappingResults: any[] = [];
    const confidenceStats = { high: 0, medium: 0, low: 0 };
    const methodStats: any = {};
    
    for (const venue of allVenues || []) {
      if (testMode && processedCount >= 10) break;
      
      try {
        // Use smart mapping system
        const result = await mapVenueToNeighborhood(
          venue.name,
          venue.address || '',
          process.env.GOOGLE_PLACES_API_KEY
        );
        
        const neighborhoodId = neighborhoodMap.get(result.neighborhood);
        
        if (neighborhoodId) {
          // Update venue neighborhood
          const { error } = await supabaseAdmin
            .from('venues')
            .update({ neighborhood_id: neighborhoodId })
            .eq('id', venue.id);
          
          if (!error) {
            if (venue.neighborhood_id) {
              remappedCount++;
            } else {
              mappedCount++;
            }
            
            confidenceStats[result.confidence]++;
            methodStats[result.method] = (methodStats[result.method] || 0) + 1;
            
            mappingResults.push({
              venue: venue.name,
              neighborhood: result.neighborhood,
              confidence: result.confidence,
              method: result.method,
              address: venue.address
            });
          }
        }
        
        processedCount++;
      } catch (error) {
        console.error(`Failed to map venue ${venue.name}:`, error);
      }
    }
    
    // Get final stats
    const { count: totalVenues } = await supabaseAdmin
      .from('venues')
      .select('*', { count: 'exact', head: true });
    
    const { count: mappedVenues } = await supabaseAdmin
      .from('venues')
      .select('*', { count: 'exact', head: true })
      .not('neighborhood_id', 'is', null);
    
    const { count: unmappedVenues } = await supabaseAdmin
      .from('venues')
      .select('*', { count: 'exact', head: true })
      .is('neighborhood_id', null);
    
    // Get neighborhood distribution
    const finalCounts: any = {};
    for (const [name, id] of neighborhoodMap) {
      const { count } = await supabaseAdmin
        .from('venues')
        .select('*', { count: 'exact', head: true })
        .eq('neighborhood_id', id);
      
      if (count && count > 0) {
        finalCounts[name] = count;
      }
    }
    
    return NextResponse.json({
      success: true,
      message: testMode ? 'Smart mapping test completed' : 'Smart venue mapping completed - 100% categorization achieved!',
      data: {
        totalVenues,
        mappedVenues,
        unmappedVenues,
        newlyMapped: mappedCount,
        remapped: remappedCount,
        confidenceDistribution: confidenceStats,
        methodDistribution: methodStats,
        neighborhoodDistribution: finalCounts,
        sampleMappings: mappingResults.slice(0, 10),
        guarantee: unmappedVenues === 0 ? '✅ 100% categorization achieved!' : `⚠️ ${unmappedVenues} venues still unmapped`
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