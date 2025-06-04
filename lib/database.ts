import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';

// Database types following the schema from the specifications
export interface Venue {
  id: number;
  name: string;
  address: string;
  neighborhood: string;
  category: string;
  subcategory: string;
  description: string;
  phone?: string;
  website?: string;
  hours?: string;
  price_range: number; // 1-4 scale
  atmosphere_tags: string; // JSON array
  demographic_tags: string; // JSON array
  feature_tags: string; // JSON array
  lat?: number;
  lng?: number;
  created_at: string;
  updated_at: string;
  featured: boolean;
  active: boolean;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  parent_id?: number;
  description: string;
  seo_title: string;
  meta_description: string;
}

export interface Neighborhood {
  id: number;
  name: string;
  slug: string;
  city: string;
  description: string;
  boundary_coords?: string; // JSON
}

export interface Tag {
  id: number;
  name: string;
  type: 'atmosphere' | 'demographic' | 'feature';
  color: string;
  description: string;
}

export interface VenueTag {
  venue_id: number;
  tag_id: number;
}

// Initialize database
let db: Database.Database;

export function getDatabase() {
  if (!db) {
    // Always use in-memory database for serverless deployment
    // This avoids file system issues in Vercel
    console.log('Initializing in-memory database...');
    db = new Database(':memory:');
    initializeDatabase();
    
    // Always seed with data since we're using in-memory database
    try {
      const { seedDatabase } = require('./seed-data');
      const seedCount = seedDatabase();
      console.log(`Seeded database with ${seedCount} venues`);
    } catch (error) {
      console.log('Seeding failed:', error);
    }
  }
  return db;
}

function initializeDatabase() {
  // Create tables with IF NOT EXISTS to avoid recreating on each load
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      parent_id INTEGER,
      description TEXT,
      seo_title TEXT,
      meta_description TEXT,
      FOREIGN KEY (parent_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS neighborhoods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      city TEXT NOT NULL DEFAULT 'San Francisco',
      description TEXT,
      boundary_coords TEXT
    );

    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT CHECK (type IN ('atmosphere', 'demographic', 'feature')) NOT NULL,
      color TEXT,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS venues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      neighborhood TEXT NOT NULL,
      category TEXT NOT NULL,
      subcategory TEXT,
      description TEXT,
      phone TEXT,
      website TEXT,
      hours TEXT,
      price_range INTEGER CHECK (price_range >= 1 AND price_range <= 4),
      atmosphere_tags TEXT DEFAULT '[]',
      demographic_tags TEXT DEFAULT '[]',
      feature_tags TEXT DEFAULT '[]',
      lat REAL,
      lng REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      featured INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS venue_tags (
      venue_id INTEGER,
      tag_id INTEGER,
      PRIMARY KEY (venue_id, tag_id),
      FOREIGN KEY (venue_id) REFERENCES venues(id),
      FOREIGN KEY (tag_id) REFERENCES tags(id)
    );

    CREATE INDEX IF NOT EXISTS idx_venues_neighborhood ON venues(neighborhood);
    CREATE INDEX IF NOT EXISTS idx_venues_category ON venues(category);
    CREATE INDEX IF NOT EXISTS idx_venues_featured ON venues(featured);
    CREATE INDEX IF NOT EXISTS idx_venues_active ON venues(active);
  `);

  // Insert initial categories based on specifications
  const categories = [
    // Food & Drink
    { name: 'Restaurants', slug: 'restaurants', description: 'Dining establishments across all cuisines and price points' },
    { name: 'Bars & Nightlife', slug: 'bars-nightlife', description: 'Wine bars, cocktail lounges, dive bars, and clubs' },
    { name: 'Cafes & Coffee', slug: 'cafes-coffee', description: 'Coffee shops, study spots, and specialty roasters' },
    { name: 'Specialty Food', slug: 'specialty-food', description: 'Wine shops, cheese shops, bakeries, and gourmet markets' },
    
    // Shopping & Retail
    { name: 'Thrift & Vintage', slug: 'thrift-vintage', description: 'Consignment shops, vintage clothing, and antiques' },
    { name: 'Fashion', slug: 'fashion', description: 'Boutiques, local designers, and clothing stores' },
    { name: 'Books & Media', slug: 'books-media', description: 'Bookstores, record shops, and comic stores' },
    
    // Activities & Entertainment
    { name: 'Live Entertainment', slug: 'live-entertainment', description: 'Music venues, comedy clubs, and theaters' },
    { name: 'Arts & Culture', slug: 'arts-culture', description: 'Galleries, museums, and cultural centers' },
    { name: 'Outdoor Activities', slug: 'outdoor-activities', description: 'Parks, hiking trails, and recreational areas' },
    
    // Services & Practical
    { name: 'Work Spaces', slug: 'work-spaces', description: 'Co-working spaces and study spots' },
    { name: 'Personal Services', slug: 'personal-services', description: 'Barber shops, salons, and wellness services' }
  ];

  const insertCategory = db.prepare(`
    INSERT OR IGNORE INTO categories (name, slug, description, seo_title, meta_description)
    VALUES (?, ?, ?, ?, ?)
  `);

  categories.forEach(cat => {
    insertCategory.run(
      cat.name,
      cat.slug,
      cat.description,
      `Best ${cat.name} in San Francisco | My Local Guide`,
      `Discover the best ${cat.name.toLowerCase()} in San Francisco. Curated local recommendations from neighborhood experts.`
    );
  });

  // Insert SF neighborhoods based on research
  const neighborhoods = [
    { name: 'Mission District', slug: 'mission', description: 'Vibrant Latino culture, street art, and the best restaurants per capita in SF' },
    { name: 'Castro', slug: 'castro', description: 'Historic LGBTQ+ neighborhood with great dining and nightlife' },
    { name: 'Marina District', slug: 'marina', description: 'Upscale waterfront neighborhood with fitness culture and restaurants' },
    { name: 'North Beach', slug: 'north-beach', description: 'Italian heritage, authentic delis, and classic San Francisco atmosphere' },
    { name: 'SoMa', slug: 'soma', description: 'South of Market tech hub with modern restaurants and rooftop bars' },
    { name: 'Haight-Ashbury', slug: 'haight', description: 'Bohemian culture, vintage shops, and eclectic dining scene' },
    { name: 'Lower Haight', slug: 'lower-haight', description: 'Emerging food destination punching above its weight' },
    { name: 'Chinatown', slug: 'chinatown', description: 'Authentic Chinese cuisine and traditional tea houses' },
    { name: 'Financial District', slug: 'financial', description: 'Business district with upscale dining and happy hour spots' },
    { name: 'Nob Hill', slug: 'nob-hill', description: 'Elegant neighborhood with fine dining and classic cocktail bars' }
  ];

  const insertNeighborhood = db.prepare(`
    INSERT OR IGNORE INTO neighborhoods (name, slug, city, description)
    VALUES (?, ?, ?, ?)
  `);

  neighborhoods.forEach(hood => {
    insertNeighborhood.run(hood.name, hood.slug, 'San Francisco', hood.description);
  });

  // Insert tags for filtering system
  const tags = [
    // Atmosphere tags
    { name: 'Cozy', type: 'atmosphere', color: '#8B4513', description: 'Intimate, warm atmosphere' },
    { name: 'Lively', type: 'atmosphere', color: '#FF6347', description: 'Energetic, bustling vibe' },
    { name: 'Quiet', type: 'atmosphere', color: '#4682B4', description: 'Peaceful, low-key setting' },
    { name: 'Romantic', type: 'atmosphere', color: '#DC143C', description: 'Perfect for dates' },
    
    // Demographic tags
    { name: 'Family-Friendly', type: 'demographic', color: '#32CD32', description: 'Great for kids and families' },
    { name: 'Young Professionals', type: 'demographic', color: '#4169E1', description: 'Popular with 26-35 crowd' },
    { name: 'Students', type: 'demographic', color: '#FFD700', description: 'Budget-friendly, study-friendly' },
    { name: 'Seniors', type: 'demographic', color: '#9370DB', description: 'Comfortable, accessible' },
    
    // Feature tags
    { name: 'Outdoor Seating', type: 'feature', color: '#228B22', description: 'Patio or sidewalk tables' },
    { name: 'WiFi', type: 'feature', color: '#1E90FF', description: 'Reliable internet connection' },
    { name: 'Dog-Friendly', type: 'feature', color: '#DEB887', description: 'Welcomes well-behaved dogs' },
    { name: 'Late Night', type: 'feature', color: '#800080', description: 'Open after 10pm' }
  ];

  const insertTag = db.prepare(`
    INSERT OR IGNORE INTO tags (name, type, color, description)
    VALUES (?, ?, ?, ?)
  `);

  tags.forEach(tag => {
    insertTag.run(tag.name, tag.type, tag.color, tag.description);
  });

  console.log('Database initialized with categories, neighborhoods, and tags');
}

// Helper functions for database operations
export function getAllVenues() {
  const db = getDatabase();
  return db.prepare('SELECT * FROM venues WHERE active = 1 ORDER BY featured DESC, name ASC').all();
}

export function getVenuesByCategory(category: string) {
  const db = getDatabase();
  return db.prepare('SELECT * FROM venues WHERE category = ? AND active = 1 ORDER BY featured DESC, name ASC').all(category);
}

export function getVenuesByNeighborhood(neighborhood: string) {
  const db = getDatabase();
  return db.prepare('SELECT * FROM venues WHERE neighborhood = ? AND active = 1 ORDER BY featured DESC, name ASC').all(neighborhood);
}

export function getFeaturedVenues() {
  const db = getDatabase();
  return db.prepare('SELECT * FROM venues WHERE featured = 1 AND active = 1 ORDER BY name ASC').all();
}

export function insertVenue(venue: Omit<Venue, 'id' | 'created_at' | 'updated_at'>) {
  const db = getDatabase();
  const insert = db.prepare(`
    INSERT INTO venues (
      name, address, neighborhood, category, subcategory, description,
      phone, website, hours, price_range, atmosphere_tags, demographic_tags,
      feature_tags, lat, lng, featured, active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  return insert.run(
    venue.name, venue.address, venue.neighborhood, venue.category,
    venue.subcategory, venue.description, venue.phone, venue.website,
    venue.hours, venue.price_range, venue.atmosphere_tags,
    venue.demographic_tags, venue.feature_tags, venue.lat, venue.lng,
    venue.featured ? 1 : 0, venue.active ? 1 : 0
  );
}