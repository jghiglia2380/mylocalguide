import { getDatabase } from '@lib/database';
import { ContentGenerator } from './content-generator';
import { VenueData } from './venue-scraper';

export interface SEOPage {
  slug: string;
  title: string;
  metaDescription: string;
  h1Title: string;
  content: string;
  keywords: string[];
  targetKeyword: string;
  pageType: 'landing' | 'collection' | 'guide' | 'neighborhood' | 'category';
}

export interface LandingPageData {
  neighborhood?: string;
  category?: string;
  collection?: string;
  venues: any[];
  totalCount: number;
}

export class SEOGenerator {
  private db: any;
  private contentGenerator: ContentGenerator;

  constructor(anthropicApiKey: string) {
    this.db = getDatabase();
    this.contentGenerator = new ContentGenerator(anthropicApiKey);
  }

  // Generate neighborhood landing pages
  async generateNeighborhoodPages(): Promise<SEOPage[]> {
    console.log('🏘️  Generating neighborhood landing pages...');
    
    const neighborhoods = this.db.prepare(`
      SELECT neighborhood, COUNT(*) as venue_count 
      FROM venues 
      GROUP BY neighborhood 
      ORDER BY venue_count DESC
    `).all();

    const pages: SEOPage[] = [];

    for (const { neighborhood, venue_count } of neighborhoods) {
      const venues = this.db.prepare(`
        SELECT * FROM venues 
        WHERE neighborhood = ? 
        ORDER BY venue_score DESC, rating DESC
      `).all(neighborhood);

      const content = await this.contentGenerator.generateNeighborhoodContent(neighborhood, venues);
      
      const slug = this.createSlug(`${neighborhood}-san-francisco`);
      
      const page: SEOPage = {
        slug,
        title: content.title,
        metaDescription: content.description,
        h1Title: `${neighborhood} Directory - San Francisco`,
        content: this.createNeighborhoodPageContent(neighborhood, venues, content),
        keywords: [
          `${neighborhood} san francisco`,
          `${neighborhood} sf`,
          `things to do ${neighborhood}`,
          `${neighborhood} restaurants`,
          `${neighborhood} bars`,
          `visit ${neighborhood} sf`
        ],
        targetKeyword: `${neighborhood} san francisco`,
        pageType: 'neighborhood'
      };

      pages.push(page);
      await this.saveSEOPage(page);
    }

    return pages;
  }

  // Generate category landing pages  
  async generateCategoryPages(): Promise<SEOPage[]> {
    console.log('📂 Generating category landing pages...');
    
    const categories = this.db.prepare(`
      SELECT category, COUNT(*) as venue_count 
      FROM venues 
      GROUP BY category 
      ORDER BY venue_count DESC
    `).all();

    const pages: SEOPage[] = [];

    for (const { category, venue_count } of categories) {
      const venues = this.db.prepare(`
        SELECT * FROM venues 
        WHERE category = ? 
        ORDER BY venue_score DESC, rating DESC
      `).all(category);

      const content = await this.contentGenerator.generateCategoryContent(category, venues);
      
      const slug = this.createSlug(`best-${category}-san-francisco`);
      
      const page: SEOPage = {
        slug,
        title: content.title,
        metaDescription: content.description,
        h1Title: `Best ${this.titleCase(category)} in San Francisco`,
        content: this.createCategoryPageContent(category, venues, content),
        keywords: [
          `best ${category} san francisco`,
          `${category} sf`,
          `san francisco ${category}`,
          `top ${category} sf`,
          `${category} guide san francisco`
        ],
        targetKeyword: `best ${category} san francisco`,
        pageType: 'category'
      };

      pages.push(page);
      await this.saveSEOPage(page);
    }

    return pages;
  }

  // Generate long-tail keyword pages
  async generateLongTailPages(): Promise<SEOPage[]> {
    console.log('🎯 Generating long-tail keyword pages...');
    
    const longTailKeywords = [
      { keyword: 'best cheap eats san francisco', query: 'restaurants with low price', filter: 'price_level <= 2 AND category = "restaurants"' },
      { keyword: 'romantic restaurants san francisco', query: 'upscale romantic dining', filter: 'category = "restaurants" AND (rating >= 4.0 OR price_level >= 3)' },
      { keyword: 'best brunch spots sf', query: 'weekend brunch restaurants', filter: 'category = "restaurants"' },
      { keyword: 'late night food san francisco', query: 'restaurants open late', filter: 'category = "restaurants" OR category = "bars"' },
      { keyword: 'craft cocktail bars sf', query: 'specialty cocktail bars', filter: 'category = "bars"' },
      { keyword: 'family friendly restaurants san francisco', query: 'kid-friendly dining', filter: 'category = "restaurants"' },
      { keyword: 'business lunch spots sf', query: 'professional dining venues', filter: 'category = "restaurants" AND (neighborhood = "Financial District" OR neighborhood = "SoMa")' },
      { keyword: 'rooftop bars san francisco', query: 'bars with views', filter: 'category = "bars"' },
      { keyword: 'coffee shops with wifi sf', query: 'work-friendly cafes', filter: 'category = "coffee"' },
      { keyword: 'date night spots san francisco', query: 'romantic venues', filter: 'category = "restaurants" OR category = "bars"' }
    ];

    const pages: SEOPage[] = [];

    for (const { keyword, query, filter } of longTailKeywords) {
      const venues = this.db.prepare(`
        SELECT * FROM venues 
        WHERE ${filter}
        ORDER BY venue_score DESC, rating DESC
        LIMIT 15
      `).all();

      if (venues.length < 3) continue; // Skip if not enough venues

      const content = await this.generateLongTailContent(keyword, query, venues);
      const slug = this.createSlug(keyword);

      const page: SEOPage = {
        slug,
        title: `${this.titleCase(keyword)} - Local Guide`,
        metaDescription: `Discover the ${keyword.toLowerCase()}. Curated list of ${venues.length} top-rated venues in San Francisco.`,
        h1Title: this.titleCase(keyword),
        content,
        keywords: [keyword, ...this.generateRelatedKeywords(keyword)],
        targetKeyword: keyword,
        pageType: 'guide'
      };

      pages.push(page);
      await this.saveSEOPage(page);
    }

    return pages;
  }

  // Generate featured collection pages
  async generateCollectionPages(): Promise<SEOPage[]> {
    console.log('⭐ Generating featured collection pages...');
    
    const collections = await this.contentGenerator.generateFeaturedCollections(
      this.db.prepare('SELECT * FROM venues ORDER BY venue_score DESC').all()
    );

    const pages: SEOPage[] = [];

    for (const collection of collections) {
      const slug = this.createSlug(collection.title);
      
      // Get venue details for the collection
      const venueNames = collection.venues;
      const venues = this.db.prepare(`
        SELECT * FROM venues 
        WHERE name IN (${venueNames.map(() => '?').join(',')})
        ORDER BY venue_score DESC
      `).all(...venueNames);

      const content = this.createCollectionPageContent(collection, venues);

      const page: SEOPage = {
        slug,
        title: `${collection.title} - Curated San Francisco Guide`,
        metaDescription: `${collection.description.substring(0, 140)}...`,
        h1Title: collection.title,
        content,
        keywords: collection.seoKeywords,
        targetKeyword: collection.seoKeywords[0] || collection.title.toLowerCase(),
        pageType: 'collection'
      };

      pages.push(page);
      await this.saveSEOPage(page);
      
      // Save to featured_collections table
      await this.saveFeaturedCollection(collection, venues);
    }

    return pages;
  }

  // Generate FAQ pages from search queries
  async generateFAQPages(): Promise<SEOPage[]> {
    console.log('❓ Generating FAQ pages...');
    
    // Get popular search queries to create FAQ content
    const popularSearches = await this.getPopularSearches();
    
    const faqSections = this.groupSearchesIntoFAQs(popularSearches);
    const pages: SEOPage[] = [];

    for (const section of faqSections) {
      const content = await this.generateFAQContent(section);
      const slug = this.createSlug(`${section.topic}-san-francisco-faq`);

      const page: SEOPage = {
        slug,
        title: `${section.topic} in San Francisco - FAQ`,
        metaDescription: `Common questions about ${section.topic.toLowerCase()} in San Francisco. Get answers from locals and experts.`,
        h1Title: `Frequently Asked Questions: ${section.topic} in San Francisco`,
        content,
        keywords: section.keywords,
        targetKeyword: `${section.topic.toLowerCase()} san francisco`,
        pageType: 'guide'
      };

      pages.push(page);
      await this.saveSEOPage(page);
    }

    return pages;
  }

  // Create dynamic sitemap
  async generateSitemap(): Promise<string> {
    console.log('🗺️  Generating sitemap...');
    
    const baseUrl = 'https://mylocalguide.co'; // Replace with actual domain
    const pages = this.db.prepare('SELECT slug, updated_at FROM seo_pages WHERE status = "active"').all();
    const venues = this.db.prepare('SELECT id, name, neighborhood, last_updated FROM venues').all();
    
    const sitemapEntries = [
      `<url><loc>${baseUrl}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>`
    ];

    // Add SEO pages
    for (const page of pages) {
      const lastmod = new Date(page.updated_at).toISOString().split('T')[0];
      sitemapEntries.push(
        `<url><loc>${baseUrl}/${page.slug}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`
      );
    }

    // Add venue pages
    for (const venue of venues) {
      const slug = this.createSlug(`${venue.name}-${venue.neighborhood}`);
      const lastmod = venue.last_updated ? new Date(venue.last_updated).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      sitemapEntries.push(
        `<url><loc>${baseUrl}/venue/${slug}</loc><lastmod>${lastmod}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>`
      );
    }

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries.join('\n')}
</urlset>`;

    // Save sitemap to public folder
    const fs = require('fs');
    fs.writeFileSync('./public/sitemap.xml', sitemap);
    
    return sitemap;
  }

  // Helper methods
  private createSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private titleCase(str: string): string {
    return str.replace(/\w\S*/g, (txt) => 
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  }

  private createNeighborhoodPageContent(neighborhood: string, venues: any[], content: any): string {
    const topVenues = venues.slice(0, 8);
    const categories = [...new Set(venues.map(v => v.category))];
    
    return `
${content.seoContent}

## What to Expect in ${neighborhood}

${content.highlights.map((highlight: string) => `• ${highlight}`).join('\n')}

## Top Venues in ${neighborhood}

${topVenues.map(venue => `**${venue.name}** - ${venue.description || 'A local favorite in the area.'}`).join('\n\n')}

## Categories Available
${categories.map(cat => `• ${this.titleCase(cat)} (${venues.filter(v => v.category === cat).length} venues)`).join('\n')}

*Discover all ${venues.length} venues in our ${neighborhood} directory.*
    `.trim();
  }

  private createCategoryPageContent(category: string, venues: any[], content: any): string {
    const neighborhoods = [...new Set(venues.map(v => v.neighborhood))];
    const topVenues = venues.slice(0, 10);
    
    return `
${content.seoContent}

${content.introText}

## Top ${this.titleCase(category)} in San Francisco

${topVenues.map(venue => `**${venue.name}** (${venue.neighborhood}) - ${venue.description || 'A highly rated local venue.'}`).join('\n\n')}

## Neighborhoods with Great ${this.titleCase(category)}
${neighborhoods.map(hood => `• ${hood} (${venues.filter(v => v.neighborhood === hood).length} ${category})`).join('\n')}

*Browse all ${venues.length} ${category} venues across San Francisco.*
    `.trim();
  }

  private createCollectionPageContent(collection: any, venues: any[]): string {
    return `
${collection.description}

## Featured Venues

${venues.map(venue => `**${venue.name}** (${venue.neighborhood})  
${venue.description || 'A standout venue in San Francisco.'}
${venue.rating ? `⭐ ${venue.rating}/5` : ''} ${venue.price_level ? `• ${'$'.repeat(venue.price_level)}` : ''}
`).join('\n')}

## Why These Venues Made Our List

Each venue in this curated collection represents the best of what San Francisco has to offer. Our selection criteria includes local reviews, community recommendations, and unique offerings that make these places special.

*Discover more curated collections across San Francisco.*
    `.trim();
  }

  private generateRelatedKeywords(keyword: string): string[] {
    const keywordMap: { [key: string]: string[] } = {
      'cheap eats': ['budget food', 'affordable restaurants', 'inexpensive dining'],
      'romantic restaurants': ['date night', 'couples dining', 'intimate restaurants'],
      'brunch spots': ['weekend brunch', 'breakfast restaurants', 'morning dining'],
      'craft cocktails': ['mixology bars', 'specialty drinks', 'artisan cocktails'],
      'family friendly': ['kid friendly', 'children welcome', 'family dining'],
      'business lunch': ['corporate dining', 'work lunch', 'professional restaurants'],
      'rooftop bars': ['outdoor bars', 'bars with views', 'elevated dining'],
      'coffee wifi': ['work cafes', 'laptop friendly', 'study spots']
    };

    for (const [key, related] of Object.entries(keywordMap)) {
      if (keyword.includes(key)) {
        return related;
      }
    }

    return [];
  }

  private async generateLongTailContent(keyword: string, query: string, venues: any[]): Promise<string> {
    const prompt = `Create SEO content for the page targeting "${keyword}" in San Francisco.

Query intent: ${query}
Number of venues: ${venues.length}
Top venues: ${venues.slice(0, 5).map(v => v.name).join(', ')}

Create:
1. Opening paragraph explaining what makes these venues special for this search
2. Brief guide section with tips
3. Venue highlights section

Keep it informative, local, and helpful. Focus on why someone searching for "${keyword}" would find value in these venues.`;

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY || '',
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
      return data.content[0].text;
    } catch (error) {
      console.error('Error generating long-tail content:', error);
      return `Discover the ${keyword.toLowerCase()} with our curated selection of ${venues.length} venues across San Francisco.`;
    }
  }

  private getPopularSearches(): Promise<Array<{ query: string; count: number }>> {
    // This would integrate with analytics data
    // For now, return common SF search patterns
    return Promise.resolve([
      { query: 'best restaurants mission district', count: 45 },
      { query: 'cocktail bars north beach', count: 32 },
      { query: 'coffee shops with wifi', count: 28 },
      { query: 'romantic dinner spots', count: 25 },
      { query: 'sunday brunch castro', count: 22 }
    ]);
  }

  private groupSearchesIntoFAQs(searches: Array<{ query: string; count: number }>): Array<{ topic: string; keywords: string[]; questions: string[] }> {
    return [
      {
        topic: 'Dining',
        keywords: ['restaurants', 'dining', 'food', 'eating'],
        questions: [
          'What are the best restaurants in San Francisco?',
          'Where can I find affordable dining in SF?',
          'What neighborhoods have the best food scene?'
        ]
      },
      {
        topic: 'Nightlife',
        keywords: ['bars', 'nightlife', 'drinks', 'cocktails'],
        questions: [
          'What are the best bars in San Francisco?',
          'Where can I find craft cocktails in SF?',
          'What neighborhoods have the best nightlife?'
        ]
      }
    ];
  }

  private async generateFAQContent(section: any): Promise<string> {
    // Generate FAQ content based on the section
    const faqHtml = section.questions.map((q: string) => `
**${q}**

[Generated answer based on local venues and data]
    `).join('\n\n');

    return `# ${section.topic} in San Francisco - Frequently Asked Questions

${faqHtml}

*Have more questions? Browse our directory to discover local favorites.*`;
  }

  private async saveSEOPage(page: SEOPage): Promise<void> {
    this.db.prepare(`
      INSERT OR REPLACE INTO seo_pages 
      (slug, title, meta_description, h1_title, content, keywords, target_keyword, page_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      page.slug,
      page.title,
      page.metaDescription,
      page.h1Title,
      page.content,
      JSON.stringify(page.keywords),
      page.targetKeyword,
      page.pageType
    );
  }

  private async saveFeaturedCollection(collection: any, venues: any[]): Promise<void> {
    const slug = this.createSlug(collection.title);
    const venueIds = venues.map(v => v.id);
    
    this.db.prepare(`
      INSERT OR REPLACE INTO featured_collections 
      (title, slug, description, venue_ids, seo_keywords)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      collection.title,
      slug,
      collection.description,
      JSON.stringify(venueIds),
      JSON.stringify(collection.seoKeywords)
    );
  }
}

// Main function to generate all SEO content
export async function generateAllSEOContent(anthropicApiKey: string): Promise<{
  success: boolean;
  pagesGenerated: number;
  categories: { [key: string]: number };
  errors?: string[];
}> {
  const generator = new SEOGenerator(anthropicApiKey);
  const errors: string[] = [];
  let totalPages = 0;
  const categories = {
    neighborhood: 0,
    category: 0,
    collection: 0,
    longtail: 0,
    faq: 0
  };

  try {
    console.log('🚀 Starting comprehensive SEO content generation...');

    // Generate all page types
    const neighborhoodPages = await generator.generateNeighborhoodPages();
    categories.neighborhood = neighborhoodPages.length;
    totalPages += neighborhoodPages.length;

    const categoryPages = await generator.generateCategoryPages();
    categories.category = categoryPages.length;
    totalPages += categoryPages.length;

    const collectionPages = await generator.generateCollectionPages();
    categories.collection = collectionPages.length;
    totalPages += collectionPages.length;

    const longTailPages = await generator.generateLongTailPages();
    categories.longtail = longTailPages.length;
    totalPages += longTailPages.length;

    const faqPages = await generator.generateFAQPages();
    categories.faq = faqPages.length;
    totalPages += faqPages.length;

    // Generate sitemap
    await generator.generateSitemap();

    console.log(`✅ SEO content generation completed: ${totalPages} pages generated`);

    return {
      success: true,
      pagesGenerated: totalPages,
      categories,
      errors: errors.length > 0 ? errors : undefined
    };

  } catch (error) {
    console.error('❌ SEO content generation failed:', error);
    errors.push(error instanceof Error ? error.message : 'Unknown error');

    return {
      success: false,
      pagesGenerated: totalPages,
      categories,
      errors
    };
  }
}