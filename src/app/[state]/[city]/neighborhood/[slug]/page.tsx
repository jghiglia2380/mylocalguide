import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCityBySlug, getVenuesByCityAndNeighborhood, getNeighborhoodsByCity, getNeighborhoodWithTags, getNeighborhoodStats } from '@lib/database-supabase-simple';
import { SAFETY_COLORS, WALKABILITY_ICONS, TRANSIT_ICONS, PRICE_LEVEL_COLORS, parseCharacteristics, parseBestFor } from '@lib/types/neighborhood';

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ state: string; city: string; slug: string }> 
}): Promise<Metadata> {
  const { state, city: citySlug, slug } = await params;
  const city = await getCityBySlug(citySlug);
  const neighborhoods = city ? await getNeighborhoodsByCity(city.id) : [];
  const neighborhood = neighborhoods.find(n => n.slug === slug);
  
  if (!city || !neighborhood) {
    return { title: 'Not Found' };
  }

  return {
    title: `${neighborhood.name}, ${city.name} - Best Local Spots & Hidden Gems`,
    description: `Explore ${neighborhood.name} in ${city.name}, ${city.state_name}. ${neighborhood.description || `Discover the best restaurants, cafes, bars, and activities in this vibrant neighborhood.`}`,
    openGraph: {
      title: `${neighborhood.name} - ${city.name} Local Guide`,
      description: neighborhood.description || `Your guide to ${neighborhood.name}`,
      type: 'website',
    },
  };
}

export default async function NeighborhoodPage({ 
  params 
}: { 
  params: Promise<{ state: string; city: string; slug: string }> 
}) {
  const { state, city: citySlug, slug } = await params;
  const city = await getCityBySlug(citySlug);
  
  if (!city || city.state_slug !== state) {
    notFound();
  }

  const neighborhood = await getNeighborhoodWithTags(slug);
  
  if (!neighborhood || neighborhood.city_id !== city.id) {
    notFound();
  }

  const venues = await getVenuesByCityAndNeighborhood(city.id, neighborhood.name);
  const neighborhoodStats = await getNeighborhoodStats(neighborhood.id);
  const allNeighborhoods = await getNeighborhoodsByCity(city.id);

  // Group venues by category
  const venuesByCategory = venues.reduce((acc, venue) => {
    if (!acc[venue.category]) {
      acc[venue.category] = [];
    }
    acc[venue.category].push(venue);
    return acc;
  }, {} as Record<string, typeof venues>);

  const categoryIcons: Record<string, string> = {
    restaurants: '🍽️',
    cafes: '☕',
    bars: '🍺',
    activities: '🎯',
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-amber-600 mb-6">
            <Link href="/" className="hover:underline">Home</Link>
            <span>›</span>
            <Link href={`/${city.state_slug}`} className="hover:underline">{city.state_name}</Link>
            <span>›</span>
            <Link href={`/${city.state_slug}/${city.slug}`} className="hover:underline">{city.name}</Link>
            <span>›</span>
            <span className="text-amber-800">{neighborhood.name}</span>
          </div>

          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4 text-amber-900 retro-font">
              {neighborhood.name}
            </h1>
            {neighborhood.description && (
              <p className="text-xl text-amber-700 max-w-3xl mx-auto mb-6">
                {neighborhood.description}
              </p>
            )}
            
            {/* Neighborhood Metadata */}
            <div className="flex flex-wrap justify-center gap-4 mb-6">
              {neighborhood.price_level && (
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${(PRICE_LEVEL_COLORS as any)[neighborhood.price_level]?.bg || 'bg-gray-100'} ${(PRICE_LEVEL_COLORS as any)[neighborhood.price_level]?.text || 'text-gray-700'}`}>
                  {neighborhood.price_level.replace('-', ' ')}
                </span>
              )}
              {neighborhood.walkability && (
                <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  {(WALKABILITY_ICONS as any)[neighborhood.walkability] || ''} {neighborhood.walkability} walkability
                </span>
              )}
              {neighborhood.safety && (
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${(SAFETY_COLORS as any)[neighborhood.safety]?.bg || 'bg-gray-100'} ${(SAFETY_COLORS as any)[neighborhood.safety]?.text || 'text-gray-700'}`}>
                  🛡️ {neighborhood.safety.replace('-', ' ')}
                </span>
              )}
              {neighborhood.transit_access && (
                <span className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                  {(TRANSIT_ICONS as any)[neighborhood.transit_access] || ''} {neighborhood.transit_access} transit
                </span>
              )}
            </div>
            
            {/* Characteristics */}
            {neighborhood.characteristics_parsed.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-amber-800 mb-2">Neighborhood Vibe</h3>
                <div className="flex flex-wrap justify-center gap-2">
                  {neighborhood.characteristics_parsed.map((characteristic: string, index: number) => (
                    <span key={index} className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm">
                      {characteristic}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Best For */}
            {neighborhood.best_for_parsed.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-amber-800 mb-2">Perfect For</h3>
                <div className="flex flex-wrap justify-center gap-2">
                  {neighborhood.best_for_parsed.map((bestFor, index) => (
                    <span key={index} className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                      {bestFor}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
              <div className="bg-white rounded-lg p-4 shadow border border-amber-200">
                <div className="text-2xl font-bold text-amber-900">{neighborhoodStats.venue_count}</div>
                <div className="text-sm text-amber-600">Total Venues</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow border border-red-200">
                <div className="text-2xl font-bold text-red-900">{neighborhoodStats.restaurant_count}</div>
                <div className="text-sm text-red-600">Restaurants</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow border border-blue-200">
                <div className="text-2xl font-bold text-blue-900">{neighborhoodStats.bar_count}</div>
                <div className="text-sm text-blue-600">Bars</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow border border-green-200">
                <div className="text-2xl font-bold text-green-900">{neighborhoodStats.cafe_count}</div>
                <div className="text-sm text-green-600">Cafes</div>
              </div>
            </div>
          </div>

          {/* Venues by Category */}
          {Object.entries(venuesByCategory).length > 0 ? (
            Object.entries(venuesByCategory).map(([category, categoryVenues]) => (
              <section key={category} className="mb-12">
                <h2 className="text-3xl font-bold mb-6 text-amber-800 retro-font flex items-center gap-3">
                  <span>{categoryIcons[category] || '📍'}</span>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categoryVenues.map((venue) => (
                    <div
                      key={venue.id}
                      className="p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 border-2 border-orange-200"
                    >
                      <h3 className="text-xl font-bold text-orange-900 mb-2">{venue.name}</h3>
                      <p className="text-gray-600 text-sm mb-3">{venue.address}</p>
                      
                      {venue.description && (
                        <p className="text-gray-700 mb-3">{venue.description}</p>
                      )}
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        {venue.rating && (
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
                            ★ {venue.rating.toFixed(1)}
                          </span>
                        )}
                        {venue.price_level && (
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                            {'$'.repeat(venue.price_level)}
                          </span>
                        )}
                      </div>
                      
                      {venue.website && (
                        <a
                          href={venue.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-amber-600 hover:text-amber-700 text-sm hover:underline"
                        >
                          Visit Website →
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-xl text-amber-700 mb-4">
                No venues listed yet in {neighborhood.name}.
              </p>
              <p className="text-amber-600">
                We're working on adding more venues. Check back soon!
              </p>
            </div>
          )}

          {/* Other Neighborhoods */}
          {allNeighborhoods.length > 1 && (
            <section className="mt-12">
              <h3 className="text-2xl font-bold mb-6 text-amber-800 retro-font">
                Explore Other Neighborhoods in {city.name}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allNeighborhoods
                  .filter(n => n.id !== neighborhood.id)
                  .map((hood) => {
                    const h = hood as any;
                    const characteristics = parseCharacteristics(h.characteristics);
                    const bestFor = parseBestFor(h.best_for);
                    
                    return (
                      <Link
                        key={hood.id}
                        href={`/${city.state_slug}/${city.slug}/neighborhood/${hood.slug}`}
                        className="block p-4 bg-white rounded-lg shadow hover:shadow-lg transition-all duration-300 border border-amber-200 hover:border-amber-400"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold text-amber-900">{hood.name}</h4>
                          {h.price_level && (
                            <span className={`px-2 py-1 rounded text-xs ${PRICE_LEVEL_COLORS[h.price_level as keyof typeof PRICE_LEVEL_COLORS].bg} ${PRICE_LEVEL_COLORS[h.price_level as keyof typeof PRICE_LEVEL_COLORS].text}`}>
                              {h.price_level}
                            </span>
                          )}
                        </div>
                        
                        {hood.description && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{hood.description}</p>
                        )}
                        
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          {h.walkability && (
                            <span>{WALKABILITY_ICONS[h.walkability as keyof typeof WALKABILITY_ICONS]}</span>
                          )}
                          {h.transit_access && (
                            <span>{TRANSIT_ICONS[h.transit_access as keyof typeof TRANSIT_ICONS]}</span>
                          )}
                          {h.safety && (
                            <span className={SAFETY_COLORS[h.safety as keyof typeof SAFETY_COLORS].text}>🛡️</span>
                          )}
                        </div>
                        
                        {characteristics.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {characteristics.slice(0, 2).map((char, index) => (
                              <span key={index} className="px-2 py-1 bg-amber-50 text-amber-600 rounded text-xs">
                                {char}
                              </span>
                            ))}
                            {characteristics.length > 2 && (
                              <span className="px-2 py-1 bg-gray-50 text-gray-500 rounded text-xs">
                                +{characteristics.length - 2} more
                              </span>
                            )}
                          </div>
                        )}
                      </Link>
                    );
                  })}
              </div>
            </section>
          )}

          {/* Back Navigation */}
          <div className="text-center mt-12">
            <Link
              href={`/${city.state_slug}/${city.slug}`}
              className="inline-block px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors duration-300"
            >
              ← Back to {city.name}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}