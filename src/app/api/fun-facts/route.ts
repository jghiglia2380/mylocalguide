import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '../../../../lib/database';
import { FunFactsDB } from '../../../../lib/fun-facts-db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const neighborhoodId = searchParams.get('neighborhoodId');
    const cityId = searchParams.get('cityId');
    const category = searchParams.get('category');
    const latitude = searchParams.get('lat');
    const longitude = searchParams.get('lng');
    const radius = searchParams.get('radius');
    const count = searchParams.get('count');

    const db = getDatabase();
    const funFactsDB = new FunFactsDB(db);

    let result: any;

    switch (type) {
      case 'neighborhood':
        if (!neighborhoodId) {
          return NextResponse.json(
            { error: 'neighborhoodId is required for neighborhood type' },
            { status: 400 }
          );
        }
        result = funFactsDB.getFactsByNeighborhood(parseInt(neighborhoodId));
        break;

      case 'city':
        if (!cityId) {
          return NextResponse.json(
            { error: 'cityId is required for city type' },
            { status: 400 }
          );
        }
        result = funFactsDB.getFactsByCity(parseInt(cityId));
        break;

      case 'location':
        if (!latitude || !longitude) {
          return NextResponse.json(
            { error: 'lat and lng are required for location type' },
            { status: 400 }
          );
        }
        const radiusKm = radius ? parseFloat(radius) : 0.5;
        result = funFactsDB.getFactsByLocation(
          parseFloat(latitude),
          parseFloat(longitude),
          radiusKm
        );
        break;

      case 'category':
        if (!category) {
          return NextResponse.json(
            { error: 'category is required for category type' },
            { status: 400 }
          );
        }
        result = funFactsDB.getFactsByCategory(
          category,
          cityId ? parseInt(cityId) : undefined
        );
        break;

      case 'random':
        const factCount = count ? parseInt(count) : 5;
        result = funFactsDB.getRandomFacts(
          factCount,
          cityId ? parseInt(cityId) : undefined
        );
        break;

      case 'secrets':
        result = funFactsDB.getLocalSecrets(
          cityId ? parseInt(cityId) : undefined
        );
        break;

      case 'stats':
        result = funFactsDB.getFunFactStats(
          cityId ? parseInt(cityId) : undefined
        );
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid type. Supported types: neighborhood, city, location, category, random, secrets, stats' },
          { status: 400 }
        );
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Fun facts API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}