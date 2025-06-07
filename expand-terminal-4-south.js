require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// TERMINAL 4: South SF neighborhoods + Special categories
const SOUTH_SEARCHES = [
  // Potrero Hill
  'potrero hill restaurant', 'potrero hill bar', 'potrero hill coffee',
  'connecticut street restaurant', '18th street restaurant',
  'potrero hill dining', 'potrero hill brunch',
  
  // Dogpatch
  'dogpatch restaurant', 'dogpatch bar', 'dogpatch coffee',
  '3rd street restaurant', 'illinois street restaurant',
  'dogpatch dining', 'dogpatch brewery',
  
  // Tenderloin
  'tenderloin restaurant', 'tenderloin bar', 'tenderloin coffee',
  'eddy street restaurant', 'turk street restaurant',
  'tenderloin vietnamese', 'tenderloin thai',
  
  // Union Square
  'union square restaurant', 'union square bar', 'union square coffee',
  'powell street restaurant', 'geary street restaurant',
  'union square fine dining', 'downtown sf restaurant',
  
  // Special Category Searches (to fill gaps)
  'food truck san francisco', 'food cart sf', 'street food sf',
  'fine dining san francisco', 'michelin restaurant sf',
  'brunch san francisco', 'breakfast san francisco',
  'late night dining sf', '24 hour restaurant sf',
  'rooftop restaurant sf', 'waterfront dining sf',
  'romantic restaurant sf', 'date restaurant sf',
  'family restaurant sf', 'kid friendly restaurant sf',
  'vegetarian restaurant sf', 'vegan restaurant sf',
  'gluten free restaurant sf', 'healthy restaurant sf',
  'cheap eats sf', 'budget restaurant sf',
  'takeout san francisco', 'delivery restaurant sf',
  'catering san francisco', 'private dining sf'
];

console.log('🌉 TERMINAL 4: South SF + Special Categories (Potrero, Dogpatch, Tenderloin, Union Square + specialty searches)');
console.log(`📍 Processing ${SOUTH_SEARCHES.length} neighborhood & specialty searches...`);

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
  
  if (addr.includes('potrero hill') || addr.includes('connecticut st')) neighborhood = 'Potrero Hill';
  else if (addr.includes('dogpatch') || addr.includes('3rd st') || addr.includes('illinois st')) neighborhood = 'Dogpatch';
  else if (addr.includes('tenderloin') || addr.includes('eddy st') || addr.includes('turk st')) neighborhood = 'Tenderloin';
  else if (addr.includes('union square') || addr.includes('powell st') || addr.includes('geary st')) neighborhood = 'Union Square';
  else if (addr.includes('mission')) neighborhood = 'The Mission';
  else if (addr.includes('castro')) neighborhood = 'Castro';
  else if (addr.includes('soma')) neighborhood = 'SoMa';
  else if (addr.includes('marina')) neighborhood = 'Marina District';
  
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

async function runSouthExpansion() {
  const startingCount = await initCache();
  
  const { data: sfCity } = await supabase
    .from('cities')
    .select('id')
    .eq('name', 'San Francisco')
    .single();
    
  console.log(`📊 Starting venues: ${startingCount}`);
  
  let searchCount = 0;
  
  for (const search of SOUTH_SEARCHES) {
    console.log(`🔍 [${++searchCount}/${SOUTH_SEARCHES.length}] ${search}`);
    
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
  
  console.log(`\n✅ TERMINAL 4 COMPLETE: Added ${totalAdded} venues`);
}

runSouthExpansion().catch(console.error);