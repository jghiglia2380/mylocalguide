import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' });
    }
    
    // Direct API call to Google Places
    const query = 'restaurants in San Francisco';
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    return NextResponse.json({
      apiKeyConfigured: true,
      apiKeyPrefix: apiKey.substring(0, 10) + '***',
      status: data.status,
      errorMessage: data.error_message,
      resultsCount: data.results?.length || 0,
      firstThreeResults: data.results?.slice(0, 3).map((r: any) => ({
        name: r.name,
        address: r.formatted_address,
        rating: r.rating,
        placeId: r.place_id
      })),
      rawResponse: data.status !== 'OK' ? data : undefined
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      apiKeyConfigured: !!process.env.GOOGLE_PLACES_API_KEY
    }, { status: 500 });
  }
}