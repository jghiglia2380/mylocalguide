import Database from 'better-sqlite3';

export interface ComprehensiveVenue {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  latitude: number;
  longitude: number;
  phone?: string;
  website?: string;
  category: string;
  subcategory: string;
  cuisine_type?: string;
  price_range: number;
  
  // Aggregated ratings
  google_rating?: number;
  google_review_count?: number;
  yelp_rating?: number;
  yelp_review_count?: number;
  tripadvisor_rating?: number;
  tripadvisor_review_count?: number;
  foursquare_rating?: number;
  foursquare_review_count?: number;
  
  aggregate_rating: number;
  total_review_count: number;
  popularity_score: number;
  quality_score: number;
  
  hours?: any;
  amenities?: string[];
  tags?: string[];
  photos?: string[];
  menu_url?: string;
  reservation_url?: string;
  delivery_apps?: string[];
  
  last_updated: string;
}

export class ComprehensiveVenueDB {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  /**
   * Get venues for a neighborhood with comprehensive filtering
   */
  getNeighborhoodVenues(params: {
    neighborhood: string;
    category?: string;
    subcategory?: string;
    cuisine?: string;
    priceRange?: number[];
    minRating?: number;
    amenities?: string[];
    sortBy?: 'rating' | 'reviews' | 'quality' | 'popularity' | 'distance';
    limit?: number;
    offset?: number;
  }): ComprehensiveVenue[] {
    let query = `
      SELECT * FROM venues_aggregated
      WHERE 1=1
    `;
    const queryParams: any[] = [];

    // Neighborhood filter (using address for now, would use geometry in production)
    if (params.neighborhood) {
      query += ` AND address LIKE ?`;
      queryParams.push(`%${params.neighborhood}%`);
    }

    if (params.category) {
      query += ` AND category = ?`;
      queryParams.push(params.category);
    }

    if (params.subcategory) {
      query += ` AND subcategory = ?`;
      queryParams.push(params.subcategory);
    }

    if (params.cuisine) {
      query += ` AND cuisine_type = ?`;
      queryParams.push(params.cuisine);
    }

    if (params.priceRange && params.priceRange.length > 0) {
      query += ` AND price_range IN (${params.priceRange.map(() => '?').join(',')})`;
      queryParams.push(...params.priceRange);
    }

    if (params.minRating) {
      query += ` AND aggregate_rating >= ?`;
      queryParams.push(params.minRating);
    }

    // Sorting
    switch (params.sortBy) {
      case 'rating':
        query += ` ORDER BY aggregate_rating DESC, total_review_count DESC`;
        break;
      case 'reviews':
        query += ` ORDER BY total_review_count DESC`;
        break;
      case 'quality':
        query += ` ORDER BY quality_score DESC`;
        break;
      case 'popularity':
        query += ` ORDER BY popularity_score DESC`;
        break;
      default:
        query += ` ORDER BY quality_score DESC, popularity_score DESC`;
    }

    // Pagination
    query += ` LIMIT ? OFFSET ?`;
    queryParams.push(params.limit || 50, params.offset || 0);

    const stmt = this.db.prepare(query);
    const results = stmt.all(...queryParams) as any[];

    return results.map(row => this.parseVenue(row));
  }

  /**
   * Get all unique cuisines/subcategories for filtering
   */
  getFilterOptions(neighborhood?: string): {
    categories: Array<{ name: string; count: number }>;
    cuisines: Array<{ name: string; count: number }>;
    priceRanges: Array<{ level: number; count: number }>;
  } {
    let whereClause = '1=1';
    const params: any[] = [];

    if (neighborhood) {
      whereClause += ' AND address LIKE ?';
      params.push(`%${neighborhood}%`);
    }

    const categories = this.db.prepare(`
      SELECT category as name, COUNT(*) as count
      FROM venues_aggregated
      WHERE ${whereClause}
      GROUP BY category
      ORDER BY count DESC
    `).all(...params) as Array<{ name: string; count: number }>;

    const cuisines = this.db.prepare(`
      SELECT cuisine_type as name, COUNT(*) as count
      FROM venues_aggregated
      WHERE ${whereClause} AND cuisine_type IS NOT NULL
      GROUP BY cuisine_type
      ORDER BY count DESC
    `).all(...params) as Array<{ name: string; count: number }>;

    const priceRanges = this.db.prepare(`
      SELECT price_range as level, COUNT(*) as count
      FROM venues_aggregated
      WHERE ${whereClause} AND price_range IS NOT NULL
      GROUP BY price_range
      ORDER BY price_range
    `).all(...params) as Array<{ level: number; count: number }>;

    return { categories, cuisines, priceRanges };
  }

  /**
   * Search venues across all neighborhoods
   */
  searchVenues(query: string, limit: number = 20): ComprehensiveVenue[] {
    const searchQuery = `%${query}%`;
    
    const stmt = this.db.prepare(`
      SELECT * FROM venues_aggregated
      WHERE name LIKE ? 
         OR category LIKE ?
         OR subcategory LIKE ?
         OR cuisine_type LIKE ?
         OR address LIKE ?
         OR tags LIKE ?
      ORDER BY 
        CASE 
          WHEN name LIKE ? THEN 1
          WHEN subcategory LIKE ? THEN 2
          WHEN cuisine_type LIKE ? THEN 3
          ELSE 4
        END,
        quality_score DESC
      LIMIT ?
    `);

    const results = stmt.all(
      searchQuery, searchQuery, searchQuery, searchQuery, searchQuery, searchQuery,
      searchQuery, searchQuery, searchQuery,
      limit
    ) as any[];

    return results.map(row => this.parseVenue(row));
  }

  /**
   * Get venue details with all review sources
   */
  getVenueDetails(venueId: number): ComprehensiveVenue | null {
    const stmt = this.db.prepare(`
      SELECT * FROM venues_aggregated WHERE id = ?
    `);
    
    const result = stmt.get(venueId) as any;
    return result ? this.parseVenue(result) : null;
  }

  /**
   * Get trending venues (high quality + recent activity)
   */
  getTrendingVenues(limit: number = 10): ComprehensiveVenue[] {
    const stmt = this.db.prepare(`
      SELECT * FROM venues_aggregated
      WHERE aggregate_rating >= 4.0
        AND total_review_count >= 50
        AND last_updated >= datetime('now', '-7 days')
      ORDER BY 
        (quality_score * 0.7 + popularity_score * 0.3) DESC,
        total_review_count DESC
      LIMIT ?
    `);

    const results = stmt.all(limit) as any[];
    return results.map(row => this.parseVenue(row));
  }

  /**
   * Get neighborhood statistics
   */
  getNeighborhoodStats(neighborhood: string): {
    totalVenues: number;
    avgRating: number;
    topCategories: Array<{ category: string; count: number }>;
    priceDistribution: Array<{ price: number; count: number }>;
  } {
    const stats = this.db.prepare(`
      SELECT 
        COUNT(*) as totalVenues,
        AVG(aggregate_rating) as avgRating
      FROM venues_aggregated
      WHERE address LIKE ?
    `).get(`%${neighborhood}%`) as any;

    const topCategories = this.db.prepare(`
      SELECT category, COUNT(*) as count
      FROM venues_aggregated
      WHERE address LIKE ?
      GROUP BY category
      ORDER BY count DESC
      LIMIT 5
    `).all(`%${neighborhood}%`) as Array<{ category: string; count: number }>;

    const priceDistribution = this.db.prepare(`
      SELECT price_range as price, COUNT(*) as count
      FROM venues_aggregated
      WHERE address LIKE ? AND price_range IS NOT NULL
      GROUP BY price_range
      ORDER BY price_range
    `).all(`%${neighborhood}%`) as Array<{ price: number; count: number }>;

    return {
      totalVenues: stats.totalVenues || 0,
      avgRating: Math.round((stats.avgRating || 0) * 10) / 10,
      topCategories,
      priceDistribution
    };
  }

  private parseVenue(row: any): ComprehensiveVenue {
    return {
      id: row.id,
      name: row.name,
      address: row.address,
      city: row.city,
      state: row.state,
      zip: row.zip,
      latitude: row.latitude,
      longitude: row.longitude,
      phone: row.phone,
      website: row.website,
      category: row.category,
      subcategory: row.subcategory,
      cuisine_type: row.cuisine_type,
      price_range: row.price_range,
      
      google_rating: row.google_rating,
      google_review_count: row.google_review_count,
      yelp_rating: row.yelp_rating,
      yelp_review_count: row.yelp_review_count,
      tripadvisor_rating: row.tripadvisor_rating,
      tripadvisor_review_count: row.tripadvisor_review_count,
      foursquare_rating: row.foursquare_rating,
      foursquare_review_count: row.foursquare_review_count,
      
      aggregate_rating: row.aggregate_rating,
      total_review_count: row.total_review_count,
      popularity_score: row.popularity_score,
      quality_score: row.quality_score,
      
      hours: row.hours ? JSON.parse(row.hours) : undefined,
      amenities: row.amenities ? JSON.parse(row.amenities) : [],
      tags: row.tags ? JSON.parse(row.tags) : [],
      photos: row.photos ? JSON.parse(row.photos) : [],
      menu_url: row.menu_url,
      reservation_url: row.reservation_url,
      delivery_apps: row.delivery_apps ? JSON.parse(row.delivery_apps) : [],
      
      last_updated: row.last_updated
    };
  }
}