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

  // Get neighborhood counts
  const neighborhoodCounts = allVenues.reduce((acc, venue) => {
    const hood = venue.neighborhoods?.name || 'Other';
    acc[hood] = (acc[hood] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get category counts  
  const categoryCounts = allVenues.reduce((acc, venue) => {
    const cat = venue.category || 'Other';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-300 py-4">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold text-blue-600 mb-2">mylocalguide</h1>
          <p className="text-lg text-gray-700">{city.name.toLowerCase()} local discovery - substance over style</p>
          
          {/* Navigation */}
          <nav className="mt-4 flex space-x-6 text-sm">
            <a href="#" className="text-blue-600 hover:underline">search</a>
            <a href="#" className="text-blue-600 hover:underline">neighborhoods</a>
            <a href="#" className="text-blue-600 hover:underline">about</a>
            <a href="#" className="text-blue-600 hover:underline">add a place</a>
          </nav>
          
          {/* Search */}
          <div className="mt-4">
            <input 
              type="text" 
              placeholder="search venues, neighborhoods, cuisine..."
              className="w-full max-w-md p-2 border border-gray-300 rounded"
            />
            <button className="ml-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              search
            </button>
          </div>
          
          {/* Popular searches */}
          <div className="mt-2 text-sm text-gray-600">
            <span className="font-medium">popular:</span>
            <a href="#" className="ml-2 text-blue-600 hover:underline">mission tacos</a> |
            <a href="#" className="ml-1 text-blue-600 hover:underline">marina brunch</a> |
            <a href="#" className="ml-1 text-blue-600 hover:underline">castro bars</a> |
            <a href="#" className="ml-1 text-blue-600 hover:underline">coffee + wifi</a>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-8">
          {/* Left Sidebar - Neighborhoods */}
          <div className="w-1/4">
            <div className="bg-gray-50 p-4 rounded">
              <h3 className="font-bold text-lg mb-3 text-gray-800">Neighborhoods</h3>
              <div className="space-y-1">
                <div className="block w-full text-left p-2 rounded text-sm bg-blue-100 text-blue-700 font-medium">
                  All SF ({allVenues.length})
                </div>
                {Object.entries(neighborhoodCounts)
                  .sort(([,a], [,b]) => (b as number) - (a as number))
                  .slice(0, 10)
                  .map(([hood, count]) => (
                    <div key={hood} className="block w-full text-left p-2 rounded text-sm text-blue-600 hover:bg-blue-50">
                      {hood} ({count as number})
                    </div>
                  ))}
              </div>
            </div>
            
            {/* Featured This Week */}
            <div className="bg-gray-50 p-4 rounded mt-6">
              <h3 className="font-bold text-lg mb-3 text-gray-800">Featured This Week</h3>
              <div className="space-y-3">
                <div className="text-sm">
                  <div className="font-medium text-blue-600">Sample Featured Venue</div>
                  <div className="text-gray-600">Mission District - Modern American</div>
                  <div className="text-gray-500 text-xs">Award-winning chef, outdoor seating, reservations recommended</div>
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-600">
                Want your business featured? <a href="#" className="text-blue-600 hover:underline">Learn more</a>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="w-3/4">
            {/* Categories */}
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {/* Food & Drink */}
              <div>
                <h2 className="text-xl font-bold mb-3 text-gray-800">Food & Drink</h2>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <a href="#" className="text-blue-600 hover:underline">Restaurants</a>
                    <span className="text-gray-500">({categoryCounts['Restaurants'] || 0})</span>
                  </div>
                  <div className="flex justify-between">
                    <a href="#" className="text-blue-600 hover:underline">Bars & Nightlife</a>
                    <span className="text-gray-500">({categoryCounts['Bars & Nightlife'] || 0})</span>
                  </div>
                  <div className="flex justify-between">
                    <a href="#" className="text-blue-600 hover:underline">Cafes & Coffee</a>
                    <span className="text-gray-500">({categoryCounts['Cafes & Coffee'] || 0})</span>
                  </div>
                  <div className="flex justify-between">
                    <a href="#" className="text-blue-600 hover:underline">Specialty Food</a>
                    <span className="text-gray-500">({categoryCounts['Specialty Food'] || 0})</span>
                  </div>
                </div>
              </div>

              {/* Shopping & Retail */}
              <div>
                <h2 className="text-xl font-bold mb-3 text-gray-800">Shopping & Retail</h2>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <a href="#" className="text-blue-600 hover:underline">Shopping</a>
                    <span className="text-gray-500">({categoryCounts['Shopping'] || 0})</span>
                  </div>
                  <div className="flex justify-between">
                    <a href="#" className="text-blue-600 hover:underline">Fashion</a>
                    <span className="text-gray-500">({categoryCounts['Fashion'] || 0})</span>
                  </div>
                  <div className="flex justify-between">
                    <a href="#" className="text-blue-600 hover:underline">Books & Media</a>
                    <span className="text-gray-500">({categoryCounts['Books & Media'] || 0})</span>
                  </div>
                </div>
              </div>

              {/* Activities & Entertainment */}
              <div>
                <h2 className="text-xl font-bold mb-3 text-gray-800">Activities & Entertainment</h2>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <a href="#" className="text-blue-600 hover:underline">Activities</a>
                    <span className="text-gray-500">({categoryCounts['Activities'] || 0})</span>
                  </div>
                  <div className="flex justify-between">
                    <a href="#" className="text-blue-600 hover:underline">Arts & Culture</a>
                    <span className="text-gray-500">({categoryCounts['Arts & Culture'] || 0})</span>
                  </div>
                  <div className="flex justify-between">
                    <a href="#" className="text-blue-600 hover:underline">Outdoor Activities</a>
                    <span className="text-gray-500">({categoryCounts['Outdoor Activities'] || 0})</span>
                  </div>
                </div>
              </div>

              {/* Services & Practical */}
              <div>
                <h2 className="text-xl font-bold mb-3 text-gray-800">Services & Practical</h2>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <a href="#" className="text-blue-600 hover:underline">Services</a>
                    <span className="text-gray-500">({categoryCounts['Services'] || 0})</span>
                  </div>
                  <div className="flex justify-between">
                    <a href="#" className="text-blue-600 hover:underline">Personal Services</a>
                    <span className="text-gray-500">({categoryCounts['Personal Services'] || 0})</span>
                  </div>
                  <div className="flex justify-between">
                    <a href="#" className="text-blue-600 hover:underline">Other</a>
                    <span className="text-gray-500">({categoryCounts['Other'] || 0})</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Venue Listings */}
            <div className="border-t border-gray-300 pt-6">
              <h3 className="text-lg font-bold mb-4 text-gray-800">
                All Venues ({allVenues.length})
              </h3>
              <div className="space-y-3">
                {allVenues.slice(0, 50).map((venue) => (
                  <div key={venue.id} className="border-b border-gray-200 pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-blue-600 hover:underline cursor-pointer font-medium">
                          {venue.name}
                        </h4>
                        <div className="text-sm text-gray-600">
                          {venue.neighborhoods?.name || 'SF'} - {venue.category}
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
        </div>
      </div>

      {/* About Section */}
      <div className="bg-gray-50 mt-12 p-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">About My Local Guide</h2>
          <div className="grid md:grid-cols-2 gap-8 text-sm">
            <div>
              <h3 className="font-bold mb-2">What is My Local Guide?</h3>
              <p className="mb-4">A curated directory of {city.name}'s best venues, focusing on substance over style. No reviews, no ratings - just well-researched recommendations from locals who know the city.</p>
              
              <h3 className="font-bold mb-2">How is this different from Yelp?</h3>
              <p className="mb-4">We prioritize information density and authentic local knowledge over photos and user reviews. Think Craigslist's simplicity meets a city insider's expertise.</p>
            </div>
            <div>
              <h3 className="font-bold mb-2">How do you find the best restaurants in {city.name}?</h3>
              <p className="mb-4">Our team personally visits venues and focuses on what locals actually care about: quality, atmosphere, and whether it's worth your time and money.</p>
              
              <h3 className="font-bold mb-2">Do you cover all {city.name} neighborhoods?</h3>
              <p>Yes - from Mission District taquerias to Marina brunch spots to Castro bars. Every neighborhood has hidden gems worth discovering.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-300 py-6 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-600">
          <div className="mb-2">
            mylocalguide © 2025 | 
            <a href="#" className="text-blue-600 hover:underline ml-1">privacy</a> |
            <a href="#" className="text-blue-600 hover:underline ml-1">terms</a> |
            <a href="#" className="text-blue-600 hover:underline ml-1">advertise</a> |
            <a href="#" className="text-blue-600 hover:underline ml-1">contact</a>
          </div>
          <div>Made for locals, by locals. {city.name} venue discovery without the noise.</div>
        </div>
      </footer>
    </div>
  );
}