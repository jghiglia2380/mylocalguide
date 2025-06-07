require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Simple Yelp client
class SimpleYelpClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  async searchBusinesses(term, location = 'San Francisco, CA', limit = 50, offset = 0) {
    const axios = require('axios');
    
    try {
      const response = await axios.get('https://api.yelp.com/v3/businesses/search', {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        params: {
          term,
          location,
          limit: Math.min(limit, 50),
          offset,
          sort_by: 'rating',
          radius: 40000
        }
      });

      return response.data.businesses || [];
    } catch (error) {
      console.error('❌ Yelp API error:', error.response?.data || error.message);
      return [];
    }
  }
}

// Comprehensive category list to maximize coverage
const COMPREHENSIVE_CATEGORIES = [
  // Food & Restaurants (detailed)
  { query: 'restaurants', limit: 1000 },
  { query: 'breakfast brunch', limit: 200 },
  { query: 'lunch', limit: 200 },
  { query: 'dinner', limit: 200 },
  { query: 'chinese restaurant', limit: 100 },
  { query: 'japanese restaurant', limit: 100 },
  { query: 'korean restaurant', limit: 100 },
  { query: 'vietnamese restaurant', limit: 100 },
  { query: 'thai restaurant', limit: 100 },
  { query: 'indian restaurant', limit: 100 },
  { query: 'mexican restaurant', limit: 100 },
  { query: 'italian restaurant', limit: 100 },
  { query: 'french restaurant', limit: 50 },
  { query: 'spanish restaurant', limit: 50 },
  { query: 'mediterranean restaurant', limit: 50 },
  { query: 'ethiopian restaurant', limit: 50 },
  { query: 'peruvian restaurant', limit: 50 },
  { query: 'brazilian restaurant', limit: 50 },
  { query: 'american restaurant', limit: 100 },
  { query: 'burgers', limit: 100 },
  { query: 'pizza', limit: 100 },
  { query: 'sandwiches', limit: 100 },
  { query: 'salad', limit: 50 },
  { query: 'soup', limit: 50 },
  { query: 'seafood', limit: 100 },
  { query: 'steakhouse', limit: 50 },
  { query: 'vegetarian restaurant', limit: 50 },
  { query: 'vegan restaurant', limit: 50 },
  { query: 'food truck', limit: 100 },
  { query: 'fast food', limit: 100 },
  { query: 'food delivery', limit: 100 },
  
  // Cafes & Bakeries
  { query: 'coffee shop', limit: 300 },
  { query: 'cafe', limit: 200 },
  { query: 'bakery', limit: 100 },
  { query: 'dessert', limit: 100 },
  { query: 'ice cream', limit: 50 },
  { query: 'frozen yogurt', limit: 50 },
  { query: 'juice bar', limit: 50 },
  { query: 'smoothie', limit: 50 },
  { query: 'tea room', limit: 50 },
  { query: 'bubble tea', limit: 50 },
  
  // Bars & Nightlife
  { query: 'bars', limit: 300 },
  { query: 'cocktail bar', limit: 100 },
  { query: 'wine bar', limit: 100 },
  { query: 'beer bar', limit: 100 },
  { query: 'sports bar', limit: 50 },
  { query: 'dive bar', limit: 50 },
  { query: 'nightclub', limit: 50 },
  { query: 'lounge', limit: 50 },
  { query: 'brewery', limit: 50 },
  { query: 'winery', limit: 50 },
  { query: 'distillery', limit: 30 },
  
  // Shopping
  { query: 'shopping', limit: 200 },
  { query: 'clothing store', limit: 100 },
  { query: 'thrift store', limit: 50 },
  { query: 'vintage store', limit: 50 },
  { query: 'bookstore', limit: 50 },
  { query: 'record store', limit: 30 },
  { query: 'gift shop', limit: 50 },
  { query: 'jewelry store', limit: 50 },
  { query: 'shoe store', limit: 50 },
  { query: 'department store', limit: 30 },
  { query: 'grocery store', limit: 100 },
  { query: 'farmers market', limit: 30 },
  { query: 'specialty food', limit: 50 },
  { query: 'flowers', limit: 30 },
  { query: 'art gallery', limit: 50 },
  { query: 'antiques', limit: 30 },
  
  // Services
  { query: 'hair salon', limit: 100 },
  { query: 'barber shop', limit: 50 },
  { query: 'nail salon', limit: 100 },
  { query: 'spa', limit: 50 },
  { query: 'massage', limit: 50 },
  { query: 'gym', limit: 100 },
  { query: 'fitness', limit: 100 },
  { query: 'yoga', limit: 50 },
  { query: 'pilates', limit: 30 },
  { query: 'dance studio', limit: 30 },
  { query: 'martial arts', limit: 30 },
  { query: 'laundromat', limit: 50 },
  { query: 'dry cleaner', limit: 50 },
  { query: 'auto repair', limit: 50 },
  { query: 'bank', limit: 50 },
  { query: 'pharmacy', limit: 50 },
  { query: 'veterinarian', limit: 30 },
  { query: 'pet store', limit: 30 },
  { query: 'pet grooming', limit: 30 },
  
  // Entertainment & Activities
  { query: 'movie theater', limit: 30 },
  { query: 'live music', limit: 50 },
  { query: 'comedy club', limit: 20 },
  { query: 'theater', limit: 30 },
  { query: 'museum', limit: 30 },
  { query: 'art museum', limit: 20 },
  { query: 'park', limit: 50 },
  { query: 'playground', limit: 30 },
  { query: 'tourist attraction', limit: 50 },
  { query: 'tour', limit: 50 },
  { query: 'escape room', limit: 20 },
  { query: 'bowling', limit: 20 },
  { query: 'arcade', limit: 20 },
  { query: 'billiards', limit: 20 },
  { query: 'karaoke', limit: 30 },
  
  // Hotels & Lodging
  { query: 'hotel', limit: 100 },
  { query: 'motel', limit: 30 },
  { query: 'hostel', limit: 20 },
  { query: 'bed breakfast', limit: 30 },
  { query: 'vacation rental', limit: 50 },
  
  // Healthcare
  { query: 'doctor', limit: 50 },
  { query: 'dentist', limit: 50 },
  { query: 'hospital', limit: 20 },
  { query: 'urgent care', limit: 30 },
  { query: 'clinic', limit: 50 },
  
  // Education
  { query: 'school', limit: 50 },
  { query: 'preschool', limit: 30 },
  { query: 'daycare', limit: 30 },
  { query: 'tutoring', limit: 30 },
  { query: 'music lessons', limit: 30 },
  
  // Transportation
  { query: 'parking', limit: 50 },
  { query: 'gas station', limit: 50 },
  { query: 'car rental', limit: 30 },
  { query: 'taxi', limit: 30 },
  
  // Real Estate & Home
  { query: 'real estate', limit: 50 },
  { query: 'apartments', limit: 50 },
  { query: 'home services', limit: 50 },
  { query: 'plumber', limit: 30 },
  { query: 'electrician', limit: 30 },
  { query: 'contractor', limit: 30 },
  { query: 'furniture store', limit: 50 },
  { query: 'home decor', limit: 50 },
  { query: 'hardware store', limit: 30 },
  
  // Religious & Community
  { query: 'church', limit: 50 },
  { query: 'temple', limit: 20 },
  { query: 'mosque', limit: 20 },
  { query: 'synagogue', limit: 20 },
  { query: 'community center', limit: 30 },
];

// Neighborhood-specific searches to increase coverage
const NEIGHBORHOODS = [
  'Mission District', 'Castro', 'Marina District', 'North Beach', 
  'Chinatown', 'SoMa', 'Financial District', 'Haight-Ashbury',
  'Richmond District', 'Sunset District', 'Nob Hill', 'Pacific Heights',
  'Hayes Valley', 'Potrero Hill', 'Noe Valley', 'Bernal Heights',
  'Dogpatch', 'Russian Hill', 'Telegraph Hill', 'Presidio'
];

// Simple neighborhood mapping
function mapToNeighborhood(address, businessName = '') {
  if (!address) return 'San Francisco';
  
  const combined = (address + ' ' + businessName).toLowerCase();
  
  // Check each neighborhood
  for (const hood of NEIGHBORHOODS) {
    if (combined.includes(hood.toLowerCase())) {
      return hood;
    }
  }
  
  // Additional keyword matching
  if (combined.includes('mission') || combined.includes('valencia')) return 'Mission District';
  if (combined.includes('castro')) return 'Castro';
  if (combined.includes('marina') || combined.includes('chestnut')) return 'Marina District';
  if (combined.includes('north beach') || combined.includes('columbus')) return 'North Beach';
  if (combined.includes('chinatown') || combined.includes('grant')) return 'Chinatown';
  if (combined.includes('soma') || combined.includes('folsom') || combined.includes('howard')) return 'SoMa';
  if (combined.includes('financial') || combined.includes('montgomery')) return 'Financial District';
  if (combined.includes('haight')) return 'Haight-Ashbury';
  if (combined.includes('richmond') || combined.includes('clement')) return 'Richmond District';
  if (combined.includes('sunset')) return 'Sunset District';
  if (combined.includes('hayes')) return 'Hayes Valley';
  if (combined.includes('nob hill')) return 'Nob Hill';
  if (combined.includes('pacific heights') || combined.includes('fillmore')) return 'Pacific Heights';
  if (combined.includes('potrero')) return 'Potrero Hill';
  if (combined.includes('noe valley')) return 'Noe Valley';
  if (combined.includes('bernal')) return 'Bernal Heights';
  if (combined.includes('dogpatch')) return 'Dogpatch';
  if (combined.includes('russian hill')) return 'Russian Hill';
  if (combined.includes('telegraph hill')) return 'Telegraph Hill';
  if (combined.includes('presidio') || combined.includes('crissy')) return 'Presidio';
  
  return 'San Francisco';
}

async function runMassiveScraping() {
  console.log('🚀 Starting MASSIVE FREE scraping for San Francisco...\n');
  console.log('📊 Target: 2,000-3,000 venues using Yelp FREE API');
  console.log('💰 Total cost: $0.00\n');
  
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
  
  const yelpClient = new SimpleYelpClient(process.env.YELP_API_KEY);
  
  let totalVenuesAdded = 0;
  let apiCalls = 0;
  const venueCache = new Set();
  const dailyLimit = 5000;
  
  // Phase 1: General category searches
  console.log('📍 Phase 1: Comprehensive category searches...\n');
  
  for (const category of COMPREHENSIVE_CATEGORIES) {
    if (apiCalls >= dailyLimit - 100) {
      console.log(`⚠️  Approaching daily limit (${apiCalls}/${dailyLimit}). Stopping for today.`);
      break;
    }
    
    console.log(`🔍 Searching: ${category.query} (target: ${category.limit} venues)`);
    
    let offset = 0;
    let categoryCount = 0;
    
    // Yelp allows up to 240 results per search (limit + offset <= 240)
    while (offset < Math.min(category.limit, 240) && apiCalls < dailyLimit - 100) {
      const businesses = await yelpClient.searchBusinesses(
        category.query,
        'San Francisco, CA',
        50,
        offset
      );
      apiCalls++;
      
      if (businesses.length === 0) break;
      
      for (const business of businesses) {
        if (venueCache.has(business.id)) continue;
        venueCache.add(business.id);
        
        const address = business.location?.display_address?.join(', ') || '';
        const neighborhood = mapToNeighborhood(address, business.name);
        
        // Get neighborhood ID
        const { data: neighborhoodData } = await supabase
          .from('neighborhoods')
          .select('id')
          .eq('name', neighborhood)
          .single();
        
        // Determine category
        let venueCategory = 'Other';
        const businessCats = (business.categories || []).map(c => c.title.toLowerCase()).join(' ');
        
        if (businessCats.includes('restaurant') || businessCats.includes('food')) {
          venueCategory = 'Restaurants';
        } else if (businessCats.includes('bar') || businessCats.includes('nightlife') || businessCats.includes('cocktail')) {
          venueCategory = 'Bars & Nightlife';
        } else if (businessCats.includes('coffee') || businessCats.includes('cafe') || businessCats.includes('tea')) {
          venueCategory = 'Cafes & Coffee';
        } else if (businessCats.includes('shop') || businessCats.includes('store') || businessCats.includes('retail')) {
          venueCategory = 'Shopping';
        } else if (businessCats.includes('hotel') || businessCats.includes('lodging')) {
          venueCategory = 'Hotels';
        } else if (businessCats.includes('gym') || businessCats.includes('fitness') || businessCats.includes('yoga')) {
          venueCategory = 'Health & Fitness';
        } else if (businessCats.includes('service') || businessCats.includes('salon') || businessCats.includes('spa')) {
          venueCategory = 'Services';
        } else if (businessCats.includes('entertainment') || businessCats.includes('arts') || businessCats.includes('museum')) {
          venueCategory = 'Activities';
        }
        
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
          category: venueCategory,
          phone: business.phone,
          website: business.url,
          yelp_rating: business.rating,
          yelp_review_count: business.review_count,
          aggregate_rating: business.rating,
          total_reviews: business.review_count,
          price_range: business.price ? business.price.length : null,
          photos: business.image_url ? [business.image_url] : null,
          verified: true,
          active: !business.is_closed,
          popularity_score: Math.min(100, Math.floor((business.review_count || 0) / 5))
        };
        
        const { error } = await supabase
          .from('venues')
          .upsert(venue, {
            onConflict: 'external_id,source',
            ignoreDuplicates: true
          });
        
        if (!error) {
          totalVenuesAdded++;
          categoryCount++;
        }
      }
      
      offset += 50;
      
      // Brief pause to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`   ✅ Added ${categoryCount} venues for ${category.query}`);
  }
  
  // Phase 2: Neighborhood-specific searches
  console.log('\n📍 Phase 2: Neighborhood-specific searches...\n');
  
  for (const neighborhood of NEIGHBORHOODS) {
    if (apiCalls >= dailyLimit - 100) break;
    
    console.log(`🏘️  Searching in ${neighborhood}...`);
    
    const searches = ['restaurants', 'bars', 'coffee', 'shopping', 'services'];
    let hoodCount = 0;
    
    for (const search of searches) {
      if (apiCalls >= dailyLimit - 100) break;
      
      const businesses = await yelpClient.searchBusinesses(
        search,
        `${neighborhood}, San Francisco, CA`,
        50
      );
      apiCalls++;
      
      for (const business of businesses) {
        if (venueCache.has(business.id)) continue;
        venueCache.add(business.id);
        
        // Get neighborhood ID
        const { data: neighborhoodData } = await supabase
          .from('neighborhoods')
          .select('id')
          .eq('name', neighborhood)
          .single();
        
        const venue = {
          external_id: `yelp-${business.id}`,
          source: 'yelp',
          name: business.name,
          slug: business.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          address: business.location?.display_address?.join(', ') || '',
          neighborhood_id: neighborhoodData?.id,
          city_id: sfCity.id,
          latitude: business.coordinates?.latitude,
          longitude: business.coordinates?.longitude,
          category: search === 'restaurants' ? 'Restaurants' : 
                   search === 'bars' ? 'Bars & Nightlife' :
                   search === 'coffee' ? 'Cafes & Coffee' :
                   search === 'shopping' ? 'Shopping' : 'Services',
          phone: business.phone,
          website: business.url,
          yelp_rating: business.rating,
          yelp_review_count: business.review_count,
          aggregate_rating: business.rating,
          total_reviews: business.review_count,
          price_range: business.price ? business.price.length : null,
          photos: business.image_url ? [business.image_url] : null,
          verified: true,
          active: !business.is_closed,
          popularity_score: Math.min(100, Math.floor((business.review_count || 0) / 5))
        };
        
        const { error } = await supabase
          .from('venues')
          .upsert(venue, {
            onConflict: 'external_id,source',
            ignoreDuplicates: true
          });
        
        if (!error) {
          totalVenuesAdded++;
          hoodCount++;
        }
      }
    }
    
    console.log(`   ✅ Added ${hoodCount} additional venues in ${neighborhood}`);
  }
  
  // Get final count
  const { count: totalVenues } = await supabase
    .from('venues')
    .select('*', { count: 'exact', head: true });
  
  console.log('\n🎉 MASSIVE SCRAPING COMPLETE!');
  console.log('================================');
  console.log(`📊 Venues added this run: ${totalVenuesAdded}`);
  console.log(`📊 Total venues in database: ${totalVenues}`);
  console.log(`💰 Yelp API calls: ${apiCalls} (FREE!)`);
  console.log(`💰 Total cost: $0.00 🎯`);
  console.log(`\n📈 Progress: ${totalVenues}/3000 (${Math.round(totalVenues/30)}%)`);
  
  if (apiCalls >= dailyLimit - 100) {
    console.log('\n⏰ Daily limit reached. Run again tomorrow to continue!');
    console.log('💡 Tip: We can run this daily to reach 3,000+ venues in 2-3 days');
  }
}

// Run the massive scraping
runMassiveScraping().catch(console.error);