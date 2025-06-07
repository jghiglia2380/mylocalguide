import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCityBySlug, getVenuesByCity, getNeighborhoodsByCityWithFilters } from '@lib/database-supabase-simple';

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

  const allVenues = await getVenuesByCity(city.id);

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b border-gray-300 py-6">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">My Local Guide</h1>
          <p className="text-lg text-gray-700 mb-4">{city.name} Local Discovery</p>
          
          <nav className="flex space-x-6 text-sm">
            <a href="#" className="text-blue-600 hover:underline">Search</a>
            <a href="#" className="text-blue-600 hover:underline">Neighborhoods</a>
            <a href="#" className="text-blue-600 hover:underline">About</a>
          </nav>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">All Venues ({allVenues.length})</h2>
          <div className="space-y-3">
            {allVenues.slice(0, 50).map((venue) => (
              <div key={venue.id} className="border-b border-gray-200 pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-blue-600 hover:underline cursor-pointer font-medium">
                      {venue.name}
                    </h4>
                    <div className="text-sm text-gray-600">
                      {venue.category}
                    </div>
                    {venue.address && (
                      <div className="text-sm text-gray-500">{venue.address}</div>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {venue.yelp_rating && `★${venue.yelp_rating.toFixed(1)}`}
                    {venue.price_range && ` • ${'$'.repeat(venue.price_range)}`}
                  </div>
                </div>
              </div>
            ))}
            {allVenues.length > 50 && (
              <div className="text-center py-4">
                <button className="text-blue-600 hover:underline">
                  View all {allVenues.length} venues
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <footer className="bg-gray-50 border-t border-gray-300 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-600">
          <p>My Local Guide © 2025 | Curated {city.name} venue directory</p>
          <p className="mt-1">Find the best restaurants, bars, coffee shops, and local gems</p>
        </div>
      </footer>
    </div>
  );
}