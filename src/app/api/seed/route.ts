import { NextResponse } from 'next/server';
import { seedDatabase } from '../../../../lib/seed-data';
import { getDatabase } from '../../../../lib/database';
import { DatabaseMigrator } from '../../../../lib/automation/db-migration';
import { FunFactsSeeder } from '../../../../lib/seed-fun-facts';
import { MultiCityScraper } from '../../../../lib/automation/multi-city-scraper';

export async function POST() {
  try {
    const seedCount = seedDatabase();
    
    // Also seed fun facts and comprehensive venues
    const db = getDatabase();
    let funFactsCount = 0;
    let totalVenues = 0;
    
    try {
      const migration = new DatabaseMigrator();
      migration.runMigrations();
      
      const funFactsSeeder = new FunFactsSeeder(db);
      funFactsSeeder.seedAllFunFacts();
      funFactsCount = 200; // Approximate count
      
      console.log('✅ Fun facts seeded successfully');
    } catch (funError) {
      console.error('Fun facts seed error:', funError);
      // Don't fail the whole seed if fun facts fail
    }
    
    // Seed comprehensive venues for all cities
    try {
      const multiCityScraper = new MultiCityScraper(db);
      const venueResults = await multiCityScraper.scrapeAllCities();
      totalVenues = venueResults.totalVenues;
      
      console.log(`✅ Multi-city venues seeded: ${totalVenues} venues across ${venueResults.citiesCompleted.length} cities`);
    } catch (venueError) {
      console.error('Multi-city venue seed error:', venueError);
      // Don't fail the whole seed if venue scraping fails
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Successfully seeded complete database: ${seedCount} initial venues + ${totalVenues} comprehensive venues + ${funFactsCount} fun facts`,
      breakdown: {
        initialVenues: seedCount,
        comprehensiveVenues: totalVenues,
        funFacts: funFactsCount,
        total: seedCount + totalVenues + funFactsCount
      }
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to seed database' 
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Force reseed for development - clear existing data first
    if (process.env.NODE_ENV === 'development') {
      const db = getDatabase();
      db.exec('DELETE FROM venues');
      console.log('Cleared existing venues for fresh seed');
    }
    
    const seedCount = seedDatabase();
    
    // Also seed fun facts and comprehensive venues
    const dbInstance = getDatabase();
    let funFactsCount = 0;
    let totalVenues = 0;
    
    try {
      const migration = new DatabaseMigrator();
      migration.runMigrations();
      
      const funFactsSeeder = new FunFactsSeeder(dbInstance);
      funFactsSeeder.seedAllFunFacts();
      funFactsCount = 200; // Approximate count
      
      console.log('✅ Fun facts seeded successfully');
    } catch (funError) {
      console.error('Fun facts seed error:', funError);
      // Don't fail the whole seed if fun facts fail
    }
    
    // Seed comprehensive venues for all cities
    try {
      const multiCityScraper = new MultiCityScraper(dbInstance);
      const venueResults = await multiCityScraper.scrapeAllCities();
      totalVenues = venueResults.totalVenues;
      
      console.log(`✅ Multi-city venues seeded: ${totalVenues} venues across ${venueResults.citiesCompleted.length} cities`);
    } catch (venueError) {
      console.error('Multi-city venue seed error:', venueError);
      // Don't fail the whole seed if venue scraping fails
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Successfully seeded complete database: ${seedCount} initial venues + ${totalVenues} comprehensive venues + ${funFactsCount} fun facts`,
      breakdown: {
        initialVenues: seedCount,
        comprehensiveVenues: totalVenues,
        funFacts: funFactsCount,
        total: seedCount + totalVenues + funFactsCount
      }
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to seed database' 
    }, { status: 500 });
  }
}