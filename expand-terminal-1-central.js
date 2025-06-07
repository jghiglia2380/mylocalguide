require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// TERMINAL 1: Central SF neighborhoods
const CENTRAL_SEARCHES = [
  // Mission District
  'mission district restaurant', 'mission district bar', 'mission district coffee',
  'valencia street restaurant', '24th street restaurant', '16th street restaurant',
  'mission taco', 'mission burrito', 'mission mexican', 'mission pizza',
  
  // Castro
  'castro restaurant', 'castro bar', 'castro coffee',
  'market street restaurant', '18th street restaurant',
  'castro brunch', 'castro dining',
  
  // Bernal Heights
  'bernal heights restaurant', 'bernal heights bar', 'bernal heights coffee',
  'cortland avenue restaurant', 'bernal dining',
  
  // SoMa
  'soma restaurant', 'soma bar', 'soma coffee',
  'south of market restaurant', 'howard street restaurant',
  'folsom street restaurant', '2nd street restaurant',
  'soma lunch', 'soma dining', 'soma steakhouse',
  
  // Financial District
  'financial district restaurant', 'financial district bar', 'financial district coffee',
  'montgomery street restaurant', 'california street restaurant',
  'financial district lunch', 'fidi restaurant', 'downtown sf restaurant'
];

console.log('🏢 TERMINAL 1: Central SF (Mission, Castro, Bernal, SoMa, Financial)');
console.log(`📍 Processing ${CENTRAL_SEARCHES.length} neighborhood searches...`);

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
      await new Promise(resolve => setTimeout(resolve, 2000));
      return [];
    }
    return [];
  }
}

async function saveVenue(biz, sfCity) {
  const extId = `yelp-${biz.id}`;
  if (venueCache.has(extId)) return false;
  
  venueCache.add(extId);
  
  const addr = (biz.location?.display_address?.join(', ') || '').toLowerCase();
  let neighborhood = 'San Francisco';
  
  if (addr.includes('mission')) neighborhood = 'The Mission';
  else if (addr.includes('castro')) neighborhood = 'Castro';
  else if (addr.includes('bernal')) neighborhood = 'Bernal Heights';
  else if (addr.includes('soma') || addr.includes('howard st') || addr.includes('folsom st')) neighborhood = 'SoMa';
  else if (addr.includes('financial') || addr.includes('montgomery st') || addr.includes('california st')) neighborhood = 'Financial District';
  
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

async function runCentralExpansion() {
  const startingCount = await initCache();
  
  const { data: sfCity } = await supabase
    .from('cities')
    .select('id')
    .eq('name', 'San Francisco')
    .single();
    
  console.log(`📊 Starting venues: ${startingCount}`);
  
  let searchCount = 0;
  
  for (const search of CENTRAL_SEARCHES) {
    console.log(`🔍 [${++searchCount}/${CENTRAL_SEARCHES.length}] ${search}`);
    
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
      
      await new Promise(resolve => setTimeout(resolve, 200)); // Longer delay for parallel processing
    }
    console.log();
  }
  
  console.log(`\n✅ TERMINAL 1 COMPLETE: Added ${totalAdded} venues`);
}

runCentralExpansion().catch(console.error);