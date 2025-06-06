'use client';

import React, { useState, useEffect } from 'react';
import { FunFactWithLocation } from '../../lib/types/fun-facts';

interface LocationFunFactsProps {
  radiusKm?: number;
  maxFacts?: number;
}

export function LocationFunFacts({ radiusKm = 0.5, maxFacts = 5 }: LocationFunFactsProps) {
  const [facts, setFacts] = useState<FunFactWithLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  const getCurrentLocation = () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLocation({ lat, lng });

        try {
          const response = await fetch(
            `/api/fun-facts?type=location&lat=${lat}&lng=${lng}&radius=${radiusKm}`
          );
          
          if (!response.ok) {
            throw new Error('Failed to fetch fun facts');
          }

          const data = await response.json();
          setFacts(data.slice(0, maxFacts));
        } catch (err) {
          setError('Failed to load fun facts for your location');
          console.error('Error fetching location-based fun facts:', err);
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        let errorMessage = 'Unable to get your location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        setError(errorMessage);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  const formatDistance = (distanceKm: number): string => {
    if (distanceKm < 0.1) {
      return 'Right here!';
    } else if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)}m away`;
    } else {
      return `${distanceKm.toFixed(1)}km away`;
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900">
          🗺️ Fun Facts Near You
        </h3>
        {!location && (
          <button
            onClick={getCurrentLocation}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '📍 Finding...' : '📍 Find My Location'}
          </button>
        )}
      </div>

      {location && (
        <div className="mb-4 text-sm text-gray-600">
          📍 Showing facts within {radiusKm}km of your location
          <button
            onClick={() => {
              setLocation(null);
              setFacts([]);
            }}
            className="ml-2 text-blue-600 hover:text-blue-800 underline"
          >
            Change location
          </button>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800 text-sm">⚠️ {error}</p>
          <button
            onClick={getCurrentLocation}
            className="mt-2 text-blue-600 hover:text-blue-800 underline text-sm"
          >
            Try again
          </button>
        </div>
      )}

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin text-3xl mb-2">🧭</div>
          <p className="text-gray-600">Finding interesting facts near you...</p>
        </div>
      )}

      {facts.length > 0 && (
        <div className="space-y-4">
          {facts.map((fact) => (
            <div
              key={fact.id}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">
                    {fact.category === 'History' ? '🏛️' :
                     fact.category === 'Culture' ? '🎭' :
                     fact.category === 'Food' ? '🍽️' :
                     fact.category === 'Architecture' ? '🏗️' :
                     fact.category === 'Street Art' ? '🎨' :
                     fact.category === 'Music' ? '🎵' :
                     fact.category === 'Celebrity' ? '⭐' :
                     fact.category === 'Quirky' ? '🤪' :
                     fact.category === 'Hidden' ? '🔍' :
                     fact.category === 'Film & TV' ? '🎬' : '💡'}
                  </span>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {fact.category}
                  </span>
                  {fact.local_knowledge && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                      🤫 Local Secret
                    </span>
                  )}
                </div>
                <div className="text-xs text-blue-600 font-medium">
                  {formatDistance((fact as any).distance_km)}
                </div>
              </div>

              <h4 className="font-semibold text-gray-900 mb-1">{fact.title}</h4>
              <p className="text-gray-700 text-sm mb-2 leading-relaxed">{fact.fact}</p>

              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                {(fact as any).address && (
                  <span className="inline-flex items-center px-2 py-1 rounded bg-green-100 text-green-700">
                    📍 {(fact as any).address}
                  </span>
                )}
                {(fact as any).neighborhood_name && (
                  <span className="inline-flex items-center px-2 py-1 rounded bg-blue-100 text-blue-700">
                    🏘️ {(fact as any).neighborhood_name}
                  </span>
                )}
                <span className="text-yellow-500">
                  {'⭐'.repeat(fact.fun_rating)}
                </span>
              </div>
            </div>
          ))}

          {facts.length === maxFacts && (
            <div className="text-center pt-2">
              <p className="text-sm text-gray-600">
                Found {facts.length}+ facts nearby! 
                <button
                  onClick={() => getCurrentLocation()}
                  className="ml-1 text-blue-600 hover:text-blue-800 underline"
                >
                  Refresh for more
                </button>
              </p>
            </div>
          )}
        </div>
      )}

      {facts.length === 0 && location && !loading && !error && (
        <div className="text-center py-6 text-gray-500">
          <div className="text-3xl mb-2">🔍</div>
          <p>No fun facts found within {radiusKm}km of your location.</p>
          <button
            onClick={() => getCurrentLocation()}
            className="mt-2 text-blue-600 hover:text-blue-800 underline"
          >
            Try expanding the search radius
          </button>
        </div>
      )}
    </div>
  );
}