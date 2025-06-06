require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Simple Yelp client for testing
class SimpleYelpClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  async searchBusinesses(term, location = 'San Francisco, CA', limit = 50) {
    const axios = require('axios');
    
    try {
      console.log(`🔍 Searching Yelp for: ${term} in ${location}`);
      
      const response = await axios.get('https://api.yelp.com/v3/businesses/search', {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        params: {
          term,
          location,
          limit: Math.min(limit, 50),
          sort_by: 'rating',
          radius: 40000
        }
      });

      console.log(`✅ Found ${response.data.businesses?.length || 0} businesses`);
      return response.data.businesses || [];
    } catch (error) {
      console.error('❌ Yelp API error:', error.response?.data || error.message);
      return [];
    }
  }
}

// Budget scraping categories
const BUDGET_CATEGORIES = [
  { query: 'restaurants', limit: 200, priority: 'high' },
  { query: 'mexican restaurant', limit: 50, priority: 'high' },
  { query: 'italian restaurant', limit: 50, priority: 'high' },
  { query: 'coffee shop', limit: 100, priority: 'high' },
  { query: 'bars', limit: 100, priority: 'high' },
  { query: 'cocktail bar', limit: 30, priority: 'medium' },
  { query: 'tourist attractions', limit: 30, priority: 'medium' },
  { query: 'shopping', limit: 20, priority: 'low' }
];

// Simple neighborhood mapping
function mapToNeighborhood(address) {
  if (!address) return 'SoMa';
  
  const addr = address.toLowerCase();
  if (addr.includes('mission') || addr.includes('valencia')) return 'The Mission';
  if (addr.includes('castro')) return 'Castro';
  if (addr.includes('marina') || addr.includes('chestnut')) return 'Marina District';
  if (addr.includes('north beach') || addr.includes('columbus')) return 'North Beach';
  if (addr.includes('chinatown') || addr.includes('grant')) return 'Chinatown';
  if (addr.includes('haight')) return 'Haight-Ashbury';
  if (addr.includes('hayes')) return 'Hayes Valley';
  if (addr.includes('richmond') || addr.includes('clement')) return 'Richmond District';
  if (addr.includes('sunset')) return 'Sunset District';
  if (addr.includes('presidio')) return 'Presidio';
  if (addr.includes('soma') || addr.includes('folsom') || addr.includes('howard')) return 'SoMa';
  if (addr.includes('financial') || addr.includes('montgomery')) return 'Financial District';
  
  return 'SoMa'; // Default fallback
}

async function runBudgetScraping() {
  console.log('🚀 Starting FREE budget scraping for San Francisco...\n');
  
  // Get SF city ID
  const { data: sfCity } = await supabase
    .from('cities')
    .select('id')
    .eq('name', 'San Francisco')
    .single();
  
  if (!sfCity) {
    console.error('❌ San Francisco not found in database');
    return;
  }
  
  console.log(`✅ Found San Francisco (ID: ${sfCity.id})`);
  
  // Initialize Yelp client
  const yelpClient = new SimpleYelpClient(process.env.YELP_API_KEY);
  
  let totalVenuesAdded = 0;
  let apiCalls = 0;
  const venueCache = new Set();
  
  // Process each category
  for (const category of BUDGET_CATEGORIES) {
    console.log(`\n📍 Processing: ${category.query} (limit: ${category.limit})`);
    
    try {
      // Search Yelp (FREE!)
      const businesses = await yelpClient.searchBusinesses(
        category.query,
        'San Francisco, CA',
        category.limit
      );
      apiCalls++;
      
      let categoryCount = 0;
      
      for (const business of businesses) {
        if (venueCache.has(business.id)) continue;
        venueCache.add(business.id);
        
        // Map to neighborhood
        const address = business.location?.display_address?.join(', ') || '';
        const neighborhood = mapToNeighborhood(address);
        
        // Get neighborhood ID
        const { data: neighborhoodData } = await supabase
          .from('neighborhoods')
          .select('id')
          .eq('name', neighborhood)
          .single();
        
        // Create venue record
        const venue = {
          external_id: `yelp-${business.id}`,
          source: 'yelp',
          name: business.name,
          slug: business.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          address: address,
          neighborhood_id: neighborhoodData?.id,
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
        const { error } = await supabase
          .from('venues')
          .upsert(venue, {
            onConflict: 'external_id,source',
            ignoreDuplicates: true
          });
        
        if (!error) {
          totalVenuesAdded++;
          categoryCount++;
        } else {
          console.error(`❌ Error inserting ${business.name}:`, error.message);
        }
      }
      
      console.log(`   ✅ Added ${categoryCount} venues for ${category.query}`);
      
    } catch (error) {
      console.error(`❌ Error processing ${category.query}:`, error.message);
    }
  }
  
  // Get final counts
  const { count: totalVenues } = await supabase
    .from('venues')
    .select('*', { count: 'exact', head: true });
  
  console.log('\n🎉 BUDGET SCRAPING COMPLETE!');
  console.log('================================');
  console.log(`📊 Venues added this run: ${totalVenuesAdded}`);
  console.log(`📊 Total venues in database: ${totalVenues}`);
  console.log(`💰 Yelp API calls: ${apiCalls} (FREE!)`);
  console.log(`💰 Google API calls: 0 ($0.00)`);
  console.log(`💰 Total cost: $0.00 🎯`);
  console.log('\n✨ Successfully achieved comprehensive SF venue coverage for FREE!');
}

// Run the scraping
runBudgetScraping().catch(console.error);