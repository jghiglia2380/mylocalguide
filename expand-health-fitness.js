require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// COMPREHENSIVE HEALTH & FITNESS - Target: Hundreds of venues
const FITNESS_SEARCHES = [
  // Gyms & Fitness Centers
  'gym san francisco', 'fitness center sf', 'health club sf',
  'fitness club sf', 'workout gym sf', 'training gym sf',
  '24 hour gym sf', 'women gym sf', 'boutique gym sf',
  'chain gym sf', 'independent gym sf', 'local gym sf',
  
  // Yoga & Mind-Body
  'yoga studio san francisco', 'yoga class sf', 'hot yoga sf',
  'bikram yoga sf', 'vinyasa yoga sf', 'hatha yoga sf',
  'yin yoga sf', 'power yoga sf', 'prenatal yoga sf',
  'meditation center sf', 'mindfulness sf', 'breathing class sf',
  
  // Pilates & Barre
  'pilates studio sf', 'pilates class sf', 'reformer pilates sf',
  'barre class sf', 'barre studio sf', 'pure barre sf',
  'classical pilates sf', 'contemporary pilates sf',
  
  // Dance & Movement
  'dance studio sf', 'dance class sf', 'ballroom dance sf',
  'latin dance sf', 'salsa class sf', 'swing dance sf',
  'hip hop dance sf', 'contemporary dance sf', 'ballet class sf',
  'zumba class sf', 'movement class sf', 'dance fitness sf',
  
  // Martial Arts & Combat
  'martial arts sf', 'karate sf', 'taekwondo sf', 'jiu jitsu sf',
  'boxing gym sf', 'kickboxing sf', 'muay thai sf',
  'mma gym sf', 'self defense sf', 'kung fu sf',
  'aikido sf', 'judo sf', 'krav maga sf',
  
  // Specialized Fitness
  'crossfit sf', 'crossfit gym sf', 'functional fitness sf',
  'personal training sf', 'personal trainer sf', 'strength training sf',
  'powerlifting sf', 'weightlifting sf', 'bodybuilding sf',
  'cardio class sf', 'hiit class sf', 'bootcamp sf',
  
  // Outdoor Fitness
  'outdoor fitness sf', 'hiking group sf', 'running club sf',
  'cycling class sf', 'spin class sf', 'bike fitting sf',
  'rock climbing sf', 'climbing gym sf', 'bouldering sf',
  'outdoor training sf', 'beach workout sf', 'park fitness sf',
  
  // Aquatic Fitness
  'swimming pool sf', 'lap pool sf', 'aqua fitness sf',
  'water aerobics sf', 'swim class sf', 'swimming lesson sf',
  'triathlon training sf', 'masters swimming sf',
  
  // Wellness & Spa
  'spa san francisco', 'day spa sf', 'wellness center sf',
  'massage therapy sf', 'massage spa sf', 'relaxation spa sf',
  'facial spa sf', 'beauty spa sf', 'luxury spa sf',
  'medical spa sf', 'wellness retreat sf', 'holistic spa sf',
  
  // Beauty & Wellness Services
  'massage therapist sf', 'acupuncture sf', 'chiropractic sf',
  'physical therapy sf', 'sports therapy sf', 'recovery center sf',
  'wellness coaching sf', 'nutrition counseling sf', 'health coaching sf',
  
  // Alternative Wellness
  'float tank sf', 'sensory deprivation sf', 'cryotherapy sf',
  'infrared sauna sf', 'salt cave sf', 'sound healing sf',
  'reiki sf', 'energy healing sf', 'crystal healing sf',
  'aromatherapy sf', 'reflexology sf', 'cupping sf',
  
  // Sports Facilities
  'tennis court sf', 'tennis club sf', 'squash court sf',
  'racquetball sf', 'basketball court sf', 'volleyball sf',
  'badminton sf', 'ping pong sf', 'table tennis sf',
  
  // Neighborhood fitness
  'mission fitness', 'castro fitness', 'soma fitness', 'marina fitness',
  'north beach fitness', 'hayes valley fitness', 'richmond fitness',
  'sunset fitness', 'potrero fitness', 'dogpatch fitness',
  
  // Specialty Programs
  'senior fitness sf', 'kids fitness sf', 'family fitness sf',
  'adaptive fitness sf', 'disability fitness sf', 'injury recovery sf',
  'postpartum fitness sf', 'prenatal fitness sf', 'mommy and me sf',
  
  // Recovery & Therapy
  'stretch studio sf', 'recovery studio sf', 'mobility sf',
  'sports massage sf', 'deep tissue massage sf', 'therapeutic massage sf',
  'injury prevention sf', 'rehabilitation sf', 'physical rehab sf',
  
  // Mind-Body-Spirit
  'wellness workshop sf', 'health workshop sf', 'life coaching sf',
  'stress reduction sf', 'anxiety relief sf', 'mental wellness sf',
  'spiritual wellness sf', 'emotional wellness sf',
  
  // General terms
  'health san francisco', 'wellness sf', 'fitness sf',
  'exercise sf', 'workout sf', 'training sf', 'therapy sf'
];

console.log('💪 HEALTH & FITNESS EXPANSION - Target: Hundreds of venues');
console.log('🎯 Gyms, yoga studios, spas, wellness centers, martial arts');
console.log(`📍 Processing ${FITNESS_SEARCHES.length} health & fitness searches...\n`);

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
        categories: 'fitness,gyms,yoga,spas,massage'  // Focus on fitness categories
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
  
  // Categorize by type
  const cats = (biz.categories || []).map(c => c.alias).join(' ');
  let category = 'Health & Fitness';
  
  // Check for wellness/spa category
  if (cats.match(/spa|massage|wellness|therapy/) && !cats.match(/gym|fitness|yoga/)) {
    category = 'Beauty & Wellness';
  }
  // Override if clearly not health/fitness
  else if (cats.match(/restaurant|food|dining/) && !cats.match(/gym|fitness|wellness/)) {
    category = 'Restaurants';
  } else if (cats.match(/bar|pub|nightlife/) && !cats.match(/gym|fitness/)) {
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

async function runFitnessExpansion() {
  const startingCount = await initCache();
  
  const { data: sfCity } = await supabase
    .from('cities')
    .select('id')
    .eq('name', 'San Francisco')
    .single();
    
  console.log(`📊 Starting venues: ${startingCount}`);
  console.log(`💪 Focus: Gyms, yoga, spas, wellness, martial arts\n`);
  
  let searchCount = 0;
  
  for (const search of FITNESS_SEARCHES) {
    console.log(`🔍 [${++searchCount}/${FITNESS_SEARCHES.length}] ${search}`);
    
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
      console.log(`✅ Fitness searches completed: ${searchCount}/${FITNESS_SEARCHES.length}`);
      console.log(`💪 Fitness venues added this run: ${totalAdded}`);
      console.log(`📈 Current total venues: ${currentTotal}\n`);
    }
  }
  
  // Final results
  const { data: finalData } = await supabase.from('venues').select('id');
  const { data: fitnessData } = await supabase.from('venues').select('id').eq('category', 'Health & Fitness');
  const { data: wellnessData } = await supabase.from('venues').select('id').eq('category', 'Beauty & Wellness');
  
  console.log('\n💪 HEALTH & FITNESS EXPANSION COMPLETE!');
  console.log('='.repeat(50));
  console.log(`✅ Health venues added this run: ${totalAdded}`);
  console.log(`💪 Total fitness venues: ${fitnessData?.length || 0}`);
  console.log(`🧘 Total wellness venues: ${wellnessData?.length || 0}`);
  console.log(`📊 Total venues: ${finalData?.length || 0}`);
  console.log(`🎯 Major health & fitness coverage achieved!`);
}

runFitnessExpansion().catch(console.error);