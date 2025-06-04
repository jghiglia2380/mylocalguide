import { GooglePlacesClient, YelpClient } from './api-clients';
import { getDatabase } from '@lib/database';
import { generateVenueContent } from './content-generator';

export interface VenueData {
  name: string;
  address: string;
  phone?: string;
  website?: string;
  description?: string;
  category: string;
  neighborhood: string;
  rating?: number;
  priceLevel?: number;
  hours?: any;
  photos?: string[];
  googlePlaceId?: string;
  yelpId?: string;
  source: 'google' | 'yelp' | 'manual';
}

export class VenueScraper {
  private googleClient: GooglePlacesClient;
  private yelpClient: YelpClient;
  private db: any;

  constructor(googleApiKey: string, yelpApiKey: string) {
    this.googleClient = new GooglePlacesClient(googleApiKey);
    this.yelpClient = new YelpClient(yelpApiKey);
    this.db = getDatabase();
  }

  // SF neighborhoods for comprehensive coverage
  private neighborhoods = [
    'Mission District', 'Castro', 'Marina District', 'North Beach',
    'Chinatown', 'SoMa', 'Financial District', 'Union Square',
    'Hayes Valley', 'Pacific Heights', 'Fillmore', 'Richmond',
    'Sunset', 'Haight-Ashbury', 'Noe Valley', 'Potrero Hill'
  ];

  // Category mapping for targeted searches
  private categorySearches = [
    { category: 'restaurants', queries: ['restaurant', 'dining', 'bistro', 'cafe'] },
    { category: 'bars', queries: ['bar', 'pub', 'cocktail lounge', 'brewery'] },
    { category: 'coffee', queries: ['coffee shop', 'cafe', 'espresso bar'] },
    { category: 'entertainment', queries: ['theater', 'club', 'live music', 'comedy'] },
    { category: 'shopping', queries: ['boutique', 'store', 'shop', 'market'] },
    { category: 'services', queries: ['salon', 'spa', 'gym', 'clinic'] }
  ];

  async scrapeAllVenues(maxVenuesPerCategory = 50): Promise<VenueData[]> {
    console.log('🎯 Starting comprehensive SF venue scraping...');
    const allVenues: VenueData[] = [];

    for (const neighborhood of this.neighborhoods) {
      console.log(`📍 Scraping ${neighborhood}...`);
      
      for (const { category, queries } of this.categorySearches) {
        for (const query of queries) {
          try {
            const searchQuery = `${query} in ${neighborhood}, San Francisco`;
            
            // Get venues from both Google and Yelp
            const [googleVenues, yelpVenues] = await Promise.all([
              this.googleClient.searchVenues(searchQuery),
              this.yelpClient.searchBusinesses(query, `${neighborhood}, San Francisco, CA`, Math.floor(maxVenuesPerCategory / 4))
            ]);

            // Process and deduplicate venues
            const processedVenues = await this.processVenues(
              [...googleVenues, ...yelpVenues], 
              category, 
              neighborhood
            );

            allVenues.push(...processedVenues);
            
            // Rate limiting - respect API limits
            await this.delay(1000);
            
          } catch (error) {
            console.error(`❌ Error scraping ${query} in ${neighborhood}:`, error);
            continue;
          }
        }
      }
    }

    console.log(`✅ Scraped ${allVenues.length} total venues`);
    return this.deduplicateVenues(allVenues);
  }

  private async processVenues(venues: any[], category: string, neighborhood: string): Promise<VenueData[]> {
    const processed: VenueData[] = [];

    for (const venue of venues) {
      try {
        // Standardize venue data from different sources
        const standardized = this.standardizeVenueData(venue, category, neighborhood);
        
        // Generate AI content for the venue
        const enhancedDescription = await generateVenueContent(standardized);
        standardized.description = enhancedDescription;

        processed.push(standardized);
      } catch (error) {
        console.error('Error processing venue:', error);
        continue;
      }
    }

    return processed;
  }

  private standardizeVenueData(venue: any, category: string, neighborhood: string): VenueData {
    // Handle Google Places format
    if (venue.place_id) {
      return {
        name: venue.name,
        address: venue.formatted_address || venue.vicinity,
        phone: venue.formatted_phone_number,
        website: venue.website,
        category,
        neighborhood,
        rating: venue.rating,
        priceLevel: venue.price_level,
        hours: venue.opening_hours,
        photos: venue.photos?.map((p: any) => p.photo_reference) || [],
        googlePlaceId: venue.place_id,
        source: 'google'
      };
    }

    // Handle Yelp format
    if (venue.id) {
      return {
        name: venue.name,
        address: venue.location?.display_address?.join(', ') || '',
        phone: venue.display_phone,
        website: venue.url,
        category,
        neighborhood,
        rating: venue.rating,
        priceLevel: venue.price ? venue.price.length : undefined,
        photos: venue.photos || [],
        yelpId: venue.id,
        source: 'yelp'
      };
    }

    // Fallback for unknown format
    return {
      name: venue.name || 'Unknown Venue',
      address: venue.address || '',
      category,
      neighborhood,
      source: 'manual'
    };
  }

  private deduplicateVenues(venues: VenueData[]): VenueData[] {
    const seen = new Set<string>();
    const unique: VenueData[] = [];

    for (const venue of venues) {
      // Create a normalized key for deduplication
      const key = `${venue.name.toLowerCase().trim()}-${venue.address.toLowerCase().trim()}`;
      
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(venue);
      }
    }

    console.log(`🔍 Deduplicated ${venues.length} venues to ${unique.length} unique venues`);
    return unique;
  }

  async saveVenuesToDatabase(venues: VenueData[]): Promise<void> {
    console.log(`💾 Saving ${venues.length} venues to database...`);

    const insertVenue = this.db.prepare(`
      INSERT OR REPLACE INTO venues (
        name, description, address, phone, website, category, neighborhood,
        rating, price_level, hours, photos, google_place_id, yelp_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = this.db.transaction((venues: VenueData[]) => {
      for (const venue of venues) {
        insertVenue.run(
          venue.name,
          venue.description || '',
          venue.address,
          venue.phone || null,
          venue.website || null,
          venue.category,
          venue.neighborhood,
          venue.rating || null,
          venue.priceLevel || null,
          venue.hours ? JSON.stringify(venue.hours) : null,
          venue.photos ? JSON.stringify(venue.photos) : null,
          venue.googlePlaceId || null,
          venue.yelpId || null
        );
      }
    });

    insertMany(venues);
    console.log('✅ All venues saved to database');
  }

  // Incremental update for ongoing maintenance
  async updateExistingVenues(): Promise<void> {
    console.log('🔄 Updating existing venue data...');
    
    const existingVenues = this.db.prepare('SELECT * FROM venues WHERE google_place_id IS NOT NULL OR yelp_id IS NOT NULL').all();
    
    for (const venue of existingVenues) {
      try {
        let updatedData = null;
        
        if (venue.google_place_id) {
          updatedData = await this.googleClient.getPlaceDetails(venue.google_place_id);
        } else if (venue.yelp_id) {
          updatedData = await this.yelpClient.getBusinessDetails(venue.yelp_id);
        }

        if (updatedData) {
          const standardized = this.standardizeVenueData(updatedData, venue.category, venue.neighborhood);
          await this.updateVenueInDatabase(venue.id, standardized);
        }

        // Rate limiting
        await this.delay(500);
      } catch (error) {
        console.error(`Error updating venue ${venue.name}:`, error);
        continue;
      }
    }
  }

  private async updateVenueInDatabase(id: number, venueData: VenueData): Promise<void> {
    const updateVenue = this.db.prepare(`
      UPDATE venues SET 
        rating = ?, hours = ?, photos = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    updateVenue.run(
      venueData.rating || null,
      venueData.hours ? JSON.stringify(venueData.hours) : null,
      venueData.photos ? JSON.stringify(venueData.photos) : null,
      id
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Quality scoring for venue ranking
  calculateVenueScore(venue: VenueData): number {
    let score = 0;
    
    // Rating weight (0-5 stars = 0-50 points)
    if (venue.rating) score += venue.rating * 10;
    
    // Complete profile bonus
    if (venue.description) score += 10;
    if (venue.phone) score += 5;
    if (venue.website) score += 5;
    if (venue.photos && venue.photos.length > 0) score += 10;
    
    // Source reliability
    if (venue.googlePlaceId && venue.yelpId) score += 15; // Both sources
    else if (venue.googlePlaceId || venue.yelpId) score += 10; // One source
    
    return Math.min(score, 100); // Cap at 100
  }
}

export async function runVenueScrapingPipeline(
  googleApiKey: string, 
  yelpApiKey: string,
  maxVenuesPerCategory = 50
): Promise<{ success: boolean; venueCount: number; errors: string[] }> {
  const scraper = new VenueScraper(googleApiKey, yelpApiKey);
  const errors: string[] = [];
  
  try {
    console.log('🚀 Starting venue scraping pipeline...');
    
    // Scrape all venues
    const venues = await scraper.scrapeAllVenues(maxVenuesPerCategory);
    
    // Calculate scores for ranking
    venues.forEach(venue => {
      (venue as any).score = scraper.calculateVenueScore(venue);
    });
    
    // Sort by score (highest first)
    venues.sort((a, b) => ((b as any).score || 0) - ((a as any).score || 0));
    
    // Save to database
    await scraper.saveVenuesToDatabase(venues);
    
    console.log(`✅ Pipeline completed successfully with ${venues.length} venues`);
    
    return {
      success: true,
      venueCount: venues.length,
      errors
    };
    
  } catch (error) {
    console.error('❌ Pipeline failed:', error);
    errors.push(error instanceof Error ? error.message : 'Unknown error');
    
    return {
      success: false,
      venueCount: 0,
      errors
    };
  }
}