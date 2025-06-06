import { getDatabase } from '@lib/database';

export interface MigrationResult {
  success: boolean;
  version: number;
  changes: string[];
  errors?: string[];
}

export class DatabaseMigrator {
  private db: any;

  constructor() {
    this.db = getDatabase();
  }

  async runMigrations(): Promise<MigrationResult> {
    console.log('🔄 Starting database migrations...');
    const changes: string[] = [];
    const errors: string[] = [];

    try {
      // Create migrations table if it doesn't exist
      this.createMigrationsTable();
      
      const currentVersion = this.getCurrentVersion();
      console.log(`📊 Current database version: ${currentVersion}`);

      // Run migrations in order
      const migrations = [
        { version: 1, name: 'add_automation_fields', migration: this.migration001_addAutomationFields },
        { version: 2, name: 'add_seo_tables', migration: this.migration002_addSeoTables },
        { version: 3, name: 'add_collections_table', migration: this.migration003_addCollectionsTable },
        { version: 4, name: 'add_analytics_tracking', migration: this.migration004_addAnalyticsTracking },
        { version: 5, name: 'add_search_optimization', migration: this.migration005_addSearchOptimization },
        { version: 6, name: 'add_multi_city_support', migration: this.migration006_addMultiCitySupport },
        { version: 7, name: 'add_hotels_infrastructure', migration: this.migration007_addHotelsInfrastructure },
        { version: 8, name: 'enhance_neighborhoods_schema', migration: this.migration008_enhanceNeighborhoodsSchema },
        { version: 9, name: 'add_neighborhood_tiers_and_regions', migration: this.migration009_addNeighborhoodTiersAndRegions },
        { version: 10, name: 'add_fun_facts_system', migration: this.migration010_addFunFactsSystem }
      ];

      for (const { version, name, migration } of migrations) {
        if (version > currentVersion) {
          console.log(`⬆️  Running migration ${version}: ${name}`);
          try {
            await migration.call(this);
            this.updateVersion(version);
            changes.push(`Migration ${version}: ${name}`);
          } catch (error) {
            const errorMsg = `Failed migration ${version}: ${error}`;
            console.error(errorMsg);
            errors.push(errorMsg);
            break; // Stop on first error
          }
        }
      }

      const finalVersion = this.getCurrentVersion();
      console.log(`✅ Migrations completed. Database version: ${finalVersion}`);

      return {
        success: errors.length === 0,
        version: finalVersion,
        changes,
        errors: errors.length > 0 ? errors : undefined
      };

    } catch (error) {
      console.error('❌ Migration process failed:', error);
      return {
        success: false,
        version: 0,
        changes,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  private createMigrationsTable(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        version INTEGER UNIQUE NOT NULL,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  private getCurrentVersion(): number {
    try {
      const result = this.db.prepare('SELECT MAX(version) as version FROM migrations').get();
      return result?.version || 0;
    } catch {
      return 0;
    }
  }

  private updateVersion(version: number): void {
    this.db.prepare('INSERT INTO migrations (version) VALUES (?)').run(version);
  }

  // Migration 001: Add automation fields to venues table
  private migration001_addAutomationFields(): void {
    const columns = [
      'google_place_id TEXT',
      'yelp_id TEXT',
      'last_updated DATETIME',
      'data_source TEXT',
      'venue_score INTEGER',
      'photos TEXT', // JSON array of photo URLs
      'hours TEXT',   // JSON object with opening hours
      'price_level INTEGER'
    ];

    for (const column of columns) {
      try {
        this.db.exec(`ALTER TABLE venues ADD COLUMN ${column}`);
      } catch (error) {
        // Column might already exist, continue
        if (error instanceof Error && !error.message.includes('duplicate column name')) {
          throw error;
        }
      }
    }

    // Add indexes for performance
    try {
      this.db.exec('CREATE INDEX IF NOT EXISTS idx_venues_google_place_id ON venues(google_place_id)');
      this.db.exec('CREATE INDEX IF NOT EXISTS idx_venues_yelp_id ON venues(yelp_id)');
      this.db.exec('CREATE INDEX IF NOT EXISTS idx_venues_score ON venues(venue_score DESC)');
      this.db.exec('CREATE INDEX IF NOT EXISTS idx_venues_updated ON venues(last_updated)');
    } catch (error) {
      console.warn('Index creation warning:', error instanceof Error ? error.message : error);
    }
  }

  // Migration 002: Add SEO and content tables
  private migration002_addSeoTables(): void {
    // Neighborhood SEO content table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS neighborhood_content (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        neighborhood TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        meta_description TEXT NOT NULL,
        intro_text TEXT,
        seo_content TEXT,
        highlights TEXT, -- JSON array
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Category SEO content table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS category_content (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        meta_description TEXT NOT NULL,
        intro_text TEXT,
        seo_content TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // SEO pages for long-tail keywords
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS seo_pages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        meta_description TEXT NOT NULL,
        h1_title TEXT NOT NULL,
        content TEXT NOT NULL,
        keywords TEXT, -- JSON array
        target_keyword TEXT,
        page_type TEXT DEFAULT 'landing', -- landing, collection, guide
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add indexes
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_seo_pages_slug ON seo_pages(slug)');
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_seo_pages_status ON seo_pages(status)');
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_seo_pages_type ON seo_pages(page_type)');
  }

  // Migration 003: Add featured collections table
  private migration003_addCollectionsTable(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS featured_collections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        description TEXT NOT NULL,
        venue_ids TEXT NOT NULL, -- JSON array of venue IDs
        seo_keywords TEXT, -- JSON array
        sort_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    this.db.exec('CREATE INDEX IF NOT EXISTS idx_collections_slug ON featured_collections(slug)');
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_collections_active ON featured_collections(is_active)');
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_collections_sort ON featured_collections(sort_order)');
  }

  // Migration 004: Add analytics and tracking
  private migration004_addAnalyticsTracking(): void {
    // Page views tracking
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS page_views (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        page_path TEXT NOT NULL,
        page_type TEXT, -- venue, category, neighborhood, collection
        entity_id TEXT, -- venue ID, category name, etc.
        user_agent TEXT,
        referrer TEXT,
        search_query TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Search queries tracking
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS search_queries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        query TEXT NOT NULL,
        results_count INTEGER DEFAULT 0,
        clicked_result TEXT,
        user_agent TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Popular searches view for content generation
    this.db.exec(`
      CREATE VIEW IF NOT EXISTS popular_searches AS
      SELECT 
        query,
        COUNT(*) as search_count,
        AVG(results_count) as avg_results,
        DATE(created_at) as search_date
      FROM search_queries 
      WHERE created_at >= datetime('now', '-30 days')
      GROUP BY query, DATE(created_at)
      ORDER BY search_count DESC
    `);

    // Indexes for analytics
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_page_views_path ON page_views(page_path)');
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_page_views_date ON page_views(created_at)');
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_search_queries_query ON search_queries(query)');
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_search_queries_date ON search_queries(created_at)');
  }

  // Migration 005: Add search optimization
  private migration005_addSearchOptimization(): void {
    // Search index table for full-text search
    this.db.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS venue_search USING fts5(
        venue_id,
        name,
        description,
        category,
        neighborhood,
        address,
        content='venues'
      )
    `);

    // Trigger to keep search index updated
    this.db.exec(`
      CREATE TRIGGER IF NOT EXISTS venue_search_insert AFTER INSERT ON venues BEGIN
        INSERT INTO venue_search(venue_id, name, description, category, neighborhood, address)
        VALUES (NEW.id, NEW.name, NEW.description, NEW.category, NEW.neighborhood, NEW.address);
      END
    `);

    this.db.exec(`
      CREATE TRIGGER IF NOT EXISTS venue_search_update AFTER UPDATE ON venues BEGIN
        UPDATE venue_search SET
          name = NEW.name,
          description = NEW.description,
          category = NEW.category,
          neighborhood = NEW.neighborhood,
          address = NEW.address
        WHERE venue_id = NEW.id;
      END
    `);

    this.db.exec(`
      CREATE TRIGGER IF NOT EXISTS venue_search_delete AFTER DELETE ON venues BEGIN
        DELETE FROM venue_search WHERE venue_id = OLD.id;
      END
    `);

    // Populate existing venues into search index
    const existingVenues = this.db.prepare(`
      SELECT id, name, description, category, neighborhood, address 
      FROM venues
    `).all();

    const insertSearch = this.db.prepare(`
      INSERT INTO venue_search(venue_id, name, description, category, neighborhood, address)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const venue of existingVenues) {
      try {
        insertSearch.run(
          venue.id,
          venue.name,
          venue.description || '',
          venue.category,
          venue.neighborhood,
          venue.address
        );
      } catch (error) {
        // Continue if venue already exists in search index
        continue;
      }
    }
  }

  // Utility methods for managing the enhanced database
  async updateVenueScore(venueId: number, score: number): Promise<void> {
    this.db.prepare('UPDATE venues SET venue_score = ?, last_updated = CURRENT_TIMESTAMP WHERE id = ?')
      .run(score, venueId);
  }

  async getTopVenues(limit = 50): Promise<any[]> {
    return this.db.prepare(`
      SELECT * FROM venues 
      WHERE venue_score > 0 
      ORDER BY venue_score DESC, rating DESC 
      LIMIT ?
    `).all(limit);
  }

  async searchVenues(query: string, limit = 20): Promise<any[]> {
    // Use FTS5 for full-text search
    return this.db.prepare(`
      SELECT v.*, vs.rank
      FROM venue_search vs
      JOIN venues v ON v.id = vs.venue_id
      WHERE venue_search MATCH ?
      ORDER BY vs.rank
      LIMIT ?
    `).all(query, limit);
  }

  async trackPageView(pagePath: string, pageType?: string, entityId?: string, userAgent?: string, referrer?: string): Promise<void> {
    this.db.prepare(`
      INSERT INTO page_views (page_path, page_type, entity_id, user_agent, referrer)
      VALUES (?, ?, ?, ?, ?)
    `).run(pagePath, pageType, entityId, userAgent, referrer);
  }

  async trackSearch(query: string, resultsCount: number, userAgent?: string): Promise<void> {
    this.db.prepare(`
      INSERT INTO search_queries (query, results_count, user_agent)
      VALUES (?, ?, ?)
    `).run(query, resultsCount, userAgent);
  }

  async getPopularSearches(days = 30, limit = 20): Promise<Array<{ query: string; count: number; avg_results: number }>> {
    return this.db.prepare(`
      SELECT query, COUNT(*) as count, AVG(results_count) as avg_results
      FROM search_queries 
      WHERE created_at >= datetime('now', '-${days} days')
      GROUP BY query
      ORDER BY count DESC
      LIMIT ?
    `).all(limit);
  }

  async getPageViewStats(days = 30): Promise<Array<{ page_path: string; views: number; page_type?: string }>> {
    return this.db.prepare(`
      SELECT page_path, COUNT(*) as views, page_type
      FROM page_views 
      WHERE created_at >= datetime('now', '-${days} days')
      GROUP BY page_path, page_type
      ORDER BY views DESC
      LIMIT 50
    `).all();
  }

  // Backup and maintenance
  async createBackup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `./backups/cicerone-sf-${timestamp}.db`;
    
    // Create backups directory if it doesn't exist
    const fs = require('fs');
    if (!fs.existsSync('./backups')) {
      fs.mkdirSync('./backups');
    }
    
    // Copy database file
    fs.copyFileSync('./cicerone-sf.db', backupPath);
    
    console.log(`✅ Database backup created: ${backupPath}`);
    return backupPath;
  }

  async optimizeDatabase(): Promise<void> {
    console.log('🔧 Optimizing database...');
    
    // Update SQLite statistics
    this.db.exec('ANALYZE');
    
    // Rebuild search index
    this.db.exec('INSERT INTO venue_search(venue_search) VALUES("rebuild")');
    
    // Vacuum to reclaim space
    this.db.exec('VACUUM');
    
    console.log('✅ Database optimization completed');
  }

  // Migration 006: Add multi-city support
  private migration006_addMultiCitySupport(): void {
    // Create states table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS states (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create cities table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS cities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        state_code TEXT NOT NULL,
        is_capital BOOLEAN DEFAULT FALSE,
        is_major_tourist_city BOOLEAN DEFAULT FALSE,
        population INTEGER,
        latitude REAL,
        longitude REAL,
        timezone TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (state_code) REFERENCES states(code)
      )
    `);

    // Add city_id to venues table
    try {
      this.db.exec(`ALTER TABLE venues ADD COLUMN city_id INTEGER REFERENCES cities(id)`);
    } catch (error) {
      if (error instanceof Error && !error.message.includes('duplicate column name')) {
        throw error;
      }
    }

    // Add city_id to neighborhoods table
    try {
      this.db.exec(`ALTER TABLE neighborhoods ADD COLUMN city_id INTEGER REFERENCES cities(id)`);
    } catch (error) {
      if (error instanceof Error && !error.message.includes('duplicate column name')) {
        throw error;
      }
    }

    // Create indexes for performance
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_cities_state_code ON cities(state_code)');
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_cities_slug ON cities(slug)');
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_venues_city_id ON venues(city_id)');
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_neighborhoods_city_id ON neighborhoods(city_id)');

    // Insert all 50 states
    const statesData = [
      ['AL', 'Alabama', 'alabama'],
      ['AK', 'Alaska', 'alaska'],
      ['AZ', 'Arizona', 'arizona'],
      ['AR', 'Arkansas', 'arkansas'],
      ['CA', 'California', 'california'],
      ['CO', 'Colorado', 'colorado'],
      ['CT', 'Connecticut', 'connecticut'],
      ['DE', 'Delaware', 'delaware'],
      ['FL', 'Florida', 'florida'],
      ['GA', 'Georgia', 'georgia'],
      ['HI', 'Hawaii', 'hawaii'],
      ['ID', 'Idaho', 'idaho'],
      ['IL', 'Illinois', 'illinois'],
      ['IN', 'Indiana', 'indiana'],
      ['IA', 'Iowa', 'iowa'],
      ['KS', 'Kansas', 'kansas'],
      ['KY', 'Kentucky', 'kentucky'],
      ['LA', 'Louisiana', 'louisiana'],
      ['ME', 'Maine', 'maine'],
      ['MD', 'Maryland', 'maryland'],
      ['MA', 'Massachusetts', 'massachusetts'],
      ['MI', 'Michigan', 'michigan'],
      ['MN', 'Minnesota', 'minnesota'],
      ['MS', 'Mississippi', 'mississippi'],
      ['MO', 'Missouri', 'missouri'],
      ['MT', 'Montana', 'montana'],
      ['NE', 'Nebraska', 'nebraska'],
      ['NV', 'Nevada', 'nevada'],
      ['NH', 'New Hampshire', 'new-hampshire'],
      ['NJ', 'New Jersey', 'new-jersey'],
      ['NM', 'New Mexico', 'new-mexico'],
      ['NY', 'New York', 'new-york'],
      ['NC', 'North Carolina', 'north-carolina'],
      ['ND', 'North Dakota', 'north-dakota'],
      ['OH', 'Ohio', 'ohio'],
      ['OK', 'Oklahoma', 'oklahoma'],
      ['OR', 'Oregon', 'oregon'],
      ['PA', 'Pennsylvania', 'pennsylvania'],
      ['RI', 'Rhode Island', 'rhode-island'],
      ['SC', 'South Carolina', 'south-carolina'],
      ['SD', 'South Dakota', 'south-dakota'],
      ['TN', 'Tennessee', 'tennessee'],
      ['TX', 'Texas', 'texas'],
      ['UT', 'Utah', 'utah'],
      ['VT', 'Vermont', 'vermont'],
      ['VA', 'Virginia', 'virginia'],
      ['WA', 'Washington', 'washington'],
      ['WV', 'West Virginia', 'west-virginia'],
      ['WI', 'Wisconsin', 'wisconsin'],
      ['WY', 'Wyoming', 'wyoming']
    ];

    const insertState = this.db.prepare('INSERT OR IGNORE INTO states (code, name, slug) VALUES (?, ?, ?)');
    for (const state of statesData) {
      insertState.run(...state);
    }

    // Insert cities (capitals and major tourist cities)
    const citiesData = [
      // State Capitals
      ['Montgomery', 'montgomery', 'AL', true, false, 32.3792, -86.3077],
      ['Juneau', 'juneau', 'AK', true, false, 58.3019, -134.4197],
      ['Phoenix', 'phoenix', 'AZ', true, true, 33.4484, -112.0740],
      ['Little Rock', 'little-rock', 'AR', true, false, 34.7465, -92.2896],
      ['Sacramento', 'sacramento', 'CA', true, false, 38.5816, -121.4944],
      ['Denver', 'denver', 'CO', true, true, 39.7392, -104.9903],
      ['Hartford', 'hartford', 'CT', true, false, 41.7658, -72.6734],
      ['Dover', 'dover', 'DE', true, false, 39.1582, -75.5244],
      ['Tallahassee', 'tallahassee', 'FL', true, false, 30.4383, -84.2807],
      ['Atlanta', 'atlanta', 'GA', true, true, 33.7490, -84.3880],
      ['Honolulu', 'honolulu', 'HI', true, true, 21.3099, -157.8581],
      ['Boise', 'boise', 'ID', true, false, 43.6150, -116.2023],
      ['Springfield', 'springfield', 'IL', true, false, 39.7817, -89.6501],
      ['Indianapolis', 'indianapolis', 'IN', true, false, 39.7684, -86.1581],
      ['Des Moines', 'des-moines', 'IA', true, false, 41.5868, -93.6250],
      ['Topeka', 'topeka', 'KS', true, false, 39.0473, -95.6752],
      ['Frankfort', 'frankfort', 'KY', true, false, 38.2009, -84.8733],
      ['Baton Rouge', 'baton-rouge', 'LA', true, false, 30.4515, -91.1871],
      ['Augusta', 'augusta', 'ME', true, false, 44.3106, -69.7795],
      ['Annapolis', 'annapolis', 'MD', true, false, 38.9784, -76.4922],
      ['Boston', 'boston', 'MA', true, true, 42.3601, -71.0589],
      ['Lansing', 'lansing', 'MI', true, false, 42.7335, -84.5555],
      ['Saint Paul', 'saint-paul', 'MN', true, false, 44.9537, -93.0900],
      ['Jackson', 'jackson', 'MS', true, false, 32.2988, -90.1848],
      ['Jefferson City', 'jefferson-city', 'MO', true, false, 38.5767, -92.1735],
      ['Helena', 'helena', 'MT', true, false, 46.5891, -112.0391],
      ['Lincoln', 'lincoln', 'NE', true, false, 40.8136, -96.7026],
      ['Carson City', 'carson-city', 'NV', true, false, 39.1638, -119.7674],
      ['Concord', 'concord', 'NH', true, false, 43.2081, -71.5376],
      ['Trenton', 'trenton', 'NJ', true, false, 40.2171, -74.7429],
      ['Santa Fe', 'santa-fe', 'NM', true, true, 35.6870, -105.9378],
      ['Albany', 'albany', 'NY', true, false, 42.6526, -73.7562],
      ['Raleigh', 'raleigh', 'NC', true, false, 35.7796, -78.6382],
      ['Bismarck', 'bismarck', 'ND', true, false, 46.8083, -100.7837],
      ['Columbus', 'columbus', 'OH', true, false, 39.9612, -82.9988],
      ['Oklahoma City', 'oklahoma-city', 'OK', true, false, 35.4676, -97.5164],
      ['Salem', 'salem', 'OR', true, false, 44.9429, -123.0351],
      ['Harrisburg', 'harrisburg', 'PA', true, false, 40.2732, -76.8867],
      ['Providence', 'providence', 'RI', true, false, 41.8240, -71.4128],
      ['Columbia', 'columbia', 'SC', true, false, 34.0007, -81.0348],
      ['Pierre', 'pierre', 'SD', true, false, 44.3683, -100.3510],
      ['Nashville', 'nashville', 'TN', true, true, 36.1627, -86.7816],
      ['Austin', 'austin', 'TX', true, true, 30.2672, -97.7431],
      ['Salt Lake City', 'salt-lake-city', 'UT', true, true, 40.7608, -111.8910],
      ['Montpelier', 'montpelier', 'VT', true, false, 44.2601, -72.5754],
      ['Richmond', 'richmond', 'VA', true, false, 37.5407, -77.4360],
      ['Olympia', 'olympia', 'WA', true, false, 47.0379, -122.9007],
      ['Charleston', 'charleston', 'WV', true, false, 38.3498, -81.6326],
      ['Madison', 'madison', 'WI', true, false, 43.0731, -89.4012],
      ['Cheyenne', 'cheyenne', 'WY', true, false, 41.1400, -104.8202],
      // Major Tourist Cities (non-capitals)
      ['Birmingham', 'birmingham', 'AL', false, true, 33.5207, -86.8025],
      ['Anchorage', 'anchorage', 'AK', false, true, 61.2181, -149.9003],
      ['Tucson', 'tucson', 'AZ', false, true, 32.2226, -110.9747],
      ['Scottsdale', 'scottsdale', 'AZ', false, true, 33.4942, -111.9261],
      ['San Francisco', 'san-francisco', 'CA', false, true, 37.7749, -122.4194],
      ['Los Angeles', 'los-angeles', 'CA', false, true, 34.0522, -118.2437],
      ['San Diego', 'san-diego', 'CA', false, true, 32.7157, -117.1611],
      ['Aspen', 'aspen', 'CO', false, true, 39.1911, -106.8175],
      ['Boulder', 'boulder', 'CO', false, true, 40.0150, -105.2705],
      ['Miami', 'miami', 'FL', false, true, 25.7617, -80.1918],
      ['Orlando', 'orlando', 'FL', false, true, 28.5383, -81.3792],
      ['Tampa', 'tampa', 'FL', false, true, 27.9506, -82.4572],
      ['Savannah', 'savannah', 'GA', false, true, 32.0809, -81.0912],
      ['Chicago', 'chicago', 'IL', false, true, 41.8781, -87.6298],
      ['New Orleans', 'new-orleans', 'LA', false, true, 29.9511, -90.0715],
      ['Portland', 'portland', 'ME', false, true, 43.6591, -70.2568],
      ['Baltimore', 'baltimore', 'MD', false, true, 39.2904, -76.6122],
      ['Detroit', 'detroit', 'MI', false, true, 42.3314, -83.0458],
      ['Minneapolis', 'minneapolis', 'MN', false, true, 44.9778, -93.2650],
      ['Kansas City', 'kansas-city', 'MO', false, true, 39.0997, -94.5786],
      ['St. Louis', 'st-louis', 'MO', false, true, 38.6270, -90.1994],
      ['Las Vegas', 'las-vegas', 'NV', false, true, 36.1699, -115.1398],
      ['Reno', 'reno', 'NV', false, true, 39.5296, -119.8138],
      ['Atlantic City', 'atlantic-city', 'NJ', false, true, 39.3643, -74.4229],
      ['Albuquerque', 'albuquerque', 'NM', false, true, 35.0844, -106.6504],
      ['New York City', 'new-york-city', 'NY', false, true, 40.7128, -74.0060],
      ['Buffalo', 'buffalo', 'NY', false, true, 42.8864, -78.8784],
      ['Charlotte', 'charlotte', 'NC', false, true, 35.2271, -80.8431],
      ['Asheville', 'asheville', 'NC', false, true, 35.5951, -82.5515],
      ['Cincinnati', 'cincinnati', 'OH', false, true, 39.1031, -84.5120],
      ['Cleveland', 'cleveland', 'OH', false, true, 41.4993, -81.6944],
      ['Portland', 'portland-or', 'OR', false, true, 45.5152, -122.6784],
      ['Philadelphia', 'philadelphia', 'PA', false, true, 39.9526, -75.1652],
      ['Pittsburgh', 'pittsburgh', 'PA', false, true, 40.4406, -79.9959],
      ['Charleston', 'charleston-sc', 'SC', false, true, 32.7765, -79.9311],
      ['Memphis', 'memphis', 'TN', false, true, 35.1495, -90.0490],
      ['Dallas', 'dallas', 'TX', false, true, 32.7767, -96.7970],
      ['Houston', 'houston', 'TX', false, true, 29.7604, -95.3698],
      ['San Antonio', 'san-antonio', 'TX', false, true, 29.4241, -98.4936],
      ['Virginia Beach', 'virginia-beach', 'VA', false, true, 36.8529, -75.9780],
      ['Seattle', 'seattle', 'WA', false, true, 47.6062, -122.3321],
      ['Milwaukee', 'milwaukee', 'WI', false, true, 43.0389, -87.9065],
      ['Jackson Hole', 'jackson-hole', 'WY', false, true, 43.4799, -110.7624]
    ];

    const insertCity = this.db.prepare(`
      INSERT OR IGNORE INTO cities (name, slug, state_code, is_capital, is_major_tourist_city, latitude, longitude) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    for (const city of citiesData) {
      insertCity.run(...city);
    }

    // Update existing San Francisco venues and neighborhoods to use the new city_id
    const sfCityId = this.db.prepare('SELECT id FROM cities WHERE slug = ?').get('san-francisco')?.id;
    if (sfCityId) {
      this.db.prepare('UPDATE venues SET city_id = ? WHERE city_id IS NULL').run(sfCityId);
      this.db.prepare("UPDATE neighborhoods SET city_id = ? WHERE city = 'San Francisco' OR city_id IS NULL").run(sfCityId);
    }

    // Create views for easy querying
    this.db.exec(`
      CREATE VIEW IF NOT EXISTS venues_with_location AS
      SELECT 
        v.*,
        c.name as city_name,
        c.slug as city_slug,
        s.name as state_name,
        s.code as state_code,
        s.slug as state_slug
      FROM venues v
      JOIN cities c ON v.city_id = c.id
      JOIN states s ON c.state_code = s.code
    `);

    this.db.exec(`
      CREATE VIEW IF NOT EXISTS neighborhoods_with_location AS
      SELECT 
        n.*,
        c.name as city_name,
        c.slug as city_slug,
        s.name as state_name,
        s.code as state_code,
        s.slug as state_slug
      FROM neighborhoods n
      JOIN cities c ON n.city_id = c.id
      JOIN states s ON c.state_code = s.code
    `);
  }

  // Migration 007: Add hotels infrastructure
  private migration007_addHotelsInfrastructure(): void {
    // Create hotels table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS hotels (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        address TEXT NOT NULL,
        city_id INTEGER NOT NULL,
        latitude REAL,
        longitude REAL,
        star_rating INTEGER, -- 1-5 stars
        description TEXT,
        amenities TEXT, -- JSON array
        photos TEXT, -- JSON array of photo URLs
        website TEXT,
        phone TEXT,
        email TEXT,
        price_range TEXT, -- budget, mid-range, luxury
        avg_nightly_rate INTEGER, -- in cents
        total_rooms INTEGER,
        booking_url TEXT,
        tripadvisor_id TEXT,
        google_place_id TEXT,
        booking_com_id TEXT,
        expedia_id TEXT,
        hotels_com_id TEXT,
        agoda_id TEXT,
        featured BOOLEAN DEFAULT FALSE,
        active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (city_id) REFERENCES cities(id)
      )
    `);

    // Create hotel_features table for standardized amenities
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS hotel_features (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        category TEXT NOT NULL, -- 'room', 'property', 'service', 'location'
        icon TEXT, -- emoji or icon name
        description TEXT
      )
    `);

    // Create hotel_hotel_features junction table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS hotel_hotel_features (
        hotel_id INTEGER NOT NULL,
        feature_id INTEGER NOT NULL,
        PRIMARY KEY (hotel_id, feature_id),
        FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
        FOREIGN KEY (feature_id) REFERENCES hotel_features(id) ON DELETE CASCADE
      )
    `);

    // Create affiliate_links table for tracking
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS affiliate_links (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entity_type TEXT NOT NULL, -- 'hotel', 'venue', 'activity'
        entity_id INTEGER NOT NULL,
        affiliate_network TEXT NOT NULL, -- 'booking_com', 'hotels_com', 'expedia', etc.
        affiliate_id TEXT NOT NULL, -- Your affiliate ID
        base_url TEXT NOT NULL,
        tracking_params TEXT, -- JSON object with additional params
        commission_rate REAL, -- percentage as decimal (0.04 = 4%)
        cookie_duration INTEGER, -- days
        active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create affiliate_clicks table for tracking
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS affiliate_clicks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        affiliate_link_id INTEGER NOT NULL,
        user_ip TEXT,
        user_agent TEXT,
        referrer TEXT,
        clicked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (affiliate_link_id) REFERENCES affiliate_links(id)
      )
    `);

    // Create indexes
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_hotels_city_id ON hotels(city_id)');
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_hotels_slug ON hotels(slug)');
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_hotels_star_rating ON hotels(star_rating)');
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_hotels_price_range ON hotels(price_range)');
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_hotels_featured ON hotels(featured)');
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_date ON affiliate_clicks(clicked_at)');

    // Insert standard hotel features
    const hotelFeatures = [
      // Room Features
      ['Free WiFi', 'room', '📶', 'Complimentary wireless internet'],
      ['Air Conditioning', 'room', '❄️', 'Climate controlled rooms'],
      ['Flat Screen TV', 'room', '📺', 'Modern television in room'],
      ['Coffee Maker', 'room', '☕', 'In-room coffee/tea facilities'],
      ['Mini Bar', 'room', '🍷', 'Stocked mini refrigerator'],
      ['Safe', 'room', '🔒', 'In-room security safe'],
      ['Balcony', 'room', '🪟', 'Private outdoor space'],
      ['Ocean View', 'room', '🌊', 'Room with ocean view'],
      ['City View', 'room', '🏙️', 'Room with city view'],
      
      // Property Features
      ['Swimming Pool', 'property', '🏊', 'On-site swimming pool'],
      ['Fitness Center', 'property', '💪', 'Exercise facilities'],
      ['Spa', 'property', '🧘', 'Wellness and spa services'],
      ['Restaurant', 'property', '🍽️', 'On-site dining'],
      ['Bar/Lounge', 'property', '🍸', 'Hotel bar or lounge'],
      ['Business Center', 'property', '💼', 'Business facilities'],
      ['Meeting Rooms', 'property', '🤝', 'Conference facilities'],
      ['Parking', 'property', '🚗', 'On-site parking available'],
      ['Valet Parking', 'property', '🚗', 'Valet parking service'],
      ['Pet Friendly', 'property', '🐕', 'Pets welcome'],
      
      // Service Features
      ['24/7 Front Desk', 'service', '🛎️', '24-hour reception'],
      ['Concierge', 'service', '🎩', 'Concierge services'],
      ['Room Service', 'service', '🛏️', '24-hour room service'],
      ['Laundry Service', 'service', '👕', 'Laundry and dry cleaning'],
      ['Airport Shuttle', 'service', '✈️', 'Transportation to/from airport'],
      ['Bellhop', 'service', '🛄', 'Luggage assistance'],
      
      // Location Features
      ['City Center', 'location', '🏛️', 'Located in city center'],
      ['Near Airport', 'location', '✈️', 'Close to airport'],
      ['Beach Access', 'location', '🏖️', 'Direct beach access'],
      ['Metro Access', 'location', '🚇', 'Near public transportation'],
      ['Shopping District', 'location', '🛍️', 'Near shopping areas'],
      ['Historic District', 'location', '🏛️', 'In historic area']
    ];

    const insertFeature = this.db.prepare(`
      INSERT OR IGNORE INTO hotel_features (name, category, icon, description) 
      VALUES (?, ?, ?, ?)
    `);
    
    for (const feature of hotelFeatures) {
      insertFeature.run(...feature);
    }

    // Create view for hotels with location info
    this.db.exec(`
      CREATE VIEW IF NOT EXISTS hotels_with_location AS
      SELECT 
        h.*,
        c.name as city_name,
        c.slug as city_slug,
        s.name as state_name,
        s.code as state_code,
        s.slug as state_slug
      FROM hotels h
      JOIN cities c ON h.city_id = c.id
      JOIN states s ON c.state_code = s.code
    `);

    // Update venues table to include hotels as a category if not already
    try {
      this.db.exec(`
        INSERT OR IGNORE INTO categories (name, slug, description, seo_title, meta_description)
        VALUES (
          'Hotels', 
          'hotels', 
          'Places to stay including hotels, motels, inns, and boutique accommodations',
          'Best Hotels in {city}',
          'Find the perfect place to stay in {city}. Compare hotels, read reviews, and book your accommodation.'
        )
      `);
    } catch (error) {
      // Category table might not exist yet, that's ok
      console.log('Note: Could not add hotels category, categories table may not exist yet');
    }
  }

  // Migration 008: Enhance neighborhoods schema with rich metadata
  private migration008_enhanceNeighborhoodsSchema(): void {
    // Add new columns to neighborhoods table
    const newColumns = [
      'characteristics TEXT', // JSON array of neighborhood characteristics
      'best_for TEXT', // JSON array of what neighborhood is best for
      'price_level TEXT CHECK(price_level IN ("budget", "mid-range", "upscale", "luxury"))',
      'walkability TEXT CHECK(walkability IN ("low", "medium", "high"))',
      'safety TEXT CHECK(safety IN ("exercise-caution", "generally-safe", "very-safe"))',
      'transit_access TEXT CHECK(transit_access IN ("limited", "good", "excellent"))',
      'image_url TEXT',
      'featured BOOLEAN DEFAULT FALSE',
      'active BOOLEAN DEFAULT TRUE'
    ];

    for (const column of newColumns) {
      try {
        this.db.exec(`ALTER TABLE neighborhoods ADD COLUMN ${column}`);
      } catch (error) {
        if (error instanceof Error && !error.message.includes('duplicate column name')) {
          throw error;
        }
      }
    }

    // Create neighborhood content table for SEO-optimized content
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS neighborhood_guides (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        neighborhood_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        meta_description TEXT NOT NULL,
        intro_text TEXT,
        history_section TEXT,
        dining_guide TEXT,
        shopping_guide TEXT,
        nightlife_guide TEXT,
        getting_around TEXT,
        local_tips TEXT,
        best_times_to_visit TEXT,
        nearby_attractions TEXT,
        keywords TEXT, -- JSON array for SEO
        featured_image_url TEXT,
        published BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (neighborhood_id) REFERENCES neighborhoods(id) ON DELETE CASCADE
      )
    `);

    // Create neighborhood tags table for flexible categorization
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS neighborhood_tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        category TEXT NOT NULL, -- 'vibe', 'activity', 'demographic', 'price'
        color TEXT,
        description TEXT
      )
    `);

    // Junction table for neighborhood-tag relationships
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS neighborhood_neighborhood_tags (
        neighborhood_id INTEGER NOT NULL,
        tag_id INTEGER NOT NULL,
        PRIMARY KEY (neighborhood_id, tag_id),
        FOREIGN KEY (neighborhood_id) REFERENCES neighborhoods(id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES neighborhood_tags(id) ON DELETE CASCADE
      )
    `);

    // Create indexes for performance
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_neighborhoods_price_level ON neighborhoods(price_level)');
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_neighborhoods_walkability ON neighborhoods(walkability)');
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_neighborhoods_featured ON neighborhoods(featured)');
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_neighborhood_guides_published ON neighborhood_guides(published)');

    // Insert standard neighborhood tags
    const neighborhoodTags = [
      // Vibe tags
      ['Hipster', 'vibe', '#8B4513', 'Trendy, alternative culture'],
      ['Family-Friendly', 'vibe', '#32CD32', 'Great for families with kids'],
      ['Upscale', 'vibe', '#DAA520', 'High-end, sophisticated atmosphere'],
      ['Bohemian', 'vibe', '#9370DB', 'Artistic, free-spirited community'],
      ['Historic', 'vibe', '#CD853F', 'Rich historical significance'],
      ['Trendy', 'vibe', '#FF6347', 'Latest hotspots and fashionable crowd'],
      ['Local', 'vibe', '#4682B4', 'Authentic local experience'],
      ['Tourist', 'vibe', '#FFD700', 'Popular with visitors'],
      
      // Activity tags
      ['Nightlife', 'activity', '#800080', 'Great bars and clubs'],
      ['Shopping', 'activity', '#FF1493', 'Excellent retail and boutiques'],
      ['Dining', 'activity', '#FF4500', 'Outstanding restaurants'],
      ['Coffee Culture', 'activity', '#D2691E', 'Great cafes and coffee shops'],
      ['Art Scene', 'activity', '#4169E1', 'Galleries and artistic venues'],
      ['Live Music', 'activity', '#DC143C', 'Music venues and performances'],
      ['Beach Access', 'activity', '#20B2AA', 'Near beaches or waterfront'],
      ['Parks & Nature', 'activity', '#228B22', 'Green spaces and outdoor activities'],
      
      // Demographic tags
      ['Young Professionals', 'demographic', '#1E90FF', 'Popular with 25-35 crowd'],
      ['Students', 'demographic', '#32CD32', 'College-aged crowd'],
      ['Families', 'demographic', '#FF69B4', 'Family-oriented community'],
      ['LGBTQ+ Friendly', 'demographic', '#9932CC', 'Welcoming LGBTQ+ community'],
      ['International', 'demographic', '#FF6347', 'Diverse, multicultural'],
      
      // Price tags
      ['Budget-Friendly', 'price', '#32CD32', 'Affordable options'],
      ['Mid-Range', 'price', '#FFD700', 'Moderate pricing'],
      ['Expensive', 'price', '#FF4500', 'High-end pricing'],
      ['Luxury', 'price', '#8B0000', 'Ultra-high-end, exclusive']
    ];

    const insertTag = this.db.prepare(`
      INSERT OR IGNORE INTO neighborhood_tags (name, category, color, description) 
      VALUES (?, ?, ?, ?)
    `);
    
    for (const tag of neighborhoodTags) {
      insertTag.run(...tag);
    }

    // Update the neighborhoods_with_location view to include new fields
    this.db.exec('DROP VIEW IF EXISTS neighborhoods_with_location');
    this.db.exec(`
      CREATE VIEW neighborhoods_with_location AS
      SELECT 
        n.*,
        c.name as city_name,
        c.slug as city_slug,
        s.name as state_name,
        s.code as state_code,
        s.slug as state_slug
      FROM neighborhoods n
      JOIN cities c ON n.city_id = c.id
      JOIN states s ON c.state_code = s.code
    `);
  }

  // Migration 009: Add neighborhood tiers and regions
  private migration009_addNeighborhoodTiersAndRegions(): void {
    // Add new columns to neighborhoods table
    const newColumns = [
      'tier INTEGER CHECK(tier IN (1, 2, 3)) DEFAULT 1', // 1=Major, 2=Notable, 3=Directory
      'region_name TEXT',
      'region_slug TEXT',
      'parent_region_id INTEGER',
      'sort_order INTEGER DEFAULT 0',
      'search_volume_estimate INTEGER DEFAULT 0',
      'content_priority TEXT CHECK(content_priority IN ("high", "medium", "low")) DEFAULT "medium"'
    ];

    for (const column of newColumns) {
      try {
        this.db.exec(`ALTER TABLE neighborhoods ADD COLUMN ${column}`);
      } catch (error) {
        if (error instanceof Error && !error.message.includes('duplicate column name')) {
          throw error;
        }
      }
    }

    // Create neighborhood_regions table for organizing neighborhoods
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS neighborhood_regions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        slug TEXT NOT NULL,
        city_id INTEGER NOT NULL,
        description TEXT,
        sort_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE CASCADE,
        UNIQUE(slug, city_id)
      )
    `);

    // Create indexes for performance
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_neighborhoods_tier ON neighborhoods(tier)');
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_neighborhoods_region ON neighborhoods(region_slug)');
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_neighborhoods_priority ON neighborhoods(content_priority)');
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_neighborhood_regions_city ON neighborhood_regions(city_id)');

    // Update the neighborhoods_with_location view to include tier and region info
    this.db.exec('DROP VIEW IF EXISTS neighborhoods_with_location');
    this.db.exec(`
      CREATE VIEW neighborhoods_with_location AS
      SELECT 
        n.*,
        c.name as city_name,
        c.slug as city_slug,
        s.name as state_name,
        s.code as state_code,
        s.slug as state_slug,
        nr.name as region_display_name,
        nr.description as region_description
      FROM neighborhoods n
      JOIN cities c ON n.city_id = c.id
      JOIN states s ON c.state_code = s.code
      LEFT JOIN neighborhood_regions nr ON n.region_slug = nr.slug AND n.city_id = nr.city_id
    `);
  }

  // Migration 010: Add fun facts system
  private migration010_addFunFactsSystem(): void {
    // Create fun_facts table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS fun_facts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        fact TEXT NOT NULL,
        category TEXT NOT NULL, -- 'history', 'culture', 'food', 'architecture', 'celebrity', 'quirky', 'hidden'
        location_type TEXT NOT NULL, -- 'neighborhood', 'city', 'venue', 'street', 'landmark'
        location_id INTEGER,
        location_name TEXT, -- For flexible location references
        city_id INTEGER NOT NULL,
        latitude REAL,
        longitude REAL,
        source TEXT, -- Where the fact came from
        verified BOOLEAN DEFAULT FALSE,
        fun_rating INTEGER CHECK(fun_rating BETWEEN 1 AND 5) DEFAULT 3, -- How interesting/fun is this fact
        tourist_appeal INTEGER CHECK(tourist_appeal BETWEEN 1 AND 5) DEFAULT 3, -- Tourist interest level
        local_knowledge BOOLEAN DEFAULT FALSE, -- Is this insider knowledge?
        photo_url TEXT,
        related_venue_names TEXT, -- JSON array of related venue names
        tags TEXT, -- JSON array of additional tags
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE CASCADE
      )
    `);

    // Create fun_fact_categories table for organizing facts
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS fun_fact_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        icon TEXT, -- emoji or icon
        description TEXT,
        color TEXT -- for UI styling
      )
    `);

    // Create indexes for performance
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_fun_facts_city ON fun_facts(city_id)');
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_fun_facts_location_type ON fun_facts(location_type, location_id)');
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_fun_facts_category ON fun_facts(category)');
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_fun_facts_rating ON fun_facts(fun_rating DESC)');
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_fun_facts_location ON fun_facts(latitude, longitude)');

    // Insert fun fact categories
    const categories = [
      ['History', '🏛️', 'Historical events, founding stories, and past events', '#8B4513'],
      ['Culture', '🎭', 'Local traditions, customs, and cultural significance', '#4169E1'],
      ['Food', '🍽️', 'Culinary history, food origins, and dining traditions', '#FF6347'],
      ['Architecture', '🏗️', 'Building stories, architectural significance, and design facts', '#708090'],
      ['Celebrity', '⭐', 'Famous residents, movie locations, and celebrity connections', '#FFD700'],
      ['Quirky', '🤪', 'Weird, unusual, and wonderfully odd local facts', '#FF69B4'],
      ['Hidden', '🔍', 'Secret spots, hidden features, and local insider knowledge', '#32CD32'],
      ['Film & TV', '🎬', 'Movie and TV show filming locations and stories', '#9370DB'],
      ['Music', '🎵', 'Musical history, famous venues, and artist connections', '#FF4500'],
      ['Street Art', '🎨', 'Murals, graffiti, and public art stories', '#20B2AA']
    ];

    const insertCategory = this.db.prepare(`
      INSERT OR IGNORE INTO fun_fact_categories (name, icon, description, color) 
      VALUES (?, ?, ?, ?)
    `);
    
    for (const category of categories) {
      insertCategory.run(...category);
    }

    // Create view for fun facts with location info
    this.db.exec(`
      CREATE VIEW IF NOT EXISTS fun_facts_with_location AS
      SELECT 
        ff.*,
        c.name as city_name,
        c.slug as city_slug,
        s.name as state_name,
        s.code as state_code,
        s.slug as state_slug,
        ffc.icon as category_icon,
        ffc.color as category_color
      FROM fun_facts ff
      JOIN cities c ON ff.city_id = c.id
      JOIN states s ON c.state_code = s.code
      LEFT JOIN fun_fact_categories ffc ON ff.category = ffc.name
    `);
  }
}

// Convenience function to run all migrations
export async function runDatabaseMigrations(): Promise<MigrationResult> {
  const migrator = new DatabaseMigrator();
  return await migrator.runMigrations();
}

// Quick migration check
export function checkDatabaseVersion(): number {
  try {
    const db = getDatabase();
    const result = db.prepare('SELECT MAX(version) as version FROM migrations').get() as { version: number } | undefined;
    return result?.version || 0;
  } catch {
    return 0;
  }
}