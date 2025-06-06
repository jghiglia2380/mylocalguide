import React from 'react';
import { ComprehensiveVenue } from '../../lib/comprehensive-venue-db';

interface VenueCardProps {
  venue: ComprehensiveVenue;
  showDetails?: boolean;
}

export function ComprehensiveVenueCard({ venue, showDetails = false }: VenueCardProps) {
  const getPriceSymbol = (price: number) => '$'.repeat(price);
  
  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 4.0) return 'text-blue-600';
    if (rating >= 3.5) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const formatReviewCount = (count: number) => {
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return count.toString();
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            {venue.name}
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>{venue.subcategory || venue.category}</span>
            {venue.cuisine_type && venue.cuisine_type !== venue.subcategory && (
              <>
                <span>•</span>
                <span>{venue.cuisine_type}</span>
              </>
            )}
            <span>•</span>
            <span className="font-medium">{getPriceSymbol(venue.price_range)}</span>
          </div>
        </div>
        
        {/* Aggregate Rating */}
        <div className="text-right">
          <div className={`text-2xl font-bold ${getRatingColor(venue.aggregate_rating)}`}>
            {venue.aggregate_rating.toFixed(1)}
          </div>
          <div className="text-xs text-gray-500">
            {formatReviewCount(venue.total_review_count)} reviews
          </div>
        </div>
      </div>

      {/* Address */}
      <p className="text-sm text-gray-600 mb-3">
        📍 {venue.address}, {venue.city}
      </p>

      {/* Rating Sources */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
        {venue.google_rating && (
          <div className="bg-gray-50 p-2 rounded text-center">
            <div className="text-xs text-gray-500">Google</div>
            <div className="font-semibold">{venue.google_rating.toFixed(1)}</div>
            <div className="text-xs text-gray-400">{formatReviewCount(venue.google_review_count!)}</div>
          </div>
        )}
        {venue.yelp_rating && (
          <div className="bg-gray-50 p-2 rounded text-center">
            <div className="text-xs text-gray-500">Yelp</div>
            <div className="font-semibold">{venue.yelp_rating.toFixed(1)}</div>
            <div className="text-xs text-gray-400">{formatReviewCount(venue.yelp_review_count!)}</div>
          </div>
        )}
        {venue.tripadvisor_rating && (
          <div className="bg-gray-50 p-2 rounded text-center">
            <div className="text-xs text-gray-500">TripAdvisor</div>
            <div className="font-semibold">{venue.tripadvisor_rating.toFixed(1)}</div>
            <div className="text-xs text-gray-400">{formatReviewCount(venue.tripadvisor_review_count!)}</div>
          </div>
        )}
        {venue.foursquare_rating && (
          <div className="bg-gray-50 p-2 rounded text-center">
            <div className="text-xs text-gray-500">Foursquare</div>
            <div className="font-semibold">{venue.foursquare_rating.toFixed(1)}</div>
            <div className="text-xs text-gray-400">{formatReviewCount(venue.foursquare_review_count!)}</div>
          </div>
        )}
      </div>

      {/* Quality Indicators */}
      <div className="flex gap-4 mb-3 text-sm">
        <div className="flex items-center gap-1">
          <div className="w-20 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full"
              style={{ width: `${venue.quality_score}%` }}
            />
          </div>
          <span className="text-xs text-gray-600">Quality</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-20 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-orange-600 h-2 rounded-full"
              style={{ width: `${venue.popularity_score}%` }}
            />
          </div>
          <span className="text-xs text-gray-600">Popularity</span>
        </div>
      </div>

      {/* Amenities & Tags */}
      {venue.amenities && venue.amenities.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {venue.amenities.slice(0, 5).map((amenity, i) => (
            <span key={i} className="px-2 py-1 bg-gray-100 text-xs rounded">
              {amenity}
            </span>
          ))}
          {venue.amenities.length > 5 && (
            <span className="px-2 py-1 bg-gray-100 text-xs rounded">
              +{venue.amenities.length - 5} more
            </span>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 mt-3">
        {venue.phone && (
          <a 
            href={`tel:${venue.phone}`}
            className="flex-1 text-center py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 text-sm"
          >
            📞 Call
          </a>
        )}
        {venue.website && (
          <a 
            href={venue.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center py-2 bg-green-50 text-green-600 rounded hover:bg-green-100 text-sm"
          >
            🌐 Website
          </a>
        )}
        {venue.menu_url && (
          <a 
            href={venue.menu_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center py-2 bg-orange-50 text-orange-600 rounded hover:bg-orange-100 text-sm"
          >
            📋 Menu
          </a>
        )}
        {venue.reservation_url && (
          <a 
            href={venue.reservation_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center py-2 bg-purple-50 text-purple-600 rounded hover:bg-purple-100 text-sm"
          >
            📅 Reserve
          </a>
        )}
      </div>

      {/* Hours (if showing details) */}
      {showDetails && venue.hours && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="font-medium text-sm text-gray-700 mb-2">Hours</h4>
          <div className="text-xs space-y-1">
            {Object.entries(venue.hours).map(([day, hours]) => (
              <div key={day} className="flex justify-between">
                <span className="capitalize text-gray-600">{day}:</span>
                <span className="text-gray-800">{hours as string}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Last Updated */}
      <div className="mt-3 text-xs text-gray-400 text-right">
        Updated: {new Date(venue.last_updated).toLocaleDateString()}
      </div>
    </div>
  );
}