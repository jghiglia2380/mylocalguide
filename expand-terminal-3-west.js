require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// TERMINAL 3: West SF neighborhoods
const WEST_SEARCHES = [
  // Richmond District
  'richmond district restaurant', 'richmond district bar', 'richmond district coffee',
  'geary boulevard restaurant', 'clement street restaurant', 'balboa street restaurant',
  'richmond asian food', 'richmond dim sum', 'richmond chinese',
  'inner richmond restaurant', 'outer richmond restaurant',
  
  // Sunset District
  'sunset district restaurant', 'sunset district bar', 'sunset district coffee',
  'irving street restaurant', 'judah street restaurant', 'noriega street restaurant',
  'sunset asian food', 'sunset chinese', 'sunset vietnamese',
  'inner sunset restaurant', 'outer sunset restaurant',
  
  // Haight-Ashbury
  'haight ashbury restaurant', 'haight ashbury bar', 'haight ashbury coffee',
  'haight street restaurant', 'haight street bar', 'haight street cafe',
  'ashbury street restaurant', 'upper haight restaurant', 'lower haight restaurant',
  
  // Hayes Valley
  'hayes valley restaurant', 'hayes valley bar', 'hayes valley coffee',
  'hayes street restaurant', 'octavia street restaurant',
  'hayes valley fine dining', 'hayes valley brunch',
  
  // Presidio
  'presidio restaurant', 'presidio bar', 'presidio coffee',
  'crissy field restaurant', 'presidio dining',
  
  // Western Addition
  'western addition restaurant', 'western addition bar', 'western addition coffee',
  'divisadero street restaurant', 'fillmore west restaurant'
];

console.log('🌊 TERMINAL 3: West SF (Richmond, Sunset, Haight-Ashbury, Hayes Valley, Presidio)');
console.log(`📍 Processing ${WEST_SEARCHES.length} neighborhood searches...`);

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
  
  if (addr.includes('richmond') || addr.includes('geary blvd') || addr.includes('clement st') || addr.includes('balboa st')) neighborhood = 'Richmond District';
  else if (addr.includes('sunset') || addr.includes('irving st') || addr.includes('judah st') || addr.includes('noriega st')) neighborhood = 'Sunset District';
  else if (addr.includes('haight') || addr.includes('ashbury')) neighborhood = 'Haight-Ashbury';
  else if (addr.includes('hayes valley') || addr.includes('hayes st')) neighborhood = 'Hayes Valley';
  else if (addr.includes('presidio')) neighborhood = 'Presidio';
  else if (addr.includes('western addition') || addr.includes('divisadero st')) neighborhood = 'Western Addition';
  
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

async function runWestExpansion() {
  const startingCount = await initCache();
  
  const { data: sfCity } = await supabase
    .from('cities')
    .select('id')
    .eq('name', 'San Francisco')
    .single();
    
  console.log(`📊 Starting venues: ${startingCount}`);
  
  let searchCount = 0;
  
  for (const search of WEST_SEARCHES) {
    console.log(`🔍 [${++searchCount}/${WEST_SEARCHES.length}] ${search}`);
    
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
  
  console.log(`\n✅ TERMINAL 3 COMPLETE: Added ${totalAdded} venues`);
}

runWestExpansion().catch(console.error);