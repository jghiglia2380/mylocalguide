import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCityBySlug, getVenuesByCity, getNeighborhoodsByCityWithFilters } from '@lib/database-supabase-simple';
import { parseCharacteristics, parseBestFor, PRICE_LEVEL_COLORS } from '@lib/types/neighborhood';

const categories = [
  { name: 'Hotels', slug: 'hotels', icon: '🏨', color: 'bg-purple-100 border-purple-300 text-purple-800' },
  { name: 'Restaurants', slug: 'restaurants', icon: '🍽️', color: 'bg-red-100 border-red-300 text-red-800' },
  { name: 'Cafes', slug: 'cafes', icon: '☕', color: 'bg-amber-100 border-amber-300 text-amber-800' },
  { name: 'Bars', slug: 'bars', icon: '🍺', color: 'bg-blue-100 border-blue-300 text-blue-800' },
  { name: 'Activities', slug: 'activities', icon: '🎯', color: 'bg-green-100 border-green-300 text-green-800' },
];

export async function generateMetadata({ params }: { params: Promise<{ state: string; city: string }> }): Promise<Metadata> {
  const { state, city: citySlug } = await params;
  const city = await getCityBySlug(citySlug);
  
  if (!city) {
    return { title: 'City Not Found' };
  }

  return {
    title: `${city.name}, ${city.state_code} Local Guide - Best Restaurants, Cafes & Bars`,
    description: `Discover the best local spots in ${city.name}, ${city.state_code}. Find authentic restaurants, cozy cafes, lively bars, and unique activities recommended by locals.`,
    openGraph: {
      title: `${city.name} Local Guide`,
      description: `Your insider guide to ${city.name}'s best kept secrets`,
      type: 'website',
    },
  };
}

export default async function CityPage({ params }: { params: Promise<{ state: string; city: string }> }) {
  const { state, city: citySlug } = await params;
  const city = await getCityBySlug(citySlug);
  
  if (!city) {
    notFound();
  }

  const topVenues = await getVenuesByCity(city.id, 12);
  const allNeighborhoods = await getNeighborhoodsByCityWithFilters(city.id);
  
  // Group neighborhoods by tier and region
  const majorNeighborhoods = allNeighborhoods.filter(n => (n as any).tier === 1);
  const notableNeighborhoods = allNeighborhoods.filter(n => (n as any).tier === 2);
  const directoryNeighborhoods = allNeighborhoods.filter(n => (n as any).tier === 3);
  
  // Group by region for major neighborhoods
  const neighborhoodsByRegion = majorNeighborhoods.reduce((acc, neighborhood) => {
    const region = (neighborhood as any).region_name || 'Other';
    if (!acc[region]) acc[region] = [];
    acc[region].push(neighborhood);
    return acc;
  }, {} as Record<string, typeof majorNeighborhoods>);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 text-amber-600 mb-2">
              <Link href="/" className="hover:underline">Home</Link>
              <span>›</span>
              <Link href={`/${city.state_slug}`} className="hover:underline">{city.state_name}</Link>
              <span>›</span>
              <span className="text-amber-800">{city.name}</span>
            </div>
            <h1 className="text-5xl font-bold mb-4 text-amber-900 retro-font">
              {city.name} Local Guide
            </h1>
            <p className="text-xl text-amber-700">
              Discover authentic local experiences in {city.name}, {city.state_name}
            </p>
            {city.is_capital && (
              <span className="inline-block mt-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-full">
                🏛️ State Capital
              </span>
            )}
            {city.is_major_tourist_city && (
              <span className="inline-block mt-2 ml-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-full">
                ⭐ Popular Tourist Destination
              </span>
            )}
          </div>

          {/* Categories */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6 text-amber-800 retro-font">
              Explore by Category
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {categories.map((category) => (
                <Link
                  key={category.slug}
                  href={`/${city.state_slug}/${city.slug}/${category.slug}`}
                  className={`block p-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 border-2 ${category.color} hover:scale-105`}
                >
                  <div className="text-4xl mb-2 text-center">{category.icon}</div>
                  <h3 className="text-xl font-bold text-center">{category.name}</h3>
                </Link>
              ))}
            </div>
          </section>

          {/* Major Neighborhoods by Region */}
          {Object.keys(neighborhoodsByRegion).length > 0 && (
            <section className="mb-12">
              <h2 className="text-3xl font-bold mb-6 text-amber-800 retro-font">
                Explore Top Neighborhoods
              </h2>
              {Object.entries(neighborhoodsByRegion).map(([region, regionNeighborhoods]) => (
                <div key={region} className="mb-8">
                  <h3 className="text-xl font-semibold mb-4 text-amber-700">{region}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {regionNeighborhoods.map((hood) => {
                      const h = hood as any;
                      const characteristics = parseCharacteristics(h.characteristics);
                      const bestFor = parseBestFor(h.best_for);
                      
                      return (
                        <Link
                          key={hood.id}
                          href={`/${city.state_slug}/${city.slug}/neighborhood/${hood.slug}`}
                          className="block p-4 bg-white rounded-lg shadow hover:shadow-lg transition-all duration-300 border-2 border-amber-200 hover:border-amber-400 hover:scale-105"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-bold text-amber-900">{hood.name}</h4>
                            <div className="flex items-center gap-2">
                              {h.tier === 1 && (
                                <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium">
                                  ⭐ Popular
                                </span>
                              )}
                              {h.price_level && (
                                <span className={`px-2 py-1 rounded text-xs ${PRICE_LEVEL_COLORS[h.price_level as keyof typeof PRICE_LEVEL_COLORS].bg} ${PRICE_LEVEL_COLORS[h.price_level as keyof typeof PRICE_LEVEL_COLORS].text}`}>
                                  {h.price_level}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {hood.description && (
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{hood.description}</p>
                          )}
                          
                          {characteristics.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {characteristics.slice(0, 2).map((char, index) => (
                                <span key={index} className="px-2 py-1 bg-amber-50 text-amber-600 rounded text-xs">
                                  {char}
                                </span>
                              ))}
                              {characteristics.length > 2 && (
                                <span className="px-2 py-1 bg-gray-50 text-gray-500 rounded text-xs">
                                  +{characteristics.length - 2}
                                </span>
                              )}
                            </div>
                          )}
                          
                          {bestFor.length > 0 && (
                            <p className="text-xs text-orange-600">
                              Perfect for: {bestFor.slice(0, 2).join(', ')}
                              {bestFor.length > 2 && '...'}
                            </p>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* More Neighborhoods */}
          {(notableNeighborhoods.length > 0 || directoryNeighborhoods.length > 0) && (
            <section className="mb-12">
              <h3 className="text-2xl font-bold mb-6 text-amber-800 retro-font">
                More Neighborhoods in {city.name}
              </h3>
              
              {/* Notable Neighborhoods */}
              {notableNeighborhoods.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold mb-3 text-amber-700">Local Favorites</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {notableNeighborhoods.map((hood) => {
                      const h = hood as any;
                      return (
                        <Link
                          key={hood.id}
                          href={`/${city.state_slug}/${city.slug}/neighborhood/${hood.slug}`}
                          className="block p-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-300 border border-amber-200"
                        >
                          <div className="flex items-center justify-between">
                            <h5 className="font-medium text-amber-900 text-sm">{hood.name}</h5>
                            {h.price_level && (
                              <span className={`px-1 py-0.5 rounded text-xs ${PRICE_LEVEL_COLORS[h.price_level as keyof typeof PRICE_LEVEL_COLORS].bg} ${PRICE_LEVEL_COLORS[h.price_level as keyof typeof PRICE_LEVEL_COLORS].text}`}>
                                {h.price_level.charAt(0).toUpperCase()}
                              </span>
                            )}
                        </div>
                        {hood.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-1">{hood.description}</p>
                        )}
                      </Link>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {/* Directory Neighborhoods */}
              {directoryNeighborhoods.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold mb-3 text-amber-700">All Neighborhoods</h4>
                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                    {directoryNeighborhoods.map((hood) => (
                      <Link
                        key={hood.id}
                        href={`/${city.state_slug}/${city.slug}/neighborhood/${hood.slug}`}
                        className="block p-2 bg-white rounded shadow hover:shadow-sm transition-shadow duration-300 border border-gray-200 text-center"
                      >
                        <span className="text-sm text-gray-700 hover:text-amber-700">{hood.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Top Venues */}
          {topVenues.length > 0 && (
            <section className="mb-12">
              <h2 className="text-3xl font-bold mb-6 text-amber-800 retro-font">
                Popular Spots
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {topVenues.map((venue) => (
                  <div
                    key={venue.id}
                    className="p-6 bg-white rounded-lg shadow-lg border-2 border-orange-200"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold text-orange-900">{venue.name}</h3>
                      <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-sm">
                        {venue.category}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{venue.neighborhood}</p>
                    {venue.description && (
                      <p className="text-gray-700 text-sm line-clamp-2">{venue.description}</p>
                    )}
                    {venue.rating && (
                      <div className="mt-2 flex items-center gap-1">
                        <span className="text-yellow-500">★</span>
                        <span className="text-sm text-gray-600">{venue.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {topVenues.length === 12 && (
                <div className="text-center mt-6">
                  <p className="text-amber-600">
                    Explore more venues by selecting a category or neighborhood above
                  </p>
                </div>
              )}
            </section>
          )}

          {/* No Venues Yet */}
          {topVenues.length === 0 && (
            <section className="text-center py-12">
              <div className="max-w-md mx-auto">
                <p className="text-xl text-amber-700 mb-4">
                  We're still building our guide for {city.name}.
                </p>
                <p className="text-amber-600">
                  Check back soon for the best local recommendations!
                </p>
              </div>
            </section>
          )}

          {/* Back Navigation */}
          <div className="text-center mt-12">
            <Link
              href={`/${city.state_slug}`}
              className="inline-block px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors duration-300"
            >
              ← Back to {city.state_name}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}