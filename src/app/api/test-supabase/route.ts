import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  console.log('🔍 Testing Supabase connection from API route');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log('Environment variables:', {
    supabaseUrl: supabaseUrl ? 'SET' : 'NOT SET',
    supabaseKey: supabaseKey ? 'SET' : 'NOT SET'
  });
  
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ 
      error: 'Missing environment variables',
      supabaseUrl: !!supabaseUrl,
      supabaseKey: !!supabaseKey
    }, { status: 500 });
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    console.log('🚀 Querying venues...');
    const { data, error } = await supabase
      .from('venues')
      .select('id, name, category')
      .eq('city_id', 1)
      .limit(5);
    
    console.log('Query result:', { count: data?.length, error });
    
    if (error) {
      return NextResponse.json({ 
        error: 'Supabase query failed',
        details: error 
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      venueCount: data?.length || 0,
      sampleVenues: data,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json({ 
      error: 'Exception occurred',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}