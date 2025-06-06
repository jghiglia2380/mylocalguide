import { getDatabase, getVenuesByNeighborhood } from '@lib/database';
import { NextResponse } from 'next/server';

export async function GET() {
  const db = getDatabase();
  
  // Get all venues with their neighborhoods
  const venues = db.prepare('SELECT id, name, neighborhood FROM venues LIMIT 50').all();
  
  // Get all neighborhoods
  const neighborhoods = db.prepare('SELECT id, name, slug FROM neighborhoods').all();
  
  // Get venue count by neighborhood
  const venueCounts = db.prepare(`
    SELECT neighborhood, COUNT(*) as count 
    FROM venues 
    GROUP BY neighborhood 
    ORDER BY count DESC
  `).all();
  
  // Test the specific function used by the page
  const missionVenues = getVenuesByNeighborhood('The Mission');
  
  return NextResponse.json({
    venues,
    neighborhoods,
    venueCounts,
    totalVenues: venues.length,
    missionVenuesFromFunction: missionVenues.length,
    missionVenues: missionVenues.map((v: any) => ({ id: v.id, name: v.name, neighborhood: v.neighborhood }))
  });
}