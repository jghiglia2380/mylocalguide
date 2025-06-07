require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// COMPREHENSIVE SHOPPING & RETAIL - Target: Thousands of venues
const SHOPPING_SEARCHES = [
  // Clothing & Fashion
  'boutique san francisco', 'clothing store sf', 'fashion boutique sf',
  'vintage clothing sf', 'thrift store sf', 'consignment sf',
  'designer boutique sf', 'mens clothing sf', 'womens clothing sf',
  'shoe store sf', 'sneaker store sf', 'boot store sf',
  'jewelry store sf', 'accessories sf', 'handbag store sf',
  
  // Books & Media
  'bookstore san francisco', 'independent bookstore sf', 'used bookstore sf',
  'comic book store sf', 'record store sf', 'vinyl records sf',
  'music store sf', 'cd store sf', 'magazine shop sf',
  
  // Specialty Retail
  'art supply store sf', 'craft store sf', 'hobby shop sf',
  'toy store sf', 'game store sf', 'board game store sf',
  'bike shop sf', 'bicycle store sf', 'outdoor gear sf',
  'sporting goods sf', 'fitness equipment sf', 'yoga gear sf',
  
  // Home & Decor
  'furniture store sf', 'home decor sf', 'interior design sf',
  'antique store sf', 'vintage furniture sf', 'lighting store sf',
  'kitchen store sf', 'housewares sf', 'home goods sf',
  'plant store sf', 'garden center sf', 'nursery sf',
  
  // Electronics & Tech
  'electronics store sf', 'computer store sf', 'phone store sf',
  'camera store sf', 'audio equipment sf', 'tech repair sf',
  'apple store sf', 'cell phone repair sf', 'gadget store sf',
  
  // Beauty & Personal Care
  'beauty supply sf', 'cosmetics store sf', 'perfume shop sf',
  'soap shop sf', 'skincare store sf', 'natural beauty sf',
  
  // Specialty Food Retail
  'wine shop sf', 'cheese shop sf', 'chocolate shop sf',
  'gourmet market sf', 'specialty food sf', 'spice shop sf',
  'tea shop sf', 'coffee shop sf', 'bakery sf',
  
  // Markets & General
  'farmers market sf', 'flea market sf', 'market sf',
  'grocery store sf', 'convenience store sf', 'corner store sf',
  'pharmacy sf', 'drugstore sf', 'health store sf',
  
  // Neighborhood shopping
  'valencia street shopping', 'mission shopping', 'castro shopping',
  'haight street shopping', 'fillmore shopping', 'union street shopping',
  'chestnut street shopping', 'polk street shopping', 'irving shopping',
  'clement street shopping', 'sacramento street shopping',
  
  // Shopping areas/districts
  'union square shopping', 'downtown sf shopping', 'chinatown shopping',
  'north beach shopping', 'marina shopping', 'hayes valley shopping',
  'soma shopping', 'financial district shopping',
  
  // Specific types
  'gift shop sf', 'souvenir shop sf', 'tourist shop sf',
  'smoke shop sf', 'head shop sf', 'party supply sf',
  'stationery store sf', 'office supply sf', 'printing sf',
  'fabric store sf', 'sewing shop sf', 'yarn shop sf',
  
  // Luxury & High-end
  'luxury boutique sf', 'designer store sf', 'high end shopping sf',
  'premium retail sf', 'exclusive boutique sf',
  
  // Alternative & Niche
  'punk store sf', 'goth shop sf', 'tattoo supply sf',
  'metaphysical shop sf', 'crystal shop sf', 'spiritual store sf',
  'adult store sf', 'novelty shop sf',
  
  // General terms
  'shopping san francisco', 'retail sf', 'store sf', 'shop sf',
  'boutique sf', 'market sf', 'outlet sf', 'warehouse sf'
];

console.log('🛍️ SHOPPING & RETAIL EXPANSION - Target: Thousands of venues');
console.log('🎯 Research shows thousands of retail venues in SF - massive opportunity');
console.log(`📍 Processing ${SHOPPING_SEARCHES.length} shopping searches...\n`);

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
        categories: 'shopping,fashion,beauty'  // Focus on shopping categories
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
  else if (addr.includes('union square')) neighborhood = 'Union Square';
  
  const { data: hood } = await supabase
    .from('neighborhoods')
    .select('id')
    .eq('name', neighborhood)
    .single();
  
  // Force shopping category for this script
  let category = 'Shopping';
  
  // Only override if clearly not shopping
  const cats = (biz.categories || []).map(c => c.alias).join(' ');
  if (cats.match(/restaurant|food|dining/) && !cats.match(/shop|store|market/)) {
    category = 'Restaurants';
  } else if (cats.match(/bar|pub|nightlife/) && !cats.match(/shop|store/)) {
    category = 'Bars & Nightlife';
  } else if (cats.match(/coffee|cafe|tea/) && !cats.match(/shop|store/)) {
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

async function runShoppingExpansion() {
  const startingCount = await initCache();
  
  const { data: sfCity } = await supabase
    .from('cities')
    .select('id')
    .eq('name', 'San Francisco')
    .single();
    
  console.log(`📊 Starting venues: ${startingCount}`);
  console.log(`🛍️ Focus: Boutiques, vintage shops, bookstores, specialty retail\n`);
  
  let searchCount = 0;
  
  for (const search of SHOPPING_SEARCHES) {
    console.log(`🔍 [${++searchCount}/${SHOPPING_SEARCHES.length}] ${search}`);
    
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
    
    // Progress check every 15 searches
    if (searchCount % 15 === 0) {
      const currentTotal = startingCount + totalAdded;
      console.log(`\n📊 Progress Update:`);
      console.log(`✅ Shopping searches completed: ${searchCount}/${SHOPPING_SEARCHES.length}`);
      console.log(`🛍️ Shops added this run: ${totalAdded}`);
      console.log(`📈 Current total venues: ${currentTotal}\n`);
    }
  }
  
  // Final results
  const { data: finalData } = await supabase.from('venues').select('id');
  const { data: shoppingData } = await supabase.from('venues').select('id').eq('category', 'Shopping');
  
  console.log('\n🛍️ SHOPPING & RETAIL EXPANSION COMPLETE!');
  console.log('='.repeat(50));
  console.log(`✅ Shops added this run: ${totalAdded}`);
  console.log(`🛍️ Total shopping venues: ${shoppingData?.length || 0}`);
  console.log(`📊 Total venues: ${finalData?.length || 0}`);
  console.log(`🎯 Major retail coverage achieved!`);
}

runShoppingExpansion().catch(console.error);