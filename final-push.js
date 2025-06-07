require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Focus on high-yield categories for final push
const FINAL_SEARCHES = [
  'nightlife', 'brewery', 'winery', 'cocktail bar',
  'shopping center', 'mall', 'farmers market',
  'tourist attraction', 'landmark', 'museum',
  'clinic', 'urgent care', 'pharmacy', 'hospital',
  'hotel', 'bed and breakfast', 'hostel',
  'auto repair', 'gas station', 'car wash',
  'coworking', 'office space', 'tech company'
];

let venueCache = new Set();

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
      headers: {
        'Authorization': `Bearer ${process.env.YELP_API_KEY}`
      },
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
    console.log(`❌ Error searching ${term}:`, error.response?.data?.error?.description || error.message);
    return [];
  }
}

async function saveVenue(biz, sfCity) {
  const extId = `yelp-${biz.id}`;
  if (venueCache.has(extId)) return false;
  
  venueCache.add(extId);
  
  // Simple neighborhood mapping
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
  else if (addr.includes('nob hill')) neighborhood = 'Nob Hill';
  else if (addr.includes('pacific heights')) neighborhood = 'Pacific Heights';
  
  const { data: hood } = await supabase
    .from('neighborhoods')
    .select('id')
    .eq('name', neighborhood)
    .single();
  
  // Smart category detection
  const cats = (biz.categories || []).map(c => c.alias).join(' ');
  let category = 'Other';
  
  if (cats.match(/restaurant|food|cuisine|dining/)) category = 'Restaurants';
  else if (cats.match(/bar|pub|nightlife|cocktail|beer|wine/)) category = 'Bars & Nightlife';
  else if (cats.match(/coffee|cafe|tea|bakery/)) category = 'Cafes & Coffee';
  else if (cats.match(/shop|store|retail|boutique/)) category = 'Shopping';
  else if (cats.match(/hotel|motel|inn|lodge/)) category = 'Hotels';
  else if (cats.match(/gym|fitness|yoga|sports/)) category = 'Health & Fitness';
  else if (cats.match(/salon|spa|beauty|barber/)) category = 'Beauty & Wellness';
  else if (cats.match(/service|repair|professional/)) category = 'Services';
  else if (cats.match(/arts|museum|theater|entertainment/)) category = 'Arts & Entertainment';
  else if (cats.match(/medical|health|dental|clinic/)) category = 'Healthcare';
  else if (cats.match(/education|school|training/)) category = 'Education';
  
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
    phone: biz.phone || '',
    website: biz.url || '',
    price_level: biz.price?.length || null,
    aggregate_rating: biz.rating || null,
    total_reviews: biz.review_count || 0,
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  try {
    const { error } = await supabase
      .from('venues')
      .insert(venue);
    
    if (error) {
      console.log('❌ Error saving venue:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.log('❌ Exception saving venue:', error.message);
    return false;
  }
}

async function runFinalPush() {
  console.log('🚀 Running final push to 2,000 venues...');
  
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
  
  let totalAdded = 0;
  
  for (const search of FINAL_SEARCHES) {
    console.log(`🔍 Searching: ${search}`);
    
    // Try multiple offsets to get more venues
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
        totalAdded += batchAdded;
      }
      
      // Small delay
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    console.log(); // New line
    
    // Check if we've reached 2,000
    const currentCount = startingCount + totalAdded;
    if (currentCount >= 2000) {
      console.log('🎉 TARGET REACHED! Breaking early...');
      break;
    }
  }
  
  // Final count check
  const { data: finalData } = await supabase.from('venues').select('id');
  const finalCount = finalData?.length || 0;
  
  console.log('\n📊 Final Results:');
  console.log('🎯 Total venues:', finalCount);
  console.log('✅ Added this run:', totalAdded);
  
  if (finalCount >= 2000) {
    console.log('🎉 SUCCESS! We reached 2,000+ venues!');
  } else {
    console.log('🚀 Need', Math.max(0, 2000 - finalCount), 'more to reach 2,000');
  }
}

runFinalPush().catch(console.error);