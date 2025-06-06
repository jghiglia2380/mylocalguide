import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@lib/supabase';

// SF neighborhood mapping based on addresses
const NEIGHBORHOOD_PATTERNS = [
  { name: 'The Mission', patterns: ['Mission St', 'Valencia St', '16th St', '18th St', '20th St', '24th St', 'Mission District', '94110'] },
  { name: 'Castro', patterns: ['Castro St', 'Market St', 'Castro', '18th St', '94114'] },
  { name: 'Marina District', patterns: ['Marina', 'Chestnut St', 'Union St', 'Fillmore St', '94123'] },
  { name: 'North Beach', patterns: ['Columbus Ave', 'Stockton St', 'Grant Ave', 'North Beach', '94133'] },
  { name: 'Chinatown', patterns: ['Grant Ave', 'Kearny St', 'Chinatown', 'Clay St', '94108'] },
  { name: 'SoMa', patterns: ['Howard St', 'Folsom St', 'Bryant St', 'SoMa', 'South of Market', '94103'] },
  { name: 'Haight-Ashbury', patterns: ['Haight St', 'Ashbury St', 'Divisadero St', '94117'] },
  { name: 'Financial District', patterns: ['Montgomery St', 'California St', 'Financial', 'Battery St', '94104', '94111'] },
  { name: 'Pacific Heights', patterns: ['Pacific Ave', 'Jackson St', 'Pacific Heights', '94115'] },
  { name: 'Nob Hill', patterns: ['California St', 'Powell St', 'Nob Hill', 'Sacramento St', '94109'] }
];

export async function POST(request: NextRequest) {
  try {
    const { confirm = false } = await request.json();
    
    if (!confirm) {
      return NextResponse.json({
        warning: 'This will assign neighborhoods to all 103 venues based on their addresses',
        instructions: 'Send { confirm: true } to proceed'
      });
    }
    
    console.log('🏠 Starting neighborhood assignment...');
    
    // Get all venues without neighborhoods
    const { data: venues } = await supabaseAdmin
      .from('venues')
      .select('id, name, address')
      .is('neighborhood_id', null);
    
    if (!venues) {
      throw new Error('No venues found');
    }
    
    // Get all neighborhoods
    const { data: neighborhoods } = await supabaseAdmin
      .from('neighborhoods')
      .select('id, name');
    
    const neighborhoodMap = new Map(neighborhoods?.map(n => [n.name, n.id]) || []);
    
    let assignedCount = 0;
    const assignments: any[] = [];
    
    for (const venue of venues) {
      let assignedNeighborhood = null;
      
      // Try to match address to neighborhood
      for (const neighborhood of NEIGHBORHOOD_PATTERNS) {
        const patterns = neighborhood.patterns;
        const address = venue.address || '';
        
        if (patterns.some(pattern => address.includes(pattern))) {
          const neighborhoodId = neighborhoodMap.get(neighborhood.name);
          if (neighborhoodId) {
            assignedNeighborhood = {
              id: neighborhoodId,
              name: neighborhood.name
            };
            break;
          }
        }
      }
      
      // Default to SoMa if no match found
      if (!assignedNeighborhood) {
        const somaId = neighborhoodMap.get('SoMa');
        if (somaId) {
          assignedNeighborhood = {
            id: somaId,
            name: 'SoMa'
          };
        }
      }
      
      if (assignedNeighborhood) {
        // Update venue
        const { error } = await supabaseAdmin
          .from('venues')
          .update({ neighborhood_id: assignedNeighborhood.id })
          .eq('id', venue.id);
        
        if (!error) {
          assignedCount++;
          assignments.push({
            venue: venue.name,
            neighborhood: assignedNeighborhood.name,
            address: venue.address
          });
        }
      }
    }
    
    // Get final counts by neighborhood
    const finalCounts: any = {};
    for (const [name, id] of neighborhoodMap) {
      const { count } = await supabaseAdmin
        .from('venues')
        .select('*', { count: 'exact', head: true })
        .eq('neighborhood_id', id);
      
      finalCounts[name] = count;
    }
    
    return NextResponse.json({
      success: true,
      message: 'Neighborhood assignment completed',
      data: {
        venuesProcessed: venues.length,
        venuesAssigned: assignedCount,
        finalCounts,
        sampleAssignments: assignments.slice(0, 10)
      }
    });
    
  } catch (error: any) {
    console.error('Neighborhood assignment error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Assignment failed'
    }, { status: 500 });
  }
}