import { NextResponse } from 'next/server';
import { seedDatabase } from '@lib/seed-data';
import { getDatabase } from '@lib/database';

export async function POST() {
  try {
    const seedCount = seedDatabase();
    return NextResponse.json({ 
      success: true, 
      message: `Successfully seeded ${seedCount} venues`,
      count: seedCount 
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
    return NextResponse.json({ 
      success: true, 
      message: `Successfully seeded ${seedCount} venues`,
      count: seedCount 
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to seed database' 
    }, { status: 500 });
  }
}