import { getVenuesByCategory, getAllVenues } from '../../../../lib/database-supabase';
import { notFound } from 'next/navigation';

// Force dynamic rendering to always fetch fresh data
export const dynamic = 'force-dynamic';

interface CategoryPageProps {
  params: Promise<{
    slug: string;
  }>;
}

const categoryMap: Record<string, string> = {
  'restaurants': 'Restaurants',
  'bars-nightlife': 'Bars & Nightlife', 
  'cafes-coffee': 'Cafes & Coffee',
  'specialty-food': 'Specialty Food',
  'thrift-vintage': 'Thrift & Vintage',
  'fashion': 'Fashion',
  'books-media': 'Books & Media',
  'live-entertainment': 'Live Entertainment',
  'arts-culture': 'Arts & Culture',
  'outdoor-activities': 'Outdoor Activities',
  'work-spaces': 'Work Spaces',
  'personal-services': 'Personal Services'
};

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  
  const categoryName = categoryMap[slug];
  if (!categoryName) {
    notFound();
  }

  const venues = await getVenuesByCategory(categoryName);
  const allVenues = await getAllVenues();

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
          <a href="/" className="directory-link">home</a> &gt; {categoryName.toLowerCase()}
        </div>

        {/* Page Title */}
        <h1 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px', borderBottom: '1px solid #CCCCCC', paddingBottom: '4px' }}>
          {categoryName} in San Francisco ({venues.length})
        </h1>

        {/* Venue Listings */}
        {venues.length > 0 ? (
          <div className="directory-list">
            {venues.map((venue: any) => (
              <div key={venue.id} className={`directory-item ${venue.featured ? 'featured' : ''}`}>
                <div style={{ marginBottom: '4px' }}>
                  <a href={`/venue/${venue.id}`} className="directory-link">
                    <strong>{venue.name}</strong>
                  </a>
                  <span className={`price-${venue.price_range}`}></span>
                  {venue.featured && <span style={{ color: '#FFD700', marginLeft: '4px' }}>★ featured</span>}
                </div>
                <div className="venue-info" style={{ marginLeft: '8px' }}>
                  {venue.address} • {venue.neighborhood}
                </div>
                <div className="venue-info" style={{ marginLeft: '8px', marginBottom: '4px' }}>
                  {venue.description.slice(0, 150)}...
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
        ) : (
          <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#F5F5F5', border: '1px solid #CCCCCC' }}>
            <p>No venues found in this category yet.</p>
            <p style={{ fontSize: '12px', marginTop: '8px' }}>
              Know a great {categoryName.toLowerCase()} spot? <a href="/contact" className="directory-link">Let us know</a>
            </p>
          </div>
        )}

        {/* Related Categories */}
        <div style={{ marginTop: '30px', border: '1px solid #CCCCCC' }}>
          <h2 className="category-header">Related Categories</h2>
          <div className="directory-list" style={{ padding: '8px' }}>
            {Object.entries(categoryMap)
              .filter(([s, name]) => s !== slug)
              .slice(0, 6)
              .map(([slug, name]) => (
                <div key={slug} className="directory-item">
                  <a href={`/category/${slug}`} className="directory-link">
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
            <strong>DEV MODE:</strong> Category: {categoryName} | Venues: {venues.length} | Total: {allVenues.length}
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