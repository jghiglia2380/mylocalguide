import axios, { AxiosInstance } from 'axios';
import { RateLimiterMemory } from 'rate-limiter-flexible';

// Rate limiters for different APIs
const googleRateLimiter = new RateLimiterMemory({
  points: parseInt(process.env.GOOGLE_API_REQUESTS_PER_HOUR || '1000'),
  duration: 3600, // per hour
});

const yelpRateLimiter = new RateLimiterMemory({
  points: parseInt(process.env.YELP_API_REQUESTS_PER_HOUR || '5000'),
  duration: 3600, // per hour
});

// Google Places API Client
export class GooglePlacesClient {
  private client: AxiosInstance;
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GOOGLE_PLACES_API_KEY || '';
    this.client = axios.create({
      baseURL: 'https://maps.googleapis.com/maps/api/place',
      timeout: 10000,
    });
  }

  async searchVenues(query: string, location: string = 'San Francisco, CA'): Promise<any[]> {
    await googleRateLimiter.consume(1);
    
    try {
      const response = await this.client.get('/textsearch/json', {
        params: {
          query: `${query} ${location}`,
          key: this.apiKey,
          type: 'establishment',
          region: 'us'
        }
      });

      return response.data.results || [];
    } catch (error) {
      console.error('Google Places API error:', error);
      return [];
    }
  }

  async getPlaceDetails(placeId: string): Promise<any> {
    await googleRateLimiter.consume(1);

    try {
      const response = await this.client.get('/details/json', {
        params: {
          place_id: placeId,
          key: this.apiKey,
          fields: 'name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,price_level,opening_hours,photos,geometry,types,reviews'
        }
      });

      return response.data.result || {};
    } catch (error) {
      console.error('Google Places Details API error:', error);
      return {};
    }
  }

  async searchByCategory(category: string, neighborhood?: string): Promise<any[]> {
    const locationQuery = neighborhood ? 
      `${category} in ${neighborhood}, San Francisco, CA` : 
      `${category} San Francisco, CA`;
    
    return this.searchVenues(locationQuery);
  }
}

// Yelp Fusion API Client
export class YelpClient {
  private client: AxiosInstance;
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.YELP_API_KEY || '';
    this.client = axios.create({
      baseURL: 'https://api.yelp.com/v3',
      timeout: 10000,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    });
  }

  async searchBusinesses(term: string, location: string = 'San Francisco, CA', limit: number = 50): Promise<any[]> {
    await yelpRateLimiter.consume(1);

    try {
      const response = await this.client.get('/businesses/search', {
        params: {
          term,
          location,
          limit: Math.min(limit, 50), // Yelp max is 50
          sort_by: 'rating',
          radius: 40000 // 40km radius for SF area
        }
      });

      return response.data.businesses || [];
    } catch (error) {
      console.error('Yelp API error:', error);
      return [];
    }
  }

  async getBusinessDetails(businessId: string): Promise<any> {
    await yelpRateLimiter.consume(1);

    try {
      const response = await this.client.get(`/businesses/${businessId}`);
      return response.data || {};
    } catch (error) {
      console.error('Yelp Business Details API error:', error);
      return {};
    }
  }

  async searchByCategory(category: string, neighborhood?: string): Promise<any[]> {
    const location = neighborhood ? 
      `${neighborhood}, San Francisco, CA` : 
      'San Francisco, CA';
    
    return this.searchBusinesses(category, location);
  }
}

// Combined API client for aggregating data
export class VenueDataAggregator {
  private googleClient: GooglePlacesClient;
  private yelpClient: YelpClient;

  constructor() {
    this.googleClient = new GooglePlacesClient();
    this.yelpClient = new YelpClient();
  }

  async searchVenuesByCategory(category: string, neighborhood?: string): Promise<{
    google: any[];
    yelp: any[];
  }> {
    console.log(`Searching for ${category} venues${neighborhood ? ` in ${neighborhood}` : ''}`);

    // Search both APIs in parallel
    const [googleResults, yelpResults] = await Promise.all([
      this.googleClient.searchByCategory(category, neighborhood),
      this.yelpClient.searchByCategory(category, neighborhood)
    ]);

    return {
      google: googleResults,
      yelp: yelpResults
    };
  }

  async getEnhancedVenueData(venueName: string, address: string): Promise<{
    google: any;
    yelp: any;
    aggregatedRating: number;
    totalReviews: number;
    confidence: number;
  }> {
    // Search for specific venue on both platforms
    const [googleSearch, yelpSearch] = await Promise.all([
      this.googleClient.searchVenues(`${venueName} ${address}`),
      this.yelpClient.searchBusinesses(venueName, address)
    ]);

    let googleData = {};
    let yelpData = {};

    // Get detailed data if found
    if (googleSearch.length > 0) {
      googleData = await this.googleClient.getPlaceDetails(googleSearch[0].place_id);
    }

    if (yelpSearch.length > 0) {
      yelpData = await this.yelpClient.getBusinessDetails(yelpSearch[0].id);
    }

    // Calculate aggregated rating and confidence
    const { aggregatedRating, totalReviews, confidence } = this.calculateAggregatedRating(googleData, yelpData);

    return {
      google: googleData,
      yelp: yelpData,
      aggregatedRating,
      totalReviews,
      confidence
    };
  }

  private calculateAggregatedRating(googleData: any, yelpData: any): {
    aggregatedRating: number;
    totalReviews: number;
    confidence: number;
  } {
    const googleRating = googleData.rating || 0;
    const googleReviews = googleData.user_ratings_total || 0;
    const yelpRating = yelpData.rating || 0;
    const yelpReviews = yelpData.review_count || 0;

    const totalReviews = googleReviews + yelpReviews;

    if (totalReviews === 0) {
      return { aggregatedRating: 0, totalReviews: 0, confidence: 0 };
    }

    // Weighted average based on review count
    const weightedRating = (
      (googleRating * googleReviews) + 
      (yelpRating * yelpReviews)
    ) / totalReviews;

    // Confidence score based on total reviews and platform agreement
    const ratingDifference = Math.abs(googleRating - yelpRating);
    const baseConfidence = Math.min(totalReviews / 100, 1); // Max confidence at 100+ reviews
    const agreementBonus = Math.max(0, (1 - ratingDifference / 5)) * 0.2; // Bonus for similar ratings
    const confidence = Math.min(baseConfidence + agreementBonus, 1);

    return {
      aggregatedRating: Number(weightedRating.toFixed(1)),
      totalReviews,
      confidence: Number(confidence.toFixed(2))
    };
  }
}

// Factory function for easy instantiation
export function createVenueAggregator(): VenueDataAggregator {
  return new VenueDataAggregator();
}