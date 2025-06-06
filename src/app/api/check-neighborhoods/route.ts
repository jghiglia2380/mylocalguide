import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@lib/supabase';

export async function GET() {
  try {
    // Check if neighborhoods exist
    const { data: neighborhoods, count: neighborhoodCount } = await supabaseAdmin
      .from('neighborhoods')
      .select('*', { count: 'exact' });
    
    // Check if cities exist
    const { data: cities, count: cityCount } = await supabaseAdmin
      .from('cities')
      .select('*', { count: 'exact' });
    
    // Check a sample venue address
    const { data: sampleVenue } = await supabaseAdmin
      .from('venues')
      .select('name, address')
      .limit(1)
      .single();
    
    return NextResponse.json({
      neighborhoodCount,
      neighborhoods: neighborhoods?.map(n => ({ id: n.id, name: n.name })),
      cityCount,
      cities: cities?.map(c => ({ id: c.id, name: c.name })),
      sampleVenue
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}