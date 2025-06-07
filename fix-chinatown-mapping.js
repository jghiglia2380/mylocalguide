require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Precise Chinatown boundaries for SF
const CHINATOWN_MAPPING = {
  // Core Chinatown streets with specific address ranges
  'grant ave': { min: 200, max: 1500, keywords: ['grant ave', 'grant avenue'] },
  'stockton st': { min: 700, max: 1700, keywords: ['stockton st', 'stockton street'] },
  'clay st': { min: 600, max: 900, keywords: ['clay st', 'clay street'] },
  'sacramento st': { min: 600, max: 900, keywords: ['sacramento st', 'sacramento street'] },
  'california st': { min: 600, max: 1000, keywords: ['california st', 'california street'] },
  'powell st': { min: 0, max: 400, keywords: ['powell st', 'powell street'] },
  'kearny st': { min: 400, max: 800, keywords: ['kearny st', 'kearny street'] },
  'montgomery st': { min: 0, max: 400, keywords: ['montgomery st', 'montgomery street'] },
  'columbus ave': { min: 400, max: 900, keywords: ['columbus ave', 'columbus avenue'] },
  'broadway': { min: 400, max: 900, keywords: ['broadway'] },
  'washington st': { min: 600, max: 900, keywords: ['washington st', 'washington street'] },
  'jackson st': { min: 600, max: 900, keywords: ['jackson st', 'jackson street'] },
  'pacific ave': { min: 600, max: 900, keywords: ['pacific ave', 'pacific avenue'] }
};

// Extract street number from address
function extractStreetNumber(address) {
  const match = address.match(/^(\d+)/);
  return match ? parseInt(match[1]) : null;
}

// Check if address is in Chinatown boundaries
function isInChinatown(address) {
  const addr = address.toLowerCase();
  
  for (const [street, config] of Object.entries(CHINATOWN_MAPPING)) {
    for (const keyword of config.keywords) {
      if (addr.includes(keyword)) {
        const streetNumber = extractStreetNumber(address);
        if (streetNumber && streetNumber >= config.min && streetNumber <= config.max) {
          return true;
        }
      }
    }
  }
  
  // Also catch obvious Chinatown keywords
  if (addr.includes('chinatown') || 
      addr.includes('portsmouth square') ||
      addr.includes('dragon gate')) {
    return true;
  }
  
  return false;
}

async function fixChinatownMapping() {
  console.log('🏮 Fixing Chinatown neighborhood mapping...');
  
  // Get Chinatown neighborhood ID
  const { data: chinatownNeighborhood } = await supabase
    .from('neighborhoods')
    .select('id')
    .eq('name', 'Chinatown')
    .single();
    
  if (!chinatownNeighborhood) {
    console.log('❌ Chinatown neighborhood not found');
    return;
  }
  
  // Get all venues that might be in Chinatown but aren't assigned
  const { data: venues } = await supabase
    .from('venues')
    .select('id, name, address, neighborhood_id')
    .or('address.ilike.%grant ave%,address.ilike.%stockton st%,address.ilike.%clay st%,address.ilike.%sacramento st%,address.ilike.%california st%,address.ilike.%kearny st%,address.ilike.%powell st%,address.ilike.%columbus ave%,address.ilike.%broadway%,address.ilike.%washington st%,address.ilike.%jackson st%,address.ilike.%montgomery st%');
    
  console.log(`📊 Checking ${venues?.length || 0} potential Chinatown venues...`);
  
  let updated = 0;
  let skipped = 0;
  
  for (const venue of venues || []) {
    if (isInChinatown(venue.address)) {
      // This venue should be in Chinatown
      if (venue.neighborhood_id !== chinatownNeighborhood.id) {
        const { error } = await supabase
          .from('venues')
          .update({ neighborhood_id: chinatownNeighborhood.id })
          .eq('id', venue.id);
          
        if (!error) {
          updated++;
          console.log(`✅ Moved to Chinatown: ${venue.name}`);
        }
      }
    } else {
      skipped++;
      if (skipped <= 5) {
        console.log(`⏭️ Skipped (outside boundaries): ${venue.name} - ${venue.address}`);
      }
    }
  }
  
  // Final count
  const { count: finalCount } = await supabase
    .from('venues')
    .select('*', { count: 'exact', head: true })
    .eq('neighborhood_id', chinatownNeighborhood.id);
    
  console.log('\n📊 Results:');
  console.log(`✅ Updated: ${updated} venues`);
  console.log(`⏭️ Skipped: ${skipped} venues (outside boundaries)`);
  console.log(`🏮 Total Chinatown venues: ${finalCount}`);
}

fixChinatownMapping().catch(console.error);