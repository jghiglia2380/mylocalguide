import { getVenuesByNeighborhood, getAllVenues } from '../../../../lib/database-supabase';
import { FunFactsDB } from '../../../../lib/fun-facts-db';
import { FunFactsSection } from '../../../components/FunFactsSection';
import { notFound } from 'next/navigation';

// Force dynamic rendering to always fetch fresh data
export const dynamic = 'force-dynamic';

import { Metadata } from 'next';

interface NeighborhoodPageProps {
  params: Promise<{
    slug: string;
  }>;
}

const neighborhoodMap: Record<string, string> = {
  'mission-district': 'The Mission',
  'castro-district': 'Castro District',
  'castro': 'Castro District',
  'marina-district': 'Marina District', 
  'north-beach': 'North Beach',
  'soma': 'SoMa',
  'haight-ashbury': 'Haight-Ashbury',
  'lower-haight': 'Lower Haight',
  'chinatown': 'Chinatown',
  'financial-district': 'Financial District',
  'nob-hill': 'Nob Hill',
  'russian-hill': 'Russian Hill',
  'pacific-heights': 'Pacific Heights',
  'union-square': 'Union Square',
  'tenderloin': 'Tenderloin',
  'civic-center': 'Civic Center',
  'western-addition': 'Western Addition',
  'japantown': 'Japantown',
  'inner-richmond': 'Inner Richmond',
  'outer-richmond': 'Outer Richmond',
  'inner-sunset': 'Inner Sunset',
  'outer-sunset': 'Outer Sunset',
  'bernal-heights': 'Bernal Heights',
  'potrero-hill': 'Potrero Hill',
  'dogpatch': 'Dogpatch',
  'bayview': 'Bayview-Hunters Point',
  'excelsior': 'Excelsior',
  'glen-park': 'Glen Park',
  'noe-valley': 'Noe Valley',
  'outer-mission': 'Outer Mission'
};

export async function generateMetadata({ params }: NeighborhoodPageProps): Promise<Metadata> {
  const { slug } = await params;
  const neighborhoodName = neighborhoodMap[slug] || 'Unknown';
  
  return {
    title: `${neighborhoodName} San Francisco - Local Guide, Fun Facts & Hidden Gems | MyLocalGuide`,
    description: `Discover ${neighborhoodName} in San Francisco: local restaurants, bars, cafes, and insider fun facts. Learn about the history, culture, and hidden secrets only locals know.`,
    keywords: `${neighborhoodName}, San Francisco, restaurants, bars, cafes, fun facts, local guide, hidden gems, history, culture`,
    openGraph: {
      title: `${neighborhoodName} Local Guide & Fun Facts`,
      description: `Your insider guide to ${neighborhoodName} - discover the best spots and learn fascinating local history and secrets.`,
      type: 'website',
    }
  };
}

export default async function NeighborhoodPage({ params }: NeighborhoodPageProps) {
  const { slug } = await params;
  
  const neighborhoodName = neighborhoodMap[slug];
  if (!neighborhoodName) {
    notFound();
  }

  const venues = await getVenuesByNeighborhood(neighborhoodName);
  const allVenues = await getAllVenues();

  // Get neighborhood ID and fun facts
  let neighborhoodId: number | null = null;
  let funFacts: any[] = [];
  
  // TODO: Implement fun facts with Supabase

  // Group venues by category
  const venuesByCategory = venues.reduce((acc: any, venue: any) => {
    if (!acc[venue.category]) {
      acc[venue.category] = [];
    }
    acc[venue.category].push(venue);
    return acc;
  }, {});

  return (
    <div>
      {/* Header */}
      <header className="site-header">
        <h1 className="site-title">
          <a href="/" style={{ textDecoration: 'none', color: 'inherit' }}>mylocalguide</a>
        </h1>
        <p className="site-subtitle">san francisco local discovery - substance over style</p>
        <nav className="nav-links">
          <a href="/">home</a>
          <a href="/#search">search</a>
          <a href="/#neighborhoods">neighborhoods</a>
          <a href="/#about">about</a>
        </nav>
      </header>

      {/* Main Content */}
      <main style={{ padding: '12px' }}>
        
        {/* Breadcrumb */}
        <div style={{ fontSize: '12px', marginBottom: '12px' }}>
          <a href="/" className="directory-link">home</a> &gt; neighborhoods &gt; {neighborhoodName.toLowerCase()}
        </div>

        {/* Page Title */}
        <h1 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px', borderBottom: '1px solid #CCCCCC', paddingBottom: '4px' }}>
          {neighborhoodName} ({venues.length} venues)
        </h1>

        {/* Neighborhood Description */}
        {neighborhoodName === 'The Mission' && (
          <div style={{ padding: '8px', backgroundColor: '#F5F5F5', border: '1px solid #CCCCCC', marginBottom: '20px', fontSize: '13px' }}>
            Vibrant Latino culture, world-class street art, and the highest concentration of excellent restaurants per capita in SF. 
            From authentic taquerias to Michelin-starred dining, the Mission has it all.
          </div>
        )}
        
        {neighborhoodName === 'Castro' && (
          <div style={{ padding: '8px', backgroundColor: '#F5F5F5', border: '1px solid #CCCCCC', marginBottom: '20px', fontSize: '13px' }}>
            Historic LGBTQ+ neighborhood with welcoming bars, emerging restaurants, and strong community spirit. 
            The heart of San Francisco's rainbow flag culture.
          </div>
        )}

        {neighborhoodName === 'Marina District' && (
          <div style={{ padding: '8px', backgroundColor: '#F5F5F5', border: '1px solid #CCCCCC', marginBottom: '20px', fontSize: '13px' }}>
            Upscale waterfront neighborhood known for fitness culture, brunching, and scenic views. 
            Chestnut Street anchors the dining scene with quality restaurants and wine bars.
          </div>
        )}

        {neighborhoodName === 'North Beach' && (
          <div style={{ padding: '8px', backgroundColor: '#F5F5F5', border: '1px solid #CCCCCC', marginBottom: '20px', fontSize: '13px' }}>
            Little Italy meets literary history. Authentic Italian delis, historic cafes, and old-school San Francisco atmosphere. 
            Home to City Lights Books and generations of North Beach families.
          </div>
        )}

        {/* Fun Facts Section */}
        {funFacts.length > 0 && (
          <FunFactsSection facts={funFacts} neighborhoodName={neighborhoodName} />
        )}

        {/* Venues by Category */}
        {Object.keys(venuesByCategory as any).length > 0 ? (
          <div>
            {Object.entries(venuesByCategory as any).map(([category, categoryVenues]: [string, any]) => (
              <div key={category} style={{ marginBottom: '25px' }}>
                <h2 className="category-header">{category} ({categoryVenues.length})</h2>
                <div className="directory-list" style={{ padding: '8px' }}>
                  {categoryVenues.map((venue: any) => (
                    <div key={venue.id} className={`directory-item ${venue.featured ? 'featured' : ''}`}>
                      <div style={{ marginBottom: '4px' }}>
                        <a href={`/venue/${venue.id}`} className="directory-link">
                          <strong>{venue.name}</strong>
                        </a>
                        <span className={`price-${venue.price_range}`}></span>
                        {venue.featured && <span style={{ color: '#FFD700', marginLeft: '4px' }}>★ featured</span>}
                      </div>
                      <div className="venue-info" style={{ marginLeft: '8px' }}>
                        {venue.address}
                      </div>
                      <div className="venue-info" style={{ marginLeft: '8px', marginBottom: '4px' }}>
                        {venue.description.slice(0, 120)}...
                      </div>
                      {venue.phone && (
                        <div className="venue-info" style={{ marginLeft: '8px' }}>
                          {venue.phone} 
                          {venue.website && (
                            <>
                              {' • '}
                              <a href={venue.website} className="directory-link" target="_blank" rel="noopener noreferrer">
                                website
                              </a>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#F5F5F5', border: '1px solid #CCCCCC' }}>
            <p>No venues found in {neighborhoodName} yet.</p>
            <p style={{ fontSize: '12px', marginTop: '8px' }}>
              Know a great spot in {neighborhoodName}? <a href="/contact" className="directory-link">Let us know</a>
            </p>
          </div>
        )}

        {/* Other Neighborhoods */}
        <div style={{ marginTop: '30px', border: '1px solid #CCCCCC' }}>
          <h2 className="category-header">Other SF Neighborhoods</h2>
          <div className="directory-list" style={{ padding: '8px' }}>
            {Object.entries(neighborhoodMap)
              .filter(([s, name]) => s !== slug)
              .slice(0, 6)
              .map(([slug, name]) => (
                <div key={slug} className="directory-item">
                  <a href={`/neighborhood/${slug}`} className="directory-link">
                    {name}
                  </a>
                  <span className="venue-info"></span>
                </div>
              ))}
          </div>
        </div>

        {/* Development Tools */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{ marginTop: '20px', padding: '8px', backgroundColor: '#FFFFCC', border: '1px solid #FFCC00', fontSize: '11px' }}>
            <strong>DEV MODE:</strong> Neighborhood: {neighborhoodName} | Venues: {venues.length} | Total: {allVenues.length}
          </div>
        )}

        {/* Footer */}
        <footer style={{ marginTop: '30px', padding: '12px', borderTop: '1px solid #CCCCCC', fontSize: '11px', color: '#666666' }}>
          <div>
            <a href="/" className="directory-link">cicerone-sf</a> © 2025 | 
            <a href="/privacy" className="directory-link">privacy</a> | 
            <a href="/terms" className="directory-link">terms</a> | 
            <a href="/advertise" className="directory-link">advertise</a>
          </div>
        </footer>

      </main>
    </div>
  );
}