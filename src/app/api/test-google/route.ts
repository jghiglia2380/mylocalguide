import { NextResponse } from 'next/server';
import { GooglePlacesClient } from '@lib/automation/api-clients';

export async function GET() {
  try {
    const googleClient = new GooglePlacesClient(process.env.GOOGLE_PLACES_API_KEY!);
    
    // Test search for restaurants in Mission District
    console.log('Testing Google Places API...');
    const results = await googleClient.searchVenues(
      'restaurant',
      'San Francisco, CA'
    );
    
    console.log('Search results:', results?.length || 0);
    
    // Get details for first result if any
    let details = null;
    if (results?.[0]?.place_id) {
      details = await googleClient.getPlaceDetails(results[0].place_id);
    }
    
    return NextResponse.json({
      success: true,
      apiKey: process.env.GOOGLE_PLACES_API_KEY ? 'Configured' : 'Missing',
      searchResults: results?.length || 0,
      firstResult: results?.[0] ? {
        name: results[0].name,
        place_id: results[0].place_id,
        address: results[0].formatted_address || results[0].vicinity,
        rating: results[0].rating
      } : null,
      details: details ? {
        name: details.name,
        phone: details.formatted_phone_number,
        website: details.website,
        hours: details.opening_hours?.weekday_text
      } : null
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      apiKey: process.env.GOOGLE_PLACES_API_KEY ? 'Configured' : 'Missing'
    }, { status: 500 });
  }
}