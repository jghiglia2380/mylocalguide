import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@lib/supabase';

export async function POST() {
  try {
    console.log('🚀 Starting Supabase migration...');
    
    // Test connection
    const { data: test, error: testError } = await supabaseAdmin
      .from('states')
      .select('count')
      .limit(1);
    
    // If states table doesn't exist, we need to run migration
    if (testError && testError.message.includes('does not exist')) {
      return NextResponse.json({
        success: false,
        message: 'Please run the SQL migration in Supabase dashboard first',
        instructions: [
          '1. Go to your Supabase dashboard',
          '2. Click on SQL Editor',
          '3. Copy the contents of /lib/supabase-schema.sql',
          '4. Paste and run in SQL editor',
          '5. Then run this migration again'
        ]
      });
    }
    
    // Import existing venues from seed data
    const { realSFVenues } = await import('@lib/seed-data');
    
    // Get San Francisco city ID
    const { data: sfCity } = await supabaseAdmin
      .from('cities')
      .select('id')
      .eq('slug', 'san-francisco')
      .single();
    
    if (!sfCity) {
      throw new Error('San Francisco city not found. Please run SQL migration first.');
    }
    
    // Get neighborhood IDs
    const { data: neighborhoods } = await supabaseAdmin
      .from('neighborhoods')
      .select('id, name');
    
    const neighborhoodMap = new Map(
      neighborhoods?.map(n => [n.name, n.id]) || []
    );
    
    // Transform and insert venues
    const supabaseVenues = realSFVenues.map(venue => {
      const neighborhoodId = neighborhoodMap.get(venue.neighborhood);
      
      return {
        name: venue.name,
        slug: venue.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        address: venue.address,
        neighborhood_id: neighborhoodId,
        city_id: sfCity.id,
        category: venue.category,
        subcategory: venue.subcategory,
        description: venue.description,
        phone: venue.phone,
        website: venue.website,
        hours: venue.hours ? { regular: venue.hours } : null,
        price_range: venue.price_range,
        atmosphere_tags: JSON.parse(venue.atmosphere_tags || '[]'),
        demographic_tags: JSON.parse(venue.demographic_tags || '[]'),
        features: JSON.parse(venue.feature_tags || '[]'),
        featured: venue.featured,
        active: venue.active,
        source: 'seed',
        external_id: `seed-${venue.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
      };
    });
    
    // Insert venues
    const { data: insertedVenues, error: insertError } = await supabaseAdmin
      .from('venues')
      .upsert(supabaseVenues, {
        onConflict: 'external_id,source',
        ignoreDuplicates: true
      });
    
    if (insertError) {
      throw insertError;
    }
    
    // Get venue count
    const { count } = await supabaseAdmin
      .from('venues')
      .select('*', { count: 'exact', head: true });
    
    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully',
      data: {
        venuesInserted: supabaseVenues.length,
        totalVenuesInDb: count,
        nextSteps: [
          'Run comprehensive venue scraping at /api/automation/scrape',
          'This will add thousands of venues from Google, Yelp, etc.'
        ]
      }
    });
    
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Migration failed',
      details: error
    }, { status: 500 });
  }
}