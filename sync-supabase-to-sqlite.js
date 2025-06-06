require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const Database = require('better-sqlite3');

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Initialize SQLite
const db = new Database('mylocal.db');

async function syncVenues() {
  console.log('🔄 Syncing venues from Supabase to SQLite...\n');
  
  try {
    // Get all venues from Supabase
    const { data: venues, error } = await supabase
      .from('venues')
      .select('*, neighborhoods(name)')
      .eq('city_id', 1); // San Francisco
    
    if (error) throw error;
    
    console.log(`📊 Found ${venues.length} venues in Supabase`);
    
    // Prepare SQLite insert statement
    const insertStmt = db.prepare(`
      INSERT OR REPLACE INTO venues (
        name, slug, address, neighborhood, city, state,
        category, description, phone, website,
        rating, review_count, price_range,
        latitude, longitude, source,
        verified, active, created_at, updated_at
      ) VALUES (
        @name, @slug, @address, @neighborhood, @city, @state,
        @category, @description, @phone, @website,
        @rating, @review_count, @price_range,
        @latitude, @longitude, @source,
        @verified, @active, datetime('now'), datetime('now')
      )
    `);
    
    // Insert venues into SQLite
    let inserted = 0;
    const insertMany = db.transaction((venues) => {
      for (const venue of venues) {
        try {
          insertStmt.run({
            name: venue.name,
            slug: venue.slug,
            address: venue.address,
            neighborhood: venue.neighborhoods?.name || 'SoMa',
            city: 'San Francisco',
            state: 'CA',
            category: venue.category || 'Restaurants',
            description: venue.description || '',
            phone: venue.phone || null,
            website: venue.website || null,
            rating: venue.aggregate_rating || null,
            review_count: venue.total_reviews || 0,
            price_range: venue.price_range || null,
            latitude: venue.latitude || null,
            longitude: venue.longitude || null,
            source: venue.source || 'yelp',
            verified: venue.verified ? 1 : 0,
            active: venue.active ? 1 : 0
          });
          inserted++;
        } catch (err) {
          console.error(`❌ Error inserting ${venue.name}:`, err.message);
        }
      }
    });
    
    insertMany(venues);
    
    // Get final count
    const result = db.prepare('SELECT COUNT(*) as count FROM venues WHERE city = ?').get('San Francisco');
    
    console.log('\n✅ SYNC COMPLETE!');
    console.log(`📊 Inserted: ${inserted} venues`);
    console.log(`📊 Total venues in SQLite: ${result.count}`);
    
  } catch (error) {
    console.error('❌ Sync error:', error);
  } finally {
    db.close();
  }
}

// Check if venues table exists
const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='venues'").get();

if (!tableExists) {
  console.log('📝 Creating venues table...');
  db.exec(`
    CREATE TABLE venues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL,
      address TEXT,
      neighborhood TEXT,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      category TEXT,
      subcategory TEXT,
      description TEXT,
      phone TEXT,
      website TEXT,
      hours TEXT,
      rating REAL,
      review_count INTEGER DEFAULT 0,
      price_range INTEGER,
      latitude REAL,
      longitude REAL,
      source TEXT,
      verified INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(slug, city, state)
    );
    
    CREATE INDEX idx_venues_city ON venues(city);
    CREATE INDEX idx_venues_neighborhood ON venues(neighborhood);
    CREATE INDEX idx_venues_category ON venues(category);
  `);
}

// Run the sync
syncVenues();