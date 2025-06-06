import { NextResponse } from 'next/server';
import { supabase } from '@lib/supabase';

export async function GET() {
  try {
    // Get venue stats
    const { count: totalCount } = await supabase
      .from('venues')
      .select('*', { count: 'exact', head: true });
    
    // Get by source
    const { data: sources } = await supabase
      .from('venues')
      .select('source')
      .limit(1000);
    
    const sourceCounts = sources?.reduce((acc: any, v) => {
      acc[v.source] = (acc[v.source] || 0) + 1;
      return acc;
    }, {}) || {};
    
    // Get by category
    const { data: categories } = await supabase
      .from('venues')
      .select('category')
      .limit(1000);
    
    const categoryCounts = categories?.reduce((acc: any, v) => {
      acc[v.category] = (acc[v.category] || 0) + 1;
      return acc;
    }, {}) || {};
    
    // Get recent venues
    const { data: recentVenues } = await supabase
      .from('venues')
      .select('name, source, category, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    
    // Check for Google venues
    const { count: googleCount } = await supabase
      .from('venues')
      .select('*', { count: 'exact', head: true })
      .eq('source', 'google');
    
    return NextResponse.json({
      totalVenues: totalCount,
      bySource: sourceCounts,
      byCategory: categoryCounts,
      googleVenues: googleCount,
      recentVenues: recentVenues?.map(v => ({
        name: v.name,
        source: v.source,
        category: v.category,
        created: new Date(v.created_at).toLocaleString()
      }))
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}