'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export default function CityPageClient({ city }: { city: any }) {
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadVenues();
  }, []);

  const loadVenues = async () => {
    if (!supabase) {
      console.log('No Supabase client');
      setLoading(false);
      return;
    }

    let allVenues: any[] = [];
    let start = 0;
    const pageSize = 1000;
    
    while (true) {
      const { data, error } = await supabase
        .from('venues')
        .select('*, neighborhoods(id, name)')
        .eq('city_id', city.id)
        .eq('active', true)
        .range(start, start + pageSize - 1);
      
      if (error) {
        console.error('Error loading venues:', error);
        break;
      }
      
      if (!data || data.length === 0) break;
      
      allVenues = allVenues.concat(data);
      console.log(`Loaded ${allVenues.length} venues so far...`);
      
      if (data.length < pageSize) break;
      start += pageSize;
    }
    
    console.log(`Total venues loaded: ${allVenues.length}`);
    setVenues(allVenues);
    setLoading(false);
  };

  // Get neighborhood counts
  const neighborhoodCounts = venues.reduce((acc, venue) => {
    const hood = venue.neighborhoods?.name || 'Other';
    acc[hood] = (acc[hood] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get category counts
  const categoryCounts = venues.reduce((acc, venue) => {
    const cat = venue.category || 'Other';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Filter venues
  const filteredVenues = venues.filter(venue => {
    const neighborhoodMatch = selectedNeighborhood === 'all' || 
      (venue.neighborhoods?.name || 'Other') === selectedNeighborhood;
    const categoryMatch = selectedCategory === 'all' || 
      venue.category === selectedCategory;
    const searchMatch = searchTerm === '' || 
      venue.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      venue.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      venue.neighborhoods?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return neighborhoodMatch && categoryMatch && searchMatch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center">Loading {city.name} venues...</div>
        </div>
      </div>
    );
  }

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
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Popular searches */}
          <div className="mt-2 text-sm text-gray-600">
            <span className="font-medium">popular:</span>
            <button onClick={() => setSearchTerm('tacos')} className="ml-2 text-blue-600 hover:underline">mission tacos</button> |
            <button onClick={() => setSearchTerm('brunch')} className="ml-1 text-blue-600 hover:underline">marina brunch</button> |
            <button onClick={() => setSearchTerm('bars')} className="ml-1 text-blue-600 hover:underline">castro bars</button> |
            <button onClick={() => setSearchTerm('coffee')} className="ml-1 text-blue-600 hover:underline">coffee + wifi</button>
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
                <button
                  onClick={() => setSelectedNeighborhood('all')}
                  className={`block w-full text-left p-2 rounded text-sm ${
                    selectedNeighborhood === 'all'
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  All SF ({venues.length})
                </button>
                {Object.entries(neighborhoodCounts)
                  .sort(([,a], [,b]) => (b as number) - (a as number))
                  .slice(0, 15)
                  .map(([hood, count]) => (
                    <button
                      key={hood}
                      onClick={() => setSelectedNeighborhood(hood)}
                      className={`block w-full text-left p-2 rounded text-sm ${
                        selectedNeighborhood === hood
                          ? 'bg-blue-100 text-blue-700 font-medium'
                          : 'text-blue-600 hover:bg-blue-50'
                      }`}
                    >
                      {hood} ({count as number})
                    </button>
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
                  <button 
                    onClick={() => setSelectedCategory('Restaurants')}
                    className="flex justify-between w-full text-left hover:bg-gray-50 p-1"
                  >
                    <span className="text-blue-600 hover:underline">Restaurants</span>
                    <span className="text-gray-500">({categoryCounts['Restaurants'] || 0})</span>
                  </button>
                  <button 
                    onClick={() => setSelectedCategory('Bars & Nightlife')}
                    className="flex justify-between w-full text-left hover:bg-gray-50 p-1"
                  >
                    <span className="text-blue-600 hover:underline">Bars & Nightlife</span>
                    <span className="text-gray-500">({categoryCounts['Bars & Nightlife'] || 0})</span>
                  </button>
                  <button 
                    onClick={() => setSelectedCategory('Cafes & Coffee')}
                    className="flex justify-between w-full text-left hover:bg-gray-50 p-1"
                  >
                    <span className="text-blue-600 hover:underline">Cafes & Coffee</span>
                    <span className="text-gray-500">({categoryCounts['Cafes & Coffee'] || 0})</span>
                  </button>
                </div>
              </div>

              {/* Other categories */}
              <div>
                <h2 className="text-xl font-bold mb-3 text-gray-800">Other Categories</h2>
                <div className="space-y-1">
                  <button 
                    onClick={() => setSelectedCategory('all')}
                    className="flex justify-between w-full text-left hover:bg-gray-50 p-1"
                  >
                    <span className="text-blue-600 hover:underline">All Categories</span>
                    <span className="text-gray-500">({venues.length})</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Venue Listings */}
            <div className="border-t border-gray-300 pt-6">
              <h3 className="text-lg font-bold mb-4 text-gray-800">
                {selectedCategory !== 'all' && `${selectedCategory} - `}
                {selectedNeighborhood !== 'all' && `${selectedNeighborhood} - `}
                {searchTerm && `"${searchTerm}" - `}
                {filteredVenues.length} venues
              </h3>
              <div className="space-y-3">
                {filteredVenues.slice(0, 100).map((venue) => (
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
                {filteredVenues.length > 100 && (
                  <div className="text-center py-4">
                    <div className="text-blue-600">
                      Showing 100 of {filteredVenues.length} venues
                    </div>
                  </div>
                )}
              </div>
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