// Check Supabase venue count
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkVenues() {
  console.log('\n🔍 Checking Supabase venues...\n');
  
  try {
    // Get total count
    const { count: totalCount } = await supabase
      .from('venues')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 Total venues in database: ${totalCount || 0}`);
    
    // Get count by category
    const { data: categories } = await supabase
      .from('venues')
      .select('category')
      .not('category', 'is', null);
    
    if (categories) {
      const categoryCounts = {};
      categories.forEach(v => {
        categoryCounts[v.category] = (categoryCounts[v.category] || 0) + 1;
      });
      
      console.log('\n📂 Venues by category:');
      Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1])
        .forEach(([cat, count]) => {
          console.log(`  ${cat}: ${count}`);
        });
    }
    
    // Get sample venues
    const { data: sampleVenues } = await supabase
      .from('venues')
      .select('id, name, category, neighborhood, city_id')
      .limit(5);
    
    console.log('\n🏪 Sample venues:');
    sampleVenues?.forEach(v => {
      console.log(`  - ${v.name} (${v.category}) in ${v.neighborhood}`);
    });
    
    // Check for any limits or views
    const { data: tables } = await supabase
      .rpc('get_table_info', { table_name: 'venues' })
      .catch(() => ({ data: null }));
    
    if (!tables) {
      console.log('\n⚠️  Could not fetch table info (this is normal)');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkVenues();