import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getStateBySlug, getCitiesByState } from '@lib/database';

export async function generateMetadata({ params }: { params: Promise<{ state: string }> }): Promise<Metadata> {
  const { state: stateSlug } = await params;
  const state = getStateBySlug(stateSlug);
  
  if (!state) {
    return { title: 'State Not Found' };
  }

  return {
    title: `${state.name} Local Guide - Find the Best Spots in ${state.name}`,
    description: `Discover the best restaurants, cafes, bars, and activities in ${state.name}. Your local guide to authentic experiences in ${state.name}'s cities.`,
    openGraph: {
      title: `${state.name} Local Guide`,
      description: `Explore the best local spots across ${state.name}`,
      type: 'website',
    },
  };
}

export default async function StatePage({ params }: { params: Promise<{ state: string }> }) {
  const { state: stateSlug } = await params;
  const state = getStateBySlug(stateSlug);
  
  if (!state) {
    notFound();
  }

  const cities = getCitiesByState(state.code);
  const capitals = cities.filter(c => c.is_capital);
  const touristCities = cities.filter(c => c.is_major_tourist_city && !c.is_capital);
  const otherCities = cities.filter(c => !c.is_capital && !c.is_major_tourist_city);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4 text-amber-900 retro-font">
              {state.name} Local Guide
            </h1>
            <p className="text-xl text-amber-700">
              Discover authentic local experiences across the {state.name}
            </p>
          </div>

          {/* State Capital */}
          {capitals.length > 0 && (
            <section className="mb-12">
              <h2 className="text-3xl font-bold mb-6 text-amber-800 retro-font">
                State Capital
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {capitals.map((city) => (
                  <Link
                    key={city.id}
                    href={`/${state.slug}/${city.slug}`}
                    className="block p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 border-2 border-amber-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-2xl font-bold text-amber-900">{city.name}</h3>
                      <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm">
                        Capital
                      </span>
                    </div>
                    <p className="text-amber-600">
                      Explore {city.name}'s best restaurants, cafes, and attractions
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Major Tourist Cities */}
          {touristCities.length > 0 && (
            <section className="mb-12">
              <h2 className="text-3xl font-bold mb-6 text-amber-800 retro-font">
                Popular Tourist Destinations
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {touristCities.map((city) => (
                  <Link
                    key={city.id}
                    href={`/${state.slug}/${city.slug}`}
                    className="block p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 border-2 border-orange-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-2xl font-bold text-orange-900">{city.name}</h3>
                      <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                        Popular
                      </span>
                    </div>
                    <p className="text-orange-600">
                      Discover {city.name}'s hidden gems and local favorites
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Other Cities */}
          {otherCities.length > 0 && (
            <section className="mb-12">
              <h2 className="text-3xl font-bold mb-6 text-amber-800 retro-font">
                More Cities
              </h2>
              <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
                {otherCities.map((city) => (
                  <Link
                    key={city.id}
                    href={`/${state.slug}/${city.slug}`}
                    className="block p-4 bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-300 border border-amber-100"
                  >
                    <h3 className="text-lg font-semibold text-amber-900">{city.name}</h3>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Back to Home */}
          <div className="text-center mt-12">
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors duration-300"
            >
              ← Back to All States
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}