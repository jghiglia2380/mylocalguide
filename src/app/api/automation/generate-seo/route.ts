import { NextRequest, NextResponse } from 'next/server';
import { generateAllSEOContent } from '@lib/automation/seo-generator';

export async function POST(request: NextRequest) {
  try {
    const { 
      pageTypes = ['neighborhood', 'category', 'collection', 'longtail', 'faq'],
      regenerateExisting = false 
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

    console.log(`🎯 Starting SEO content generation...`);
    console.log(`📄 Page types: ${pageTypes.join(', ')}`);
    console.log(`🔄 Regenerate existing: ${regenerateExisting}`);
    
    const startTime = Date.now();
    
    const result = await generateAllSEOContent(anthropicApiKey);
    
    const duration = Date.now() - startTime;

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'SEO content generation completed successfully',
        data: {
          totalPages: result.pagesGenerated,
          pageBreakdown: result.categories,
          duration: `${Math.round(duration / 1000)}s`,
          pageTypes,
          regenerateExisting
        },
        errors: result.errors
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'SEO content generation failed',
        data: {
          totalPages: result.pagesGenerated,
          pageBreakdown: result.categories,
          duration: `${Math.round(duration / 1000)}s`
        },
        errors: result.errors
      }, { status: 500 });
    }

  } catch (error) {
    console.error('SEO generation API error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'SEO generation failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'SEO content generation API endpoint',
    methods: ['POST'],
    description: 'Generates comprehensive SEO content including landing pages, collections, and guides',
    parameters: {
      pageTypes: 'array (default: all types) - Types of pages to generate: "neighborhood", "category", "collection", "longtail", "faq"',
      regenerateExisting: 'boolean (default: false) - Whether to regenerate existing SEO pages'
    },
    requiredEnvVars: [
      'ANTHROPIC_API_KEY'
    ],
    generatedContent: {
      neighborhood: 'Landing pages for each SF neighborhood with venue listings',
      category: 'Category overview pages (restaurants, bars, coffee, etc.)',
      collection: 'Curated collections like "Top Rated Places", "Best Cheap Eats"',
      longtail: 'Long-tail keyword pages like "romantic restaurants san francisco"',
      faq: 'FAQ pages answering common questions about SF venues'
    },
    outputs: [
      'SEO-optimized pages stored in seo_pages table',
      'Featured collections stored in featured_collections table',
      'Sitemap.xml generated in public folder',
      'All pages include proper meta tags and structured content'
    ]
  });
}