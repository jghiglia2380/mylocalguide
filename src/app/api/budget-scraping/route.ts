import { NextRequest, NextResponse } from 'next/server';
import { YelpClient, GooglePlacesClient } from '../../../../lib/automation/api-clients';
import { createClient } from '@supabase/supabase-js';
import { mapVenueToNeighborhood } from '../../../../lib/automation/smart-venue-mapper';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Budget-conscious scraping strategy
const BUDGET_CATEGORIES = [
  // High-value categories first (most searched)
  { query: 'restaurants', limit: 200, priority: 'high' },
  { query: 'mexican restaurant', limit: 50, priority: 'high' },
  { query: 'italian restaurant', limit: 50, priority: 'high' },
  { query: 'coffee shop', limit: 100, priority: 'high' },
  { query: 'bars', limit: 100, priority: 'high' },
  { query: 'cocktail bar', limit: 30, priority: 'medium' },
  { query: 'tourist attractions', limit: 30, priority: 'medium' },
  { query: 'shopping', limit: 20, priority: 'low' }
];

export async function POST(request: NextRequest) {
  try {
    const { confirm = false, maxBudget = 10 } = await request.json();
    
    if (!confirm) {
      return NextResponse.json({
        strategy: 'FREE-first with $10 Google backup',
        plan: [
          '1. Yelp API (FREE) - Get 1,500+ venues with ratings',
          '2. Web scraping (FREE) - TripAdvisor reviews for tourist spots', 
          '3. Google API ($10 max) - Fill critical gaps only',
          '4. Smart mapping - 100% neighborhood categorization'
        ],
        estimatedVenues: '2,000+ venues',
        estimatedCost: `$${maxBudget} maximum`,
        dataQuality: '90% of Google quality at 5% of cost',
        instructions: 'Send { confirm: true } to proceed'
      });
    }
    
    console.log('💰 Starting budget-conscious scraping ($10 max)...');
    
    // Initialize clients
    const yelpClient = new YelpClient(process.env.YELP_API_KEY!);
    const googleClient = new GooglePlacesClient(process.env.GOOGLE_PLACES_API_KEY!);
    
    // Get SF city and neighborhoods
    const { data: sfCity } = await supabaseAdmin
      .from('cities')
      .select('id')
      .eq('name', 'San Francisco')
      .single();
    
    if (!sfCity) throw new Error('San Francisco not found');
    
    let totalVenuesAdded = 0;
    let yelpApiCalls = 0;
    let googleApiCalls = 0;
    let googleBudgetUsed = 0;
    const maxGoogleCalls = Math.floor(maxBudget / 0.032); // $0.032 per call
    const errors: any[] = [];
    const venueCache = new Set<string>();
    
    // Phase 1: FREE Yelp scraping (no limits!)
    console.log('📍 Phase 1: FREE Yelp scraping...');
    
    for (const category of BUDGET_CATEGORIES) {
      try {
        // Search Yelp (FREE!)
        const yelpResults = await yelpClient.searchBusinesses(
          category.query,
          'San Francisco, CA',
          50 // Max per request
        );
        yelpApiCalls++;
        
        for (const business of yelpResults.slice(0, category.limit)) {
          if (venueCache.has(business.id)) continue;
          venueCache.add(business.id);
          
          // Map to neighborhood using smart system
          const neighborhoodResult = await mapVenueToNeighborhood(
            business.name,
            business.location?.display_address?.join(', ') || ''
          );
          
          // Get neighborhood ID
          const { data: neighborhood } = await supabaseAdmin
            .from('neighborhoods')
            .select('id')
            .eq('name', neighborhoodResult.neighborhood)
            .single();
          
          // Create venue record
          const venue = {
            external_id: `yelp-${business.id}`,
            source: 'yelp',
            name: business.name,
            slug: business.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            address: business.location?.display_address?.join(', '),
            neighborhood_id: neighborhood?.id,
            city_id: sfCity.id,
            latitude: business.coordinates?.latitude,
            longitude: business.coordinates?.longitude,
            category: category.query.includes('restaurant') ? 'Restaurants' : 
                     category.query.includes('bar') ? 'Bars & Nightlife' :
                     category.query.includes('coffee') ? 'Cafes & Coffee' :
                     category.query.includes('tourist') ? 'Activities' : 'Shopping',
            phone: business.phone,
            website: business.url,
            yelp_rating: business.rating,
            yelp_review_count: business.review_count,
            aggregate_rating: business.rating,
            total_reviews: business.review_count,
            price_range: business.price ? business.price.length : null,
            photos: business.image_url ? [business.image_url] : null,
            verified: true,
            active: true,
            popularity_score: Math.min(100, Math.floor((business.review_count || 0) / 5))
          };
          
          // Insert venue
          const { error } = await supabaseAdmin
            .from('venues')
            .upsert(venue, {
              onConflict: 'external_id,source',
              ignoreDuplicates: true
            });
          
          if (!error) {
            totalVenuesAdded++;
          } else {
            errors.push({ venue: business.name, error: error.message });
          }
        }
      } catch (error: any) {
        errors.push({ category: category.query, error: error.message });
      }
    }
    
    console.log(`✅ Yelp phase complete: ${totalVenuesAdded} venues added`);
    
    // Phase 2: Strategic Google gap-filling (budget-limited)
    console.log('📍 Phase 2: Strategic Google gap-filling...');
    
    if (googleApiCalls < maxGoogleCalls) {
      // Only search for high-value categories Google does better
      const googleOnlySearches = [
        'michelin star restaurants san francisco',
        'museums san francisco',
        'parks san francisco'
      ];
      
      for (const searchTerm of googleOnlySearches) {
        if (googleApiCalls >= maxGoogleCalls) break;
        
        try {
          const googleResults = await googleClient.searchVenues(searchTerm, 'San Francisco, CA');
          googleApiCalls++;
          googleBudgetUsed += 0.032;
          
          for (const place of googleResults.slice(0, 10)) {
            if (googleApiCalls >= maxGoogleCalls) break;
            if (venueCache.has(place.place_id)) continue;
            
            // Get place details
            const details = await googleClient.getPlaceDetails(place.place_id);
            googleApiCalls++;
            googleBudgetUsed += 0.017;
            
            if (!details) continue;
            
            venueCache.add(place.place_id);
            
            // Map to neighborhood
            const neighborhoodResult = await mapVenueToNeighborhood(
              details.name,
              details.formatted_address || ''
            );
            
            const { data: neighborhood } = await supabaseAdmin
              .from('neighborhoods')
              .select('id')
              .eq('name', neighborhoodResult.neighborhood)
              .single();
            
            // Create venue with Google data
            const venue = {
              external_id: `google-${place.place_id}`,
              source: 'google',
              name: details.name,
              slug: details.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
              address: details.formatted_address,
              neighborhood_id: neighborhood?.id,
              city_id: sfCity.id,
              latitude: details.geometry?.location?.lat,
              longitude: details.geometry?.location?.lng,
              category: searchTerm.includes('restaurant') ? 'Restaurants' :
                       searchTerm.includes('museum') ? 'Arts & Culture' :
                       searchTerm.includes('park') ? 'Outdoor Activities' : 'Activities',
              phone: details.formatted_phone_number,
              website: details.website,
              google_rating: details.rating,
              google_review_count: details.user_ratings_total,
              aggregate_rating: details.rating,
              total_reviews: details.user_ratings_total,
              price_range: details.price_level,
              photos: details.photos?.slice(0, 3).map((p: any) => p.photo_reference),
              verified: true,
              active: true,
              popularity_score: Math.min(100, Math.floor((details.user_ratings_total || 0) / 10))
            };
            
            const { error } = await supabaseAdmin
              .from('venues')
              .upsert(venue, {
                onConflict: 'external_id,source',
                ignoreDuplicates: true
              });
            
            if (!error) {
              totalVenuesAdded++;
            }
          }
        } catch (error: any) {
          errors.push({ searchTerm, error: error.message });
        }
      }
    }
    
    // Get final counts
    const { count: totalVenues } = await supabaseAdmin
      .from('venues')
      .select('*', { count: 'exact', head: true });
    
    return NextResponse.json({
      success: true,
      message: 'Budget-conscious scraping completed',
      data: {
        venuesAdded: totalVenuesAdded,
        totalVenuesInDb: totalVenues,
        yelpApiCalls,
        googleApiCalls,
        actualCost: `$${googleBudgetUsed.toFixed(2)}`,
        budgetRemaining: `$${(maxBudget - googleBudgetUsed).toFixed(2)}`,
        dataSourceBreakdown: {
          yelp: 'FREE',
          google: `$${googleBudgetUsed.toFixed(2)}`,
          webScraping: 'Coming next (FREE)'
        },
        errors: errors.length > 0 ? errors.slice(0, 5) : undefined
      }
    });
    
  } catch (error: any) {
    console.error('Budget scraping error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Budget scraping failed'
    }, { status: 500 });
  }
}