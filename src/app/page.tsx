import { getAllStates, getCapitalCities, getTouristCities } from '@lib/database-supabase-simple';
import Link from 'next/link';

// Force dynamic rendering to always fetch fresh data
export const dynamic = 'force-dynamic';

export default async function Home() {
  const states = await getAllStates();
  const capitalCities = await getCapitalCities();
  const touristCities = await getTouristCities();

  // Group states by region for better organization
  const regions = {
    'Northeast': ['CT', 'ME', 'MA', 'NH', 'NJ', 'NY', 'PA', 'RI', 'VT'],
    'Southeast': ['AL', 'FL', 'GA', 'KY', 'MD', 'NC', 'SC', 'TN', 'VA', 'WV', 'DE'],
    'Midwest': ['IL', 'IN', 'IA', 'KS', 'MI', 'MN', 'MO', 'NE', 'ND', 'OH', 'SD', 'WI'],
    'Southwest': ['AZ', 'NM', 'OK', 'TX'],
    'West': ['AK', 'CA', 'CO', 'HI', 'ID', 'MT', 'NV', 'OR', 'UT', 'WA', 'WY'],
    'Other': ['AR', 'LA', 'MS']
  };

  const getStatesByRegion = (regionStates: string[]) => {
    return states.filter(state => regionStates.includes(state.code));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-amber-600 to-orange-600 text-white py-8 shadow-lg">
        <div className="container mx-auto px-4">
          <h1 className="text-5xl font-bold mb-2 retro-font">MyLocalGuide</h1>
          <p className="text-xl">Discover authentic local experiences across America</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Popular Cities */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8 text-amber-800 retro-font">
              Popular Destinations
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {touristCities.slice(0, 12).map((city) => (
                <Link
                  key={city.id}
                  href={`/${city.state_slug}/${city.slug}`}
                  className="block p-4 bg-white rounded-lg shadow hover:shadow-lg transition-all duration-300 border-2 border-orange-200 hover:border-orange-400 hover:scale-105"
                >
                  <h3 className="font-bold text-orange-900">{city.name}</h3>
                  <p className="text-sm text-orange-600">{city.state_name}</p>
                  {city.is_capital && (
                    <span className="inline-block mt-1 px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs">
                      State Capital
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </section>

          {/* Browse by State */}
          <section>
            <h2 className="text-3xl font-bold mb-8 text-amber-800 retro-font">
              Browse by State
            </h2>
            
            {Object.entries(regions).map(([region, regionStates]) => {
              const statesInRegion = getStatesByRegion(regionStates);
              if (statesInRegion.length === 0) return null;
              
              return (
                <div key={region} className="mb-10">
                  <h3 className="text-xl font-semibold mb-4 text-amber-700">{region}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {statesInRegion.map((state) => (
                      <Link
                        key={state.id}
                        href={`/${state.slug}`}
                        className="block p-3 bg-white rounded-lg shadow hover:shadow-md transition-all duration-300 border border-amber-200 hover:border-amber-400 text-center hover:scale-105"
                      >
                        <div className="font-bold text-amber-900">{state.code}</div>
                        <div className="text-sm text-amber-600">{state.name}</div>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </section>

          {/* About Section */}
          <section className="mt-16 p-8 bg-white rounded-lg shadow-lg border-2 border-amber-200">
            <h2 className="text-3xl font-bold mb-6 text-amber-800 retro-font">About MyLocalGuide</h2>
            <div className="space-y-4 text-amber-700">
              <p>
                <strong className="text-amber-900">What is MyLocalGuide?</strong><br />
                A curated directory of America's best local venues, from coast to coast. We focus on authentic experiences
                recommended by locals who know their cities inside and out.
              </p>
              <p>
                <strong className="text-amber-900">How is this different from other guides?</strong><br />
                We prioritize local knowledge and hidden gems over tourist traps. No fake reviews, no paid placements - 
                just honest recommendations from people who live and breathe their cities.
              </p>
              <p>
                <strong className="text-amber-900">Which cities do you cover?</strong><br />
                We're expanding to cover all 50 state capitals plus major tourist destinations in each state. 
                From San Francisco's Mission District taquerias to Austin's live music venues to Boston's historic pubs.
              </p>
            </div>
          </section>

          {/* Stats */}
          <section className="mt-12 text-center">
            <div className="inline-grid grid-cols-3 gap-8 p-6 bg-amber-100 rounded-lg">
              <div>
                <div className="text-3xl font-bold text-amber-900">{states.length}</div>
                <div className="text-amber-700">States</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-amber-900">{capitalCities.length + touristCities.length}</div>
                <div className="text-amber-700">Cities</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-amber-900">2000+</div>
                <div className="text-amber-700">Coming Soon</div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 py-8 bg-amber-800 text-amber-100">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-2">MyLocalGuide © 2025 - Made for locals, by locals</p>
          <div className="space-x-4 text-sm">
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
            <Link href="/contact" className="hover:text-white">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}