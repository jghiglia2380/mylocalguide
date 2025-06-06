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
      const url = `/textsearch/json`;
      const params = {
        query: `${query} in ${location}`,
        key: this.apiKey,
      };
      
      console.log('Google API request:', { url, params: { ...params, key: '***' } });
      
      const response = await this.client.get(url, { params });
      
      console.log('Google API response status:', response.data.status);
      console.log('Google API results count:', response.data.results?.length || 0);
      
      if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
        console.error('Google API error status:', response.data.status);
        console.error('Error message:', response.data.error_message);
      }

      return response.data.results || [];
    } catch (error: any) {
      console.error('Google Places API error:', error.response?.data || error.message);
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

// OpenTable API Client
export class OpenTableClient {
  private client: AxiosInstance;
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENTABLE_API_KEY || '';
    this.client = axios.create({
      baseURL: 'https://platform.opentable.com/sync',
      timeout: 10000,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
    });
  }

  async searchRestaurants(location: string = 'San Francisco, CA', limit: number = 50): Promise<any[]> {
    await googleRateLimiter.consume(1);

    try {
      const response = await this.client.get('/listings', {
        params: {
          city: 'San Francisco',
          state: 'CA',
          country: 'US',
          per_page: limit,
          include_unavailable: false
        }
      });

      return response.data.items || [];
    } catch (error) {
      console.error('OpenTable API error:', error);
      return [];
    }
  }

  async getRestaurantDetails(restaurantId: string): Promise<any> {
    await googleRateLimiter.consume(1);

    try {
      const response = await this.client.get(`/listings/${restaurantId}`);
      return response.data || {};
    } catch (error) {
      console.error('OpenTable Details API error:', error);
      return {};
    }
  }
}

// TripAdvisor API Client
export class TripAdvisorClient {
  private client: AxiosInstance;
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.TRIPADVISOR_API_KEY || '';
    this.client = axios.create({
      baseURL: 'https://api.content.tripadvisor.com/api/v1',
      timeout: 10000,
      headers: {
        'accept': 'application/json',
        'X-TripAdvisor-API-Key': this.apiKey
      },
    });
  }

  async searchLocations(query: string, location: string = 'San Francisco'): Promise<any[]> {
    await yelpRateLimiter.consume(1);

    try {
      const response = await this.client.get('/location/search', {
        params: {
          searchQuery: `${query} ${location}`,
          category: 'restaurants',
          phone: '',
          address: location,
          latLong: '37.7749,-122.4194', // SF coordinates
          radius: '10',
          radiusUnit: 'mi',
          language: 'en'
        }
      });

      return response.data.data || [];
    } catch (error) {
      console.error('TripAdvisor API error:', error);
      return [];
    }
  }

  async getLocationDetails(locationId: string): Promise<any> {
    await yelpRateLimiter.consume(1);

    try {
      const response = await this.client.get(`/location/${locationId}/details`, {
        params: {
          language: 'en',
          currency: 'USD'
        }
      });

      return response.data || {};
    } catch (error) {
      console.error('TripAdvisor Details API error:', error);
      return {};
    }
  }

  async getLocationReviews(locationId: string): Promise<any[]> {
    await yelpRateLimiter.consume(1);

    try {
      const response = await this.client.get(`/location/${locationId}/reviews`, {
        params: {
          language: 'en'
        }
      });

      return response.data.data || [];
    } catch (error) {
      console.error('TripAdvisor Reviews API error:', error);
      return [];
    }
  }
}

// Airbnb Experiences API Client (using unofficial API)
export class AirbnbExperiencesClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: 'https://www.airbnb.com/api/v3',
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MyLocalGuideBot/1.0)',
        'Accept': 'application/json'
      },
    });
  }

  async searchExperiences(location: string = 'San Francisco, CA', limit: number = 50): Promise<any[]> {
    await yelpRateLimiter.consume(1);

    try {
      // Using Airbnb's search endpoint for experiences
      const response = await this.client.get('/ExploreSearch', {
        params: {
          version: '1.8.1',
          satori_version: '1.2.0',
          source: 'EXPLORE',
          refinement_paths: ['/experiences'],
          query: location,
          adults: 1,
          price_max: 500,
          items_per_grid: limit,
          section_offset: 0,
          supports_for_you_v3: true,
          timezone_offset: -480, // PST offset
          metadata_only: false,
          is_standard_search: true,
          fetch_filters: true,
          has_zero_guest_treatment: false,
          is_web_search: true,
          refinement_search: false,
          flexible_trip_lengths: [1],
          date_picker_type: 'calendar',
          search_type: 'filter_change'
        }
      });

      // Extract experiences from the complex Airbnb response structure
      const sections = response.data?.explore_tabs?.[0]?.sections || [];
      const experiences = [];

      for (const section of sections) {
        if (section.listings) {
          experiences.push(...section.listings);
        }
      }

      return experiences.slice(0, limit);
    } catch (error) {
      console.error('Airbnb Experiences API error:', error);
      return [];
    }
  }

  async getExperienceDetails(experienceId: string): Promise<any> {
    await yelpRateLimiter.consume(1);

    try {
      const response = await this.client.get('/pdp_listing_details', {
        params: {
          listing_id: experienceId,
          adults: 1,
          children: 0,
          infants: 0
        }
      });

      return response.data?.pdp_listing_detail || {};
    } catch (error) {
      console.error('Airbnb Experience Details API error:', error);
      return {};
    }
  }
}

// Enhanced aggregator with new sources
export class EnhancedVenueDataAggregator extends VenueDataAggregator {
  private openTableClient: OpenTableClient;
  private tripAdvisorClient: TripAdvisorClient;
  private airbnbClient: AirbnbExperiencesClient;

  constructor() {
    super();
    this.openTableClient = new OpenTableClient();
    this.tripAdvisorClient = new TripAdvisorClient();
    this.airbnbClient = new AirbnbExperiencesClient();
  }

  async searchAllSources(query: string, neighborhood?: string): Promise<{
    google: any[];
    yelp: any[];
    openTable: any[];
    tripAdvisor: any[];
    airbnbExperiences: any[];
  }> {
    const baseResults = await this.searchVenuesByCategory(query, neighborhood);
    
    const [openTableResults, tripAdvisorResults, airbnbResults] = await Promise.all([
      this.openTableClient.searchRestaurants(`${neighborhood}, San Francisco`),
      this.tripAdvisorClient.searchLocations(query, `${neighborhood}, San Francisco`),
      this.airbnbClient.searchExperiences(`${neighborhood}, San Francisco`)
    ]);

    return {
      google: baseResults.google,
      yelp: baseResults.yelp,
      openTable: openTableResults,
      tripAdvisor: tripAdvisorResults,
      airbnbExperiences: airbnbResults
    };
  }

  aggregateAllSourcesRating(
    googleData: any, 
    yelpData: any, 
    openTableData: any, 
    tripAdvisorData: any
  ): {
    aggregatedRating: number;
    totalReviews: number;
    confidence: number;
    sources: string[];
  } {
    const ratings: Array<{rating: number, reviews: number, source: string}> = [];

    if (googleData.rating) {
      ratings.push({
        rating: googleData.rating,
        reviews: googleData.user_ratings_total || 0,
        source: 'Google'
      });
    }

    if (yelpData.rating) {
      ratings.push({
        rating: yelpData.rating,
        reviews: yelpData.review_count || 0,
        source: 'Yelp'
      });
    }

    if (openTableData.score) {
      ratings.push({
        rating: openTableData.score,
        reviews: openTableData.reviews_count || 0,
        source: 'OpenTable'
      });
    }

    if (tripAdvisorData.rating) {
      ratings.push({
        rating: tripAdvisorData.rating,
        reviews: tripAdvisorData.num_reviews || 0,
        source: 'TripAdvisor'
      });
    }

    if (ratings.length === 0) {
      return { aggregatedRating: 0, totalReviews: 0, confidence: 0, sources: [] };
    }

    const totalReviews = ratings.reduce((sum, r) => sum + r.reviews, 0);
    const weightedRating = ratings.reduce((sum, r) => sum + (r.rating * r.reviews), 0) / totalReviews;
    const confidence = Math.min(ratings.length * 0.25, 1.0); // Higher confidence with more sources

    return {
      aggregatedRating: Number(weightedRating.toFixed(2)),
      totalReviews,
      confidence: Number(confidence.toFixed(2)),
      sources: ratings.map(r => r.source)
    };
  }
}

// Factory function for easy instantiation
export function createVenueAggregator(): VenueDataAggregator {
  return new VenueDataAggregator();
}

export function createEnhancedVenueAggregator(): EnhancedVenueDataAggregator {
  return new EnhancedVenueDataAggregator();
}