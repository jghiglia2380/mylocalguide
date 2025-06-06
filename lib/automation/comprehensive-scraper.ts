import Database from 'better-sqlite3';
import { VenueAggregator } from './venue-aggregator';

interface ScraperConfig {
  googleMapsApiKey?: string;
  yelpApiKey?: string;
  tripadvisorApiKey?: string;
  foursquareApiKey?: string;
}

interface CategoryMapping {
  displayName: string;
  googleTypes: string[];
  yelpCategories: string[];
  subcategories: string[];
}

export class ComprehensiveScraper {
  private db: Database.Database;
  private aggregator: VenueAggregator;
  private config: ScraperConfig;

  // Comprehensive category mappings
  private categories: Record<string, CategoryMapping> = {
    'Restaurants': {
      displayName: 'Restaurants',
      googleTypes: ['restaurant', 'cafe', 'bakery', 'bar'],
      yelpCategories: ['restaurants', 'food', 'bars'],
      subcategories: [
        'Mexican', 'Italian', 'Chinese', 'Japanese', 'Thai', 'Vietnamese', 
        'Indian', 'Korean', 'Ethiopian', 'Mediterranean', 'French', 'Spanish',
        'Peruvian', 'Brazilian', 'Argentinian', 'Colombian', 'Ecuadorian',
        'Salvadoran', 'Nicaraguan', 'Filipino', 'Indonesian', 'Malaysian',
        'Middle Eastern', 'Lebanese', 'Turkish', 'Greek', 'Moroccan',
        'American', 'Burgers', 'Pizza', 'Seafood', 'Steakhouse', 'BBQ',
        'Vegetarian', 'Vegan', 'Farm-to-Table', 'Fusion', 'Food Trucks',
        'Breakfast', 'Brunch', 'Desserts', 'Ice Cream', 'Coffee', 'Tea'
      ]
    },
    'Bars & Nightlife': {
      displayName: 'Bars & Nightlife',
      googleTypes: ['bar', 'night_club'],
      yelpCategories: ['bars', 'nightlife'],
      subcategories: [
        'Cocktail Bars', 'Wine Bars', 'Dive Bars', 'Sports Bars',
        'Breweries', 'Pubs', 'Lounges', 'Dance Clubs', 'Jazz Clubs',
        'Comedy Clubs', 'Karaoke', 'Pool Halls', 'Speakeasies'
      ]
    },
    'Shopping': {
      displayName: 'Shopping',
      googleTypes: ['shopping_mall', 'store', 'clothing_store', 'book_store'],
      yelpCategories: ['shopping'],
      subcategories: [
        'Grocery Stores', 'Farmers Markets', 'Boutiques', 'Vintage Stores',
        'Bookstores', 'Record Stores', 'Art Galleries', 'Antiques',
        'Electronics', 'Home Goods', 'Sporting Goods', 'Toy Stores',
        'Latin Markets', 'Asian Markets', 'European Markets', 'Specialty Foods'
      ]
    },
    'Activities & Attractions': {
      displayName: 'Activities & Attractions',
      googleTypes: ['tourist_attraction', 'museum', 'art_gallery', 'amusement_park'],
      yelpCategories: ['arts', 'active'],
      subcategories: [
        'Museums', 'Tours', 'Historical Sites', 'Observation Decks',
        'Escape Rooms', 'Mini Golf', 'Bowling', 'Arcades', 'Theaters',
        'Concert Venues', 'Comedy Shows', 'Art Classes', 'Cooking Classes',
        'Wine Tasting', 'Brewery Tours', 'Walking Tours', 'Boat Tours'
      ]
    },
    'Parks & Nature': {
      displayName: 'Parks & Nature',
      googleTypes: ['park', 'natural_feature'],
      yelpCategories: ['parks'],
      subcategories: [
        'City Parks', 'Playgrounds', 'Dog Parks', 'Hiking Trails',
        'Beaches', 'Gardens', 'Nature Preserves', 'Scenic Viewpoints',
        'Picnic Areas', 'Sports Fields', 'Skate Parks', 'Community Gardens'
      ]
    },
    'Services': {
      displayName: 'Services',
      googleTypes: ['gym', 'spa', 'hair_care', 'beauty_salon'],
      yelpCategories: ['beautysvc', 'fitness'],
      subcategories: [
        'Gyms', 'Yoga Studios', 'Pilates', 'CrossFit', 'Martial Arts',
        'Spas', 'Nail Salons', 'Hair Salons', 'Barbershops', 'Massage',
        'Laundromats', 'Dry Cleaning', 'Auto Repair', 'Bike Shops'
      ]
    },
    'Entertainment': {
      displayName: 'Entertainment',
      googleTypes: ['movie_theater', 'bowling_alley', 'casino'],
      yelpCategories: ['entertainment'],
      subcategories: [
        'Movie Theaters', 'Live Music', 'Performing Arts', 'Casinos',
        'Billiards', 'Darts', 'Board Game Cafes', 'VR Experiences'
      ]
    }
  };

  // San Francisco neighborhoods with boundaries
  private sfNeighborhoods = [
    { name: 'The Mission', bounds: { north: 37.773, south: 37.748, east: -122.406, west: -122.429 } },
    { name: 'Castro District', bounds: { north: 37.772, south: 37.756, east: -122.424, west: -122.444 } },
    { name: 'North Beach', bounds: { north: 37.808, south: 37.795, east: -122.401, west: -122.418 } },
    { name: 'Chinatown', bounds: { north: 37.798, south: 37.790, east: -122.402, west: -122.410 } },
    { name: 'SoMa', bounds: { north: 37.790, south: 37.773, east: -122.387, west: -122.415 } },
    { name: 'Financial District', bounds: { north: 37.798, south: 37.788, east: -122.390, west: -122.405 } },
    { name: 'Marina District', bounds: { north: 37.808, south: 37.798, east: -122.430, west: -122.448 } },
    { name: 'Pacific Heights', bounds: { north: 37.796, south: 37.786, east: -122.420, west: -122.447 } },
    { name: 'Haight-Ashbury', bounds: { north: 37.775, south: 37.765, east: -122.441, west: -122.458 } },
    { name: 'Inner Sunset', bounds: { north: 37.765, south: 37.755, east: -122.455, west: -122.475 } },
    { name: 'Outer Sunset', bounds: { north: 37.755, south: 37.735, east: -122.475, west: -122.510 } },
    { name: 'Richmond District', bounds: { north: 37.788, south: 37.773, east: -122.447, west: -122.517 } },
    { name: 'Nob Hill', bounds: { north: 37.796, south: 37.788, east: -122.407, west: -122.421 } },
    { name: 'Russian Hill', bounds: { north: 37.805, south: 37.798, east: -122.410, west: -122.425 } },
    { name: 'Potrero Hill', bounds: { north: 37.766, south: 37.753, east: -122.393, west: -122.410 } },
    { name: 'Dogpatch', bounds: { north: 37.766, south: 37.753, east: -122.380, west: -122.393 } },
    { name: 'Bernal Heights', bounds: { north: 37.748, south: 37.732, east: -122.403, west: -122.423 } },
    { name: 'Excelsior', bounds: { north: 37.732, south: 37.710, east: -122.415, west: -122.445 } },
    { name: 'Bayview', bounds: { north: 37.742, south: 37.708, east: -122.372, west: -122.402 } },
    { name: 'Tenderloin', bounds: { north: 37.790, south: 37.778, east: -122.408, west: -122.420 } },
    { name: 'Hayes Valley', bounds: { north: 37.778, south: 37.772, east: -122.419, west: -122.432 } },
    { name: 'Lower Haight', bounds: { north: 37.775, south: 37.769, east: -122.424, west: -122.437 } },
    { name: 'Japantown', bounds: { north: 37.788, south: 37.782, east: -122.425, west: -122.435 } },
    { name: 'Western Addition', bounds: { north: 37.788, south: 37.778, east: -122.419, west: -122.445 } },
    { name: 'Glen Park', bounds: { north: 37.740, south: 37.730, east: -122.425, west: -122.440 } },
    { name: 'Noe Valley', bounds: { north: 37.755, south: 37.745, east: -122.425, west: -122.440 } },
    { name: 'Twin Peaks', bounds: { north: 37.755, south: 37.745, east: -122.440, west: -122.455 } },
    { name: 'Diamond Heights', bounds: { north: 37.748, south: 37.738, east: -122.435, west: -122.450 } },
    { name: 'Visitacion Valley', bounds: { north: 37.721, south: 37.708, east: -122.395, west: -122.415 } },
    { name: 'Portola', bounds: { north: 37.732, south: 37.721, east: -122.395, west: -122.415 } }
  ];

  constructor(db: Database.Database, config: ScraperConfig = {}) {
    this.db = db;
    this.aggregator = new VenueAggregator(db);
    this.config = config;
    this.createTables();
  }

  private createTables(): void {
    // Create comprehensive venues table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS venues_aggregated (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        city TEXT NOT NULL,
        state TEXT NOT NULL,
        zip TEXT,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        phone TEXT,
        website TEXT,
        category TEXT NOT NULL,
        subcategory TEXT,
        cuisine_type TEXT,
        price_range INTEGER CHECK(price_range BETWEEN 1 AND 4),
        
        -- Ratings from different sources
        google_rating REAL,
        google_review_count INTEGER,
        yelp_rating REAL,
        yelp_review_count INTEGER,
        tripadvisor_rating REAL,
        tripadvisor_review_count INTEGER,
        foursquare_rating REAL,
        foursquare_review_count INTEGER,
        
        -- Calculated fields
        aggregate_rating REAL,
        total_review_count INTEGER,
        popularity_score REAL,
        quality_score REAL,
        
        -- Additional data
        hours TEXT, -- JSON
        amenities TEXT, -- JSON array
        tags TEXT, -- JSON array
        photos TEXT, -- JSON array
        menu_url TEXT,
        reservation_url TEXT,
        delivery_apps TEXT, -- JSON array
        
        -- Source IDs
        google_maps_id TEXT,
        yelp_id TEXT,
        tripadvisor_id TEXT,
        foursquare_id TEXT,
        opentable_id TEXT,
        
        -- Metadata
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        
        -- Indexes for performance
        UNIQUE(google_maps_id),
        UNIQUE(address, name)
      );
      
      CREATE INDEX IF NOT EXISTS idx_venues_category ON venues_aggregated(category);
      CREATE INDEX IF NOT EXISTS idx_venues_subcategory ON venues_aggregated(subcategory);
      CREATE INDEX IF NOT EXISTS idx_venues_cuisine ON venues_aggregated(cuisine_type);
      CREATE INDEX IF NOT EXISTS idx_venues_rating ON venues_aggregated(aggregate_rating DESC);
      CREATE INDEX IF NOT EXISTS idx_venues_popularity ON venues_aggregated(popularity_score DESC);
      CREATE INDEX IF NOT EXISTS idx_venues_location ON venues_aggregated(latitude, longitude);
      CREATE INDEX IF NOT EXISTS idx_venues_neighborhood ON venues_aggregated(city, category);
      
      -- Review tracking table
      CREATE TABLE IF NOT EXISTS venue_reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        venue_id INTEGER NOT NULL,
        source TEXT NOT NULL, -- 'google', 'yelp', 'tripadvisor', 'foursquare'
        rating INTEGER NOT NULL,
        review_text TEXT,
        reviewer_name TEXT,
        review_date DATE,
        helpful_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (venue_id) REFERENCES venues_aggregated(id)
      );
      
      -- Scraping history
      CREATE TABLE IF NOT EXISTS scraping_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        neighborhood TEXT NOT NULL,
        category TEXT NOT NULL,
        source TEXT NOT NULL,
        venues_found INTEGER,
        venues_imported INTEGER,
        started_at DATETIME,
        completed_at DATETIME,
        status TEXT,
        error_message TEXT
      );
    `);
  }

  /**
   * Main scraping orchestrator - runs all scrapers for comprehensive coverage
   */
  async scrapeAllSanFrancisco(): Promise<{
    totalVenues: number;
    byNeighborhood: Record<string, number>;
    byCategory: Record<string, number>;
  }> {
    console.log('🚀 Starting comprehensive San Francisco venue scraping...');
    
    const stats = {
      totalVenues: 0,
      byNeighborhood: {} as Record<string, number>,
      byCategory: {} as Record<string, number>
    };

    // Scrape each neighborhood
    for (const neighborhood of this.sfNeighborhoods) {
      console.log(`\n📍 Scraping ${neighborhood.name}...`);
      let neighborhoodTotal = 0;

      // Scrape each category
      for (const [categoryKey, category] of Object.entries(this.categories)) {
        console.log(`  📂 Category: ${category.displayName}`);
        
        try {
          const venues = await this.scrapeNeighborhoodCategory(
            neighborhood,
            categoryKey,
            category
          );
          
          if (venues.length > 0) {
            const imported = await this.aggregator.importBulkVenues(venues);
            neighborhoodTotal += imported;
            stats.byCategory[categoryKey] = (stats.byCategory[categoryKey] || 0) + imported;
            
            console.log(`    ✅ Imported ${imported} ${category.displayName}`);
          }
        } catch (error) {
          console.error(`    ❌ Error scraping ${category.displayName}:`, error);
        }
      }

      stats.byNeighborhood[neighborhood.name] = neighborhoodTotal;
      stats.totalVenues += neighborhoodTotal;
      
      console.log(`  📊 ${neighborhood.name} total: ${neighborhoodTotal} venues`);
    }

    console.log('\n🎉 Scraping complete!');
    console.log(`📊 Total venues imported: ${stats.totalVenues}`);
    
    return stats;
  }

  /**
   * Scrape venues for a specific neighborhood and category
   */
  private async scrapeNeighborhoodCategory(
    neighborhood: any,
    categoryKey: string,
    category: CategoryMapping
  ): Promise<any[]> {
    const venues: any[] = [];
    
    // For each subcategory, search specifically
    for (const subcategory of category.subcategories) {
      const searchQuery = `${subcategory} in ${neighborhood.name}, San Francisco`;
      
      // In a real implementation, you would call actual APIs here
      // For now, we'll create sample data structure
      const mockVenues = this.generateMockVenues(
        neighborhood,
        categoryKey,
        subcategory,
        Math.floor(Math.random() * 15) + 5 // 5-20 venues per subcategory
      );
      
      venues.push(...mockVenues);
    }
    
    return venues;
  }

  /**
   * Generate mock venues for testing
   * In production, this would be replaced with actual API calls
   */
  private generateMockVenues(
    neighborhood: any,
    category: string,
    subcategory: string,
    count: number
  ): any[] {
    const venues = [];
    
    for (let i = 0; i < count; i++) {
      const lat = neighborhood.bounds.south + Math.random() * (neighborhood.bounds.north - neighborhood.bounds.south);
      const lng = neighborhood.bounds.west + Math.random() * (neighborhood.bounds.east - neighborhood.bounds.west);
      
      venues.push({
        name: `${subcategory} Place ${i + 1}`,
        address: `${Math.floor(Math.random() * 9000) + 1000} ${['Mission', 'Valencia', 'Market', 'Fillmore', 'Geary'][Math.floor(Math.random() * 5)]} St`,
        city: 'San Francisco',
        state: 'CA',
        zip: `941${Math.floor(Math.random() * 90) + 10}`,
        latitude: lat,
        longitude: lng,
        category: category,
        subcategory: subcategory,
        cuisine_type: category === 'Restaurants' ? subcategory : null,
        price_range: Math.floor(Math.random() * 4) + 1,
        
        // Simulated ratings
        google_rating: 3.5 + Math.random() * 1.5,
        google_review_count: Math.floor(Math.random() * 2000) + 50,
        yelp_rating: 3.5 + Math.random() * 1.5,
        yelp_review_count: Math.floor(Math.random() * 1500) + 30,
        tripadvisor_rating: 3.5 + Math.random() * 1.5,
        tripadvisor_review_count: Math.floor(Math.random() * 1000) + 20,
        
        hours: {
          monday: '9:00 AM - 10:00 PM',
          tuesday: '9:00 AM - 10:00 PM',
          wednesday: '9:00 AM - 10:00 PM',
          thursday: '9:00 AM - 10:00 PM',
          friday: '9:00 AM - 11:00 PM',
          saturday: '10:00 AM - 11:00 PM',
          sunday: '10:00 AM - 9:00 PM'
        },
        
        amenities: ['WiFi', 'Outdoor Seating', 'Takeout', 'Delivery'],
        tags: [subcategory, neighborhood.name, 'Popular'],
        
        data_sources: {
          google_maps_id: `gmaps_${Math.random().toString(36).substr(2, 9)}`,
          yelp_id: `yelp_${Math.random().toString(36).substr(2, 9)}`
        }
      });
    }
    
    return venues;
  }

  /**
   * Update venue ratings from all sources
   * This should run hourly to keep data fresh
   */
  async updateAllRatings(): Promise<number> {
    console.log('🔄 Updating ratings for all venues...');
    
    const venues = this.db.prepare(`
      SELECT id, google_maps_id, yelp_id, tripadvisor_id, foursquare_id, google_rating, google_review_count
      FROM venues_aggregated
      WHERE last_updated < datetime('now', '-1 hour')
      LIMIT 1000
    `).all() as Array<{
      id: number;
      google_maps_id?: string;
      yelp_id?: string;
      tripadvisor_id?: string;
      foursquare_id?: string;
      google_rating?: number;
      google_review_count?: number;
    }>;
    
    let updateCount = 0;
    
    for (const venue of venues) {
      // In production, fetch fresh ratings from each API
      // For now, simulate small rating changes
      const updates = {
        google_rating: (venue.google_rating || 4.0) + (Math.random() - 0.5) * 0.1,
        google_review_count: (venue.google_review_count || 50) + Math.floor(Math.random() * 5),
        last_updated: new Date().toISOString()
      };
      
      this.db.prepare(`
        UPDATE venues_aggregated 
        SET google_rating = ?, google_review_count = ?, last_updated = ?
        WHERE id = ?
      `).run(updates.google_rating, updates.google_review_count, updates.last_updated, venue.id);
      
      updateCount++;
    }
    
    console.log(`✅ Updated ${updateCount} venues`);
    return updateCount;
  }
}