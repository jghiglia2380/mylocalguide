import Database from 'better-sqlite3';

interface VenueSource {
  google_maps_id?: string;
  yelp_id?: string;
  tripadvisor_id?: string;
  foursquare_id?: string;
  opentable_id?: string;
}

interface AggregatedVenue {
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
  
  // Calculated fields
  aggregate_rating: number;
  total_review_count: number;
  popularity_score: number;
  quality_score: number;
  
  // Additional data
  hours: any;
  amenities: string[];
  tags: string[];
  photos: string[];
  menu_url?: string;
  reservation_url?: string;
  delivery_apps?: string[];
  
  // Metadata
  last_updated: Date;
  data_sources: VenueSource;
}

export class VenueAggregator {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  /**
   * Calculate aggregate rating with weighted average based on review counts
   */
  calculateAggregateRating(venue: Partial<AggregatedVenue>): number {
    const ratings = [
      { rating: venue.google_rating, count: venue.google_review_count || 0, weight: 1.2 }, // Google slightly higher weight
      { rating: venue.yelp_rating, count: venue.yelp_review_count || 0, weight: 1.0 },
      { rating: venue.tripadvisor_rating, count: venue.tripadvisor_review_count || 0, weight: 1.1 },
      { rating: venue.foursquare_rating, count: venue.foursquare_review_count || 0, weight: 0.8 }
    ].filter(r => r.rating && r.rating > 0);

    if (ratings.length === 0) return 0;

    const totalWeight = ratings.reduce((sum, r) => sum + (r.count * r.weight), 0);
    const weightedSum = ratings.reduce((sum, r) => sum + (r.rating! * r.count * r.weight), 0);

    return Math.round((weightedSum / totalWeight) * 100) / 100;
  }

  /**
   * Calculate popularity score based on review velocity and total count
   */
  calculatePopularityScore(venue: Partial<AggregatedVenue>): number {
    const totalReviews = (venue.google_review_count || 0) + 
                        (venue.yelp_review_count || 0) + 
                        (venue.tripadvisor_review_count || 0) + 
                        (venue.foursquare_review_count || 0);

    // Logarithmic scale to handle venues with thousands of reviews
    const reviewScore = Math.log10(totalReviews + 1) * 20;
    
    // Rating bonus (higher ratings get popularity boost)
    const ratingBonus = (venue.aggregate_rating || 0) * 10;
    
    return Math.min(100, reviewScore + ratingBonus);
  }

  /**
   * Calculate quality score combining ratings, consistency, and recent trends
   */
  calculateQualityScore(venue: Partial<AggregatedVenue>): number {
    const ratings = [
      venue.google_rating,
      venue.yelp_rating,
      venue.tripadvisor_rating,
      venue.foursquare_rating
    ].filter((r): r is number => r !== undefined && r !== null && r > 0);

    if (ratings.length === 0) return 0;

    // Average rating
    const avgRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
    
    // Consistency (lower variance is better)
    const variance = ratings.reduce((sum, r) => sum + Math.pow(r - avgRating, 2), 0) / ratings.length;
    const consistencyScore = Math.max(0, 100 - (variance * 50));
    
    // Combine average rating and consistency
    return Math.round((avgRating * 15 + consistencyScore * 0.3) * 10) / 10;
  }

  /**
   * Import venues in bulk from scraped data
   */
  async importBulkVenues(venues: Partial<AggregatedVenue>[]): Promise<number> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO venues_aggregated (
        name, address, city, state, zip, latitude, longitude, 
        phone, website, category, subcategory, cuisine_type, price_range,
        google_rating, google_review_count, yelp_rating, yelp_review_count,
        tripadvisor_rating, tripadvisor_review_count, foursquare_rating, foursquare_review_count,
        aggregate_rating, total_review_count, popularity_score, quality_score,
        hours, amenities, tags, photos, menu_url, reservation_url, delivery_apps,
        last_updated, google_maps_id, yelp_id, tripadvisor_id, foursquare_id, opentable_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let importCount = 0;
    
    for (const venue of venues) {
      // Calculate aggregate scores
      venue.aggregate_rating = this.calculateAggregateRating(venue);
      venue.total_review_count = (venue.google_review_count || 0) + 
                                (venue.yelp_review_count || 0) + 
                                (venue.tripadvisor_review_count || 0) + 
                                (venue.foursquare_review_count || 0);
      venue.popularity_score = this.calculatePopularityScore(venue);
      venue.quality_score = this.calculateQualityScore(venue);

      try {
        stmt.run(
          venue.name,
          venue.address,
          venue.city || 'San Francisco',
          venue.state || 'CA',
          venue.zip,
          venue.latitude,
          venue.longitude,
          venue.phone,
          venue.website,
          venue.category,
          venue.subcategory,
          venue.cuisine_type,
          venue.price_range || 2,
          venue.google_rating,
          venue.google_review_count,
          venue.yelp_rating,
          venue.yelp_review_count,
          venue.tripadvisor_rating,
          venue.tripadvisor_review_count,
          venue.foursquare_rating,
          venue.foursquare_review_count,
          venue.aggregate_rating,
          venue.total_review_count,
          venue.popularity_score,
          venue.quality_score,
          JSON.stringify(venue.hours || {}),
          JSON.stringify(venue.amenities || []),
          JSON.stringify(venue.tags || []),
          JSON.stringify(venue.photos || []),
          venue.menu_url,
          venue.reservation_url,
          JSON.stringify(venue.delivery_apps || []),
          new Date().toISOString(),
          venue.data_sources?.google_maps_id,
          venue.data_sources?.yelp_id,
          venue.data_sources?.tripadvisor_id,
          venue.data_sources?.foursquare_id,
          venue.data_sources?.opentable_id
        );
        importCount++;
      } catch (error) {
        console.error(`Failed to import venue ${venue.name}:`, error);
      }
    }

    return importCount;
  }

  /**
   * Get top venues by category and neighborhood
   */
  getTopVenues(params: {
    category?: string;
    neighborhood?: string;
    cuisine?: string;
    limit?: number;
    sortBy?: 'quality' | 'popularity' | 'rating' | 'reviews';
  }) {
    let query = `
      SELECT v.*, n.name as neighborhood_name 
      FROM venues_aggregated v
      LEFT JOIN neighborhoods n ON ST_Contains(n.geometry, v.location)
      WHERE 1=1
    `;
    
    const queryParams: any[] = [];
    
    if (params.category) {
      query += ' AND v.category = ?';
      queryParams.push(params.category);
    }
    
    if (params.neighborhood) {
      query += ' AND n.name = ?';
      queryParams.push(params.neighborhood);
    }
    
    if (params.cuisine) {
      query += ' AND v.cuisine_type = ?';
      queryParams.push(params.cuisine);
    }
    
    // Sorting
    switch (params.sortBy) {
      case 'quality':
        query += ' ORDER BY v.quality_score DESC';
        break;
      case 'popularity':
        query += ' ORDER BY v.popularity_score DESC';
        break;
      case 'rating':
        query += ' ORDER BY v.aggregate_rating DESC';
        break;
      case 'reviews':
        query += ' ORDER BY v.total_review_count DESC';
        break;
      default:
        query += ' ORDER BY v.quality_score DESC, v.popularity_score DESC';
    }
    
    query += ' LIMIT ?';
    queryParams.push(params.limit || 50);
    
    const stmt = this.db.prepare(query);
    return stmt.all(...queryParams);
  }

  /**
   * Get venue statistics for a neighborhood
   */
  getNeighborhoodStats(neighborhoodName: string) {
    const stats = this.db.prepare(`
      SELECT 
        COUNT(*) as total_venues,
        COUNT(DISTINCT category) as categories,
        COUNT(DISTINCT cuisine_type) as cuisines,
        AVG(aggregate_rating) as avg_rating,
        SUM(total_review_count) as total_reviews,
        COUNT(CASE WHEN aggregate_rating >= 4.5 THEN 1 END) as excellent_venues,
        COUNT(CASE WHEN aggregate_rating >= 4.0 THEN 1 END) as great_venues
      FROM venues_aggregated v
      LEFT JOIN neighborhoods n ON ST_Contains(n.geometry, v.location)
      WHERE n.name = ?
    `).get(neighborhoodName) || {};

    const topCategories = this.db.prepare(`
      SELECT category, COUNT(*) as count
      FROM venues_aggregated v
      LEFT JOIN neighborhoods n ON ST_Contains(n.geometry, v.location)
      WHERE n.name = ?
      GROUP BY category
      ORDER BY count DESC
      LIMIT 5
    `).all(neighborhoodName);

    return { ...stats, topCategories };
  }
}