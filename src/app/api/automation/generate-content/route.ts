import { NextRequest, NextResponse } from 'next/server';
import { ContentGenerator, generateBatchContent } from '@lib/automation/content-generator';
import { getDatabase } from '@lib/database';

export async function POST(request: NextRequest) {
  try {
    const { 
      contentType = 'venues',
      batchSize = 10,
      targetVenues = null 
    } = await request.json();

    // Validate API key
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicApiKey) {
      return NextResponse.json(
        { 
          error: 'Missing ANTHROPIC_API_KEY environment variable',
          required: ['ANTHROPIC_API_KEY']
        },
        { status: 400 }
      );
    }

    console.log(`🤖 Starting content generation (${contentType})...`);
    const startTime = Date.now();
    
    const db = getDatabase();
    const generator = new ContentGenerator(anthropicApiKey);
    
    let result;

    switch (contentType) {
      case 'venues':
        result = await generateVenueDescriptions(db, generator, batchSize, targetVenues);
        break;
        
      case 'neighborhoods':
        result = await generateNeighborhoodContent(db, generator);
        break;
        
      case 'categories':
        result = await generateCategoryContent(db, generator);
        break;
        
      case 'collections':
        result = await generateFeaturedCollections(db, generator);
        break;
        
      default:
        return NextResponse.json(
          { error: `Unknown content type: ${contentType}` },
          { status: 400 }
        );
    }
    
    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      message: `Content generation completed for ${contentType}`,
      data: {
        ...result,
        duration: `${Math.round(duration / 1000)}s`,
        contentType,
        batchSize
      }
    });

  } catch (error) {
    console.error('Content generation API error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Content generation failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function generateVenueDescriptions(
  db: any, 
  generator: ContentGenerator, 
  batchSize: number,
  targetVenues: string[] | null
) {
  let venues;
  
  if (targetVenues && targetVenues.length > 0) {
    // Generate content for specific venues
    const placeholders = targetVenues.map(() => '?').join(',');
    venues = db.prepare(`
      SELECT * FROM venues 
      WHERE name IN (${placeholders}) 
      AND (description IS NULL OR description = '')
    `).all(...targetVenues);
  } else {
    // Generate content for venues without descriptions
    venues = db.prepare(`
      SELECT * FROM venues 
      WHERE description IS NULL OR description = ''
      ORDER BY venue_score DESC, rating DESC
    `).all();
  }

  if (venues.length === 0) {
    return { 
      venuesUpdated: 0, 
      message: 'No venues found needing descriptions' 
    };
  }

  console.log(`📝 Generating descriptions for ${venues.length} venues...`);
  
  const updateVenue = db.prepare(`
    UPDATE venues 
    SET description = ?, last_updated = CURRENT_TIMESTAMP 
    WHERE id = ?
  `);

  let updated = 0;
  const errors: string[] = [];

  // Process in batches to avoid rate limiting
  for (let i = 0; i < venues.length; i += batchSize) {
    const batch = venues.slice(i, i + batchSize);
    
    for (const venue of batch) {
      try {
        const description = await generator.generateVenueDescription(venue);
        updateVenue.run(description, venue.id);
        updated++;
        console.log(`✓ Generated description for ${venue.name}`);
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        const errorMsg = `Failed to generate description for ${venue.name}: ${error}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }
    
    // Longer delay between batches
    if (i + batchSize < venues.length) {
      console.log(`💤 Batch complete, waiting before next batch...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  return {
    venuesUpdated: updated,
    totalVenues: venues.length,
    errors: errors.length > 0 ? errors : undefined
  };
}

async function generateNeighborhoodContent(db: any, generator: ContentGenerator) {
  const neighborhoods = db.prepare(`
    SELECT neighborhood, COUNT(*) as venue_count 
    FROM venues 
    GROUP BY neighborhood
  `).all();

  console.log(`🏘️  Generating content for ${neighborhoods.length} neighborhoods...`);

  const insertContent = db.prepare(`
    INSERT OR REPLACE INTO neighborhood_content 
    (neighborhood, title, meta_description, intro_text, seo_content, highlights)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  let generated = 0;
  const errors: string[] = [];

  for (const { neighborhood } of neighborhoods) {
    try {
      const venues = db.prepare(`
        SELECT * FROM venues 
        WHERE neighborhood = ? 
        ORDER BY venue_score DESC
      `).all(neighborhood);

      const content = await generator.generateNeighborhoodContent(neighborhood, venues);
      
      insertContent.run(
        neighborhood,
        content.title,
        content.description,
        content.seoContent.substring(0, 500), // First paragraph as intro
        content.seoContent,
        JSON.stringify(content.highlights)
      );

      generated++;
      console.log(`✓ Generated content for ${neighborhood}`);
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      const errorMsg = `Failed to generate content for ${neighborhood}: ${error}`;
      console.error(errorMsg);
      errors.push(errorMsg);
    }
  }

  return {
    neighborhoodsGenerated: generated,
    totalNeighborhoods: neighborhoods.length,
    errors: errors.length > 0 ? errors : undefined
  };
}

async function generateCategoryContent(db: any, generator: ContentGenerator) {
  const categories = db.prepare(`
    SELECT category, COUNT(*) as venue_count 
    FROM venues 
    GROUP BY category
  `).all();

  console.log(`📂 Generating content for ${categories.length} categories...`);

  const insertContent = db.prepare(`
    INSERT OR REPLACE INTO category_content 
    (category, title, meta_description, intro_text, seo_content)
    VALUES (?, ?, ?, ?, ?)
  `);

  let generated = 0;
  const errors: string[] = [];

  for (const { category } of categories) {
    try {
      const venues = db.prepare(`
        SELECT * FROM venues 
        WHERE category = ? 
        ORDER BY venue_score DESC
      `).all(category);

      const content = await generator.generateCategoryContent(category, venues);
      
      insertContent.run(
        category,
        content.title,
        content.description,
        content.introText,
        content.seoContent
      );

      generated++;
      console.log(`✓ Generated content for ${category} category`);
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      const errorMsg = `Failed to generate content for ${category}: ${error}`;
      console.error(errorMsg);
      errors.push(errorMsg);
    }
  }

  return {
    categoriesGenerated: generated,
    totalCategories: categories.length,
    errors: errors.length > 0 ? errors : undefined
  };
}

async function generateFeaturedCollections(db: any, generator: ContentGenerator) {
  const venues = db.prepare(`
    SELECT * FROM venues 
    ORDER BY venue_score DESC, rating DESC
  `).all();

  console.log(`⭐ Generating featured collections...`);

  const collections = await generator.generateFeaturedCollections(venues);
  
  const insertCollection = db.prepare(`
    INSERT OR REPLACE INTO featured_collections 
    (title, slug, description, venue_ids, seo_keywords)
    VALUES (?, ?, ?, ?, ?)
  `);

  let generated = 0;
  const errors: string[] = [];

  for (const collection of collections) {
    try {
      const slug = collection.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      // Get venue IDs for the collection
      const venueIds = db.prepare(`
        SELECT id FROM venues 
        WHERE name IN (${collection.venues.map(() => '?').join(',')})
      `).all(...collection.venues).map((v: any) => v.id);

      insertCollection.run(
        collection.title,
        slug,
        collection.description,
        JSON.stringify(venueIds),
        JSON.stringify(collection.seoKeywords)
      );

      generated++;
      console.log(`✓ Generated collection: ${collection.title}`);
    } catch (error) {
      const errorMsg = `Failed to generate collection ${collection.title}: ${error}`;
      console.error(errorMsg);
      errors.push(errorMsg);
    }
  }

  return {
    collectionsGenerated: generated,
    totalCollections: collections.length,
    errors: errors.length > 0 ? errors : undefined
  };
}

export async function GET() {
  return NextResponse.json({
    message: 'Content generation API endpoint',
    methods: ['POST'],
    parameters: {
      contentType: 'string - Type of content to generate: "venues", "neighborhoods", "categories", "collections"',
      batchSize: 'number (default: 10) - Number of items to process per batch',
      targetVenues: 'array (optional) - Specific venue names to generate content for'
    },
    requiredEnvVars: [
      'ANTHROPIC_API_KEY'
    ],
    examples: {
      venues: {
        contentType: 'venues',
        batchSize: 5
      },
      specific_venues: {
        contentType: 'venues',
        targetVenues: ['Tartine Bakery', 'Blue Bottle Coffee']
      },
      neighborhoods: {
        contentType: 'neighborhoods'
      }
    }
  });
}