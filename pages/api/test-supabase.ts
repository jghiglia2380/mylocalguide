import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🔍 Testing Supabase connection from API route');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log('Environment variables:', {
    supabaseUrl: supabaseUrl ? 'SET' : 'NOT SET',
    supabaseKey: supabaseKey ? 'SET' : 'NOT SET'
  });
  
  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ 
      error: 'Missing environment variables',
      supabaseUrl: !!supabaseUrl,
      supabaseKey: !!supabaseKey,
      envVars: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL,
        VERCEL_ENV: process.env.VERCEL_ENV
      }
    });
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
      return res.status(500).json({ 
        error: 'Supabase query failed',
        details: error 
      });
    }
    
    return res.json({
      success: true,
      venueCount: data?.length || 0,
      sampleVenues: data,
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL,
        VERCEL_ENV: process.env.VERCEL_ENV
      }
    });
    
  } catch (error) {
    console.error('API route error:', error);
    return res.status(500).json({ 
      error: 'Exception occurred',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}