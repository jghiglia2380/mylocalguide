import { NextResponse } from 'next/server';
import { getDatabase } from '../../../../lib/database';
import { ComprehensiveScraper } from '../../../../lib/automation/comprehensive-scraper';

export async function POST() {
  try {
    console.log('🚀 Starting comprehensive venue scraping for San Francisco...');
    
    const db = getDatabase();
    const scraper = new ComprehensiveScraper(db);
    
    // Run the comprehensive scraper
    const stats = await scraper.scrapeAllSanFrancisco();
    
    // Log statistics
    console.log('\n📊 Scraping Statistics:');
    console.log(`Total venues: ${stats.totalVenues}`);
    console.log('\nBy neighborhood:');
    Object.entries(stats.byNeighborhood).forEach(([neighborhood, count]) => {
      console.log(`  ${neighborhood}: ${count} venues`);
    });
    console.log('\nBy category:');
    Object.entries(stats.byCategory).forEach(([category, count]) => {
      console.log(`  ${category}: ${count} venues`);
    });
    
    return NextResponse.json({
      success: true,
      message: 'Comprehensive scraping completed successfully',
      stats: {
        total: stats.totalVenues,
        neighborhoods: stats.byNeighborhood,
        categories: stats.byCategory,
        estimatedCoverage: {
          restaurants: stats.byCategory['Restaurants'] || 0,
          expectedRestaurants: 3234,
          coveragePercent: Math.round(((stats.byCategory['Restaurants'] || 0) / 3234) * 100)
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Scraping error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check scraping status
export async function GET() {
  try {
    const db = getDatabase();
    
    // Get venue statistics
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total_venues,
        COUNT(DISTINCT category) as categories,
        COUNT(DISTINCT subcategory) as subcategories,
        AVG(aggregate_rating) as avg_rating,
        SUM(total_review_count) as total_reviews
      FROM venues_aggregated
    `).get() as any;
    
    // Get neighborhood breakdown
    const neighborhoodStats = db.prepare(`
      SELECT 
        city as neighborhood,
        COUNT(*) as venue_count,
        AVG(aggregate_rating) as avg_rating
      FROM venues_aggregated
      GROUP BY city
      ORDER BY venue_count DESC
    `).all();
    
    // Get category breakdown
    const categoryStats = db.prepare(`
      SELECT 
        category,
        COUNT(*) as venue_count,
        COUNT(DISTINCT subcategory) as subcategory_count,
        AVG(aggregate_rating) as avg_rating
      FROM venues_aggregated
      GROUP BY category
      ORDER BY venue_count DESC
    `).all();
    
    // Get recent scraping history
    const recentScrapes = db.prepare(`
      SELECT * FROM scraping_history
      ORDER BY started_at DESC
      LIMIT 10
    `).all();
    
    return NextResponse.json({
      success: true,
      stats: {
        overview: stats,
        byNeighborhood: neighborhoodStats,
        byCategory: categoryStats,
        recentActivity: recentScrapes,
        lastUpdate: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error fetching scraping stats:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch statistics'
      },
      { status: 500 }
    );
  }
}