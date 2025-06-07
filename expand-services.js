require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// COMPREHENSIVE SERVICES - Target: Hundreds of venues
const SERVICES_SEARCHES = [
  // Personal Care Services
  'hair salon san francisco', 'barber shop sf', 'beauty salon sf',
  'nail salon sf', 'manicure sf', 'pedicure sf', 'nail art sf',
  'eyebrow salon sf', 'waxing salon sf', 'threading sf',
  'eyelash extension sf', 'permanent makeup sf', 'microblading sf',
  
  // Automotive Services
  'auto repair sf', 'car repair sf', 'mechanic sf',
  'oil change sf', 'tire shop sf', 'auto body sf',
  'car wash sf', 'auto detailing sf', 'car service sf',
  'brake repair sf', 'transmission repair sf', 'smog check sf',
  
  // Home & Repair Services
  'dry cleaning sf', 'laundromat sf', 'alterations sf',
  'tailor sf', 'shoe repair sf', 'watch repair sf',
  'jewelry repair sf', 'electronics repair sf', 'phone repair sf',
  'computer repair sf', 'appliance repair sf', 'bike repair sf',
  
  // Professional Services
  'lawyer san francisco', 'attorney sf', 'law firm sf',
  'accountant sf', 'tax preparation sf', 'cpa sf',
  'notary sf', 'real estate agent sf', 'insurance agent sf',
  'financial advisor sf', 'investment advisor sf', 'mortgage broker sf',
  
  // Business Services
  'printing sf', 'copy center sf', 'shipping sf',
  'ups store sf', 'fedex sf', 'mailbox rental sf',
  'office supply sf', 'business center sf', 'coworking sf',
  'meeting room sf', 'conference room sf', 'event space sf',
  
  // Health Services
  'medical office sf', 'clinic sf', 'urgent care sf',
  'dentist sf', 'dental office sf', 'orthodontist sf',
  'optometrist sf', 'eye doctor sf', 'vision center sf',
  'chiropractor sf', 'physical therapy sf', 'acupuncture sf',
  
  // Pet Services
  'veterinary sf', 'vet clinic sf', 'animal hospital sf',
  'pet grooming sf', 'dog grooming sf', 'pet boarding sf',
  'dog daycare sf', 'pet sitting sf', 'dog walking sf',
  'pet store sf', 'pet supply sf', 'pet training sf',
  
  // Financial Services
  'bank sf', 'credit union sf', 'atm sf',
  'currency exchange sf', 'check cashing sf', 'payday loan sf',
  'investment firm sf', 'wealth management sf', 'financial planning sf',
  
  // Educational Services
  'tutoring sf', 'test prep sf', 'language school sf',
  'music lessons sf', 'art lessons sf', 'driving school sf',
  'dance lessons sf', 'cooking class sf', 'computer training sf',
  
  // Photography & Media
  'photographer sf', 'wedding photographer sf', 'portrait photographer sf',
  'photo studio sf', 'video production sf', 'graphic design sf',
  'web design sf', 'marketing agency sf', 'advertising agency sf',
  
  // Travel & Transportation
  'travel agency sf', 'travel agent sf', 'car rental sf',
  'bike rental sf', 'scooter rental sf', 'moving company sf',
  'storage unit sf', 'self storage sf', 'parking garage sf',
  
  // Cleaning Services
  'house cleaning sf', 'office cleaning sf', 'carpet cleaning sf',
  'window cleaning sf', 'pressure washing sf', 'janitorial sf',
  'maid service sf', 'deep cleaning sf', 'move out cleaning sf',
  
  // Construction & Home Improvement
  'contractor sf', 'handyman sf', 'plumber sf',
  'electrician sf', 'painter sf', 'roofer sf',
  'flooring sf', 'tile installer sf', 'cabinet maker sf',
  'locksmith sf', 'security system sf', 'alarm system sf',
  
  // Specialty Services
  'wedding planner sf', 'event planner sf', 'party planner sf',
  'catering sf', 'florist sf', 'flower shop sf',
  'cake decorator sf', 'party supply sf', 'costume rental sf',
  
  // Technology Services
  'it support sf', 'computer consultant sf', 'software developer sf',
  'website developer sf', 'app developer sf', 'tech consultant sf',
  'data recovery sf', 'network setup sf', 'cybersecurity sf',
  
  // Consulting Services
  'business consultant sf', 'management consultant sf', 'hr consultant sf',
  'marketing consultant sf', 'strategy consultant sf', 'startup advisor sf',
  'life coach sf', 'career coach sf', 'executive coach sf',
  
  // Government & Public Services
  'post office sf', 'city hall sf', 'courthouse sf',
  'dmv sf', 'passport office sf', 'social security sf',
  'unemployment office sf', 'voter registration sf',
  
  // Neighborhood services
  'mission services', 'castro services', 'soma services', 'marina services',
  'north beach services', 'hayes valley services', 'richmond services',
  'sunset services', 'potrero services', 'dogpatch services',
  
  // Emergency & Urgent Services
  'emergency service sf', 'urgent repair sf', '24 hour service sf',
  'emergency plumber sf', 'emergency locksmith sf', 'towing sf',
  'roadside assistance sf', 'emergency vet sf',
  
  // General service terms
  'service san francisco', 'repair sf', 'professional sf',
  'consultant sf', 'specialist sf', 'expert sf', 'provider sf'
];

console.log('🔧 SERVICES EXPANSION - Target: Hundreds of venues');
console.log('🎯 Professional services, repair shops, personal care, automotive');
console.log(`📍 Processing ${SERVICES_SEARCHES.length} service searches...\n`);

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
        categories: 'homeservices,autorepair,professional,beautysvc'  // Focus on service categories
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
  
  // Categorize services appropriately
  const cats = (biz.categories || []).map(c => c.alias).join(' ');
  let category = 'Services';
  
  // Check for specific service subcategories
  if (cats.match(/salon|barber|nail|beauty|spa|massage/) && !cats.match(/restaurant|food/)) {
    category = 'Beauty & Wellness';
  } else if (cats.match(/medical|dental|clinic|doctor|health/) && !cats.match(/restaurant|spa/)) {
    category = 'Healthcare';
  }
  // Override if clearly not services
  else if (cats.match(/restaurant|food|dining/) && !cats.match(/service|repair/)) {
    category = 'Restaurants';
  } else if (cats.match(/bar|pub|nightlife/) && !cats.match(/service/)) {
    category = 'Bars & Nightlife';
  } else if (cats.match(/shop|store|retail/) && !cats.match(/repair|service/)) {
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

async function runServicesExpansion() {
  const startingCount = await initCache();
  
  const { data: sfCity } = await supabase
    .from('cities')
    .select('id')
    .eq('name', 'San Francisco')
    .single();
    
  console.log(`📊 Starting venues: ${startingCount}`);
  console.log(`🔧 Focus: Professional services, repair, automotive, personal care\n`);
  
  let searchCount = 0;
  
  for (const search of SERVICES_SEARCHES) {
    console.log(`🔍 [${++searchCount}/${SERVICES_SEARCHES.length}] ${search}`);
    
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
      console.log(`✅ Service searches completed: ${searchCount}/${SERVICES_SEARCHES.length}`);
      console.log(`🔧 Services added this run: ${totalAdded}`);
      console.log(`📈 Current total venues: ${currentTotal}\n`);
    }
  }
  
  // Final results
  const { data: finalData } = await supabase.from('venues').select('id');
  const { data: servicesData } = await supabase.from('venues').select('id').eq('category', 'Services');
  const { data: healthcareData } = await supabase.from('venues').select('id').eq('category', 'Healthcare');
  
  console.log('\n🔧 SERVICES EXPANSION COMPLETE!');
  console.log('='.repeat(50));
  console.log(`✅ Services added this run: ${totalAdded}`);
  console.log(`🔧 Total service venues: ${servicesData?.length || 0}`);
  console.log(`🏥 Total healthcare venues: ${healthcareData?.length || 0}`);
  console.log(`📊 Total venues: ${finalData?.length || 0}`);
  console.log(`🎯 Major service coverage achieved!`);
}

runServicesExpansion().catch(console.error);