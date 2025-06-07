require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Focus on high-yield restaurant searches (avoiding the 240 offset limit)
const HIGH_YIELD_RESTAURANT_SEARCHES = [
  // Specific neighborhood + food combinations
  'mission district restaurant', 'castro restaurant', 'soma restaurant',
  'north beach restaurant', 'marina restaurant', 'haight restaurant',
  'richmond restaurant', 'sunset restaurant', 'chinatown restaurant',
  'financial district restaurant', 'pacific heights restaurant',
  
  // Popular food types not covered yet
  'pizza', 'burger', 'sandwich', 'salad', 'soup', 'noodles',
  'dumpling', 'dim sum', 'hot pot', 'barbecue', 'steakhouse',
  'seafood', 'taco', 'burrito', 'deli', 'bakery',
  
  // Dining styles
  'fine dining san francisco', 'casual dining', 'family restaurant',
  'takeout restaurant', 'delivery restaurant', 'food truck',
  'brunch restaurant', 'breakfast restaurant', 'late night dining',
  
  // Cuisine + SF combinations
  'ethiopian food san francisco', 'moroccan restaurant sf',
  'peruvian restaurant sf', 'brazilian restaurant sf',
  'filipino restaurant sf', 'burmese restaurant sf',
  
  // Broader food terms
  'eatery san francisco', 'bistro sf', 'gastropub sf',
  'tavern san francisco', 'grill sf', 'kitchen sf'
];

let venueCache = new Set();
let totalAdded = 0;

async function initCache() {
  const { data } = await supabase.from('venues').select('external_id');
  data?.forEach(v => venueCache.add(v.external_id));
  return data?.length || 0;
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
        radius: 40000
      }
    });
    
    return response.data.businesses || [];
  } catch (error) {
    if (error.response?.status === 429) {
      console.log('⏳ Rate limited, waiting...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      return [];
    }
    console.log(`❌ Error: ${error.response?.data?.error?.description || error.message}`);
    return [];
  }
}

async function saveVenue(biz, sfCity) {
  const extId = `yelp-${biz.id}`;
  if (venueCache.has(extId)) return false;
  
  venueCache.add(extId);
  
  // Quick neighborhood mapping
  const addr = (biz.location?.display_address?.join(', ') || '').toLowerCase();
  let neighborhood = 'San Francisco';
  
  if (addr.includes('mission')) neighborhood = 'The Mission';
  else if (addr.includes('castro')) neighborhood = 'Castro';
  else if (addr.includes('marina')) neighborhood = 'Marina District';
  else if (addr.includes('soma')) neighborhood = 'SoMa';
  else if (addr.includes('financial')) neighborhood = 'Financial District';
  else if (addr.includes('north beach')) neighborhood = 'North Beach';
  else if (addr.includes('chinatown')) neighborhood = 'Chinatown';
  else if (addr.includes('haight')) neighborhood = 'Haight-Ashbury';
  else if (addr.includes('richmond')) neighborhood = 'Richmond District';
  else if (addr.includes('sunset')) neighborhood = 'Sunset District';
  
  const { data: hood } = await supabase
    .from('neighborhoods')
    .select('id')
    .eq('name', neighborhood)
    .single();
  
  const cats = (biz.categories || []).map(c => c.alias).join(' ');
  let category = 'Restaurants';
  
  if (cats.match(/bar|pub|nightlife|cocktail|beer|wine/)) category = 'Bars & Nightlife';
  else if (cats.match(/coffee|cafe|tea|bakery/)) category = 'Cafes & Coffee';
  else if (cats.match(/shop|store|retail|boutique/)) category = 'Shopping';
  
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

async function continueExpansion() {
  console.log('🚀 CONTINUING RESTAURANT EXPANSION - Phase 2');
  console.log('Target: 5,000 total venues (competitive threshold)\n');
  
  const startingCount = await initCache();
  
  const { data: sfCity } = await supabase
    .from('cities')
    .select('id')
    .eq('name', 'San Francisco')
    .single();
    
  console.log(`📊 Current venues: ${startingCount}`);
  console.log(`🎯 Need: ${Math.max(0, 5000 - startingCount)} more for 5K target\n`);
  
  let searchCount = 0;
  
  for (const search of HIGH_YIELD_RESTAURANT_SEARCHES) {
    console.log(`🔍 [${++searchCount}/${HIGH_YIELD_RESTAURANT_SEARCHES.length}] ${search}`);
    
    // Use lower offset limit to avoid 240 error
    for (let offset = 0; offset < 200; offset += 50) {
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
      
      await new Promise(resolve => setTimeout(resolve, 150));
    }
    console.log();
    
    // Check progress every 5 searches
    if (searchCount % 5 === 0) {
      const currentTotal = startingCount + totalAdded;
      console.log(`\n📈 Progress: ${currentTotal} venues (+${totalAdded} this run)`);
      console.log(`🎯 ${Math.max(0, 5000 - currentTotal)} more needed for 5K target\n`);
      
      if (currentTotal >= 5000) {
        console.log('🎉 5,000 VENUE TARGET REACHED!');
        break;
      }
    }
  }
  
  // Final count
  const { data: finalData } = await supabase.from('venues').select('id');
  const finalCount = finalData?.length || 0;
  
  console.log('\n🎊 EXPANSION RESULTS:');
  console.log('='.repeat(40));
  console.log(`✅ Added this session: ${totalAdded}`);
  console.log(`📊 Total venues: ${finalCount}`);
  console.log(`🏆 Progress: ${Math.round(finalCount/50)}% toward 5,000`);
  
  if (finalCount >= 5000) {
    console.log('\n🎉🎉 COMPETITIVE THRESHOLD ACHIEVED! 🎉🎉');
    console.log('MyLocalGuide now has comprehensive SF coverage!');
  }
}

continueExpansion().catch(console.error);