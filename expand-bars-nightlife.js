require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// COMPREHENSIVE BARS & NIGHTLIFE - Target: 400-1,000 venues
const BAR_SEARCHES = [
  // Types of bars
  'dive bar san francisco', 'cocktail bar sf', 'wine bar sf', 'sports bar sf',
  'rooftop bar sf', 'speakeasy sf', 'whiskey bar sf', 'tiki bar sf',
  'beer bar sf', 'craft beer sf', 'gastropub sf', 'brew pub sf',
  'piano bar sf', 'karaoke bar sf', 'pool hall sf', 'billiards sf',
  'lounge sf', 'cocktail lounge sf', 'hotel bar sf', 'lobby bar sf',
  
  // Nightlife venues
  'nightclub san francisco', 'dance club sf', 'music venue sf',
  'live music sf', 'jazz club sf', 'blues club sf', 'rock venue sf',
  'comedy club sf', 'comedy show sf', 'cabaret sf', 'burlesque sf',
  
  // Breweries & Distilleries
  'brewery san francisco', 'microbrewery sf', 'craft brewery sf',
  'taproom sf', 'beer garden sf', 'distillery sf', 'cidery sf',
  
  // Wine-focused
  'wine bar san francisco', 'wine tasting sf', 'wine shop sf',
  'champagne bar sf', 'natural wine sf', 'wine lounge sf',
  
  // Neighborhood-specific bars
  'mission bar', 'castro bar', 'soma bar', 'north beach bar',
  'marina bar', 'haight bar', 'richmond bar', 'sunset bar',
  'financial district bar', 'union square bar', 'nob hill bar',
  'potrero hill bar', 'dogpatch bar', 'hayes valley bar',
  
  // Specific vibes/atmospheres
  'dive bar', 'craft cocktail', 'happy hour sf', 'late night bar sf',
  'outdoor bar sf', 'patio bar sf', 'waterfront bar sf',
  'romantic bar sf', 'date bar sf', 'group bar sf',
  'hipster bar sf', 'punk bar sf', 'goth bar sf', 'metal bar sf',
  
  // LGBTQ+ venues
  'gay bar san francisco', 'lesbian bar sf', 'drag show sf',
  'queer bar sf', 'lgbt nightlife sf',
  
  // Specific street searches
  'valencia street bar', 'mission street bar', 'polk street bar',
  'divisadero bar', 'fillmore bar', 'castro street bar',
  'folsom street bar', 'howard street bar', 'market street bar',
  
  // General terms
  'bar san francisco', 'pub sf', 'tavern sf', 'saloon sf',
  'drinking sf', 'nightlife sf', 'booze sf', 'alcohol sf'
];

console.log('🍺 BARS & NIGHTLIFE EXPANSION - Target: 400-1,000 venues');
console.log('🎯 Research shows SF has 440-1,000 bars - need comprehensive coverage');
console.log(`📍 Processing ${BAR_SEARCHES.length} bar & nightlife searches...\n`);

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
        categories: 'bars,nightlife'  // Focus on bar categories
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
  
  // Enhanced neighborhood mapping
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
  else if (addr.includes('hayes valley')) neighborhood = 'Hayes Valley';
  else if (addr.includes('potrero hill')) neighborhood = 'Potrero Hill';
  else if (addr.includes('dogpatch')) neighborhood = 'Dogpatch';
  
  const { data: hood } = await supabase
    .from('neighborhoods')
    .select('id')
    .eq('name', neighborhood)
    .single();
  
  // Force bars & nightlife category for this script
  let category = 'Bars & Nightlife';
  
  // Only override if clearly not a bar
  const cats = (biz.categories || []).map(c => c.alias).join(' ');
  if (cats.match(/restaurant|food|dining/) && !cats.match(/bar|pub|nightlife/)) {
    category = 'Restaurants';
  } else if (cats.match(/coffee|cafe|tea/) && !cats.match(/bar|nightlife/)) {
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

async function runBarExpansion() {
  const startingCount = await initCache();
  
  const { data: sfCity } = await supabase
    .from('cities')
    .select('id')
    .eq('name', 'San Francisco')
    .single();
    
  console.log(`📊 Starting venues: ${startingCount}`);
  console.log(`🍺 Focus: Dive bars, cocktail lounges, breweries, nightlife\n`);
  
  let searchCount = 0;
  
  for (const search of BAR_SEARCHES) {
    console.log(`🔍 [${++searchCount}/${BAR_SEARCHES.length}] ${search}`);
    
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
      console.log(`✅ Bar searches completed: ${searchCount}/${BAR_SEARCHES.length}`);
      console.log(`🍺 Bars added this run: ${totalAdded}`);
      console.log(`📈 Current total venues: ${currentTotal}\n`);
    }
  }
  
  // Final results
  const { data: finalData } = await supabase.from('venues').select('id');
  const { data: barData } = await supabase.from('venues').select('id').eq('category', 'Bars & Nightlife');
  
  console.log('\n🍺 BAR & NIGHTLIFE EXPANSION COMPLETE!');
  console.log('='.repeat(50));
  console.log(`✅ Bars added this run: ${totalAdded}`);
  console.log(`🍺 Total bars now: ${barData?.length || 0}`);
  console.log(`📊 Total venues: ${finalData?.length || 0}`);
  console.log(`🎯 Bar target progress: ${Math.round((barData?.length || 0)/4)}% toward 400 minimum`);
  
  if ((barData?.length || 0) >= 400) {
    console.log('🎉 BAR TARGET ACHIEVED! 400+ bars reached!');
  }
}

runBarExpansion().catch(console.error);