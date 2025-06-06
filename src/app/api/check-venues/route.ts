import { NextResponse } from 'next/server';
import { supabase } from '@lib/supabase';

export async function GET() {
  try {
    // Get venue count by category
    const { data: venues, error } = await supabase
      .from('venues')
      .select('id, name, category, neighborhood_id')
      .limit(100);
    
    if (error) throw error;
    
    // Get count by category
    const categoryCounts = venues?.reduce((acc: any, venue) => {
      acc[venue.category] = (acc[venue.category] || 0) + 1;
      return acc;
    }, {});
    
    const { count: totalCount } = await supabase
      .from('venues')
      .select('*', { count: 'exact', head: true });
    
    return NextResponse.json({
      totalVenues: totalCount,
      categoryCounts,
      sampleVenues: venues?.slice(0, 10).map(v => ({
        name: v.name,
        category: v.category
      }))
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}