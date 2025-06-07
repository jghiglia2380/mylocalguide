require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Quick batch searches to maximize coverage
const QUICK_SEARCHES = [
  // High-yield searches
  'food', 'restaurant', 'bar', 'coffee', 'shop', 'store',
  'service', 'health', 'fitness', 'beauty', 'salon', 'spa',
  'hotel', 'park', 'museum', 'theater', 'entertainment',
  'automotive', 'education', 'medical', 'dental', 'pharmacy',
  'bank', 'finance', 'insurance', 'real estate', 'home',
  
  // Specific high-value categories
  'pizza', 'burger', 'taco', 'sushi', 'pho', 'ramen',
  'bakery', 'deli', 'market', 'grocery', 'convenience',
  'gym', 'yoga', 'pilates', 'dance', 'martial arts',
  'clothing', 'shoes', 'jewelry', 'accessories', 'boutique',
  'electronics', 'computer', 'phone', 'repair', 'hardware',
  
  // Services people need
  'laundry', 'dry cleaning', 'tailor', 'alterations',
  'plumber', 'electrician', 'contractor', 'handyman',
  'lawyer', 'accountant', 'tax', 'notary', 'consulting',
  'veterinary', 'pet', 'grooming', 'boarding', 'daycare',
  'parking', 'gas station', 'car wash', 'mechanic',
  
  // Entertainment & culture
  'music', 'concert', 'club', 'lounge', 'karaoke',
  'art', 'gallery', 'studio', 'craft', 'hobby',
  'book', 'library', 'comic', 'game', 'toy',
  'sports', 'recreation', 'pool', 'bowling', 'golf',
  
  // Community
  'church', 'temple', 'mosque', 'synagogue', 'spiritual',
  'community', 'nonprofit', 'charity', 'volunteer',
  'school', 'college', 'university', 'training', 'tutoring'
];

async function batchScrape() {
  console.log('🚀 Running batch scraping...\n');
  
  const { data: sfCity } = await supabase
    .from('cities')
    .select('id')
    .eq('name', 'San Francisco')
    .single();
    
  let totalAdded = 0;
  let apiCalls = 0;
  const venueCache = new Set();
  
  // Load existing venues to avoid duplicates
  const { data: existing } = await supabase
    .from('venues')
    .select('external_id');
  
  existing.forEach(v => venueCache.add(v.external_id));
  console.log(`📊 Starting with ${venueCache.size} existing venues\n`);
  
  for (const search of QUICK_SEARCHES) {
    if (apiCalls >= 200) { // Stop after 200 calls per run
      console.log('\n⏸️  Batch limit reached. Run again for more!');
      break;
    }
    
    console.log(`🔍 Searching: ${search}`);
    
    try {
      // Search with offset to get different results
      for (let offset = 0; offset < 200; offset += 50) {
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
        
        apiCalls++;
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
      }
      
      console.log(''); // New line after search
      
    } catch (error) {
      console.log(' ❌ Error');
    }
    
    // Brief pause
    await new Promise(r => setTimeout(r, 200));
  }
  
  // Final count
  const { count } = await supabase
    .from('venues')
    .select('*', { count: 'exact', head: true });
  
  console.log('\n✅ Batch complete!');
  console.log(`📊 Added ${totalAdded} new venues`);
  console.log(`📊 Total venues: ${count}`);
  console.log(`💰 API calls: ${apiCalls} (FREE)`);
  console.log(`📈 Progress: ${Math.round((count/2500)*100)}% of target\n`);
  
  if (count < 2000) {
    console.log('💡 Run this script again to add more venues!');
    console.log('   Each run adds 200-500 venues');
    console.log(`   ${Math.ceil((2000 - count) / 300)} more runs needed to reach 2,000`);
  } else {
    console.log('🎉 TARGET REACHED! Over 2,000 venues!');
  }
}

batchScrape().catch(console.error);