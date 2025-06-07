require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// TERMINAL 2: North SF neighborhoods
const NORTH_SEARCHES = [
  // Marina District
  'marina district restaurant', 'marina district bar', 'marina district coffee',
  'chestnut street restaurant', 'union street restaurant', 'fillmore street restaurant',
  'marina dining', 'marina brunch', 'marina pizza', 'marina italian',
  
  // Pacific Heights
  'pacific heights restaurant', 'pacific heights bar', 'pacific heights coffee',
  'fillmore street dining', 'sacramento street restaurant',
  'pacific heights fine dining', 'pac heights restaurant',
  
  // Russian Hill
  'russian hill restaurant', 'russian hill bar', 'russian hill coffee',
  'polk street restaurant', 'larkin street restaurant',
  'russian hill dining', 'russian hill brunch',
  
  // North Beach
  'north beach restaurant', 'north beach bar', 'north beach coffee',
  'columbus avenue restaurant', 'grant avenue restaurant',
  'north beach italian', 'north beach pizza', 'little italy restaurant',
  
  // Chinatown
  'chinatown restaurant', 'chinatown bar', 'chinatown coffee',
  'grant avenue dining', 'stockton street restaurant',
  'chinese restaurant chinatown', 'dim sum chinatown',
  
  // Nob Hill
  'nob hill restaurant', 'nob hill bar', 'nob hill coffee',
  'california street restaurant', 'powell street restaurant',
  'nob hill fine dining', 'nob hill hotel restaurant'
];

console.log('🏔️ TERMINAL 2: North SF (Marina, Pacific Heights, Russian Hill, North Beach, Chinatown, Nob Hill)');
console.log(`📍 Processing ${NORTH_SEARCHES.length} neighborhood searches...`);

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
  
  if (addr.includes('marina') || addr.includes('chestnut st') || addr.includes('union st')) neighborhood = 'Marina District';
  else if (addr.includes('pacific heights') || addr.includes('fillmore st')) neighborhood = 'Pacific Heights';
  else if (addr.includes('russian hill') || addr.includes('polk st')) neighborhood = 'Russian Hill';
  else if (addr.includes('north beach') || addr.includes('columbus ave')) neighborhood = 'North Beach';
  else if (addr.includes('chinatown') || addr.includes('grant ave') || addr.includes('stockton st')) neighborhood = 'Chinatown';
  else if (addr.includes('nob hill') || addr.includes('california st') || addr.includes('powell st')) neighborhood = 'Nob Hill';
  
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

async function runNorthExpansion() {
  const startingCount = await initCache();
  
  const { data: sfCity } = await supabase
    .from('cities')
    .select('id')
    .eq('name', 'San Francisco')
    .single();
    
  console.log(`📊 Starting venues: ${startingCount}`);
  
  let searchCount = 0;
  
  for (const search of NORTH_SEARCHES) {
    console.log(`🔍 [${++searchCount}/${NORTH_SEARCHES.length}] ${search}`);
    
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
  
  console.log(`\n✅ TERMINAL 2 COMPLETE: Added ${totalAdded} venues`);
}

runNorthExpansion().catch(console.error);