import { NextResponse } from 'next/server';
import { supabase } from '@lib/supabase';

export async function GET() {
  try {
    // Get unmapped venues
    const { data: unmappedVenues } = await supabase
      .from('venues')
      .select('id, name, address, source')
      .is('neighborhood_id', null);
    
    return NextResponse.json({
      unmappedCount: unmappedVenues?.length || 0,
      unmappedVenues: unmappedVenues?.map(v => ({
        name: v.name,
        address: v.address,
        source: v.source
      }))
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}