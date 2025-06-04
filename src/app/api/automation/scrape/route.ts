import { NextRequest, NextResponse } from 'next/server';
import { runVenueScrapingPipeline } from '@lib/automation/venue-scraper';

export async function POST(request: NextRequest) {
  try {
    const { maxVenuesPerCategory = 50, runMode = 'full' } = await request.json();

    // Validate API keys
    const googleApiKey = process.env.GOOGLE_PLACES_API_KEY;
    const yelpApiKey = process.env.YELP_API_KEY;

    if (!googleApiKey || !yelpApiKey) {
      return NextResponse.json(
        { 
          error: 'Missing required API keys',
          required: ['GOOGLE_PLACES_API_KEY', 'YELP_API_KEY']
        },
        { status: 400 }
      );
    }

    console.log(`🚀 Starting venue scraping pipeline (${runMode} mode)...`);
    
    const startTime = Date.now();
    
    const result = await runVenueScrapingPipeline(
      googleApiKey,
      yelpApiKey,
      maxVenuesPerCategory
    );
    
    const duration = Date.now() - startTime;

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Scraping completed successfully`,
        data: {
          venuesAdded: result.venueCount,
          duration: `${Math.round(duration / 1000)}s`,
          maxVenuesPerCategory,
          runMode
        },
        errors: result.errors
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Scraping pipeline failed',
        data: {
          venuesAdded: result.venueCount,
          duration: `${Math.round(duration / 1000)}s`
        },
        errors: result.errors
      }, { status: 500 });
    }

  } catch (error) {
    console.error('API route error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Venue scraping API endpoint',
    methods: ['POST'],
    parameters: {
      maxVenuesPerCategory: 'number (default: 50) - Maximum venues to scrape per category',
      runMode: 'string (default: "full") - Scraping mode: "full" or "incremental"'
    },
    requiredEnvVars: [
      'GOOGLE_PLACES_API_KEY',
      'YELP_API_KEY'
    ]
  });
}