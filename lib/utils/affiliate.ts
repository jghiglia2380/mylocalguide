import { headers } from 'next/headers';
import { trackAffiliateClick, createAffiliateLink } from '@lib/database';
import { AFFILIATE_NETWORKS } from '@lib/types/hotel';

export interface AffiliateConfig {
  booking_com?: string;
  hotels_com?: string;
  expedia?: string;
  agoda?: string;
}

// Store affiliate IDs (you'll update these when approved)
const AFFILIATE_IDS: AffiliateConfig = {
  booking_com: process.env.BOOKING_COM_AFFILIATE_ID || 'YOUR_BOOKING_ID',
  hotels_com: process.env.HOTELS_COM_AFFILIATE_ID || 'YOUR_HOTELS_ID',
  expedia: process.env.EXPEDIA_AFFILIATE_ID || 'YOUR_EXPEDIA_ID',
  agoda: process.env.AGODA_AFFILIATE_ID || 'YOUR_AGODA_ID',
};

export function generateBookingComUrl(
  hotelName: string, 
  cityName: string, 
  checkIn?: string, 
  checkOut?: string,
  guests = 2,
  rooms = 1
): string {
  const baseUrl = 'https://www.booking.com/searchresults.html';
  const params = new URLSearchParams({
    ss: `${hotelName}, ${cityName}`,
    checkin: checkIn || '',
    checkout: checkOut || '',
    adults: guests.toString(),
    rooms: rooms.toString(),
    aid: AFFILIATE_IDS.booking_com || '1234567' // Replace with your actual ID
  });
  
  return `${baseUrl}?${params.toString()}`;
}

export function generateHotelsComUrl(
  hotelName: string,
  cityName: string,
  stateCode: string,
  checkIn?: string,
  checkOut?: string
): string {
  const baseUrl = 'https://www.hotels.com/search.do';
  const params = new URLSearchParams({
    'q-destination': `${hotelName}, ${cityName}, ${stateCode}`,
    'q-check-in': checkIn || '',
    'q-check-out': checkOut || '',
    'q-rooms': '1',
    'q-room-0-adults': '2',
    'q-room-0-children': '0'
  });
  
  // Add affiliate ID when available
  if (AFFILIATE_IDS.hotels_com && AFFILIATE_IDS.hotels_com !== 'YOUR_HOTELS_ID') {
    params.set('pid', AFFILIATE_IDS.hotels_com);
  }
  
  return `${baseUrl}?${params.toString()}`;
}

export function generateExpediaUrl(
  cityName: string,
  stateCode: string,
  checkIn?: string,
  checkOut?: string
): string {
  const baseUrl = 'https://www.expedia.com/Hotel-Search';
  const params = new URLSearchParams({
    destination: `${cityName}, ${stateCode}`,
    startDate: checkIn || '',
    endDate: checkOut || '',
    rooms: '1',
    adults: '2'
  });
  
  // Add affiliate ID when available
  if (AFFILIATE_IDS.expedia && AFFILIATE_IDS.expedia !== 'YOUR_EXPEDIA_ID') {
    params.set('affcid', AFFILIATE_IDS.expedia);
  }
  
  return `${baseUrl}?${params.toString()}`;
}

export function generateAgodaUrl(
  cityName: string,
  checkIn?: string,
  checkOut?: string
): string {
  const baseUrl = 'https://www.agoda.com/search';
  const params = new URLSearchParams({
    city: cityName,
    checkIn: checkIn || '',
    checkOut: checkOut || '',
    rooms: '1',
    adults: '2',
    children: '0'
  });
  
  // Add affiliate ID when available
  if (AFFILIATE_IDS.agoda && AFFILIATE_IDS.agoda !== 'YOUR_AGODA_ID') {
    params.set('cid', AFFILIATE_IDS.agoda);
  }
  
  return `${baseUrl}?${params.toString()}`;
}

export async function trackClick(
  affiliateNetwork: string,
  entityType: string,
  entityId: number
): Promise<void> {
  try {
    // Get request headers for tracking
    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || undefined;
    const referer = headersList.get('referer') || undefined;
    const forwarded = headersList.get('x-forwarded-for');
    const realIp = headersList.get('x-real-ip');
    const userIp = forwarded?.split(',')[0] || realIp || undefined;

    // Create or get affiliate link
    const affiliateId = AFFILIATE_IDS[affiliateNetwork as keyof AffiliateConfig];
    if (!affiliateId || affiliateId.startsWith('YOUR_')) {
      console.log(`No affiliate ID configured for ${affiliateNetwork}`);
      return;
    }

    // You would create the affiliate link record here
    // For now, just log the click
    console.log(`Affiliate click tracked: ${affiliateNetwork} for ${entityType} ${entityId}`);
    
  } catch (error) {
    console.error('Error tracking affiliate click:', error);
  }
}

export function getAllHotelBookingUrls(
  hotelName: string,
  cityName: string,
  stateCode: string,
  checkIn?: string,
  checkOut?: string,
  guests = 2,
  rooms = 1
) {
  return {
    booking_com: {
      name: 'Booking.com',
      url: generateBookingComUrl(hotelName, cityName, checkIn, checkOut, guests, rooms),
      logo: '🏨',
      description: 'Free cancellation on most bookings'
    },
    hotels_com: {
      name: 'Hotels.com',
      url: generateHotelsComUrl(hotelName, cityName, stateCode, checkIn, checkOut),
      logo: '🏪',
      description: 'Collect 10 nights, get 1 free'
    },
    expedia: {
      name: 'Expedia',
      url: generateExpediaUrl(cityName, stateCode, checkIn, checkOut),
      logo: '✈️',
      description: 'Bundle and save with flight + hotel'
    },
    agoda: {
      name: 'Agoda',
      url: generateAgodaUrl(cityName, checkIn, checkOut),
      logo: '🌏',
      description: 'Member prices and flash deals'
    }
  };
}

// Hook for easy use in components
export function useAffiliateConfig() {
  return {
    isConfigured: (network: keyof AffiliateConfig) => {
      const id = AFFILIATE_IDS[network];
      return id && !id.startsWith('YOUR_');
    },
    getAffiliateId: (network: keyof AffiliateConfig) => AFFILIATE_IDS[network],
    networks: AFFILIATE_NETWORKS
  };
}