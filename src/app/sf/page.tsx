'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export default function SanFranciscoPage() {
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('all');

  useEffect(() => {
    loadVenues();
  }, []);

  const loadVenues = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('venues')
        .select('*')
        .eq('city_id', 1);
      
      if (data) {
        setVenues(data);
      }
      if (error) {
        console.error('Supabase error:', error);
      }
    } catch (error) {
      console.error('Error loading venues:', error);
    }
    setLoading(false);
  };

  const neighborhoodCounts = venues.reduce((acc, venue) => {
    const hood = venue.neighborhoods?.name || 'Other';
    acc[hood] = (acc[hood] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const categoryCounts = venues.reduce((acc, venue) => {
    const cat = venue.category || 'Other';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const filteredVenues = selectedNeighborhood === 'all' 
    ? venues 
    : venues.filter(v => (v.neighborhoods?.name || 'Other') === selectedNeighborhood);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center">Loading venues...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b border-gray-300 py-6">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">My Local Guide</h1>
          <p className="text-lg text-gray-700 mb-4">San Francisco Local Discovery</p>
          
          <nav className="flex space-x-6 text-sm">
            <a href="#" className="text-blue-600 hover:underline">Search</a>
            <a href="#" className="text-blue-600 hover:underline">Neighborhoods</a>
            <a href="#" className="text-blue-600 hover:underline">About</a>
          </nav>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          <div className="w-1/4">
            <div className="bg-gray-50 p-4 rounded">
              <h3 className="font-bold text-lg mb-3">Neighborhoods</h3>
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
          </div>

          <div className="w-3/4">
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div>
                <h2 className="text-xl font-bold mb-3">Food & Drink</h2>
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
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold mb-3">Activities & Services</h2>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <a href="#" className="text-blue-600 hover:underline">Shopping</a>
                    <span className="text-gray-500">({categoryCounts['Shopping'] || 0})</span>
                  </div>
                  <div className="flex justify-between">
                    <a href="#" className="text-blue-600 hover:underline">Activities</a>
                    <span className="text-gray-500">({categoryCounts['Activities'] || 0})</span>
                  </div>
                  <div className="flex justify-between">
                    <a href="#" className="text-blue-600 hover:underline">Other</a>
                    <span className="text-gray-500">({categoryCounts['Other'] || 0})</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-300 pt-6">
              <h3 className="text-lg font-bold mb-4">
                {selectedNeighborhood === 'all' 
                  ? `All Venues (${filteredVenues.length})`
                  : `${selectedNeighborhood} (${filteredVenues.length})`
                }
              </h3>
              <div className="space-y-3">
                {filteredVenues.slice(0, 50).map((venue) => (
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
                {filteredVenues.length > 50 && (
                  <div className="text-center py-4">
                    <button className="text-blue-600 hover:underline">
                      View all {filteredVenues.length} venues
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="bg-gray-50 border-t border-gray-300 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-600">
          <p>My Local Guide © 2025 | Curated San Francisco venue directory</p>
          <p className="mt-1">Find the best restaurants, bars, coffee shops, and local gems</p>
        </div>
      </footer>
    </div>
  );
}