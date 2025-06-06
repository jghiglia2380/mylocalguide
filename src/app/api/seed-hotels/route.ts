import { NextResponse } from 'next/server';
import { seedHotels } from '@lib/seed-hotels';
import { runDatabaseMigrations } from '@lib/automation/db-migration';

export async function POST() {
  try {
    console.log('🏨 Starting hotel seeding...');
    
    // First run migrations to ensure hotel tables exist
    const migrationResult = await runDatabaseMigrations();
    if (!migrationResult.success) {
      return NextResponse.json({
        success: false,
        message: 'Migration failed before seeding hotels',
        error: migrationResult.errors
      }, { status: 500 });
    }
    
    // Seed hotels
    const hotelCount = seedHotels();
    
    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${hotelCount} hotels`,
      data: {
        hotels_seeded: hotelCount,
        migration_version: migrationResult.version
      }
    });
    
  } catch (error) {
    console.error('Hotel seeding error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Hotel seeding failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Hotel seeding API endpoint',
    methods: ['POST'],
    description: 'Seeds the database with sample hotels for San Francisco'
  });
}