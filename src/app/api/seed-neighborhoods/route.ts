import { NextResponse } from 'next/server';
import { seedNeighborhoods } from '@lib/seed-neighborhoods';
import { runDatabaseMigrations } from '@lib/automation/db-migration';

export async function POST() {
  try {
    console.log('🏘️ Starting neighborhood seeding...');
    
    // First run migrations to ensure neighborhood tables are up to date
    const migrationResult = await runDatabaseMigrations();
    if (!migrationResult.success) {
      return NextResponse.json({
        success: false,
        message: 'Migration failed before seeding neighborhoods',
        error: migrationResult.errors
      }, { status: 500 });
    }
    
    // Seed neighborhoods
    const neighborhoodCount = seedNeighborhoods();
    
    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${neighborhoodCount} neighborhoods across major cities`,
      data: {
        neighborhoods_seeded: neighborhoodCount,
        migration_version: migrationResult.version,
        cities_covered: [
          'San Francisco, CA',
          'New York City, NY', 
          'Los Angeles, CA',
          'Chicago, IL',
          'Miami, FL',
          'Austin, TX'
        ]
      }
    });
    
  } catch (error) {
    console.error('Neighborhood seeding error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Neighborhood seeding failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Neighborhood seeding API endpoint',
    methods: ['POST'],
    description: 'Seeds the database with comprehensive neighborhood data for major cities',
    features: [
      'Enhanced neighborhood metadata (walkability, safety, price level)',
      'Neighborhood characteristics and best-for tags',
      'Transit access information',
      'Rich descriptions for SEO'
    ]
  });
}