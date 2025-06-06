import { NextResponse } from 'next/server';
import { supabase } from '@lib/supabase';

export async function GET() {
  try {
    // Get venues without neighborhoods
    const { data: unmappedVenues, count: unmappedCount } = await supabase
      .from('venues')
      .select('id, name, neighborhood_id', { count: 'exact' })
      .is('neighborhood_id', null);
    
    // Get venues with neighborhoods
    const { count: mappedCount } = await supabase
      .from('venues')
      .select('*', { count: 'exact', head: true })
      .not('neighborhood_id', 'is', null);
    
    // Get neighborhood venue counts
    const { data: neighborhoods } = await supabase
      .from('neighborhoods')
      .select('id, name');
    
    const neighborhoodCounts: any = {};
    for (const n of neighborhoods || []) {
      const { count } = await supabase
        .from('venues')
        .select('*', { count: 'exact', head: true })
        .eq('neighborhood_id', n.id);
      
      neighborhoodCounts[n.name] = count;
    }
    
    // Get venues by source
    const { data: googleVenues } = await supabase
      .from('venues')
      .select('name, neighborhood_id')
      .eq('source', 'google')
      .limit(10);
    
    return NextResponse.json({
      totalVenues: (unmappedCount || 0) + (mappedCount || 0),
      venuesWithNeighborhoods: mappedCount,
      venuesWithoutNeighborhoods: unmappedCount,
      neighborhoodCounts,
      sampleUnmappedVenues: unmappedVenues?.slice(0, 10).map(v => v.name),
      sampleGoogleVenues: googleVenues?.map(v => ({
        name: v.name,
        hasNeighborhood: !!v.neighborhood_id
      }))
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}