require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Just use the exact working script but with focused searches
const HIGH_YIELD_SEARCHES = [
  'nightlife', 'brewery', 'winery', 'cocktail bar', 'dive bar',
  'shopping center', 'mall', 'farmers market', 'boutique',
  'tourist attraction', 'landmark', 'museum', 'gallery',
  'clinic', 'urgent care', 'pharmacy', 'hospital', 'dental',
  'hotel', 'bed and breakfast', 'hostel', 'airbnb',
  'auto repair', 'gas station', 'car wash', 'mechanic'
];

let venueCache = new Set();

async function initCache() {
  const { data } = await supabase.from('venues').select('external_id');
  data?.forEach(v => venueCache.add(v.external_id));
  return data?.length || 0;
}

async function runSimpleFinal() {
  console.log('🚀 Simple final scrape...');
  
  const startingCount = await initCache();
  console.log('📊 Starting with', startingCount, 'venues');
  
  const { data: sfCity } = await supabase
    .from('cities')
    .select('id')
    .eq('name', 'San Francisco')
    .single();
    
  let totalAdded = 0;
  
  for (const search of HIGH_YIELD_SEARCHES) {
    console.log(`🔍 ${search}`);
    
    for (let offset = 0; offset < 100; offset += 50) {
      try {
        const response = await axios.get('https://api.yelp.com/v3/businesses/search', {
          headers: { 'Authorization': `Bearer ${process.env.YELP_API_KEY}` },
          params: {
            term: search,
            location: 'San Francisco, CA',
            limit: 50,
            offset,
            radius: 40000
          }
        });
        
        const businesses = response.data.businesses || [];
        if (businesses.length === 0) break;
        
        let batchCount = 0;
        for (const biz of businesses) {
          const extId = `yelp-${biz.id}`;
          if (venueCache.has(extId)) continue;
          
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
          
          const { error } = await supabase
            .from('venues')
            .upsert(venue, {
              onConflict: 'external_id,source',
              ignoreDuplicates: true
            });
          
          if (!error) {
            batchCount++;
            totalAdded++;
          }
        }
        
        if (batchCount > 0) {
          process.stdout.write(` +${batchCount}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        break;
      }
    }
    console.log(); // New line
    
    // Check if we hit 2,000
    if (startingCount + totalAdded >= 2000) {
      console.log('🎉 Hit 2,000! Breaking...');
      break;
    }
  }
  
  // Final count
  const { data: finalData } = await supabase.from('venues').select('id');
  const finalCount = finalData?.length || 0;
  
  console.log('\n📊 Final Results:');
  console.log('🎯 Total venues:', finalCount);
  console.log('✅ Added this run:', totalAdded);
  
  if (finalCount >= 2000) {
    console.log('🎉 TARGET REACHED! We have 2,000+ venues!');
  } else {
    console.log('🚀 Need', Math.max(0, 2000 - finalCount), 'more');
  }
}

runSimpleFinal().catch(console.error);