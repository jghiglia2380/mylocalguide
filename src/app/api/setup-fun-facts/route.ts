import { NextResponse } from 'next/server';
import { getDatabase } from '../../../../lib/database';
import { DatabaseMigrator } from '../../../../lib/automation/db-migration';
import { FunFactsSeeder } from '../../../../lib/seed-fun-facts';

export async function POST() {
  try {
    console.log('🎯 Setting up fun facts system...');
    
    // Run the migration
    const db = getDatabase();
    const migration = new DatabaseMigrator();
    migration.runMigrations();
    console.log('✅ Fun facts tables created');
    
    // Seed the fun facts
    const seeder = new FunFactsSeeder(db);
    seeder.seedAllFunFacts();
    console.log('✅ Fun facts seeded');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Fun facts system setup completed successfully!' 
    });
    
  } catch (error) {
    console.error('❌ Fun facts setup error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}