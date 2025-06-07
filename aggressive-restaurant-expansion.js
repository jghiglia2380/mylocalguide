require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Comprehensive restaurant search terms to reach 4,000+ restaurants
const RESTAURANT_SEARCHES = [
  // Cuisine types (major categories)
  'italian restaurant', 'chinese restaurant', 'mexican restaurant', 'thai restaurant',
  'japanese restaurant', 'korean restaurant', 'indian restaurant', 'vietnamese restaurant',
  'french restaurant', 'mediterranean restaurant', 'greek restaurant', 'spanish restaurant',
  'ethiopian restaurant', 'moroccan restaurant', 'peruvian restaurant', 'brazilian restaurant',
  'filipino restaurant', 'burmese restaurant', 'cambodian restaurant', 'laotian restaurant',
  
  // American & Fusion
  'american restaurant', 'california cuisine', 'fusion restaurant', 'new american',
  'farm to table', 'organic restaurant', 'locally sourced',
  
  // Specific food types
  'sushi restaurant', 'ramen restaurant', 'pho restaurant', 'dim sum restaurant',
  'taco shop', 'burrito shop', 'pizza restaurant', 'burger restaurant',
  'steakhouse', 'seafood restaurant', 'bbq restaurant', 'soul food',
  'sandwich shop', 'deli', 'bagel shop', 'soup restaurant',
  
  // Dining styles
  'fine dining', 'casual dining', 'fast casual', 'counter service',
  'family restaurant', 'romantic restaurant', 'date restaurant',
  'group dining', 'business lunch', 'quick bite',
  
  // Special dietary
  'vegan restaurant', 'vegetarian restaurant', 'gluten free restaurant',
  'kosher restaurant', 'halal restaurant', 'organic restaurant',
  
  // Meal times
  'breakfast restaurant', 'brunch restaurant', 'lunch restaurant', 'dinner restaurant',
  'late night dining', 'all day breakfast', '24 hour restaurant',
  
  // Neighborhood-specific searches (to catch local spots)
  'mission restaurant', 'castro restaurant', 'soma restaurant', 'north beach restaurant',
  'chinatown restaurant', 'marina restaurant', 'haight restaurant', 'richmond restaurant',
  'sunset restaurant', 'financial district restaurant', 'union square restaurant',
  'pacific heights restaurant', 'nob hill restaurant', 'potrero hill restaurant',
  
  // Food trucks and casual
  'food truck', 'food cart', 'food stand', 'market stall',
  'takeout restaurant', 'delivery restaurant', 'catering',
  
  // Specific search terms that might catch smaller places
  'eatery', 'bistro', 'brasserie', 'tavern', 'gastropub',
  'trattoria', 'osteria', 'cantina', 'taqueria', 'pupuseria',
  'noodle house', 'rice bowl', 'dumpling house', 'hot pot',
  
  // Broader food terms
  'restaurant', 'dining', 'food', 'eat', 'meal', 'cuisine'
];

let venueCache = new Set();
let totalAdded = 0;

async function initCache() {
  console.log('Loading existing venues...');
  const { data } = await supabase.from('venues').select('external_id');
  data?.forEach(v => venueCache.add(v.external_id));
  console.log(`📋 Loaded ${venueCache.size} existing venues`);
  return venueCache.size;
}

async function searchYelp(term, offset = 0) {
  try {
    const response = await axios.get('https://api.yelp.com/v3/businesses/search', {
      headers: { 'Authorization': `Bearer ${process.env.YELP_API_KEY}` },
      params: {
        term,
        location: 'San Francisco, CA',
        limit: 50,
        offset,
        radius: 40000,
        categories: 'restaurants,food'  // Focus on restaurant categories
      }
    });
    
    return response.data.businesses || [];
  } catch (error) {
    if (error.response?.status === 429) {
      console.log('⏳ Rate limited, waiting...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      return [];
    }
    console.log(`❌ Error searching ${term}:`, error.response?.data?.error?.description || error.message);
    return [];
  }
}

async function saveVenue(biz, sfCity) {
  const extId = `yelp-${biz.id}`;
  if (venueCache.has(extId)) return false;
  
  venueCache.add(extId);
  
  // Enhanced neighborhood mapping
  const addr = (biz.location?.display_address?.join(', ') || '').toLowerCase();
  let neighborhood = 'San Francisco';
  
  // More comprehensive neighborhood detection
  const neighborhoodMappings = {
    'The Mission': ['mission', '24th st', '16th st', 'valencia st', 'mission st', '94110'],
    'Castro': ['castro', '18th st', '19th st', 'market st', '94114'],
    'Marina District': ['marina', 'fillmore st', 'union st', 'chestnut st', '94123'],
    'SoMa': ['soma', 'south of market', '2nd st', '3rd st', 'howard st', 'folsom st', '94103', '94107'],
    'Financial District': ['financial', 'montgomery st', 'california st', 'pine st', 'battery st', '94104', '94111'],
    'North Beach': ['north beach', 'columbus ave', 'grant ave', 'broadway', '94133'],
    'Chinatown': ['chinatown', 'grant ave', 'stockton st', 'clay st', 'sacramento st'],
    'Haight-Ashbury': ['haight', 'ashbury', 'haight st', 'masonic ave', '94117'],
    'Richmond District': ['richmond', 'geary blvd', 'clement st', 'balboa st', '94118', '94121'],
    'Sunset District': ['sunset', 'irving st', 'judah st', 'noriega st', '94122', '94116'],
    'Nob Hill': ['nob hill', 'california st', 'powell st', 'mason st', '94108'],
    'Pacific Heights': ['pacific heights', 'fillmore st', 'sacramento st', 'california st', '94115'],
    'Hayes Valley': ['hayes valley', 'hayes st', 'grove st', 'octavia st', '94102'],
    'Tenderloin': ['tenderloin', 'eddy st', 'turk st', 'jones st', '94102'],
    'Union Square': ['union square', 'powell st', 'geary st', 'post st', '94102'],
    'Russian Hill': ['russian hill', 'polk st', 'larkin st', 'hyde st', '94109'],
    'Bernal Heights': ['bernal heights', 'cortland ave', 'mission st', '94110'],
    'Potrero Hill': ['potrero hill', '16th st', '18th st', 'connecticut st', '94107'],
    'Dogpatch': ['dogpatch', '3rd st', 'illinois st', 'indiana st', '94107']
  };
  
  for (const [hood, keywords] of Object.entries(neighborhoodMappings)) {
    if (keywords.some(keyword => addr.includes(keyword))) {
      neighborhood = hood;
      break;
    }
  }
  
  const { data: hood } = await supabase
    .from('neighborhoods')
    .select('id')
    .eq('name', neighborhood)
    .single();
  
  // Enhanced restaurant categorization
  const cats = (biz.categories || []).map(c => c.alias).join(' ');
  let category = 'Restaurants'; // Default for this script
  
  // More specific restaurant subcategorization
  if (cats.match(/bar|pub|nightlife|cocktail|beer|wine/)) {
    category = 'Bars & Nightlife';
  } else if (cats.match(/coffee|cafe|tea|bakery/)) {
    category = 'Cafes & Coffee';
  }
  
  const venue = {
    external_id: extId,
    source: 'yelp',
    name: biz.name,
    slug: biz.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    address: biz.location?.display_address?.join(', ') || '',
    neighborhood_id: hood?.id,
    city_id: sfCity.id,
    latitude: biz.coordinates?.latitude,
    longitude: biz.coordinates?.longitude,
    category,
    phone: biz.phone,
    website: biz.url,
    yelp_rating: biz.rating,
    yelp_review_count: biz.review_count,
    aggregate_rating: biz.rating,
    total_reviews: biz.review_count,
    price_range: biz.price ? biz.price.length : null,
    photos: biz.image_url ? [biz.image_url] : null,
    verified: true,
    active: !biz.is_closed,
    popularity_score: Math.min(100, Math.floor((biz.review_count || 0) / 5))
  };
  
  try {
    const { error } = await supabase
      .from('venues')
      .upsert(venue, {
        onConflict: 'external_id,source',
        ignoreDuplicates: true
      });
    
    if (!error) {
      totalAdded++;
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}

async function runAggressiveRestaurantExpansion() {
  console.log('🍽️ AGGRESSIVE RESTAURANT EXPANSION - Target: 4,000+ restaurants');
  console.log('📊 Research shows SF has 4,400+ restaurants - we need comprehensive coverage\n');
  
  const startingCount = await initCache();
  
  // Get SF city
  const { data: sfCity } = await supabase
    .from('cities')
    .select('id')
    .eq('name', 'San Francisco')
    .single();
    
  if (!sfCity) {
    console.log('❌ San Francisco city not found');
    return;
  }
  
  console.log(`🎯 Starting venue count: ${startingCount}`);
  console.log(`🎯 Target: 5,000 venues (need ${Math.max(0, 5000 - startingCount)} more)`);
  console.log(`🍽️ Restaurant focus: Need ~3,200 more restaurants\n`);
  
  let searchesCompleted = 0;
  
  for (const search of RESTAURANT_SEARCHES) {
    console.log(`🔍 [${++searchesCompleted}/${RESTAURANT_SEARCHES.length}] Searching: ${search}`);
    
    // Search multiple pages for comprehensive coverage
    for (let offset = 0; offset < 240; offset += 50) {
      const businesses = await searchYelp(search, offset);
      if (businesses.length === 0) break;
      
      let batchAdded = 0;
      for (const biz of businesses) {
        if (await saveVenue(biz, sfCity)) {
          batchAdded++;
        }
      }
      
      if (batchAdded > 0) {
        process.stdout.write(` +${batchAdded}`);
      }
      
      // Small delay to respect API limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    console.log(); // New line after each search
    
    // Progress check every 10 searches
    if (searchesCompleted % 10 === 0) {
      const currentTotal = startingCount + totalAdded;
      console.log(`\n📊 Progress Update:`);
      console.log(`✅ Searches completed: ${searchesCompleted}/${RESTAURANT_SEARCHES.length}`);
      console.log(`📈 Venues added this run: ${totalAdded}`);
      console.log(`🎯 Current total: ${currentTotal}`);
      console.log(`🚀 Need ${Math.max(0, 5000 - currentTotal)} more for 5K target\n`);
      
      if (currentTotal >= 5000) {
        console.log('🎉 5,000 VENUE TARGET REACHED! Stopping expansion...');
        break;
      }
    }
  }
  
  // Final results
  const { data: finalData } = await supabase.from('venues').select('id');
  const finalCount = finalData?.length || 0;
  
  console.log('\n🎉 AGGRESSIVE RESTAURANT EXPANSION COMPLETE!');
  console.log('='.repeat(50));
  console.log(`✅ Restaurants added this run: ${totalAdded}`);
  console.log(`📊 Total venues now: ${finalCount}`);
  console.log(`🎯 Target progress: ${finalCount}/5,000 (${Math.round(finalCount/50)}%)`);
  
  if (finalCount >= 5000) {
    console.log('🏆 COMPETITIVE THRESHOLD REACHED! 5,000+ venues achieved!');
  } else {
    console.log(`🚀 Still need: ${5000 - finalCount} more venues`);
  }
  
  // Show category breakdown
  const { data: categoryStats } = await supabase
    .from('venues')
    .select('category')
    .eq('category', 'Restaurants');
    
  console.log(`🍽️ Restaurant count: ${categoryStats?.length || 0}`);
  console.log(`📈 Progress toward 4,000 restaurant target: ${Math.round((categoryStats?.length || 0)/40)}%`);
}

runAggressiveRestaurantExpansion().catch(console.error);