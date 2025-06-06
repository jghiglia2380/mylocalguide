import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';
import { State, City, CityWithState, VenueWithLocation, NeighborhoodWithLocation } from './types/location';
import { Hotel, HotelWithLocation, HotelFeature, HotelWithFeatures, AffiliateLink, HotelSearchFilters } from './types/hotel';
import { 
  Neighborhood, 
  NeighborhoodWithTags, 
  NeighborhoodTag, 
  NeighborhoodGuide, 
  NeighborhoodStats,
  NeighborhoodSearchFilters,
  parseCharacteristics,
  parseBestFor 
} from './types/neighborhood';

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

export interface NeighborhoodDB {
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
      city_id INTEGER,
      city TEXT NOT NULL DEFAULT 'San Francisco',
      description TEXT,
      boundary_coords TEXT,
      active INTEGER DEFAULT 1,
      FOREIGN KEY (city_id) REFERENCES cities(id)
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
      city_id INTEGER,
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
      active INTEGER DEFAULT 1,
      FOREIGN KEY (city_id) REFERENCES cities(id)
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

    -- States table
    CREATE TABLE IF NOT EXISTS states (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Cities table  
    CREATE TABLE IF NOT EXISTS cities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL,
      state_code TEXT NOT NULL,
      county TEXT,
      population INTEGER,
      latitude REAL,
      longitude REAL,
      timezone TEXT,
      is_capital INTEGER DEFAULT 0,
      is_major_tourist_city INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (state_code) REFERENCES states(code),
      UNIQUE(slug, state_code)
    );

    -- Hotels table
    CREATE TABLE IF NOT EXISTS hotels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      city_id INTEGER,
      address TEXT,
      latitude REAL,
      longitude REAL,
      star_rating INTEGER,
      featured INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (city_id) REFERENCES cities(id)
    );

    -- Affiliate links table
    CREATE TABLE IF NOT EXISTS affiliate_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type TEXT NOT NULL,
      entity_id INTEGER NOT NULL,
      affiliate_network TEXT NOT NULL,
      link_url TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Create basic views
    CREATE VIEW IF NOT EXISTS venues_with_location AS
    SELECT v.*, c.name as city_name, c.slug as city_slug, s.name as state_name, s.code as state_code, s.slug as state_slug
    FROM venues v
    LEFT JOIN cities c ON v.city_id = c.id
    LEFT JOIN states s ON c.state_code = s.code;

    CREATE VIEW IF NOT EXISTS neighborhoods_with_location AS  
    SELECT n.*, c.name as city_name, c.slug as city_slug, s.name as state_name, s.code as state_code, s.slug as state_slug
    FROM neighborhoods n
    LEFT JOIN cities c ON n.city_id = c.id
    LEFT JOIN states s ON c.state_code = s.code;

    CREATE VIEW IF NOT EXISTS hotels_with_location AS
    SELECT h.*, c.name as city_name, c.slug as city_slug, s.name as state_name, s.code as state_code, s.slug as state_slug  
    FROM hotels h
    LEFT JOIN cities c ON h.city_id = c.id
    LEFT JOIN states s ON c.state_code = s.code;
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
    { name: 'Experiences', slug: 'experiences', description: 'Local tours, classes, workshops, and unique activities' },
    
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

  // Insert initial states and cities
  const insertState = db.prepare(`
    INSERT OR IGNORE INTO states (name, code, slug)
    VALUES (?, ?, ?)
  `);
  
  const insertCity = db.prepare(`
    INSERT OR IGNORE INTO cities (name, slug, state_code, latitude, longitude, is_major_tourist_city)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  // Add California state
  insertState.run('California', 'CA', 'california');
  
  // Add San Francisco city  
  insertCity.run('San Francisco', 'san-francisco', 'CA', 37.7749, -122.4194, 1);

  // Insert SF neighborhoods based on research
  const neighborhoods = [
    { name: 'The Mission', slug: 'mission', description: 'Vibrant Latino culture, street art, and the best restaurants per capita in SF' },
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
    INSERT OR IGNORE INTO neighborhoods (name, slug, city_id, city, description)
    VALUES (?, ?, ?, ?, ?)
  `);

  // Get SF city ID
  const sfCity = db.prepare('SELECT id FROM cities WHERE slug = ?').get('san-francisco') as { id: number };
  const sfCityId = sfCity?.id || 1;

  neighborhoods.forEach(hood => {
    insertNeighborhood.run(hood.name, hood.slug, sfCityId, 'San Francisco', hood.description);
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

// Multi-city helper functions
export function getAllStates(): State[] {
  const db = getDatabase();
  return db.prepare('SELECT * FROM states ORDER BY name ASC').all() as State[];
}

export function getStateBySlug(slug: string): State | undefined {
  const db = getDatabase();
  return db.prepare('SELECT * FROM states WHERE slug = ?').get(slug) as State | undefined;
}

export function getCitiesByState(stateCode: string): City[] {
  const db = getDatabase();
  return db.prepare(`
    SELECT * FROM cities 
    WHERE state_code = ? 
    ORDER BY is_capital DESC, is_major_tourist_city DESC, name ASC
  `).all(stateCode) as City[];
}

export function getCityBySlug(slug: string): CityWithState | undefined {
  const db = getDatabase();
  return db.prepare(`
    SELECT 
      c.*,
      s.name as state_name,
      s.slug as state_slug
    FROM cities c
    JOIN states s ON c.state_code = s.code
    WHERE c.slug = ?
  `).get(slug) as CityWithState | undefined;
}

export function getVenuesByCity(cityId: number, limit?: number): VenueWithLocation[] {
  const db = getDatabase();
  const query = limit 
    ? 'SELECT * FROM venues_with_location WHERE city_id = ? AND active = 1 ORDER BY venue_score DESC, rating DESC LIMIT ?'
    : 'SELECT * FROM venues_with_location WHERE city_id = ? AND active = 1 ORDER BY venue_score DESC, rating DESC';
  
  return limit 
    ? db.prepare(query).all(cityId, limit) as VenueWithLocation[]
    : db.prepare(query).all(cityId) as VenueWithLocation[];
}

export function getVenuesByCityAndCategory(cityId: number, category: string): VenueWithLocation[] {
  const db = getDatabase();
  return db.prepare(`
    SELECT * FROM venues_with_location 
    WHERE city_id = ? AND category = ? AND active = 1 
    ORDER BY venue_score DESC, rating DESC
  `).all(cityId, category) as VenueWithLocation[];
}

export function getVenuesByCityAndNeighborhood(cityId: number, neighborhood: string): VenueWithLocation[] {
  const db = getDatabase();
  return db.prepare(`
    SELECT * FROM venues_with_location 
    WHERE city_id = ? AND neighborhood = ? AND active = 1 
    ORDER BY venue_score DESC, rating DESC
  `).all(cityId, neighborhood) as VenueWithLocation[];
}

export function getNeighborhoodsByCity(cityId: number): NeighborhoodWithLocation[] {
  const db = getDatabase();
  return db.prepare(`
    SELECT * FROM neighborhoods_with_location 
    WHERE city_id = ? 
    ORDER BY name ASC
  `).all(cityId) as NeighborhoodWithLocation[];
}

export function getCapitalCities(): CityWithState[] {
  const db = getDatabase();
  return db.prepare(`
    SELECT 
      c.*,
      s.name as state_name,
      s.slug as state_slug
    FROM cities c
    JOIN states s ON c.state_code = s.code
    WHERE c.is_capital = 1
    ORDER BY s.name ASC
  `).all() as CityWithState[];
}

export function getTouristCities(): CityWithState[] {
  const db = getDatabase();
  return db.prepare(`
    SELECT 
      c.*,
      s.name as state_name,
      s.slug as state_slug
    FROM cities c
    JOIN states s ON c.state_code = s.code
    WHERE c.is_major_tourist_city = 1
    ORDER BY s.name ASC, c.name ASC
  `).all() as CityWithState[];
}

export function searchVenuesByCity(cityId: number, query: string): VenueWithLocation[] {
  const db = getDatabase();
  return db.prepare(`
    SELECT DISTINCT vwl.*
    FROM venues_with_location vwl
    JOIN venue_search vs ON vwl.id = vs.venue_id
    WHERE vwl.city_id = ? AND venue_search MATCH ?
    ORDER BY vs.rank
    LIMIT 20
  `).all(cityId, query) as VenueWithLocation[];
}

// Hotel helper functions
export function getAllHotels(): Hotel[] {
  const db = getDatabase();
  return db.prepare('SELECT * FROM hotels WHERE active = 1 ORDER BY featured DESC, star_rating DESC, name ASC').all() as Hotel[];
}

export function getHotelsByCity(cityId: number, filters?: HotelSearchFilters): HotelWithLocation[] {
  const db = getDatabase();
  let query = 'SELECT * FROM hotels_with_location WHERE city_id = ? AND active = 1';
  const params: any[] = [cityId];

  if (filters?.price_range) {
    query += ' AND price_range = ?';
    params.push(filters.price_range);
  }

  if (filters?.star_rating) {
    query += ' AND star_rating >= ?';
    params.push(filters.star_rating);
  }

  // Sort by
  const sortBy = filters?.sort_by || 'featured';
  const sortOrder = filters?.sort_order || 'desc';
  
  switch (sortBy) {
    case 'price':
      query += ` ORDER BY avg_nightly_rate ${sortOrder}, name ASC`;
      break;
    case 'rating':
      query += ` ORDER BY star_rating ${sortOrder}, name ASC`;
      break;
    case 'name':
      query += ` ORDER BY name ${sortOrder}`;
      break;
    default:
      query += ' ORDER BY featured DESC, star_rating DESC, name ASC';
  }

  return db.prepare(query).all(...params) as HotelWithLocation[];
}

export function getHotelBySlug(slug: string): HotelWithLocation | undefined {
  const db = getDatabase();
  return db.prepare('SELECT * FROM hotels_with_location WHERE slug = ? AND active = 1').get(slug) as HotelWithLocation | undefined;
}

export function getHotelById(id: number): HotelWithLocation | undefined {
  const db = getDatabase();
  return db.prepare('SELECT * FROM hotels_with_location WHERE id = ? AND active = 1').get(id) as HotelWithLocation | undefined;
}

export function getHotelFeatures(): HotelFeature[] {
  const db = getDatabase();
  return db.prepare('SELECT * FROM hotel_features ORDER BY category, name').all() as HotelFeature[];
}

export function getHotelFeaturesById(hotelId: number): HotelFeature[] {
  const db = getDatabase();
  return db.prepare(`
    SELECT hf.*
    FROM hotel_features hf
    JOIN hotel_hotel_features hhf ON hf.id = hhf.feature_id
    WHERE hhf.hotel_id = ?
    ORDER BY hf.category, hf.name
  `).all(hotelId) as HotelFeature[];
}

export function getHotelWithFeatures(slug: string): HotelWithFeatures | undefined {
  const hotel = getHotelBySlug(slug);
  if (!hotel) return undefined;

  const features = getHotelFeaturesById(hotel.id);
  return { ...hotel, features };
}

export function getFeaturedHotels(limit = 10): HotelWithLocation[] {
  const db = getDatabase();
  return db.prepare(`
    SELECT * FROM hotels_with_location 
    WHERE featured = 1 AND active = 1 
    ORDER BY star_rating DESC, name ASC 
    LIMIT ?
  `).all(limit) as HotelWithLocation[];
}

export function getHotelsByPriceRange(priceRange: 'budget' | 'mid-range' | 'luxury', limit = 20): HotelWithLocation[] {
  const db = getDatabase();
  return db.prepare(`
    SELECT * FROM hotels_with_location 
    WHERE price_range = ? AND active = 1 
    ORDER BY star_rating DESC, name ASC 
    LIMIT ?
  `).all(priceRange, limit) as HotelWithLocation[];
}

export function searchHotels(query: string, cityId?: number): HotelWithLocation[] {
  const db = getDatabase();
  let sql = `
    SELECT * FROM hotels_with_location 
    WHERE active = 1 AND (
      name LIKE ? OR 
      address LIKE ? OR 
      description LIKE ?
    )
  `;
  const searchTerm = `%${query}%`;
  const params: (string | number)[] = [searchTerm, searchTerm, searchTerm];

  if (cityId) {
    sql += ' AND city_id = ?';
    params.push(cityId);
  }

  sql += ' ORDER BY star_rating DESC, name ASC LIMIT 20';

  return db.prepare(sql).all(...params) as HotelWithLocation[];
}

// Affiliate link functions
export function getAffiliateLinksForHotel(hotelId: number): AffiliateLink[] {
  const db = getDatabase();
  return db.prepare(`
    SELECT * FROM affiliate_links 
    WHERE entity_type = 'hotel' AND entity_id = ? AND active = 1
    ORDER BY commission_rate DESC
  `).all(hotelId) as AffiliateLink[];
}

export function createAffiliateLink(link: Omit<AffiliateLink, 'id' | 'created_at' | 'updated_at'>): number {
  const db = getDatabase();
  const insert = db.prepare(`
    INSERT INTO affiliate_links (
      entity_type, entity_id, affiliate_network, affiliate_id, 
      base_url, tracking_params, commission_rate, cookie_duration, active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const result = insert.run(
    link.entity_type,
    link.entity_id,
    link.affiliate_network,
    link.affiliate_id,
    link.base_url,
    link.tracking_params || null,
    link.commission_rate || null,
    link.cookie_duration || null,
    link.active ? 1 : 0
  );
  
  return result.lastInsertRowid as number;
}

export function trackAffiliateClick(affiliateLinkId: number, userIp?: string, userAgent?: string, referrer?: string): void {
  const db = getDatabase();
  const insert = db.prepare(`
    INSERT INTO affiliate_clicks (affiliate_link_id, user_ip, user_agent, referrer)
    VALUES (?, ?, ?, ?)
  `);
  
  insert.run(affiliateLinkId, userIp || null, userAgent || null, referrer || null);
}

export function insertHotel(hotel: Omit<Hotel, 'id' | 'created_at' | 'updated_at'>): number {
  const db = getDatabase();
  const insert = db.prepare(`
    INSERT INTO hotels (
      name, slug, address, city_id, latitude, longitude, star_rating,
      description, amenities, photos, website, phone, email, price_range,
      avg_nightly_rate, total_rooms, booking_url, tripadvisor_id, google_place_id,
      booking_com_id, expedia_id, hotels_com_id, agoda_id, featured, active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const result = insert.run(
    hotel.name, hotel.slug, hotel.address, hotel.city_id,
    hotel.latitude || null, hotel.longitude || null, hotel.star_rating || null,
    hotel.description || null, hotel.amenities || null, hotel.photos || null,
    hotel.website || null, hotel.phone || null, hotel.email || null,
    hotel.price_range || null, hotel.avg_nightly_rate || null, hotel.total_rooms || null,
    hotel.booking_url || null, hotel.tripadvisor_id || null, hotel.google_place_id || null,
    hotel.booking_com_id || null, hotel.expedia_id || null, hotel.hotels_com_id || null,
    hotel.agoda_id || null, hotel.featured ? 1 : 0, hotel.active ? 1 : 0
  );
  
  return result.lastInsertRowid as number;
}

// Enhanced Neighborhood helper functions
export function getNeighborhoodBySlug(slug: string): NeighborhoodWithLocation | undefined {
  const db = getDatabase();
  return db.prepare(`
    SELECT * FROM neighborhoods_with_location 
    WHERE slug = ? AND active = 1
  `).get(slug) as NeighborhoodWithLocation | undefined;
}

export function getNeighborhoodsByCityWithFilters(cityId: number, filters?: NeighborhoodSearchFilters): NeighborhoodWithLocation[] {
  const db = getDatabase();
  let query = 'SELECT * FROM neighborhoods_with_location WHERE city_id = ? AND active = 1';
  const params: any[] = [cityId];

  if (filters?.price_level) {
    query += ' AND price_level = ?';
    params.push(filters.price_level);
  }

  if (filters?.walkability) {
    query += ' AND walkability = ?';
    params.push(filters.walkability);
  }

  if (filters?.safety) {
    query += ' AND safety = ?';
    params.push(filters.safety);
  }

  if (filters?.transit_access) {
    query += ' AND transit_access = ?';
    params.push(filters.transit_access);
  }

  if (filters?.featured !== undefined) {
    query += ' AND featured = ?';
    params.push(filters.featured ? 1 : 0);
  }

  query += ' ORDER BY featured DESC, name ASC';

  return db.prepare(query).all(...params) as NeighborhoodWithLocation[];
}

export function getNeighborhoodWithTags(slug: string): NeighborhoodWithTags | undefined {
  const neighborhood = getNeighborhoodBySlug(slug);
  if (!neighborhood) return undefined;

  const tags = getNeighborhoodTags(neighborhood.id);
  
  // Cast to proper type since the database query includes all fields
  const fullNeighborhood = neighborhood as any;
  
  return {
    ...neighborhood,
    description: neighborhood.description || '',
    tags,
    characteristics_parsed: parseCharacteristics(fullNeighborhood.characteristics),
    best_for_parsed: parseBestFor(fullNeighborhood.best_for),
    featured: fullNeighborhood.featured ?? false,
    active: fullNeighborhood.active ?? true
  };
}

export function getNeighborhoodTags(neighborhoodId: number): NeighborhoodTag[] {
  const db = getDatabase();
  return db.prepare(`
    SELECT nt.*
    FROM neighborhood_tags nt
    JOIN neighborhood_neighborhood_tags nnt ON nt.id = nnt.tag_id
    WHERE nnt.neighborhood_id = ?
    ORDER BY nt.category, nt.name
  `).all(neighborhoodId) as NeighborhoodTag[];
}

export function getNeighborhoodStats(neighborhoodId: number): NeighborhoodStats {
  const db = getDatabase();
  
  // Get venue counts by category
  const venueStats = db.prepare(`
    SELECT 
      category,
      COUNT(*) as count
    FROM venues 
    WHERE neighborhood = (
      SELECT name FROM neighborhoods WHERE id = ?
    ) AND active = 1
    GROUP BY category
    ORDER BY count DESC
  `).all(neighborhoodId) as Array<{ category: string; count: number }>;

  // Get hotel count for the city (neighborhoods don't directly have hotels)
  const hotelCount = db.prepare(`
    SELECT COUNT(*) as count
    FROM hotels 
    WHERE city_id = (
      SELECT city_id FROM neighborhoods WHERE id = ?
    ) AND active = 1
  `).get(neighborhoodId) as { count: number };

  // Calculate stats
  const totalVenues = venueStats.reduce((sum, stat) => sum + stat.count, 0);
  const restaurantCount = venueStats.find(s => s.category.toLowerCase().includes('restaurant'))?.count || 0;
  const barCount = venueStats.find(s => s.category.toLowerCase().includes('bar'))?.count || 0;
  const cafeCount = venueStats.find(s => s.category.toLowerCase().includes('cafe'))?.count || 0;
  const activityCount = venueStats.find(s => s.category.toLowerCase().includes('activit'))?.count || 0;

  return {
    venue_count: totalVenues,
    hotel_count: hotelCount.count,
    restaurant_count: restaurantCount,
    bar_count: barCount,
    cafe_count: cafeCount,
    activity_count: activityCount,
    avg_price_level: 2.5, // TODO: Calculate from actual venue data
    top_categories: venueStats.slice(0, 5)
  };
}

export function getFeaturedNeighborhoods(limit = 10): NeighborhoodWithLocation[] {
  const db = getDatabase();
  return db.prepare(`
    SELECT * FROM neighborhoods_with_location 
    WHERE featured = 1 AND active = 1 
    ORDER BY city_name, name 
    LIMIT ?
  `).all(limit) as NeighborhoodWithLocation[];
}

export function searchNeighborhoods(query: string, cityId?: number): NeighborhoodWithLocation[] {
  const db = getDatabase();
  let sql = `
    SELECT * FROM neighborhoods_with_location 
    WHERE active = 1 AND (
      name LIKE ? OR 
      description LIKE ? OR
      characteristics LIKE ? OR
      best_for LIKE ?
    )
  `;
  const searchTerm = `%${query}%`;
  const params: (string | number)[] = [searchTerm, searchTerm, searchTerm, searchTerm];

  if (cityId) {
    sql += ' AND city_id = ?';
    params.push(cityId);
  }

  sql += ' ORDER BY featured DESC, name ASC LIMIT 20';

  return db.prepare(sql).all(...params) as NeighborhoodWithLocation[];
}