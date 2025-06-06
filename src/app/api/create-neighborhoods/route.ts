import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { confirm = false } = await request.json();
    
    if (!confirm) {
      return NextResponse.json({
        warning: 'This will create 10 SF neighborhoods in the database',
        instructions: 'Send { confirm: true } to proceed'
      });
    }
    
    console.log('🏘️ Creating SF neighborhoods...');
    
    // Get SF city ID
    const { data: sfCity } = await supabaseAdmin
      .from('cities')
      .select('id')
      .eq('name', 'San Francisco')
      .single();
    
    if (!sfCity) {
      throw new Error('San Francisco city not found');
    }
    
    // SF neighborhoods to create
    const neighborhoods = [
      { name: 'The Mission', slug: 'mission', description: 'Vibrant Latino culture, street art, and the best restaurants per capita in SF' },
      { name: 'Castro', slug: 'castro', description: 'Historic LGBTQ+ neighborhood with great dining and nightlife' },
      { name: 'Marina District', slug: 'marina', description: 'Upscale waterfront neighborhood with fitness culture and restaurants' },
      { name: 'North Beach', slug: 'north-beach', description: 'Italian heritage, authentic delis, and classic San Francisco atmosphere' },
      { name: 'SoMa', slug: 'soma', description: 'South of Market tech hub with modern restaurants and rooftop bars' },
      { name: 'Haight-Ashbury', slug: 'haight', description: 'Bohemian culture, vintage shops, and eclectic dining scene' },
      { name: 'Lower Haight', slug: 'lower-haight', description: 'Emerging food destination punching above its weight' },
      { name: 'Chinatown', slug: 'chinatown', description: 'Authentic Chinese cuisine and traditional tea houses' },
      { name: 'Financial District', slug: 'financial', description: 'Business district with upscale dining and happy hour spots' },
      { name: 'Nob Hill', slug: 'nob-hill', description: 'Elegant neighborhood with fine dining and classic cocktail bars' }
    ];
    
    const neighborhoodsWithCity = neighborhoods.map(n => ({
      ...n,
      city_id: sfCity.id,
      active: true
    }));
    
    // Insert neighborhoods
    const { data: insertedNeighborhoods, error } = await supabaseAdmin
      .from('neighborhoods')
      .upsert(neighborhoodsWithCity, {
        onConflict: 'slug,city_id',
        ignoreDuplicates: false
      })
      .select();
    
    if (error) {
      throw error;
    }
    
    // Get final count
    const { count } = await supabaseAdmin
      .from('neighborhoods')
      .select('*', { count: 'exact', head: true });
    
    return NextResponse.json({
      success: true,
      message: 'Neighborhoods created successfully',
      data: {
        neighborhoodsCreated: insertedNeighborhoods?.length || 0,
        totalNeighborhoods: count,
        neighborhoods: insertedNeighborhoods?.map(n => ({ id: n.id, name: n.name }))
      }
    });
    
  } catch (error: any) {
    console.error('Neighborhood creation error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Neighborhood creation failed'
    }, { status: 500 });
  }
}