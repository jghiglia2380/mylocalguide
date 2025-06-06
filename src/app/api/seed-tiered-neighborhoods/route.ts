import { NextResponse } from 'next/server';
import { seedTieredNeighborhoods } from '@lib/seed-tiered-neighborhoods';
import { runDatabaseMigrations } from '@lib/automation/db-migration';

export async function POST() {
  try {
    console.log('🏘️ Starting tiered neighborhood seeding...');
    
    // First run migrations to ensure all tables are up to date
    const migrationResult = await runDatabaseMigrations();
    if (!migrationResult.success) {
      return NextResponse.json({
        success: false,
        message: 'Migration failed before seeding tiered neighborhoods',
        error: migrationResult.errors
      }, { status: 500 });
    }
    
    // Seed tiered neighborhoods
    const neighborhoodCount = seedTieredNeighborhoods();
    
    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${neighborhoodCount} tiered neighborhoods`,
      data: {
        neighborhoods_seeded: neighborhoodCount,
        migration_version: migrationResult.version,
        strategy: {
          tier_1: 'Major tourist/high-traffic areas with full content treatment',
          tier_2: 'Notable local neighborhoods with basic pages',
          tier_3: 'Directory listings for SEO completeness'
        },
        cities_covered: [
          'San Francisco, CA (30+ neighborhoods)',
          'New York City, NY (14+ neighborhoods)', 
          'Los Angeles, CA (9+ neighborhoods)',
          'More cities can be added using the same template'
        ],
        benefits: [
          'Comprehensive SEO coverage without content overload',
          'Strategic content investment in high-value areas',
          'Scalable template for all 100+ cities',
          'Regional organization for better UX'
        ]
      }
    });
    
  } catch (error) {
    console.error('Tiered neighborhood seeding error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Tiered neighborhood seeding failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Tiered Neighborhood Seeding API',
    methods: ['POST'],
    description: 'Seeds comprehensive tiered neighborhoods across major cities',
    strategy: {
      tier_1_major: {
        description: 'Major tourist/high-traffic neighborhoods',
        content: 'Full pages with rich metadata, descriptions, characteristics',
        count_per_city: '5-8 neighborhoods',
        examples: 'Mission District SF, SoHo NYC, Venice LA'
      },
      tier_2_notable: {
        description: 'Notable local neighborhoods',
        content: 'Basic pages with essential info and venue listings',
        count_per_city: '10-15 neighborhoods', 
        examples: 'Noe Valley SF, Tribeca NYC, Manhattan Beach LA'
      },
      tier_3_directory: {
        description: 'Minor/residential areas for SEO completeness',
        content: 'Directory listings with minimal content',
        count_per_city: '15+ neighborhoods',
        examples: 'Outer Richmond SF, Park Slope NYC, Hermosa Beach LA'
      }
    },
    regional_organization: [
      'Neighborhoods grouped by geographic regions',
      'Hierarchical navigation structure',
      'Better user experience and content discovery'
    ]
  });
}