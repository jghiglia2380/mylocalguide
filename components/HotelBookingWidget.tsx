'use client';

import { useState } from 'react';
// import { getAllHotelBookingUrls, trackClick } from '@/lib/utils/affiliate';
// import { HotelWithLocation } from '@/lib/types/hotel';

interface HotelBookingWidgetProps {
  hotel?: any; // HotelWithLocation;
  cityName: string;
  stateCode: string;
  className?: string;
}

export default function HotelBookingWidget({ 
  hotel, 
  cityName, 
  stateCode, 
  className = "" 
}: HotelBookingWidgetProps) {
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);
  const [rooms, setRooms] = useState(1);

  const hotelName = hotel?.name || '';
  // const bookingUrls = getAllHotelBookingUrls(
  //   hotelName, 
  //   cityName, 
  //   stateCode, 
  //   checkIn, 
  //   checkOut, 
  //   guests, 
  //   rooms
  // );
  const bookingUrls = {}; // Placeholder

  const handleBookingClick = async (network: string, url: string) => {
    // Track the click
    // if (hotel) {
    //   await trackClick(network, 'hotel', hotel.id);
    // }
    
    // Open booking site
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg border-2 border-blue-200 p-6 ${className}`}>
      <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2">
        🏨 {hotel ? `Book ${hotel.name}` : `Find Hotels in ${cityName}`}
      </h3>

      {/* Search Form */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Check-in</label>
          <input
            type="date"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            min={new Date().toISOString().split('T')[0]}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Check-out</label>
          <input
            type="date"
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            min={checkIn || new Date().toISOString().split('T')[0]}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Guests</label>
          <select
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
          >
            {[1, 2, 3, 4, 5, 6].map(num => (
              <option key={num} value={num}>{num}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Rooms</label>
          <select
            value={rooms}
            onChange={(e) => setRooms(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
          >
            {[1, 2, 3, 4].map(num => (
              <option key={num} value={num}>{num}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Booking Platforms */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="text-center p-4 border border-gray-200 rounded-lg">
          <p className="text-gray-600">Hotel booking integration coming soon!</p>
        </div>
      </div>

      {/* Affiliate Disclosure */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        MyLocalGuide may earn a commission from bookings made through these links at no extra cost to you.
      </div>
    </div>
  );
}