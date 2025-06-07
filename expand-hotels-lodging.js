require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// COMPREHENSIVE HOTELS & LODGING - Target: 400+ venues
const HOTEL_SEARCHES = [
  // Hotel types
  'hotel san francisco', 'luxury hotel sf', 'boutique hotel sf',
  'business hotel sf', 'airport hotel sf', 'downtown hotel sf',
  'waterfront hotel sf', 'historic hotel sf', 'design hotel sf',
  'eco hotel sf', 'green hotel sf', 'sustainable hotel sf',
  
  // Budget accommodations
  'budget hotel sf', 'cheap hotel sf', 'affordable hotel sf',
  'motel san francisco', 'inn sf', 'lodge sf',
  'hostel san francisco', 'backpacker hostel sf', 'youth hostel sf',
  
  // Alternative lodging
  'bed and breakfast sf', 'b&b san francisco', 'bnb sf',
  'vacation rental sf', 'short term rental sf', 'corporate housing sf',
  'extended stay sf', 'serviced apartment sf', 'apartment hotel sf',
  
  // Neighborhood hotels
  'union square hotel', 'financial district hotel', 'soma hotel',
  'mission hotel', 'castro hotel', 'marina hotel',
  'north beach hotel', 'chinatown hotel', 'nob hill hotel',
  'russian hill hotel', 'pacific heights hotel', 'hayes valley hotel',
  'fishermans wharf hotel', 'pier 39 hotel', 'embarcadero hotel',
  
  // Specific amenities/features
  'pet friendly hotel sf', 'dog friendly hotel sf', 'family hotel sf',
  'business center hotel sf', 'fitness hotel sf', 'spa hotel sf',
  'pool hotel sf', 'rooftop hotel sf', 'view hotel sf',
  'parking hotel sf', 'accessible hotel sf', 'suites sf',
  
  // Boutique & Unique
  'boutique inn sf', 'historic inn sf', 'victorian hotel sf',
  'art hotel sf', 'themed hotel sf', 'unique lodging sf',
  'romantic hotel sf', 'honeymoon hotel sf', 'anniversary hotel sf',
  
  // Business travel
  'conference hotel sf', 'convention hotel sf', 'meeting hotel sf',
  'corporate rate hotel sf', 'executive hotel sf', 'business class sf',
  
  // Tourist areas
  'fishermans wharf lodging', 'union square lodging', 'pier 39 lodging',
  'lombard street hotel', 'alcatraz hotel', 'golden gate hotel',
  'moscone center hotel', 'att park hotel', 'oracle park hotel',
  
  // Special categories
  'resort san francisco', 'all suite hotel sf', 'apartment style sf',
  'kitchen hotel sf', 'long stay sf', 'weekly hotel sf',
  'monthly rental sf', 'furnished apartment sf',
  
  // Transit-focused
  'airport shuttle hotel sf', 'bart hotel sf', 'muni hotel sf',
  'cable car hotel sf', 'trolley hotel sf', 'transit hotel sf',
  
  // Price points
  'luxury accommodation sf', 'premium hotel sf', 'upscale hotel sf',
  'mid range hotel sf', 'economy hotel sf', 'discount hotel sf',
  
  // International/Cultural
  'japanese hotel sf', 'european style hotel sf', 'asian hotel sf',
  'international hotel sf', 'cultural hotel sf',
  
  // General lodging terms
  'accommodation san francisco', 'lodging sf', 'stay sf',
  'sleep sf', 'room sf', 'suite sf', 'housing sf'
];

console.log('🏨 HOTELS & LODGING EXPANSION - Target: 400+ venues');
console.log('🎯 Research shows 400+ accommodations in SF - compete with Booking.com');
console.log(`📍 Processing ${HOTEL_SEARCHES.length} lodging searches...\n`);

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
        radius: 40000,
        categories: 'hotels,bedbreakfast,hostels'  // Focus on lodging categories
      }
    });
    return response.data.businesses || [];
  } catch (error) {
    if (error.response?.status === 429) {
      console.log('⏳ Rate limited, waiting...');
      await new Promise(resolve => setTimeout(resolve, 3000));
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
  
  // Enhanced neighborhood mapping for hotels
  if (addr.includes('union square') || addr.includes('powell st') || addr.includes('geary st')) neighborhood = 'Union Square';
  else if (addr.includes('financial') || addr.includes('montgomery st') || addr.includes('california st')) neighborhood = 'Financial District';
  else if (addr.includes('soma') || addr.includes('howard st') || addr.includes('folsom st')) neighborhood = 'SoMa';
  else if (addr.includes('mission')) neighborhood = 'The Mission';
  else if (addr.includes('castro')) neighborhood = 'Castro';
  else if (addr.includes('marina')) neighborhood = 'Marina District';
  else if (addr.includes('north beach') || addr.includes('columbus ave')) neighborhood = 'North Beach';
  else if (addr.includes('chinatown')) neighborhood = 'Chinatown';
  else if (addr.includes('nob hill') || addr.includes('california st')) neighborhood = 'Nob Hill';
  else if (addr.includes('russian hill')) neighborhood = 'Russian Hill';
  else if (addr.includes('pacific heights')) neighborhood = 'Pacific Heights';
  else if (addr.includes('hayes valley')) neighborhood = 'Hayes Valley';
  else if (addr.includes('fishermans wharf') || addr.includes('pier 39')) neighborhood = 'Fisherman\'s Wharf';
  
  const { data: hood } = await supabase
    .from('neighborhoods')
    .select('id')
    .eq('name', neighborhood)
    .single();
  
  // Force hotels category for this script
  let category = 'Hotels';
  
  // Only override if clearly not lodging
  const cats = (biz.categories || []).map(c => c.alias).join(' ');
  if (cats.match(/restaurant|food|dining/) && !cats.match(/hotel|lodge|inn/)) {
    category = 'Restaurants';
  } else if (cats.match(/bar|pub|nightlife/) && !cats.match(/hotel|lodge/)) {
    category = 'Bars & Nightlife';
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

async function runHotelExpansion() {
  const startingCount = await initCache();
  
  const { data: sfCity } = await supabase
    .from('cities')
    .select('id')
    .eq('name', 'San Francisco')
    .single();
    
  console.log(`📊 Starting venues: ${startingCount}`);
  console.log(`🏨 Focus: Hotels, B&Bs, hostels, vacation rentals\n`);
  
  let searchCount = 0;
  
  for (const search of HOTEL_SEARCHES) {
    console.log(`🔍 [${++searchCount}/${HOTEL_SEARCHES.length}] ${search}`);
    
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
      
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    console.log();
    
    // Progress check every 10 searches
    if (searchCount % 10 === 0) {
      const currentTotal = startingCount + totalAdded;
      console.log(`\n📊 Progress Update:`);
      console.log(`✅ Hotel searches completed: ${searchCount}/${HOTEL_SEARCHES.length}`);
      console.log(`🏨 Hotels added this run: ${totalAdded}`);
      console.log(`📈 Current total venues: ${currentTotal}\n`);
    }
  }
  
  // Final results
  const { data: finalData } = await supabase.from('venues').select('id');
  const { data: hotelData } = await supabase.from('venues').select('id').eq('category', 'Hotels');
  
  console.log('\n🏨 HOTELS & LODGING EXPANSION COMPLETE!');
  console.log('='.repeat(50));
  console.log(`✅ Hotels added this run: ${totalAdded}`);
  console.log(`🏨 Total hotels now: ${hotelData?.length || 0}`);
  console.log(`📊 Total venues: ${finalData?.length || 0}`);
  console.log(`🎯 Hotel target progress: ${Math.round((hotelData?.length || 0)/4)}% toward 400 target`);
  
  if ((hotelData?.length || 0) >= 400) {
    console.log('🎉 HOTEL TARGET ACHIEVED! 400+ accommodations reached!');
  }
}

runHotelExpansion().catch(console.error);