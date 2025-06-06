import { getDatabase, insertHotel, getCityBySlug } from './database';
import { Hotel } from './types/hotel';

export function seedHotels(): number {
  const db = getDatabase();
  
  // Get San Francisco city ID
  const sanFrancisco = getCityBySlug('san-francisco');
  if (!sanFrancisco) {
    console.log('San Francisco not found, skipping hotel seeding');
    return 0;
  }

  const hotels: Omit<Hotel, 'id' | 'created_at' | 'updated_at'>[] = [
    {
      name: 'The Ritz-Carlton San Francisco',
      slug: 'ritz-carlton-san-francisco',
      address: '600 Stockton St, San Francisco, CA 94108',
      city_id: sanFrancisco.id,
      latitude: 37.7915,
      longitude: -122.4084,
      star_rating: 5,
      description: 'Luxury hotel in Nob Hill with impeccable service, elegant rooms, and stunning city views. Features a world-class spa and fine dining.',
      price_range: 'luxury',
      avg_nightly_rate: 65000, // $650 in cents
      total_rooms: 336,
      website: 'https://www.ritzcarlton.com/en/hotels/california/san-francisco',
      phone: '(415) 296-7465',
      featured: true,
      active: true,
      amenities: JSON.stringify(['spa', 'fitness-center', 'concierge', 'room-service', 'valet-parking']),
      photos: JSON.stringify(['ritz1.jpg', 'ritz2.jpg', 'ritz3.jpg']),
      google_place_id: 'ChIJ-_7c_t-AhYARvDaIp8v5K8I',
      booking_com_id: '20179',
      tripadvisor_id: '60972'
    },
    {
      name: 'Hotel Zephyr San Francisco',
      slug: 'hotel-zephyr-san-francisco',
      address: '250 Beach St, San Francisco, CA 94133',
      city_id: sanFrancisco.id,
      latitude: 37.8076,
      longitude: -122.4156,
      star_rating: 4,
      description: 'Nautical-themed boutique hotel at Fishermans Wharf with playful maritime decor, bay views, and family-friendly amenities.',
      price_range: 'mid-range',
      avg_nightly_rate: 32000, // $320 in cents
      total_rooms: 361,
      website: 'https://www.hotelzephyrsf.com',
      phone: '(415) 617-6565',
      featured: true,
      active: true,
      amenities: JSON.stringify(['fitness-center', 'pet-friendly', 'parking', 'business-center']),
      photos: JSON.stringify(['zephyr1.jpg', 'zephyr2.jpg']),
      google_place_id: 'ChIJQ8QK8dqAhYARQ8h4z1K5P4Y',
      booking_com_id: '70440'
    },
    {
      name: 'The Phoenix Hotel',
      slug: 'phoenix-hotel-san-francisco',
      address: '601 Eddy St, San Francisco, CA 94109',
      city_id: sanFrancisco.id,
      latitude: 37.7822,
      longitude: -122.4186,
      star_rating: 3,
      description: 'Rock and roll themed boutique hotel in the Tenderloin with a pool, live music venue, and edgy artistic atmosphere.',
      price_range: 'mid-range',
      avg_nightly_rate: 18000, // $180 in cents
      total_rooms: 44,
      website: 'https://www.phoenixhotelsf.com',
      phone: '(415) 776-1380',
      featured: false,
      active: true,
      amenities: JSON.stringify(['pool', 'bar', 'live-music', 'pet-friendly']),
      photos: JSON.stringify(['phoenix1.jpg', 'phoenix2.jpg']),
      google_place_id: 'ChIJZzE-g_SAhYARbOvGDw3pYeE'
    },
    {
      name: 'Pod San Francisco',
      slug: 'pod-san-francisco',
      address: '1469 Folsom St, San Francisco, CA 94103',
      city_id: sanFrancisco.id,
      latitude: 37.7697,
      longitude: -122.4130,
      star_rating: 3,
      description: 'Modern micro-hotel in SOMA with efficient pod-style rooms, shared spaces, and tech-forward amenities perfect for digital nomads.',
      price_range: 'budget',
      avg_nightly_rate: 12000, // $120 in cents
      total_rooms: 152,
      website: 'https://www.thepodhotel.com/pod-san-francisco',
      phone: '(415) 920-2275',
      featured: false,
      active: true,
      amenities: JSON.stringify(['wifi', 'shared-workspace', 'fitness-center', 'pet-friendly']),
      photos: JSON.stringify(['pod1.jpg', 'pod2.jpg']),
      google_place_id: 'ChIJb8Jg8fWAhYAR_eK9xGx2jbI'
    },
    {
      name: 'Hotel Bohème',
      slug: 'hotel-boheme-san-francisco',
      address: '444 Columbus Ave, San Francisco, CA 94133',
      city_id: sanFrancisco.id,
      latitude: 37.7983,
      longitude: -122.4077,
      star_rating: 3,
      description: 'Intimate 15-room boutique hotel in North Beach celebrating the Beat Generation with literary-themed decor and European charm.',
      price_range: 'mid-range',
      avg_nightly_rate: 25000, // $250 in cents
      total_rooms: 15,
      website: 'https://www.hotelboheme.com',
      phone: '(415) 433-9111',
      featured: false,
      active: true,
      amenities: JSON.stringify(['wifi', 'concierge', 'historic-building']),
      photos: JSON.stringify(['boheme1.jpg', 'boheme2.jpg']),
      google_place_id: 'ChIJX8YNm9qAhYAR2zJqPs5Vvj8'
    },
    {
      name: 'Hi San Francisco Downtown Hostel',
      slug: 'hi-san-francisco-downtown-hostel',
      address: '312 Mason St, San Francisco, CA 94102',
      city_id: sanFrancisco.id,
      latitude: 37.7872,
      longitude: -122.4103,
      star_rating: 2,
      description: 'Budget-friendly hostel in Union Square with both dormitory and private rooms, communal kitchen, and social atmosphere for travelers.',
      price_range: 'budget',
      avg_nightly_rate: 5000, // $50 in cents
      total_rooms: 62,
      website: 'https://www.hiusa.org/hostels/california/san-francisco/downtown',
      phone: '(415) 788-5604',
      featured: false,
      active: true,
      amenities: JSON.stringify(['shared-kitchen', 'wifi', 'luggage-storage', 'laundry']),
      photos: JSON.stringify(['hi1.jpg', 'hi2.jpg']),
      google_place_id: 'ChIJp8Q_rdqAhYARlPi8EbGs-r4'
    }
  ];

  let count = 0;
  for (const hotel of hotels) {
    try {
      insertHotel(hotel);
      count++;
      console.log(`Inserted hotel: ${hotel.name}`);
    } catch (error) {
      console.error(`Error inserting hotel ${hotel.name}:`, error);
    }
  }

  console.log(`Seeded ${count} hotels`);
  return count;
}

// Run seeder if called directly
if (require.main === module) {
  seedHotels();
}