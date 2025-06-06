'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SFVenuesPage() {
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('all');

  useEffect(() => {
    loadVenues();
  }, []);

  const loadVenues = async () => {
    const { data, error } = await supabase
      .from('venues')
      .select('*, neighborhoods(name)')
      .eq('city_id', 1)
      .order('aggregate_rating', { ascending: false });
    
    if (data) {
      setVenues(data);
    }
    setLoading(false);
  };

  // Get unique categories and neighborhoods
  const categories = ['all', ...new Set(venues.map(v => v.category).filter(Boolean))];
  const neighborhoods = ['all', ...new Set(venues.map(v => v.neighborhoods?.name).filter(Boolean))];

  // Filter venues
  const filteredVenues = venues.filter(venue => {
    const categoryMatch = selectedCategory === 'all' || venue.category === selectedCategory;
    const neighborhoodMatch = selectedNeighborhood === 'all' || venue.neighborhoods?.name === selectedNeighborhood;
    return categoryMatch && neighborhoodMatch;
  });

  if (loading) {
    return <div className="text-center py-12">Loading venues...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50">
      <header className="bg-gradient-to-r from-amber-600 to-orange-600 text-white py-8 shadow-lg">
        <div className="container mx-auto px-4">
          <h1 className="text-5xl font-bold mb-2 retro-font">San Francisco Venues</h1>
          <p className="text-xl">{venues.length} authentic local spots discovered</p>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-lg border-2 border-amber-200 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-amber-800 retro-font">Filter Venues</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-amber-700">Category</label>
              <select 
                className="w-full p-3 border-2 border-amber-200 rounded-lg focus:border-amber-400 focus:outline-none"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? '🏪 All Categories' : 
                     cat === 'Restaurants' ? '🍽️ Restaurants' :
                     cat === 'Bars & Nightlife' ? '🍺 Bars & Nightlife' :
                     cat === 'Cafes & Coffee' ? '☕ Cafes & Coffee' :
                     cat === 'Shopping' ? '🛍️ Shopping' :
                     cat === 'Activities' ? '🎯 Activities' : cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-amber-700">Neighborhood</label>
              <select 
                className="w-full p-3 border-2 border-amber-200 rounded-lg focus:border-amber-400 focus:outline-none"
                value={selectedNeighborhood}
                onChange={(e) => setSelectedNeighborhood(e.target.value)}
              >
                {neighborhoods.map(hood => (
                  <option key={hood} value={hood}>
                    {hood === 'all' ? '📍 All Neighborhoods' : hood}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 text-center">
            <span className="inline-block px-4 py-2 bg-amber-100 text-amber-700 rounded-full font-semibold">
              📊 Showing {filteredVenues.length} of {venues.length} venues
            </span>
          </div>
        </div>

        {/* Venues Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVenues.map((venue) => (
            <div key={venue.id} className="bg-white rounded-lg shadow-lg border-2 border-orange-200 p-6 hover:border-orange-400 hover:shadow-xl transition-all duration-300">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-bold text-orange-900">{venue.name}</h3>
                <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-sm">
                  {venue.category === 'Restaurants' ? '🍽️' :
                   venue.category === 'Bars & Nightlife' ? '🍺' :
                   venue.category === 'Cafes & Coffee' ? '☕' :
                   venue.category === 'Shopping' ? '🛍️' :
                   venue.category === 'Activities' ? '🎯' : '📍'}
                </span>
              </div>
              <p className="text-amber-700 font-medium text-sm mb-2">
                {venue.neighborhoods?.name || 'San Francisco'} • {venue.category}
              </p>
              {venue.address && (
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{venue.address}</p>
              )}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-orange-100">
                {venue.yelp_rating && (
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-500 text-lg">★</span>
                    <span className="font-bold text-gray-800">{venue.yelp_rating.toFixed(1)}</span>
                    <span className="text-gray-500 text-xs">
                      ({venue.yelp_review_count})
                    </span>
                  </div>
                )}
                {venue.price_range && (
                  <span className="text-green-600 font-bold">
                    {'$'.repeat(venue.price_range)}
                  </span>
                )}
              </div>
              {venue.source === 'yelp' && (
                <div className="mt-3 text-xs text-green-600 font-semibold">
                  ✓ Discovered with FREE Yelp API
                </div>
              )}
            </div>
          ))}
        </div>
        {/* Back Navigation */}
        <div className="text-center mt-12">
          <a
            href="/"
            className="inline-block px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors duration-300 font-semibold"
          >
            ← Back to MyLocalGuide
          </a>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-16 py-8 bg-amber-800 text-amber-100">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-2">MyLocalGuide © 2025 - Made for locals, by locals</p>
          <p className="text-sm">
            394 venues discovered using FREE Yelp API • $0.00 total cost
          </p>
        </div>
      </footer>
    </div>
  );
}