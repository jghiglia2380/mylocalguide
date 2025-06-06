import { NextRequest, NextResponse } from 'next/server';
import { GooglePlacesClient, YelpClient } from '@lib/automation/api-clients';
import { supabaseAdmin } from '@lib/supabase';

// Cost-optimized categories for maximum value
const SF_CATEGORIES = [
  // High-value restaurant categories (most searches)
  { query: 'restaurant', category: 'Restaurants', limit: 200 },
  { query: 'mexican restaurant', category: 'Restaurants', subcategory: 'Mexican', limit: 50 },
  { query: 'italian restaurant', category: 'Restaurants', subcategory: 'Italian', limit: 50 },
  { query: 'chinese restaurant', category: 'Restaurants', subcategory: 'Chinese', limit: 50 },
  { query: 'japanese restaurant', category: 'Restaurants', subcategory: 'Japanese', limit: 50 },
  { query: 'thai restaurant', category: 'Restaurants', subcategory: 'Thai', limit: 30 },
  { query: 'vietnamese restaurant', category: 'Restaurants', subcategory: 'Vietnamese', limit: 30 },
  
  // Bars & Nightlife (high monetization potential)
  { query: 'bar', category: 'Bars & Nightlife', limit: 100 },
  { query: 'cocktail bar', category: 'Bars & Nightlife', subcategory: 'Cocktail Bars', limit: 50 },
  { query: 'wine bar', category: 'Bars & Nightlife', subcategory: 'Wine Bars', limit: 50 },
  
  // Coffee (daily searches)
  { query: 'coffee shop', category: 'Cafes & Coffee', limit: 100 },
  
  // Tourist attractions (high value)
  { query: 'tourist attraction', category: 'Activities', subcategory: 'Attractions', limit: 50 },
  { query: 'museum', category: 'Arts & Culture', subcategory: 'Museums', limit: 30 },
  { query: 'park', category: 'Outdoor Activities', subcategory: 'Parks', limit: 50 },
  
  // Shopping (monetization through local businesses)
  { query: 'shopping', category: 'Shopping', limit: 50 },
  { query: 'boutique', category: 'Shopping', subcategory: 'Boutiques', limit: 30 }
];

// Key SF neighborhoods for comprehensive coverage
const SF_NEIGHBORHOODS = [
  { name: 'Mission District', lat: 37.7599, lng: -122.4148 },
  { name: 'Castro', lat: 37.7609, lng: -122.4350 },
  { name: 'Marina District', lat: 37.8037, lng: -122.4368 },
  { name: 'North Beach', lat: 37.8061, lng: -122.4103 },
  { name: 'Chinatown', lat: 37.7941, lng: -122.4078 },
  { name: 'SoMa', lat: 37.7785, lng: -122.3948 },
  { name: 'Haight-Ashbury', lat: 37.7692, lng: -122.4481 },
  { name: 'Financial District', lat: 37.7946, lng: -122.3999 },
  { name: 'Pacific Heights', lat: 37.7925, lng: -122.4382 },
  { name: 'Nob Hill', lat: 37.7930, lng: -122.4161 }
];

export async function POST(request: NextRequest) {
  try {
    const { confirm = false, testMode = false } = await request.json();
    
    if (!confirm && !testMode) {
      return NextResponse.json({
        warning: 'This will use approximately 1,000-2,000 Google Places API calls',
        estimatedCost: '$17-34 (using your $200 free monthly credit)',
        estimatedVenues: '1,500-2,500 unique venues',
        instructions: 'Send { confirm: true } to proceed',
        testModeAvailable: 'Send { testMode: true } for a free 50-venue test'
      });
    }
    
    console.log('🚀 Starting comprehensive SF venue scraping...');
    
    const googleClient = new GooglePlacesClient(process.env.GOOGLE_PLACES_API_KEY!);
    const yelpClient = new YelpClient(process.env.YELP_API_KEY!);
    
    // Get SF city and neighborhoods from database
    const { data: sfCity } = await supabaseAdmin
      .from('cities')
      .select('id')
      .eq('slug', 'san-francisco')
      .single();
    
    if (!sfCity) throw new Error('San Francisco not found in database');
    
    const { data: neighborhoods } = await supabaseAdmin
      .from('neighborhoods')
      .select('id, name')
      .eq('city_id', sfCity.id);
    
    const neighborhoodMap = new Map(neighborhoods?.map(n => [n.name, n.id]) || []);
    
    let totalVenuesAdded = 0;
    let totalApiCalls = 0;
    const errors: any[] = [];
    const venueCache = new Set<string>(); // Prevent duplicates
    
    // Process each category
    for (const categoryConfig of SF_CATEGORIES) {
      if (testMode && totalVenuesAdded >= 50) break; // Limit test mode
      
      try {
        console.log(`Searching for ${categoryConfig.query}...`);
        
        // Search in key neighborhoods for better coverage
        for (const hood of SF_NEIGHBORHOODS.slice(0, testMode ? 2 : undefined)) {
          if (testMode && totalVenuesAdded >= 50) break;
          
          const places = await googleClient.searchVenues(
            categoryConfig.query,
            `${hood.name}, San Francisco, CA`
          );
          
          totalApiCalls++;
          
          // Limit results per neighborhood in test mode
          const placesToProcess = testMode ? places.slice(0, 5) : places.slice(0, 20);
          
          for (const place of placesToProcess) {
            if (!place.place_id || venueCache.has(place.place_id)) continue;
            venueCache.add(place.place_id);
            
            // Get detailed info
            const details = await googleClient.getPlaceDetails(place.place_id);
            totalApiCalls++;
            
            if (!details) continue;
            
            // Try to get Yelp data (free!)
            let yelpData = null;
            try {
              const yelpResults = await yelpClient.searchBusinesses(
                details.name,
                'San Francisco, CA',
                1
              );
              
              if (yelpResults?.[0]?.name?.toLowerCase().includes(details.name.toLowerCase().slice(0, 10))) {
                yelpData = yelpResults[0];
              }
            } catch (e) {
              // Yelp search failed, continue without it
            }
            
            // Determine neighborhood
            const neighborhoodId = neighborhoodMap.get(hood.name) || 
                                  neighborhoodMap.get('SoMa'); // Default
            
            // Create venue record
            const venue = {
              external_id: `google-${place.place_id}`,
              source: 'google',
              name: details.name,
              slug: details.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
              address: details.formatted_address || details.vicinity,
              neighborhood_id: neighborhoodId,
              city_id: sfCity.id,
              latitude: details.geometry?.location.lat,
              longitude: details.geometry?.location.lng,
              category: categoryConfig.category,
              subcategory: categoryConfig.subcategory,
              phone: details.formatted_phone_number || details.international_phone_number,
              website: details.website,
              price_range: details.price_level,
              google_rating: details.rating,
              google_review_count: details.user_ratings_total,
              yelp_rating: yelpData?.rating,
              yelp_review_count: yelpData?.review_count,
              aggregate_rating: yelpData ? (details.rating + yelpData.rating) / 2 : details.rating,
              total_reviews: (details.user_ratings_total || 0) + (yelpData?.review_count || 0),
              hours: details.opening_hours,
              photos: details.photos?.slice(0, 5).map((p: any) => p.photo_reference),
              verified: true,
              active: true,
              popularity_score: Math.min(100, Math.floor((details.user_ratings_total || 0) / 10))
            };
            
            // Insert venue
            const { data: insertedVenue, error } = await supabaseAdmin
              .from('venues')
              .upsert(venue, {
                onConflict: 'external_id,source',
                ignoreDuplicates: true
              })
              .select()
              .single();
            
            if (error) {
              console.error(`Failed to insert venue ${venue.name}:`, error);
              errors.push({ venue: venue.name, error: error.message });
            } else if (insertedVenue) {
              totalVenuesAdded++;
              console.log(`Added venue: ${venue.name}`);
            }
          }
        }
      } catch (error: any) {
        console.error(`Error processing ${categoryConfig.query}:`, error.message);
        errors.push({ category: categoryConfig.query, error: error.message });
      }
    }
    
    // Get final count
    const { count } = await supabaseAdmin
      .from('venues')
      .select('*', { count: 'exact', head: true });
    
    return NextResponse.json({
      success: true,
      message: testMode ? 'Test scraping completed' : 'Comprehensive SF scraping completed',
      data: {
        venuesAdded: totalVenuesAdded,
        totalVenuesInDb: count,
        apiCallsUsed: totalApiCalls,
        estimatedCost: `$${(totalApiCalls * 0.017).toFixed(2)}`,
        testMode,
        errors: errors.length > 0 ? errors : undefined
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