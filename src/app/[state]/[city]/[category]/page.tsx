import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCityBySlug, getVenuesByCityAndCategory, getHotelsByCity } from '@lib/database-supabase-simple';
// import HotelBookingWidget from '../../../components/HotelBookingWidget';

const categoryInfo: Record<string, { plural: string; icon: string; description: string }> = {
  hotels: { 
    plural: 'Hotels', 
    icon: '🏨',
    description: 'From budget-friendly to luxury accommodations'
  },
  restaurants: { 
    plural: 'Restaurants', 
    icon: '🍽️',
    description: 'From casual dining to fine cuisine'
  },
  cafes: { 
    plural: 'Cafes', 
    icon: '☕',
    description: 'Coffee shops, tea houses, and bakeries'
  },
  bars: { 
    plural: 'Bars', 
    icon: '🍺',
    description: 'Cocktail lounges, dive bars, and breweries'
  },
  activities: { 
    plural: 'Activities', 
    icon: '🎯',
    description: 'Things to do and places to explore'
  },
};

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ state: string; city: string; category: string }> 
}): Promise<Metadata> {
  const { state, city: citySlug, category } = await params;
  const city = await getCityBySlug(citySlug);
  const catInfo = categoryInfo[category];
  
  if (!city || !catInfo) {
    return { title: 'Not Found' };
  }

  return {
    title: `Best ${catInfo.plural} in ${city.name}, ${city.state_code} - Local Guide`,
    description: `Discover the best ${category} in ${city.name}, ${city.state_name}. ${catInfo.description}. Honest reviews and local recommendations.`,
    openGraph: {
      title: `${catInfo.plural} in ${city.name}`,
      description: `Find the best ${category} in ${city.name}`,
      type: 'website',
    },
  };
}

export default async function CategoryPage({ 
  params 
}: { 
  params: Promise<{ state: string; city: string; category: string }> 
}) {
  const { state, city: citySlug, category } = await params;
  const city = await getCityBySlug(citySlug);
  const catInfo = categoryInfo[category];
  
  if (!city || city.state_slug !== state || !catInfo) {
    notFound();
  }

  // Get data based on category type
  const venues = category === 'hotels' ? [] : await getVenuesByCityAndCategory(city.id, category);
  const hotels = category === 'hotels' ? await getHotelsByCity(city.id) : [];

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
            <span className="text-amber-800">{catInfo.plural}</span>
          </div>

          {/* Header */}
          <div className="text-center mb-12">
            <div className="text-6xl mb-4">{catInfo.icon}</div>
            <h1 className="text-5xl font-bold mb-4 text-amber-900 retro-font">
              {catInfo.plural} in {city.name}
            </h1>
            <p className="text-xl text-amber-700">
              {catInfo.description}
            </p>
          </div>

          {/* Hotel Search Widget */}
          {category === 'hotels' && (
            <div className="mb-8 p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
              <p className="text-purple-800">Hotel booking widget coming soon!</p>
            </div>
          )}

          {/* Hotels */}
          {category === 'hotels' && hotels.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hotels.map((hotel) => (
                <div
                  key={hotel.id}
                  className="p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 border-2 border-purple-200"
                >
                  <h3 className="text-xl font-bold text-purple-900 mb-2">{hotel.name}</h3>
                  <p className="text-gray-600 text-sm mb-3">{hotel.address}</p>
                  
                  {hotel.description && (
                    <p className="text-gray-700 mb-3">{hotel.description}</p>
                  )}
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    {hotel.star_rating && (
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
                        {'★'.repeat(hotel.star_rating)} {hotel.star_rating} Star{hotel.star_rating > 1 ? 's' : ''}
                      </span>
                    )}
                    {hotel.price_range && (
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm capitalize">
                        {hotel.price_range}
                      </span>
                    )}
                    {hotel.avg_nightly_rate && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                        From ${Math.round(hotel.avg_nightly_rate / 100)}/night
                      </span>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    {hotel.website && (
                      <a
                        href={hotel.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-600 hover:text-purple-700 text-sm hover:underline"
                      >
                        Hotel Website →
                      </a>
                    )}
                    <a
                      href={`https://www.booking.com/searchresults.html?ss=${encodeURIComponent(hotel.name + ' ' + city.name)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 text-sm hover:underline ml-auto"
                    >
                      Book Now →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : category !== 'hotels' && venues.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {venues.map((venue) => (
                <div
                  key={venue.id}
                  className="p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 border-2 border-amber-200"
                >
                  <h3 className="text-xl font-bold text-amber-900 mb-2">{venue.name}</h3>
                  <p className="text-gray-600 text-sm mb-3">{venue.neighborhood} • {venue.address}</p>
                  
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
                    {venue.venue_score && venue.venue_score > 80 && (
                      <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                        🔥 Hot Spot
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
          ) : (
            <div className="text-center py-12">
              <p className="text-xl text-amber-700 mb-4">
                No {category} listed yet in {city.name}.
              </p>
              <p className="text-amber-600">
                We're working on adding more {category === 'hotels' ? 'hotels' : 'venues'}. Check back soon!
              </p>
              {category === 'hotels' && (
                <div className="mt-6">
                  <p className="text-amber-600 mb-4">In the meantime, search for hotels on these platforms:</p>
                  <div className="flex justify-center gap-4">
                    <a
                      href={`https://www.booking.com/searchresults.html?ss=${encodeURIComponent(city.name + ', ' + city.state_code)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Booking.com
                    </a>
                    <a
                      href={`https://www.hotels.com/search.do?q-destination=${encodeURIComponent(city.name + ', ' + city.state_code)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Hotels.com
                    </a>
                    <a
                      href={`https://www.expedia.com/Hotel-Search?destination=${encodeURIComponent(city.name + ', ' + city.state_code)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                    >
                      Expedia
                    </a>
                  </div>
                </div>
              )}
            </div>
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