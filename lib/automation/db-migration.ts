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
        { version: 5, name: 'add_search_optimization', migration: this.migration005_addSearchOptimization }
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