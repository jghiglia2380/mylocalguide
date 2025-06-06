import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('Budget scraping API called');
    
    const body = await request.json();
    console.log('Request body:', body);
    
    if (!body.confirm) {
      return NextResponse.json({
        strategy: 'FREE Yelp + $10 Google',
        message: 'Send { confirm: true } to proceed with scraping'
      });
    }
    
    // Simple test response
    return NextResponse.json({
      success: true,
      message: 'Budget scraping would run here',
      testData: {
        estimatedVenues: '2000+',
        estimatedCost: '$10',
        sources: ['Yelp (FREE)', 'Google ($10)']
      }
    });
    
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}