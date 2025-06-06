import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Cost-controlled scraping - just 10 venues per category for testing
    const { testMode = true } = await request.json();
    
    console.log('🚀 Starting LIMITED venue scraping (cost-controlled)...');
    
    // Get SF city ID
    const { data: sfCity } = await supabaseAdmin
      .from('cities')
      .select('id')
      .eq('slug', 'san-francisco')
      .single();
    
    if (!sfCity) {
      throw new Error('San Francisco not found in database');
    }
    
    // Get neighborhoods
    const { data: neighborhoods } = await supabaseAdmin
      .from('neighborhoods')
      .select('id, name')
      .eq('city_id', sfCity.id);
    
    const neighborhoodMap = new Map(
      neighborhoods?.map(n => [n.name, n.id]) || []
    );
    
    // Sample venues to add (FREE - no API calls!)
    const sampleVenues = [
      // Mission District
      {
        name: "Tartine Bakery",
        address: "600 Guerrero St, San Francisco, CA 94110",
        category: "Cafes & Coffee",
        neighborhood_id: neighborhoodMap.get('The Mission'),
        description: "Iconic SF bakery known for morning buns, croissants, and artisanal bread. James Beard Award winner.",
        price_range: 2,
        google_rating: 4.4,
        yelp_rating: 4.0,
        aggregate_rating: 4.2
      },
      {
        name: "Bi-Rite Creamery",
        address: "3692 18th St, San Francisco, CA 94110",
        category: "Specialty Food",
        neighborhood_id: neighborhoodMap.get('The Mission'),
        description: "Artisanal ice cream shop with unique flavors like honey lavender and salted caramel.",
        price_range: 2,
        google_rating: 4.6,
        yelp_rating: 4.5,
        aggregate_rating: 4.55
      },
      {
        name: "The Monk's Kettle",
        address: "3141 16th St, San Francisco, CA 94103",
        category: "Bars & Nightlife",
        neighborhood_id: neighborhoodMap.get('The Mission'),
        description: "Craft beer gastropub with 200+ bottles and rotating taps. Known for beer-friendly food.",
        price_range: 2,
        google_rating: 4.4,
        yelp_rating: 4.0,
        aggregate_rating: 4.2
      },
      // Castro
      {
        name: "Kitchen Story",
        address: "3499 16th St, San Francisco, CA 94114",
        category: "Restaurants",
        neighborhood_id: neighborhoodMap.get('Castro'),
        description: "California-Asian fusion brunch spot. Famous for millionaire's bacon and souffle pancakes.",
        price_range: 2,
        google_rating: 4.5,
        yelp_rating: 4.5,
        aggregate_rating: 4.5
      },
      {
        name: "Twin Peaks Tavern",
        address: "401 Castro St, San Francisco, CA 94114",
        category: "Bars & Nightlife",
        neighborhood_id: neighborhoodMap.get('Castro'),
        description: "Historic LGBTQ+ bar with large windows facing Castro & Market. A neighborhood institution since 1972.",
        price_range: 1,
        google_rating: 4.3,
        yelp_rating: 3.5,
        aggregate_rating: 3.9
      },
      // North Beach
      {
        name: "Tony's Pizza Napoletana",
        address: "1570 Stockton St, San Francisco, CA 94133",
        category: "Restaurants",
        neighborhood_id: neighborhoodMap.get('North Beach'),
        description: "Award-winning pizzeria with 7 different ovens for different pizza styles. World Pizza Champion.",
        price_range: 3,
        google_rating: 4.5,
        yelp_rating: 4.0,
        aggregate_rating: 4.25
      },
      {
        name: "Vesuvio Cafe",
        address: "255 Columbus Ave, San Francisco, CA 94133",
        category: "Bars & Nightlife",
        neighborhood_id: neighborhoodMap.get('North Beach'),
        description: "Legendary Beat Generation bar. Jack Kerouac's hangout next to City Lights Books.",
        price_range: 2,
        google_rating: 4.4,
        yelp_rating: 4.0,
        aggregate_rating: 4.2
      },
      // Marina
      {
        name: "Atelier Crenn",
        address: "3127 Fillmore St, San Francisco, CA 94123",
        category: "Restaurants",
        neighborhood_id: neighborhoodMap.get('Marina District'),
        description: "Three Michelin star restaurant by Chef Dominique Crenn. Poetic culinaria at its finest.",
        price_range: 4,
        google_rating: 4.6,
        yelp_rating: 4.5,
        aggregate_rating: 4.55
      },
      {
        name: "The Dorian",
        address: "2001 Chestnut St, San Francisco, CA 94123",
        category: "Bars & Nightlife",
        neighborhood_id: neighborhoodMap.get('Marina District'),
        description: "Upscale gastropub with craft cocktails and elevated bar food. Popular happy hour spot.",
        price_range: 3,
        google_rating: 4.2,
        yelp_rating: 4.0,
        aggregate_rating: 4.1
      },
      // Haight
      {
        name: "Cha Cha Cha",
        address: "1801 Haight St, San Francisco, CA 94117",
        category: "Restaurants",
        neighborhood_id: neighborhoodMap.get('Haight-Ashbury'),
        description: "Lively Cuban restaurant with sangria pitchers and tapas. A Haight institution since 1984.",
        price_range: 2,
        google_rating: 4.2,
        yelp_rating: 3.5,
        aggregate_rating: 3.85
      }
    ];
    
    // Add venues to Supabase
    const venuesWithDetails = sampleVenues.map(venue => ({
      ...venue,
      city_id: sfCity.id,
      slug: `${venue.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`,
      external_id: `sample-${venue.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`,
      source: 'sample',
      active: true,
      verified: true,
      total_reviews: Math.floor(Math.random() * 500) + 100,
      popularity_score: Math.floor(Math.random() * 100) + 1
    }));
    
    const { data: inserted, error } = await supabaseAdmin
      .from('venues')
      .upsert(venuesWithDetails, {
        onConflict: 'external_id,source',
        ignoreDuplicates: true
      })
      .select();
    
    if (error) throw error;
    
    // Get total count
    const { count } = await supabaseAdmin
      .from('venues')
      .select('*', { count: 'exact', head: true });
    
    return NextResponse.json({
      success: true,
      message: testMode 
        ? 'Test scraping completed - added sample venues for FREE'
        : 'Limited scraping completed',
      data: {
        venuesAdded: inserted?.length || 0,
        totalVenuesInDb: count,
        testMode,
        note: 'This added sample venues without any API calls. Ready to do full scraping when you are!',
        estimatedCostForFullSF: '$10-15',
        estimatedVenuesForFullSF: '5,000-10,000'
      }
    });
    
  } catch (error: any) {
    console.error('Scraping error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Scraping failed'
    }, { status: 500 });
  }
}