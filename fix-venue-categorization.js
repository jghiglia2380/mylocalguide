require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Enhanced category mapping
const CATEGORY_KEYWORDS = {
  'Restaurants': [
    'restaurant', 'cuisine', 'dining', 'bistro', 'grill', 'eatery', 'kitchen', 'taco', 'pizza', 'burger', 
    'sushi', 'ramen', 'pho', 'thai', 'chinese', 'mexican', 'italian', 'indian', 'korean', 'japanese',
    'deli', 'sandwich', 'noodle', 'bbq', 'steakhouse', 'seafood', 'fusion', 'brasserie', 'tonkatsu',
    'subs', 'cracked', 'battered', 'gourmet', 'cachanillas', 'lokma', 'zitouna', 'xica', 'sisterita'
  ],
  'Shopping': [
    'shop', 'store', 'retail', 'boutique', 'apparel', 'clothing', 'fashion', 'shoes', 'jewelry', 
    'accessories', 'electronics', 'computer', 'phone', 'hardware', 'furniture', 'home', 'decor',
    'books', 'records', 'vintage', 'thrift', 'market', 'pharmacy', 'drugstore', 'edge', 'stitch',
    'gorjana', 'flora', 'engrafft'
  ],
  'Cafes & Coffee': [
    'coffee', 'cafe', 'tea', 'bakery', 'pastry', 'donuts', 'bagel', 'breakfast', 'brunch'
  ],
  'Bars & Nightlife': [
    'bar', 'pub', 'nightlife', 'cocktail', 'lounge', 'club', 'brewery', 'taproom', 'wine bar',
    'sports bar', 'dive bar', 'speakeasy'
  ],
  'Health & Fitness': [
    'gym', 'fitness', 'yoga', 'pilates', 'crossfit', 'martial arts', 'dance', 'sports', 'wellness'
  ],
  'Beauty & Wellness': [
    'salon', 'spa', 'beauty', 'barber', 'massage', 'nail', 'skincare', 'facial', 'wellness'
  ],
  'Healthcare': [
    'medical', 'clinic', 'hospital', 'dental', 'dentist', 'doctor', 'urgent care', 'pharmacy',
    'optometry', 'chiropractic', 'physical therapy', 'veterinary', 'vet'
  ],
  'Services': [
    'service', 'repair', 'auto', 'mechanic', 'laundry', 'dry cleaning', 'tailor', 'alterations',
    'plumber', 'electrician', 'contractor', 'handyman', 'lawyer', 'accountant', 'insurance',
    'real estate', 'bank', 'finance', 'notary', 'consulting', 'agency', 'catering', 'kanteen',
    'boochmania', 'mercado', 'tahona', 'asmbly', 'hall'
  ],
  'Arts & Entertainment': [
    'theater', 'museum', 'gallery', 'art', 'music', 'entertainment', 'cinema', 'movie', 'comedy',
    'performance', 'venue', 'studio', 'creative'
  ],
  'Education': [
    'school', 'education', 'university', 'college', 'training', 'tutoring', 'academy', 'institute',
    'library', 'learning'
  ],
  'Hotels': [
    'hotel', 'motel', 'inn', 'lodge', 'hostel', 'bed and breakfast', 'resort', 'accommodation'
  ]
};

// SF neighborhood mappings with more keywords
const SF_NEIGHBORHOOD_MAPPING = {
  'The Mission': ['mission', '24th st', '16th st', 'valencia st', 'mission st', '94110'],
  'Castro': ['castro', 'market st', '18th st', '94114'],
  'Marina District': ['marina', 'fillmore st', 'union st', 'chestnut st', '94123'],
  'SoMa': ['soma', 'south of market', '2nd st', '3rd st', 'howard st', 'folsom st', '94103', '94107'],
  'Financial District': ['financial', 'montgomery st', 'california st', 'pine st', '94104', '94111'],
  'North Beach': ['north beach', 'columbus ave', 'grant ave', 'broadway', '94133'],
  'Chinatown': ['chinatown', 'grant ave', 'stockton st', 'clay st'],
  'Haight-Ashbury': ['haight', 'ashbury', 'haight st', 'masonic ave', '94117'],
  'Richmond District': ['richmond', 'geary blvd', 'clement st', 'balboa st', '94118', '94121'],
  'Sunset District': ['sunset', 'irving st', 'judah st', 'noriega st', '94122', '94116'],
  'Nob Hill': ['nob hill', 'california st', 'powell st', 'mason st', '94108'],
  'Pacific Heights': ['pacific heights', 'fillmore st', 'sacramento st', 'california st', '94115'],
  'Hayes Valley': ['hayes valley', 'hayes st', 'grove st', 'octavia st', '94102'],
  'Tenderloin': ['tenderloin', 'eddy st', 'turk st', 'jones st', '94102'],
  'Union Square': ['union square', 'powell st', 'geary st', 'post st', '94102'],
  'Civic Center': ['civic center', 'mcallister st', 'grove st', 'van ness ave', '94102'],
  'Russian Hill': ['russian hill', 'polk st', 'larkin st', 'hyde st', '94109'],
  'Presidio': ['presidio', 'lombard st', 'chestnut st', '94129'],
  'Bernal Heights': ['bernal heights', 'cortland ave', 'mission st', '94110'],
  'Potrero Hill': ['potrero hill', '16th st', '18th st', 'connecticut st', '94107'],
  'Dogpatch': ['dogpatch', '3rd st', 'illinois st', 'indiana st', '94107'],
  'Glen Park': ['glen park', 'diamond st', 'bosworth st', '94131'],
  'Excelsior': ['excelsior', 'geneva ave', 'mission st', '94112'],
  'Outer Richmond': ['outer richmond', '38th ave', '45th ave', 'balboa st', '94121'],
  'Outer Sunset': ['outer sunset', '19th ave', 'taraval st', 'vicente st', '94116']
};

async function fixCategorization() {
  console.log('🔧 Starting venue categorization fix...');
  
  // Get all "Other" venues
  const { data: otherVenues } = await supabase
    .from('venues')
    .select('id, name, address, external_id')
    .eq('category', 'Other');
    
  console.log(`📊 Found ${otherVenues?.length || 0} "Other" venues to categorize`);
  
  let categorized = 0;
  
  for (const venue of otherVenues || []) {
    const searchText = `${venue.name} ${venue.address}`.toLowerCase();
    let newCategory = 'Other';
    
    // Find matching category
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (keywords.some(keyword => searchText.includes(keyword))) {
        newCategory = category;
        break;
      }
    }
    
    if (newCategory !== 'Other') {
      const { error } = await supabase
        .from('venues')
        .update({ category: newCategory })
        .eq('id', venue.id);
        
      if (!error) {
        categorized++;
        if (categorized % 50 === 0) {
          console.log(`✅ Categorized ${categorized} venues...`);
        }
      }
    }
  }
  
  console.log(`✅ Categorized ${categorized} venues from "Other" to proper categories`);
}

async function fixNeighborhoods() {
  console.log('🏘️ Starting neighborhood assignment...');
  
  // Get venues missing neighborhoods in SF
  const { data: venues } = await supabase
    .from('venues')
    .select('id, name, address')
    .is('neighborhood_id', null)
    .ilike('address', '%San Francisco%');
    
  console.log(`📊 Found ${venues?.length || 0} SF venues missing neighborhoods`);
  
  // Get SF neighborhoods
  const { data: neighborhoods } = await supabase
    .from('neighborhoods')
    .select('id, name');
    
  const neighborhoodMap = new Map(neighborhoods?.map(n => [n.name, n.id]) || []);
  
  let assigned = 0;
  
  for (const venue of venues || []) {
    const addr = venue.address.toLowerCase();
    let assignedNeighborhood = null;
    
    // Find matching neighborhood
    for (const [neighborhood, keywords] of Object.entries(SF_NEIGHBORHOOD_MAPPING)) {
      if (keywords.some(keyword => addr.includes(keyword))) {
        assignedNeighborhood = neighborhood;
        break;
      }
    }
    
    // Default to San Francisco if in SF but no specific match
    if (!assignedNeighborhood && addr.includes('san francisco')) {
      assignedNeighborhood = 'San Francisco';
    }
    
    if (assignedNeighborhood && neighborhoodMap.has(assignedNeighborhood)) {
      const { error } = await supabase
        .from('venues')
        .update({ neighborhood_id: neighborhoodMap.get(assignedNeighborhood) })
        .eq('id', venue.id);
        
      if (!error) {
        assigned++;
        if (assigned % 50 === 0) {
          console.log(`🏘️ Assigned ${assigned} neighborhoods...`);
        }
      }
    }
  }
  
  console.log(`✅ Assigned neighborhoods to ${assigned} venues`);
}

async function removeNonSFVenues() {
  console.log('🧹 Removing non-SF venues...');
  
  // Remove venues clearly outside SF
  const { count: deletedCount } = await supabase
    .from('venues')
    .delete()
    .not('address', 'ilike', '%San Francisco%')
    .neq('address', '');
    
  console.log(`🗑️ Removed ${deletedCount} non-SF venues`);
}

async function runCleanup() {
  console.log('🚀 Starting comprehensive venue cleanup...');
  
  await removeNonSFVenues();
  await fixCategorization();
  await fixNeighborhoods();
  
  // Final stats
  const { count: totalVenues } = await supabase
    .from('venues')
    .select('*', { count: 'exact', head: true });
    
  const { count: otherCount } = await supabase
    .from('venues')
    .select('*', { count: 'exact', head: true })
    .eq('category', 'Other');
    
  const { count: nullNeighborhoods } = await supabase
    .from('venues')
    .select('*', { count: 'exact', head: true })
    .is('neighborhood_id', null);
    
  console.log('\n📊 Final Results:');
  console.log(`🎯 Total venues: ${totalVenues}`);
  console.log(`❓ "Other" category: ${otherCount}`);
  console.log(`🏘️ Missing neighborhoods: ${nullNeighborhoods}`);
  
  if (otherCount === 0) {
    console.log('🎉 SUCCESS! No more "Other" venues!');
  }
}

runCleanup().catch(console.error);