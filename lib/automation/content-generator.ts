import { VenueData } from './venue-scraper';

// AI-powered content generation for venues and SEO
export class ContentGenerator {
  private apiKey: string;
  private baseUrl = 'https://api.anthropic.com/v1/messages';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateVenueDescription(venue: VenueData): Promise<string> {
    const prompt = `Write a compelling 2-3 sentence description for this San Francisco venue:

Name: ${venue.name}
Category: ${venue.category}
Neighborhood: ${venue.neighborhood}
Address: ${venue.address}
${venue.rating ? `Rating: ${venue.rating}/5 stars` : ''}
${venue.priceLevel ? `Price Level: ${venue.priceLevel}/4` : ''}

Guidelines:
- Local SF voice and personality
- Highlight what makes this place special
- Include neighborhood context
- Keep it authentic and informative
- No marketing fluff or superlatives
- Focus on atmosphere, offerings, or unique features

Example style: "A cozy Mission District coffee shop serving single-origin beans and house-made pastries. The exposed brick walls and communal tables make it a favorite among local freelancers and students."`;

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 150,
          messages: [{
            role: 'user',
            content: prompt
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      return data.content[0].text.trim();
    } catch (error) {
      console.error('Error generating venue description:', error);
      return this.getFallbackDescription(venue);
    }
  }

  async generateNeighborhoodContent(neighborhood: string, venues: VenueData[]): Promise<{
    title: string;
    description: string;
    highlights: string[];
    seoContent: string;
  }> {
    const topVenues = venues
      .filter(v => v.neighborhood === neighborhood)
      .slice(0, 5)
      .map(v => `${v.name} (${v.category})`)
      .join(', ');

    const categories = [...new Set(venues.filter(v => v.neighborhood === neighborhood).map(v => v.category))];

    const prompt = `Create SEO-optimized content for the ${neighborhood} neighborhood directory page in San Francisco:

Top venues: ${topVenues}
Categories available: ${categories.join(', ')}
Total venues: ${venues.filter(v => v.neighborhood === neighborhood).length}

Generate:
1. Page title (under 60 characters)
2. Meta description (under 160 characters)
3. 3-4 neighborhood highlights/features
4. 2-3 paragraph SEO content describing the area

Focus on:
- Local character and atmosphere
- What makes this neighborhood unique
- Types of venues and experiences available
- Why people visit/live here
- Include neighborhood-specific keywords naturally

Format as JSON with keys: title, description, highlights (array), seoContent`;

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 500,
          messages: [{
            role: 'user',
            content: prompt
          }]
        })
      });

      const data = await response.json();
      const content = JSON.parse(data.content[0].text);
      
      return {
        title: content.title,
        description: content.description,
        highlights: content.highlights,
        seoContent: content.seoContent
      };
    } catch (error) {
      console.error('Error generating neighborhood content:', error);
      return this.getFallbackNeighborhoodContent(neighborhood, venues);
    }
  }

  async generateCategoryContent(category: string, venues: VenueData[]): Promise<{
    title: string;
    description: string;
    introText: string;
    seoContent: string;
  }> {
    const categoryVenues = venues.filter(v => v.category === category);
    const neighborhoods = [...new Set(categoryVenues.map(v => v.neighborhood))];
    const topRated = categoryVenues
      .filter(v => v.rating)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 3)
      .map(v => v.name);

    const prompt = `Create SEO content for the ${category} directory page in San Francisco:

Total ${category} venues: ${categoryVenues.length}
Neighborhoods covered: ${neighborhoods.join(', ')}
Top rated: ${topRated.join(', ')}

Generate:
1. Page title for SEO (under 60 characters)
2. Meta description (under 160 characters) 
3. Intro paragraph for the page
4. 2-3 paragraph SEO content about ${category} scene in SF

Include:
- SF-specific ${category} culture/scene
- Variety and range available
- Neighborhood diversity
- What makes SF ${category} special
- Naturally include keywords like "San Francisco ${category}", "SF ${category}", etc.

Format as JSON with keys: title, description, introText, seoContent`;

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 400,
          messages: [{
            role: 'user',
            content: prompt
          }]
        })
      });

      const data = await response.json();
      const content = JSON.parse(data.content[0].text);
      
      return {
        title: content.title,
        description: content.description,
        introText: content.introText,
        seoContent: content.seoContent
      };
    } catch (error) {
      console.error('Error generating category content:', error);
      return this.getFallbackCategoryContent(category, venues);
    }
  }

  async generateFeaturedCollections(venues: VenueData[]): Promise<Array<{
    title: string;
    description: string;
    venues: string[];
    seoKeywords: string[];
  }>> {
    // Generate collections based on common search patterns
    const collections = [
      {
        criteria: (v: VenueData) => v.rating && v.rating >= 4.5,
        title: "Top Rated Places in San Francisco",
        keywords: ["best san francisco", "top rated sf", "highest rated venues"]
      },
      {
        criteria: (v: VenueData) => v.category === 'restaurants' && v.priceLevel && v.priceLevel <= 2,
        title: "Best Affordable Restaurants in SF",
        keywords: ["cheap eats sf", "budget restaurants san francisco", "affordable dining"]
      },
      {
        criteria: (v: VenueData) => v.category === 'bars' && (v.neighborhood === 'Mission District' || v.neighborhood === 'Castro'),
        title: "Mission & Castro Nightlife Guide",
        keywords: ["mission bars", "castro nightlife", "sf bar scene"]
      },
      {
        criteria: (v: VenueData) => v.category === 'coffee' && v.rating && v.rating >= 4.0,
        title: "Best Coffee Shops in San Francisco",
        keywords: ["sf coffee", "san francisco cafes", "best coffee shops"]
      }
    ];

    const generatedCollections = [];

    for (const collection of collections) {
      const matchingVenues = venues.filter(collection.criteria).slice(0, 8);
      
      if (matchingVenues.length >= 3) {
        const venueNames = matchingVenues.map(v => v.name);
        
        const prompt = `Write a 2-3 sentence description for this curated collection:

Title: ${collection.title}
Venues included: ${venueNames.join(', ')}

Make it compelling and informative, explaining why these venues were selected and what visitors can expect.`;

        try {
          const response = await this.generateDescription(prompt);
          
          generatedCollections.push({
            title: collection.title,
            description: response,
            venues: venueNames,
            seoKeywords: collection.keywords
          });
        } catch (error) {
          console.error('Error generating collection description:', error);
        }
      }
    }

    return generatedCollections;
  }

  private async generateDescription(prompt: string): Promise<string> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 100,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    const data = await response.json();
    return data.content[0].text.trim();
  }

  private getFallbackDescription(venue: VenueData): string {
    const templates = {
      restaurants: `A ${venue.neighborhood} restaurant serving delicious food in San Francisco.`,
      bars: `A popular bar located in ${venue.neighborhood}, San Francisco.`,
      coffee: `A local coffee shop in the heart of ${venue.neighborhood}.`,
      entertainment: `An entertainment venue bringing fun to ${venue.neighborhood}.`,
      shopping: `A unique shopping destination in ${venue.neighborhood}.`,
      services: `Professional services available in ${venue.neighborhood}.`
    };

    return templates[venue.category as keyof typeof templates] || 
           `A local business serving the ${venue.neighborhood} community.`;
  }

  private getFallbackNeighborhoodContent(neighborhood: string, venues: VenueData[]) {
    const venueCount = venues.filter(v => v.neighborhood === neighborhood).length;
    
    return {
      title: `${neighborhood} San Francisco - Local Directory`,
      description: `Discover the best venues in ${neighborhood}, San Francisco. ${venueCount} local businesses and attractions.`,
      highlights: [
        `${venueCount} local venues`,
        'Diverse dining and entertainment',
        'Unique neighborhood character',
        'Local favorites and hidden gems'
      ],
      seoContent: `${neighborhood} is one of San Francisco's most vibrant neighborhoods, offering a diverse mix of restaurants, bars, shops, and services. Our directory features ${venueCount} carefully curated venues that capture the unique spirit of this area. From local favorites to hidden gems, discover what makes ${neighborhood} a special part of the San Francisco experience.`
    };
  }

  private getFallbackCategoryContent(category: string, venues: VenueData[]) {
    const categoryVenues = venues.filter(v => v.category === category);
    
    return {
      title: `Best ${category} in San Francisco - Local Directory`,
      description: `Find the top ${category} venues across San Francisco. ${categoryVenues.length} locations reviewed and recommended.`,
      introText: `Explore San Francisco's ${category} scene with our curated directory of ${categoryVenues.length} venues across the city.`,
      seoContent: `San Francisco offers an incredible variety of ${category} options across its diverse neighborhoods. Our directory features ${categoryVenues.length} carefully selected venues that represent the best of what the city has to offer. From neighborhood favorites to destination spots, discover the ${category} that make San Francisco special.`
    };
  }
}

// Convenience function for generating venue content
export async function generateVenueContent(venue: VenueData, apiKey?: string): Promise<string> {
  if (!apiKey) {
    // Return a basic description if no API key
    const templates = {
      restaurants: `A local restaurant in ${venue.neighborhood} offering great food and atmosphere.`,
      bars: `A neighborhood bar in ${venue.neighborhood} perfect for drinks and socializing.`,
      coffee: `A coffee shop in ${venue.neighborhood} serving quality drinks and snacks.`,
      entertainment: `An entertainment venue in ${venue.neighborhood} offering fun experiences.`,
      shopping: `A local shop in ${venue.neighborhood} with unique offerings.`,
      services: `Professional services available in ${venue.neighborhood}.`
    };

    return templates[venue.category as keyof typeof templates] || 
           `A local business serving the ${venue.neighborhood} community.`;
  }

  const generator = new ContentGenerator(apiKey);
  return await generator.generateVenueDescription(venue);
}

// Batch content generation for efficiency
export async function generateBatchContent(
  venues: VenueData[], 
  apiKey: string,
  batchSize = 10
): Promise<{ [venueId: string]: string }> {
  const generator = new ContentGenerator(apiKey);
  const results: { [venueId: string]: string } = {};
  
  for (let i = 0; i < venues.length; i += batchSize) {
    const batch = venues.slice(i, i + batchSize);
    
    const promises = batch.map(async (venue, index) => {
      const content = await generator.generateVenueDescription(venue);
      const venueId = `${venue.name}-${venue.neighborhood}`.replace(/\s+/g, '-').toLowerCase();
      results[venueId] = content;
      
      // Small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    });
    
    await Promise.all(promises);
    
    // Longer delay between batches
    if (i + batchSize < venues.length) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  return results;
}