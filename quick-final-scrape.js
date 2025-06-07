require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Focus on high-yield categories we might have missed
const FINAL_SEARCHES = [
  'nightlife', 'clubs', 'brewery', 'winery', 'cocktail',
  'shopping', 'mall', 'plaza', 'market', 'farmers market',
  'tours', 'activity', 'attraction', 'landmark', 'gallery',
  'clinic', 'hospital', 'urgent care', 'pharmacy',
  'school', 'college', 'library', 'community center',
  'hotel', 'hostel', 'motel', 'bed breakfast',
  'automotive', 'repair', 'mechanic', 'gas station',
  'tech', 'startup', 'coworking', 'office'
];

async function searchYelp(query, offset = 0) {
  try {
    const response = await axios.get('https://api.yelp.com/v3/businesses/search', {
      headers: {
        'Authorization': `Bearer ${process.env.YELP_API_KEY}`
      },
      params: {
        location: 'San Francisco, CA',
        term: query,
        limit: 50,
        offset: offset,
        sort_by: 'distance'
      }
    });
    return response.data.businesses || [];
  } catch (error) {
    console.log(`❌ Error searching ${query}:`, error.response?.data?.error?.description || error.message);
    return [];
  }
}

async function saveVenue(venue) {
  try {
    const venueData = {
      external_id: venue.id,
      source: 'yelp',
      name: venue.name,
      address: venue.location?.display_address?.join(', ') || '',
      latitude: venue.coordinates?.latitude,
      longitude: venue.coordinates?.longitude,
      phone: venue.phone || '',
      website: venue.url || '',
      categories: venue.categories?.map(c => c.title).join(', ') || '',
      price_level: venue.price?.length || null,
      aggregate_rating: venue.rating || null,
      review_count: venue.review_count || 0,
      city: 'San Francisco',
      state: 'CA',
      country: 'US',
      zip_code: venue.location?.zip_code || '',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('venues')
      .upsert(venueData, {
        onConflict: 'external_id,source',
        ignoreDuplicates: true
      });

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

async function runFinalScrape() {
  console.log('🚀 Running final focused scrape...');
  
  // Check starting count
  const { data: startData } = await supabase.from('venues').select('id');
  console.log('📊 Starting with', startData?.length || 0, 'venues');
  
  let totalAdded = 0;
  
  for (const query of FINAL_SEARCHES) {
    console.log(`🔍 Searching: ${query}`);
    
    // Search with multiple offsets to get more venues
    for (let offset = 0; offset < 200; offset += 50) {
      const venues = await searchYelp(query, offset);
      if (venues.length === 0) break;
      
      let batchAdded = 0;
      for (const venue of venues) {
        if (await saveVenue(venue)) {
          batchAdded++;
        }
      }
      
      if (batchAdded > 0) {
        process.stdout.write(` +${batchAdded}`);
        totalAdded += batchAdded;
      }
      
      // Small delay to be nice to the API
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    console.log(); // New line after each search
  }
  
  // Final count
  const { data: endData } = await supabase.from('venues').select('id');
  console.log('\n📊 Final Results:');
  console.log('🎯 Total venues:', endData?.length || 0);
  console.log('✅ Added this run:', totalAdded);
  
  if ((endData?.length || 0) >= 2000) {
    console.log('🎉 TARGET REACHED! We have 2,000+ venues!');
  } else {
    console.log('🚀 Need', Math.max(0, 2000 - (endData?.length || 0)), 'more to reach 2,000');
  }
}

runFinalScrape().catch(console.error);