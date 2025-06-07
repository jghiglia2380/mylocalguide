'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export default function SanFranciscoPage() {
  console.log('🚀 SF PAGE COMPONENT INITIALIZING');
  console.log('Environment check:', {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  });
  
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('all');
  
  console.log('SF Page: venues state has', venues.length, 'venues');

  useEffect(() => {
    console.log('📊 useEffect triggered - calling loadVenues');
    loadVenues();
  }, []);

  const loadVenues = async () => {
    console.log('loadVenues called, supabase client:', !!supabase);
    
    if (!supabase) {
      console.log('No supabase client available');
      setLoading(false);
      return;
    }
    
    try {
      console.log('Querying venues...');
      // First try a simple query without joins
      const { data, error } = await supabase
        .from('venues')
        .select('*')
        .eq('city_id', 1)
        .limit(100);
      
      console.log('Query result:', { dataCount: data?.length, error });
      
      if (data) {
        setVenues(data);
        console.log('Set venues:', data.length);
      }
      if (error) {
        console.error('Supabase error:', error);
      }
    } catch (error) {
      console.error('Error loading venues:', error);
    }
    setLoading(false);
  };

  // Get neighborhood counts (simplified for debugging)
  const neighborhoodCounts = venues.reduce((acc, venue) => {
    const hood = 'All SF'; // Simplified for now
    acc[hood] = (acc[hood] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get category counts  
  const categoryCounts = venues.reduce((acc, venue) => {
    const cat = venue.category || 'Other';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Filter venues by neighborhood (simplified for debugging)
  const filteredVenues = venues;

  if (loading) {
    return (
      <div className="text-center py-12">
        <div>Loading venues...</div>
        <div style={{fontSize: '12px', marginTop: '10px', color: '#666'}}>
          Debug: Supabase URL = {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET'}<br/>
          Debug: Supabase Key = {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET'}<br/>
          Debug: Client = {supabase ? 'INITIALIZED' : 'FAILED'}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* MASSIVE TEST BANNER */}
      <div style={{ 
        background: 'red', 
        color: 'white', 
        padding: '30px', 
        textAlign: 'center', 
        fontSize: '24px', 
        fontWeight: 'bold' 
      }}>
        🚨 DEPLOYMENT TEST - IF YOU SEE THIS, VERCEL IS WORKING! 🚨
      </div>
      
      {/* DEBUG BANNER - VISIBLE CONFIRMATION */}
      <div style={{ background: 'yellow', padding: '10px', textAlign: 'center', fontFamily: 'monospace' }}>
        🚧 DEBUG VERSION - {venues.length} venues loaded - Supabase: {supabase ? 'INIT' : 'FAIL'} - ENV: {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'UNSET'}
      </div>
      
      {/* Header */}
      <header className="bg-white border-b border-gray-300 py-4">
        <div className="max-w-7xl mx-auto px-4 relative">
          {/* Event Calendar - sized to fit above dividing line */}
          <div className="absolute top-0 right-0" style={{width: '400px'}}>
            <div className="bg-gray-50 p-4 rounded border border-gray-300">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-gray-800">Events This Week</h3>
                <div className="flex gap-1">
                  <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm font-medium">Day</button>
                  <button className="px-3 py-1 bg-white text-gray-600 border border-gray-300 rounded text-sm hover:bg-gray-100">Week</button>
                  <button className="px-3 py-1 bg-white text-gray-600 border border-gray-300 rounded text-sm hover:bg-gray-100">Month</button>
                </div>
              </div>
              
              {/* Calendar Grid with tighter spacing to fit */}
              <div className="grid grid-cols-7 gap-1">
                {/* Day headers */}
                <div className="text-center text-gray-600 font-semibold text-sm pb-1">S</div>
                <div className="text-center text-gray-600 font-semibold text-sm pb-1">M</div>
                <div className="text-center text-gray-600 font-semibold text-sm pb-1">T</div>
                <div className="text-center text-gray-600 font-semibold text-sm pb-1">W</div>
                <div className="text-center text-gray-600 font-semibold text-sm pb-1">T</div>
                <div className="text-center text-gray-600 font-semibold text-sm pb-1">F</div>
                <div className="text-center text-gray-600 font-semibold text-sm pb-1">S</div>
                
                {/* Date cells - perfect squares with more height */}
                <div className="relative pb-[100%]">
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-base">31</div>
                </div>
                <div className="relative pb-[100%]">
                  <div className="absolute inset-0 flex items-center justify-center hover:bg-blue-50 cursor-pointer rounded-md text-base border border-transparent hover:border-blue-200">1</div>
                </div>
                <div className="relative pb-[100%]">
                  <div className="absolute inset-0 flex items-center justify-center hover:bg-blue-50 cursor-pointer rounded-md text-base border border-transparent hover:border-blue-200">2</div>
                </div>
                <div className="relative pb-[100%]">
                  <div className="absolute inset-0 flex items-center justify-center hover:bg-blue-50 cursor-pointer rounded-md text-base border border-transparent hover:border-blue-200">3</div>
                </div>
                <div className="relative pb-[100%]">
                  <div className="absolute inset-0 flex items-center justify-center hover:bg-blue-50 cursor-pointer rounded-md text-base border border-transparent hover:border-blue-200">4</div>
                </div>
                <div className="relative pb-[100%]">
                  <div className="absolute inset-0 flex items-center justify-center hover:bg-blue-50 cursor-pointer rounded-md text-base border border-transparent hover:border-blue-200">5</div>
                </div>
                <div className="relative pb-[100%]">
                  <div className="absolute inset-0 flex items-center justify-center bg-blue-100 text-blue-700 font-bold rounded-md cursor-pointer text-base border border-blue-200">6</div>
                </div>
                
                <div className="relative pb-[100%]">
                  <div className="absolute inset-0 flex items-center justify-center bg-blue-600 text-white rounded-md cursor-pointer text-base font-bold">7</div>
                </div>
                <div className="relative pb-[100%]">
                  <div className="absolute inset-0 flex items-center justify-center hover:bg-blue-50 cursor-pointer rounded-md text-base border border-transparent hover:border-blue-200">8</div>
                </div>
                <div className="relative pb-[100%]">
                  <div className="absolute inset-0 flex items-center justify-center hover:bg-blue-50 cursor-pointer rounded-md text-base border border-transparent hover:border-blue-200">9</div>
                </div>
                <div className="relative pb-[100%]">
                  <div className="absolute inset-0 flex items-center justify-center bg-blue-100 text-blue-700 font-bold rounded-md cursor-pointer text-base border border-blue-200">10</div>
                </div>
                <div className="relative pb-[100%]">
                  <div className="absolute inset-0 flex items-center justify-center bg-blue-100 text-blue-700 font-bold rounded-md cursor-pointer text-base border border-blue-200">11</div>
                </div>
                <div className="relative pb-[100%]">
                  <div className="absolute inset-0 flex items-center justify-center hover:bg-blue-50 cursor-pointer rounded-md text-base border border-transparent hover:border-blue-200">12</div>
                </div>
                <div className="relative pb-[100%]">
                  <div className="absolute inset-0 flex items-center justify-center hover:bg-blue-50 cursor-pointer rounded-md text-base border border-transparent hover:border-blue-200">13</div>
                </div>
              </div>
              
              {/* Legend with tighter spacing */}
              <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-blue-600 rounded"></span>
                  <span>Today</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-blue-100 border border-blue-200 rounded"></span>
                  <span>Has events</span>
                </div>
              </div>
            </div>
          </div>
          
          <h1 className="text-4xl font-bold text-blue-600 mb-2">🚨 DEPLOYMENT TEST - mylocalguide</h1>
          <p className="text-lg text-gray-700">san francisco local discovery - substance over style</p>
          
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
                    <span className="text-gray-500">(2)</span>
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
                    <span className="text-gray-500">(2)</span>
                  </div>
                  <div className="flex justify-between">
                    <a href="#" className="text-blue-600 hover:underline">Books & Media</a>
                    <span className="text-gray-500">(2)</span>
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
                    <span className="text-gray-500">(2)</span>
                  </div>
                  <div className="flex justify-between">
                    <a href="#" className="text-blue-600 hover:underline">Outdoor Activities</a>
                    <span className="text-gray-500">(2)</span>
                  </div>
                </div>
              </div>

              {/* Services & Practical */}
              <div>
                <h2 className="text-xl font-bold mb-3 text-gray-800">Services & Practical</h2>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <a href="#" className="text-blue-600 hover:underline">Work Spaces</a>
                    <span className="text-gray-500">(2)</span>
                  </div>
                  <div className="flex justify-between">
                    <a href="#" className="text-blue-600 hover:underline">Personal Services</a>
                    <span className="text-gray-500">(2)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Venue Listings */}
            <div className="border-t border-gray-300 pt-6">
              <h3 className="text-lg font-bold mb-4 text-gray-800">
                {selectedNeighborhood === 'all' 
                  ? `All Venues (${filteredVenues.length})`
                  : `${selectedNeighborhood} (${filteredVenues.length})`
                }
              </h3>
              <div className="space-y-3">
                {filteredVenues.slice(0, 20).map((venue) => (
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
                {filteredVenues.length > 20 && (
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

      {/* About Section */}
      <div className="bg-gray-50 mt-12 p-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">About My Local Guide</h2>
          <div className="grid md:grid-cols-2 gap-8 text-sm">
            <div>
              <h3 className="font-bold mb-2">What is My Local Guide?</h3>
              <p className="mb-4">A curated directory of San Francisco's best venues, focusing on substance over style. No reviews, no ratings - just well-researched recommendations from locals who know the city.</p>
              
              <h3 className="font-bold mb-2">How is this different from Yelp?</h3>
              <p className="mb-4">We prioritize information density and authentic local knowledge over photos and user reviews. Think Craigslist's simplicity meets a city insider's expertise.</p>
            </div>
            <div>
              <h3 className="font-bold mb-2">How do you find the best restaurants in San Francisco?</h3>
              <p className="mb-4">Our team personally visits venues and focuses on what locals actually care about: quality, atmosphere, and whether it's worth your time and money.</p>
              
              <h3 className="font-bold mb-2">Do you cover all San Francisco neighborhoods?</h3>
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
          <div>Made for locals, by locals. San Francisco venue discovery without the noise.</div>
        </div>
      </footer>
    </div>
  );
}