import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@lib/database';
import { checkDatabaseVersion } from '@lib/automation/db-migration';

export async function GET(request: NextRequest) {
  try {
    const db = getDatabase();
    
    // Get comprehensive database statistics
    const stats = {
      database: {
        version: checkDatabaseVersion(),
        file: './cicerone-sf.db',
        size: getDatabaseSize()
      },
      venues: {
        total: 0,
        withDescriptions: 0,
        withPhotos: 0,
        withGoogleData: 0,
        withYelpData: 0,
        averageScore: 0,
        byCategory: {},
        byNeighborhood: {},
        topRated: [] as any[]
      },
      seo: {
        totalPages: 0,
        byType: {},
        collections: 0,
        neighborhoodContent: 0,
        categoryContent: 0
      },
      analytics: {
        pageViews: 0,
        searchQueries: 0,
        popularSearches: [] as any[],
        topPages: [] as any[]
      },
      apiKeys: {
        google: !!process.env.GOOGLE_PLACES_API_KEY,
        yelp: !!process.env.YELP_API_KEY,
        anthropic: !!process.env.ANTHROPIC_API_KEY
      },
      lastUpdated: new Date().toISOString()
    };

    // Venues statistics
    try {
      const venueStats = db.prepare(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN description IS NOT NULL AND description != '' THEN 1 END) as withDescriptions,
          COUNT(CASE WHEN photos IS NOT NULL AND photos != '' THEN 1 END) as withPhotos,
          COUNT(CASE WHEN google_place_id IS NOT NULL THEN 1 END) as withGoogleData,
          COUNT(CASE WHEN yelp_id IS NOT NULL THEN 1 END) as withYelpData,
          AVG(CASE WHEN venue_score > 0 THEN venue_score END) as averageScore
        FROM venues
      `).get();
      
      stats.venues = { ...stats.venues, ...(venueStats || {}) };
      
      // Category breakdown
      const categoryStats = db.prepare(`
        SELECT category, COUNT(*) as count 
        FROM venues 
        GROUP BY category 
        ORDER BY count DESC
      `).all();
      
      stats.venues.byCategory = Object.fromEntries(
        categoryStats.map((row: any) => [row.category, row.count])
      );
      
      // Neighborhood breakdown
      const neighborhoodStats = db.prepare(`
        SELECT neighborhood, COUNT(*) as count 
        FROM venues 
        GROUP BY neighborhood 
        ORDER BY count DESC
      `).all();
      
      stats.venues.byNeighborhood = Object.fromEntries(
        neighborhoodStats.map((row: any) => [row.neighborhood, row.count])
      );
      
      // Top rated venues
      const topRated = db.prepare(`
        SELECT name, neighborhood, category, rating, venue_score
        FROM venues 
        WHERE rating IS NOT NULL 
        ORDER BY rating DESC, venue_score DESC 
        LIMIT 5
      `).all();
      
      stats.venues.topRated = topRated;
      
    } catch (error) {
      console.warn('Error gathering venue stats:', error);
    }

    // SEO statistics
    try {
      const seoPageStats = db.prepare(`
        SELECT 
          COUNT(*) as total,
          page_type,
          COUNT(*) as count
        FROM seo_pages 
        WHERE status = 'active'
        GROUP BY page_type
      `).all();
      
      stats.seo.totalPages = seoPageStats.reduce((sum: number, row: any) => sum + row.count, 0);
      stats.seo.byType = Object.fromEntries(
        seoPageStats.map((row: any) => [row.page_type, row.count])
      );
      
      // Collections count
      const collectionsCount = db.prepare(`
        SELECT COUNT(*) as count FROM featured_collections WHERE is_active = 1
      `).get();
      stats.seo.collections = (collectionsCount as any)?.count || 0;
      
      // Content tables
      const neighborhoodContentCount = db.prepare(`
        SELECT COUNT(*) as count FROM neighborhood_content
      `).get();
      stats.seo.neighborhoodContent = (neighborhoodContentCount as any)?.count || 0;
      
      const categoryContentCount = db.prepare(`
        SELECT COUNT(*) as count FROM category_content
      `).get();
      stats.seo.categoryContent = (categoryContentCount as any)?.count || 0;
      
    } catch (error) {
      console.warn('Error gathering SEO stats - tables may not exist yet:', error);
    }

    // Analytics statistics (if tables exist)
    try {
      const pageViewCount = db.prepare(`
        SELECT COUNT(*) as count FROM page_views
      `).get();
      stats.analytics.pageViews = (pageViewCount as any)?.count || 0;
      
      const searchQueryCount = db.prepare(`
        SELECT COUNT(*) as count FROM search_queries
      `).get();
      stats.analytics.searchQueries = (searchQueryCount as any)?.count || 0;
      
      // Popular searches (last 30 days)
      const popularSearches = db.prepare(`
        SELECT query, COUNT(*) as count
        FROM search_queries 
        WHERE created_at >= datetime('now', '-30 days')
        GROUP BY query 
        ORDER BY count DESC 
        LIMIT 5
      `).all();
      stats.analytics.popularSearches = popularSearches;
      
      // Top pages (last 30 days)
      const topPages = db.prepare(`
        SELECT page_path, COUNT(*) as views
        FROM page_views 
        WHERE created_at >= datetime('now', '-30 days')
        GROUP BY page_path 
        ORDER BY views DESC 
        LIMIT 5
      `).all();
      stats.analytics.topPages = topPages;
      
    } catch (error) {
      console.warn('Error gathering analytics stats - tables may not exist yet:', error);
    }

    return NextResponse.json({
      success: true,
      message: 'System status retrieved successfully',
      data: stats,
      recommendations: generateRecommendations(stats)
    });

  } catch (error) {
    console.error('Status API error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to retrieve system status',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function getDatabaseSize(): string {
  try {
    const fs = require('fs');
    const stats = fs.statSync('./cicerone-sf.db');
    const bytes = stats.size;
    
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  } catch (error) {
    return 'Unknown';
  }
}

function generateRecommendations(stats: any): string[] {
  const recommendations: string[] = [];
  
  // Database recommendations
  if (stats.database.version < 5) {
    recommendations.push('🔄 Run database migrations to get latest features');
  }
  
  // Venue recommendations
  if (stats.venues.total < 100) {
    recommendations.push('📊 Run venue scraping to build a more comprehensive directory');
  }
  
  if (stats.venues.withDescriptions < stats.venues.total * 0.8) {
    recommendations.push('✍️ Generate descriptions for venues missing content');
  }
  
  // API key recommendations
  if (!stats.apiKeys.google || !stats.apiKeys.yelp) {
    recommendations.push('🔑 Add missing API keys for data scraping');
  }
  
  if (!stats.apiKeys.anthropic) {
    recommendations.push('🤖 Add Anthropic API key for content generation');
  }
  
  // SEO recommendations
  if (stats.seo.totalPages < 20) {
    recommendations.push('🎯 Generate SEO landing pages for better search visibility');
  }
  
  if (stats.seo.collections < 5) {
    recommendations.push('⭐ Create featured collections to highlight top venues');
  }
  
  // Content recommendations
  const categoryCount = Object.keys(stats.venues.byCategory).length;
  if (stats.seo.categoryContent < categoryCount) {
    recommendations.push('📂 Generate category content for all venue types');
  }
  
  const neighborhoodCount = Object.keys(stats.venues.byNeighborhood).length;
  if (stats.seo.neighborhoodContent < neighborhoodCount) {
    recommendations.push('🏘️ Generate neighborhood content for all areas');
  }
  
  // If everything looks good
  if (recommendations.length === 0) {
    recommendations.push('✅ System is well-configured and ready for production');
  }
  
  return recommendations;
}

// Health check endpoint
export async function HEAD() {
  try {
    // Quick database connectivity check
    const db = getDatabase();
    db.prepare('SELECT 1').get();
    
    return new Response(null, { status: 200 });
  } catch (error) {
    return new Response(null, { status: 503 });
  }
}