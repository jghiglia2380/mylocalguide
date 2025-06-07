require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// COMPREHENSIVE ARTS & CULTURE - Target: Hundreds of venues
const ARTS_SEARCHES = [
  // Museums
  'museum san francisco', 'art museum sf', 'history museum sf',
  'science museum sf', 'children museum sf', 'contemporary museum sf',
  'modern art sf', 'fine art museum sf', 'cultural museum sf',
  'sfmoma', 'de young museum', 'legion of honor', 'asian art museum',
  'exploratorium', 'california academy sciences',
  
  // Galleries
  'art gallery san francisco', 'gallery sf', 'contemporary gallery sf',
  'photography gallery sf', 'sculpture gallery sf', 'painting gallery sf',
  'independent gallery sf', 'artist gallery sf', 'exhibition space sf',
  'art space sf', 'creative space sf', 'art studio sf',
  
  // Theaters
  'theater san francisco', 'theatre sf', 'playhouse sf',
  'drama theater sf', 'musical theater sf', 'comedy theater sf',
  'experimental theater sf', 'black box theater sf', 'repertory theater sf',
  'opera house sf', 'symphony hall sf', 'concert hall sf',
  
  // Music Venues
  'music venue san francisco', 'concert venue sf', 'live music sf',
  'jazz venue sf', 'rock venue sf', 'classical venue sf',
  'indie venue sf', 'underground venue sf', 'intimate venue sf',
  'outdoor venue sf', 'amphitheater sf', 'music hall sf',
  
  // Performance Spaces
  'performance space sf', 'dance venue sf', 'ballet sf',
  'dance studio sf', 'performance art sf', 'cabaret sf',
  'variety show sf', 'circus sf', 'magic show sf',
  
  // Cultural Centers
  'cultural center sf', 'community center sf', 'arts center sf',
  'multicultural center sf', 'ethnic center sf', 'heritage center sf',
  'cultural organization sf', 'arts organization sf',
  
  // Film & Cinema
  'movie theater sf', 'cinema sf', 'film festival sf',
  'independent cinema sf', 'art house cinema sf', 'repertory cinema sf',
  'drive in sf', 'outdoor cinema sf', 'film screening sf',
  
  // Alternative Arts
  'artist collective sf', 'artist space sf', 'maker space sf',
  'creative collective sf', 'art warehouse sf', 'artist studio sf',
  'printmaking sf', 'ceramics studio sf', 'glass blowing sf',
  
  // Literary & Writing
  'literary center sf', 'writing center sf', 'poetry venue sf',
  'book reading sf', 'author event sf', 'literary event sf',
  'spoken word sf', 'storytelling sf', 'writing workshop sf',
  
  // Neighborhood arts
  'mission arts', 'soma arts', 'hayes valley arts', 'castro arts',
  'north beach arts', 'chinatown arts', 'richmond arts',
  'potrero hill arts', 'dogpatch arts', 'marina arts',
  
  // Public Art & Monuments
  'public art sf', 'sculpture sf', 'monument sf', 'mural sf',
  'street art sf', 'installation art sf', 'outdoor art sf',
  'landmark sf', 'historic site sf', 'cultural landmark sf',
  
  // Educational Arts
  'art school sf', 'art education sf', 'art class sf',
  'art workshop sf', 'creative workshop sf', 'pottery class sf',
  'painting class sf', 'drawing class sf', 'sculpture class sf',
  
  // Festivals & Events
  'art festival sf', 'music festival sf', 'cultural festival sf',
  'arts festival sf', 'street festival sf', 'neighborhood festival sf',
  'annual event sf', 'cultural event sf', 'art event sf',
  
  // Specialty Arts
  'fiber arts sf', 'textile art sf', 'fashion art sf',
  'jewelry making sf', 'metalworking sf', 'woodworking sf',
  'digital art sf', 'new media sf', 'video art sf',
  
  // Night Arts
  'art opening sf', 'gallery opening sf', 'first friday sf',
  'art walk sf', 'gallery walk sf', 'art night sf',
  'late night arts sf', 'arts nightlife sf',
  
  // General terms
  'arts san francisco', 'culture sf', 'entertainment sf',
  'creative sf', 'artistic sf', 'cultural sf', 'exhibition sf'
];

console.log('🎭 ARTS & CULTURE EXPANSION - Target: Hundreds of venues');
console.log('🎯 Museums, galleries, theaters, music venues, cultural centers');
console.log(`📍 Processing ${ARTS_SEARCHES.length} arts & culture searches...\n`);

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
        categories: 'arts,museums,theaters,musicvenues'  // Focus on arts categories
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
  else if (addr.includes('union square')) neighborhood = 'Union Square';
  
  const { data: hood } = await supabase
    .from('neighborhoods')
    .select('id')
    .eq('name', neighborhood)
    .single();
  
  // Force arts & entertainment category for this script
  let category = 'Arts & Entertainment';
  
  // Only override if clearly not arts/culture
  const cats = (biz.categories || []).map(c => c.alias).join(' ');
  if (cats.match(/restaurant|food|dining/) && !cats.match(/theater|museum|gallery/)) {
    category = 'Restaurants';
  } else if (cats.match(/bar|pub|nightlife/) && !cats.match(/theater|venue|performance/)) {
    category = 'Bars & Nightlife';
  } else if (cats.match(/shop|store|retail/) && !cats.match(/gallery|museum/)) {
    category = 'Shopping';
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

async function runArtsExpansion() {
  const startingCount = await initCache();
  
  const { data: sfCity } = await supabase
    .from('cities')
    .select('id')
    .eq('name', 'San Francisco')
    .single();
    
  console.log(`📊 Starting venues: ${startingCount}`);
  console.log(`🎭 Focus: Museums, galleries, theaters, music venues, cultural centers\n`);
  
  let searchCount = 0;
  
  for (const search of ARTS_SEARCHES) {
    console.log(`🔍 [${++searchCount}/${ARTS_SEARCHES.length}] ${search}`);
    
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
      console.log(`✅ Arts searches completed: ${searchCount}/${ARTS_SEARCHES.length}`);
      console.log(`🎭 Arts venues added this run: ${totalAdded}`);
      console.log(`📈 Current total venues: ${currentTotal}\n`);
    }
  }
  
  // Final results
  const { data: finalData } = await supabase.from('venues').select('id');
  const { data: artsData } = await supabase.from('venues').select('id').eq('category', 'Arts & Entertainment');
  
  console.log('\n🎭 ARTS & CULTURE EXPANSION COMPLETE!');
  console.log('='.repeat(50));
  console.log(`✅ Arts venues added this run: ${totalAdded}`);
  console.log(`🎭 Total arts venues: ${artsData?.length || 0}`);
  console.log(`📊 Total venues: ${finalData?.length || 0}`);
  console.log(`🎯 Major cultural coverage achieved!`);
}

runArtsExpansion().catch(console.error);