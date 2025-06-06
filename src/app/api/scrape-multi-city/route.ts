import { NextResponse } from 'next/server';
import { getDatabase } from '../../../../lib/database';
import { MultiCityScraper } from '../../../../lib/automation/multi-city-scraper';

export async function POST() {
  try {
    console.log('🌍 Starting multi-city comprehensive venue scraping...');
    
    const db = getDatabase();
    const scraper = new MultiCityScraper(db);
    
    // Run the multi-city scraper
    const results = await scraper.scrapeAllCities();
    
    // Calculate estimated coverage
    const estimatedTotalVenues = results.totalCities * 2000; // Conservative estimate
    const coveragePercent = Math.round((results.totalVenues / estimatedTotalVenues) * 100);
    
    console.log('\n🎉 Multi-city scraping complete!');
    console.log(`📊 Results:`);
    console.log(`  - Cities processed: ${results.citiesCompleted.length}/${results.totalCities}`);
    console.log(`  - Total venues: ${results.totalVenues.toLocaleString()}`);
    console.log(`  - Failed cities: ${results.citiesFailed.length}`);
    
    // Log top cities by venue count
    const topCities = Object.entries(results.detailedStats)
      .sort(([,a], [,b]) => (b as any).totalVenues - (a as any).totalVenues)
      .slice(0, 10);
    
    console.log('\n🏆 Top cities by venue count:');
    topCities.forEach(([city, stats]) => {
      console.log(`  ${city}: ${(stats as any).totalVenues} venues`);
    });
    
    return NextResponse.json({
      success: true,
      message: `Multi-city scraping completed: ${results.totalVenues.toLocaleString()} venues across ${results.citiesCompleted.length} cities`,
      results: {
        overview: {
          totalCities: results.totalCities,
          citiesCompleted: results.citiesCompleted.length,
          citiesFailed: results.citiesFailed.length,
          totalVenues: results.totalVenues,
          estimatedCoverage: `${coveragePercent}%`,
          avgVenuesPerCity: Math.round(results.totalVenues / results.citiesCompleted.length)
        },
        topCities: topCities.map(([city, stats]) => ({
          city,
          venues: (stats as any).totalVenues,
          neighborhoods: Object.keys((stats as any).byNeighborhood).length,
          categories: Object.keys((stats as any).byCategory).length
        })),
        failedCities: results.citiesFailed,
        detailedBreakdown: results.detailedStats
      }
    });
    
  } catch (error) {
    console.error('❌ Multi-city scraping error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check current multi-city coverage
export async function GET() {
  try {
    const db = getDatabase();
    
    // Get comprehensive statistics across all cities
    const overallStats = db.prepare(`
      SELECT 
        COUNT(DISTINCT city) as cities_with_venues,
        COUNT(*) as total_venues,
        COUNT(DISTINCT category) as total_categories,
        COUNT(DISTINCT subcategory) as total_subcategories,
        AVG(aggregate_rating) as avg_rating_all_cities,
        SUM(total_review_count) as total_reviews_all_cities
      FROM venues_aggregated
    `).get() as any;
    
    // Get breakdown by city
    const cityBreakdown = db.prepare(`
      SELECT 
        city,
        COUNT(*) as venue_count,
        COUNT(DISTINCT category) as categories,
        COUNT(DISTINCT subcategory) as subcategories,
        AVG(aggregate_rating) as avg_rating,
        SUM(total_review_count) as total_reviews,
        MIN(last_updated) as oldest_update,
        MAX(last_updated) as newest_update
      FROM venues_aggregated
      GROUP BY city
      ORDER BY venue_count DESC
    `).all();
    
    // Get category breakdown across all cities
    const categoryBreakdown = db.prepare(`
      SELECT 
        category,
        COUNT(*) as total_venues,
        COUNT(DISTINCT city) as cities_covered,
        AVG(aggregate_rating) as avg_rating
      FROM venues_aggregated
      GROUP BY category
      ORDER BY total_venues DESC
    `).all();
    
    // Get cities that need venue data
    const citiesNeedingData = db.prepare(`
      SELECT c.name, s.name as state, c.population, c.is_major_tourist_city
      FROM cities c
      JOIN states s ON c.state_id = s.id
      WHERE c.name NOT IN (SELECT DISTINCT city FROM venues_aggregated)
      ORDER BY 
        c.is_major_tourist_city DESC,
        c.population DESC NULLS LAST
      LIMIT 20
    `).all();
    
    return NextResponse.json({
      success: true,
      coverage: {
        overview: {
          ...overallStats,
          coverage_status: overallStats.cities_with_venues > 50 ? 'Good' : 
                          overallStats.cities_with_venues > 20 ? 'Moderate' : 'Needs Work'
        },
        byCity: cityBreakdown,
        byCategory: categoryBreakdown,
        citiesNeedingData: citiesNeedingData,
        lastUpdated: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error fetching multi-city coverage:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch coverage statistics'
      },
      { status: 500 }
    );
  }
}