import { GooglePlacesClient } from './api-clients';

// Comprehensive SF neighborhood mapping with multiple fallback layers
export class SmartVenueMapper {
  private googleClient?: GooglePlacesClient;

  constructor(googleApiKey?: string) {
    if (googleApiKey) {
      this.googleClient = new GooglePlacesClient(googleApiKey);
    }
  }

  // Layer 1: Comprehensive zip code mapping
  private zipCodeMapping = new Map([
    ['94102', ['Hayes Valley', 'Tenderloin', 'Union Square', 'Civic Center']],
    ['94103', ['SoMa', 'Mission Bay']],
    ['94104', ['Financial District']],
    ['94105', ['SoMa', 'Rincon Hill']],
    ['94107', ['SoMa', 'Potrero Hill']],
    ['94108', ['Chinatown', 'Nob Hill']],
    ['94109', ['Nob Hill', 'Russian Hill']],
    ['94110', ['The Mission', 'Bernal Heights']],
    ['94111', ['Financial District', 'North Beach']],
    ['94112', ['Excelsior', 'Outer Mission']],
    ['94114', ['Castro', 'Noe Valley']],
    ['94115', ['Pacific Heights', 'Fillmore']],
    ['94116', ['Sunset District']],
    ['94117', ['Haight-Ashbury', 'Cole Valley']],
    ['94118', ['Richmond District', 'Laurel Heights']],
    ['94121', ['Richmond District']],
    ['94122', ['Sunset District']],
    ['94123', ['Marina District', 'Cow Hollow']],
    ['94124', ['Bayview', 'Hunters Point']],
    ['94127', ['West Portal', 'Forest Hill']],
    ['94129', ['Presidio']],
    ['94131', ['Glen Park', 'Diamond Heights']],
    ['94132', ['Lake Merced']],
    ['94133', ['North Beach', 'Telegraph Hill']],
    ['94134', ['Bayview']],
    ['94158', ['Mission Bay']]
  ]);

  // Layer 2: Street-based mapping with ranges
  private streetMapping = [
    // Mission District
    { street: 'Mission St', ranges: [[2000, 4000]], neighborhood: 'The Mission' },
    { street: 'Valencia St', ranges: [[500, 1500]], neighborhood: 'The Mission' },
    { street: '16th St', ranges: [[2800, 3800]], neighborhood: 'The Mission' },
    { street: '24th St', ranges: [[2800, 3800]], neighborhood: 'The Mission' },
    
    // Castro
    { street: 'Castro St', ranges: [[100, 600]], neighborhood: 'Castro' },
    { street: 'Market St', ranges: [[2000, 2500]], neighborhood: 'Castro' },
    
    // Marina
    { street: 'Chestnut St', ranges: [[2000, 3500]], neighborhood: 'Marina District' },
    { street: 'Union St', ranges: [[2000, 3500]], neighborhood: 'Marina District' },
    { street: 'Marina Blvd', ranges: [[1, 500]], neighborhood: 'Marina District' },
    
    // North Beach
    { street: 'Columbus Ave', ranges: [[200, 1000]], neighborhood: 'North Beach' },
    { street: 'Grant Ave', ranges: [[200, 800]], neighborhood: 'North Beach' },
    
    // Chinatown
    { street: 'Grant Ave', ranges: [[600, 1200]], neighborhood: 'Chinatown' },
    { street: 'Stockton St', ranges: [[600, 1200]], neighborhood: 'Chinatown' },
    
    // Haight
    { street: 'Haight St', ranges: [[1000, 2000]], neighborhood: 'Haight-Ashbury' },
    { street: 'Divisadero St', ranges: [[1400, 2000]], neighborhood: 'Haight-Ashbury' },
    
    // Hayes Valley
    { street: 'Hayes St', ranges: [[300, 800]], neighborhood: 'Hayes Valley' },
    { street: 'Octavia St', ranges: [[300, 800]], neighborhood: 'Hayes Valley' },
    
    // Richmond
    { street: 'Clement St', ranges: [[200, 4000]], neighborhood: 'Richmond District' },
    { street: 'Geary Blvd', ranges: [[200, 4000]], neighborhood: 'Richmond District' },
    
    // SoMa
    { street: 'Howard St', ranges: [[200, 2000]], neighborhood: 'SoMa' },
    { street: 'Folsom St', ranges: [[200, 2000]], neighborhood: 'SoMa' },
    { street: 'Bryant St', ranges: [[200, 2000]], neighborhood: 'SoMa' },
    
    // Financial District
    { street: 'Montgomery St', ranges: [[1, 800]], neighborhood: 'Financial District' },
    { street: 'California St', ranges: [[1, 800]], neighborhood: 'Financial District' },
    
    // Nob Hill
    { street: 'California St', ranges: [[800, 1800]], neighborhood: 'Nob Hill' },
    { street: 'Sacramento St', ranges: [[800, 1800]], neighborhood: 'Nob Hill' },
    
    // Pacific Heights
    { street: 'Fillmore St', ranges: [[1800, 2800]], neighborhood: 'Pacific Heights' },
    { street: 'Union St', ranges: [[1800, 2500]], neighborhood: 'Pacific Heights' }
  ];

  // Layer 3: Landmark and keyword mapping
  private landmarkMapping = new Map([
    // Parks and landmarks
    ['Crissy Field', 'Presidio'],
    ['Golden Gate Park', 'Haight-Ashbury'],
    ['Dolores Park', 'The Mission'],
    ['Washington Square', 'North Beach'],
    ['Union Square', 'Union Square'],
    ['Ferry Building', 'Financial District'],
    ['Pier 39', 'Fisherman\'s Wharf'],
    ['Ghirardelli Square', 'Fisherman\'s Wharf'],
    ['AT&T Park', 'SoMa'],
    ['Oracle Park', 'SoMa'],
    
    // Shopping areas
    ['Hayes Valley', 'Hayes Valley'],
    ['Castro District', 'Castro'],
    ['Mission District', 'The Mission'],
    ['North Beach', 'North Beach'],
    ['Chinatown', 'Chinatown'],
    ['Marina District', 'Marina District'],
    ['Pacific Heights', 'Pacific Heights'],
    ['Nob Hill', 'Nob Hill'],
    ['Russian Hill', 'Russian Hill'],
    ['Haight', 'Haight-Ashbury'],
    ['Haight-Ashbury', 'Haight-Ashbury'],
    ['Richmond', 'Richmond District'],
    ['Sunset', 'Sunset District'],
    ['SoMa', 'SoMa'],
    ['South of Market', 'SoMa'],
    ['Financial District', 'Financial District'],
    ['FiDi', 'Financial District'],
    ['Tenderloin', 'Tenderloin'],
    ['Presidio', 'Presidio']
  ]);

  // Layer 4: LLM-based smart mapping (fallback)
  private async mapWithLLM(venueName: string, address: string): Promise<string | null> {
    try {
      // Use a simple AI prompt to determine neighborhood
      const prompt = `Given this San Francisco venue:
Name: ${venueName}
Address: ${address}

Which SF neighborhood is this in? Choose from: The Mission, Castro, Marina District, North Beach, Chinatown, SoMa, Financial District, Haight-Ashbury, Hayes Valley, Richmond District, Nob Hill, Pacific Heights, Tenderloin, Union Square, Presidio, West Portal, Sunset District, or Potrero Hill.

Respond with only the neighborhood name.`;

      // For now, use a simple heuristic (you can replace with actual LLM call)
      const addressLower = address.toLowerCase();
      
      // Simple keyword-based inference as LLM fallback
      if (addressLower.includes('mission') || addressLower.includes('valencia')) return 'The Mission';
      if (addressLower.includes('castro')) return 'Castro';
      if (addressLower.includes('marina') || addressLower.includes('chestnut')) return 'Marina District';
      if (addressLower.includes('north beach') || addressLower.includes('columbus')) return 'North Beach';
      if (addressLower.includes('chinatown') || addressLower.includes('grant')) return 'Chinatown';
      if (addressLower.includes('haight')) return 'Haight-Ashbury';
      if (addressLower.includes('hayes')) return 'Hayes Valley';
      if (addressLower.includes('richmond') || addressLower.includes('clement')) return 'Richmond District';
      if (addressLower.includes('sunset')) return 'Sunset District';
      if (addressLower.includes('presidio') || addressLower.includes('crissy')) return 'Presidio';
      
      return null;
    } catch (error) {
      console.error('LLM mapping failed:', error);
      return null;
    }
  }

  // Layer 5: Geocoding fallback
  private async mapWithGeocoding(address: string): Promise<string | null> {
    if (!this.googleClient) return null;
    
    try {
      // Use Google Geocoding to get precise coordinates, then map to neighborhood
      // This would require additional Google API calls but provides the most accuracy
      return null; // Placeholder for now
    } catch (error) {
      console.error('Geocoding mapping failed:', error);
      return null;
    }
  }

  // Main mapping function with all fallback layers
  async mapVenueToNeighborhood(venueName: string, address: string): Promise<{
    neighborhood: string | null;
    confidence: 'high' | 'medium' | 'low';
    method: 'zip' | 'street' | 'landmark' | 'llm' | 'geocoding' | 'default';
  }> {
    if (!address) {
      return { neighborhood: 'SoMa', confidence: 'low', method: 'default' };
    }

    const addressUpper = address.toUpperCase();
    const venueUpper = venueName.toUpperCase();

    // Layer 1: Zip code mapping (highest confidence)
    const zipMatch = address.match(/\b(\d{5})\b/);
    if (zipMatch) {
      const zipCode = zipMatch[1];
      const neighborhoods = this.zipCodeMapping.get(zipCode);
      if (neighborhoods && neighborhoods.length === 1) {
        return { neighborhood: neighborhoods[0], confidence: 'high', method: 'zip' };
      }
      if (neighborhoods && neighborhoods.length > 1) {
        // Multiple neighborhoods in zip code - use additional context
        for (const landmark of this.landmarkMapping.keys()) {
          if (addressUpper.includes(landmark.toUpperCase()) || venueUpper.includes(landmark.toUpperCase())) {
            const neighborhood = this.landmarkMapping.get(landmark);
            if (neighborhood && neighborhoods.includes(neighborhood)) {
              return { neighborhood, confidence: 'high', method: 'landmark' };
            }
          }
        }
        // Default to first neighborhood in zip
        return { neighborhood: neighborhoods[0], confidence: 'medium', method: 'zip' };
      }
    }

    // Layer 2: Street number and name mapping
    for (const streetInfo of this.streetMapping) {
      const streetRegex = new RegExp(`(\\d+)\\s+${streetInfo.street.replace(/\s/g, '\\s+')}`, 'i');
      const match = address.match(streetRegex);
      
      if (match) {
        const streetNumber = parseInt(match[1]);
        for (const range of streetInfo.ranges) {
          if (streetNumber >= range[0] && streetNumber <= range[1]) {
            return { neighborhood: streetInfo.neighborhood, confidence: 'high', method: 'street' };
          }
        }
      }
    }

    // Layer 3: Landmark and keyword mapping
    for (const [landmark, neighborhood] of this.landmarkMapping) {
      if (addressUpper.includes(landmark.toUpperCase()) || venueUpper.includes(landmark.toUpperCase())) {
        return { neighborhood, confidence: 'medium', method: 'landmark' };
      }
    }

    // Layer 4: LLM fallback
    const llmResult = await this.mapWithLLM(venueName, address);
    if (llmResult) {
      return { neighborhood: llmResult, confidence: 'medium', method: 'llm' };
    }

    // Layer 5: Geocoding fallback
    const geocodingResult = await this.mapWithGeocoding(address);
    if (geocodingResult) {
      return { neighborhood: geocodingResult, confidence: 'medium', method: 'geocoding' };
    }

    // Final fallback - assign to SoMa (central SF)
    return { neighborhood: 'SoMa', confidence: 'low', method: 'default' };
  }
}

export async function mapVenueToNeighborhood(
  venueName: string, 
  address: string, 
  googleApiKey?: string
): Promise<{
  neighborhood: string;
  confidence: 'high' | 'medium' | 'low';
  method: string;
}> {
  const mapper = new SmartVenueMapper(googleApiKey);
  const result = await mapper.mapVenueToNeighborhood(venueName, address);
  return {
    neighborhood: result.neighborhood || 'SoMa',
    confidence: result.confidence,
    method: result.method
  };
}