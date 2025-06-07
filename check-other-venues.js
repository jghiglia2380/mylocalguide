require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkOtherVenues() {
  const { data: venues } = await supabase
    .from('venues')
    .select('id, name, address, category')
    .eq('category', 'Other')
    .limit(15);
    
  console.log('📊 Sample "Other" venues needing categorization:');
  venues?.forEach((v, i) => {
    console.log(`${i+1}. ${v.name} - ${v.address}`);
  });
  
  const { count } = await supabase
    .from('venues')
    .select('*', { count: 'exact', head: true })
    .eq('category', 'Other');
    
  console.log(`\n🎯 Total "Other" venues: ${count}`);
  
  // Also check null neighborhood_id venues
  const { count: nullNeighborhoods } = await supabase
    .from('venues')
    .select('*', { count: 'exact', head: true })
    .is('neighborhood_id', null);
    
  console.log(`🏘️ Venues missing neighborhoods: ${nullNeighborhoods}`);
}

checkOtherVenues();