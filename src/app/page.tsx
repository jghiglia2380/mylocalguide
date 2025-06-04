import { getDatabase, getVenuesByCategory, getVenuesByNeighborhood, getAllVenues } from '@lib/database';

// Force dynamic rendering to always fetch fresh data
export const dynamic = 'force-dynamic';

export default function Home() {
  // Initialize database on page load
  getDatabase();
  
  // Get real venue counts (this will run on each request)
  const allVenues = getAllVenues();
  const getCountByCategory = (category: string) => {
    return getVenuesByCategory(category).length;
  };
  const getCountByNeighborhood = (neighborhood: string) => {
    return getVenuesByNeighborhood(neighborhood).length;
  };
  
  const categories = [
    {
      name: 'Food & Drink',
      items: [
        { name: 'Restaurants', slug: 'restaurants', count: getCountByCategory('Restaurants') },
        { name: 'Bars & Nightlife', slug: 'bars-nightlife', count: getCountByCategory('Bars & Nightlife') },
        { name: 'Cafes & Coffee', slug: 'cafes-coffee', count: getCountByCategory('Cafes & Coffee') },
        { name: 'Specialty Food', slug: 'specialty-food', count: getCountByCategory('Specialty Food') }
      ]
    },
    {
      name: 'Shopping & Retail', 
      items: [
        { name: 'Thrift & Vintage', slug: 'thrift-vintage', count: getCountByCategory('Thrift & Vintage') },
        { name: 'Fashion', slug: 'fashion', count: getCountByCategory('Fashion') },
        { name: 'Books & Media', slug: 'books-media', count: getCountByCategory('Books & Media') }
      ]
    },
    {
      name: 'Activities & Entertainment',
      items: [
        { name: 'Live Entertainment', slug: 'live-entertainment', count: getCountByCategory('Live Entertainment') },
        { name: 'Arts & Culture', slug: 'arts-culture', count: getCountByCategory('Arts & Culture') },
        { name: 'Outdoor Activities', slug: 'outdoor-activities', count: getCountByCategory('Outdoor Activities') },
        { name: 'Experiences', slug: 'experiences', count: getCountByCategory('Experiences') }
      ]
    },
    {
      name: 'Services & Practical',
      items: [
        { name: 'Work Spaces', slug: 'work-spaces', count: getCountByCategory('Work Spaces') },
        { name: 'Personal Services', slug: 'personal-services', count: getCountByCategory('Personal Services') }
      ]
    }
  ];

  const neighborhoods = [
    'Mission District', 'Castro', 'Marina District', 'North Beach', 'SoMa',
    'Haight-Ashbury', 'Lower Haight', 'Chinatown', 'Financial District', 'Nob Hill'
  ];

  return (
    <div>
      {/* Header */}
      <header className="site-header">
        <h1 className="site-title">mylocalguide</h1>
        <p className="site-subtitle">san francisco local discovery - substance over style</p>
        <nav className="nav-links">
          <a href="#search">search</a>
          <a href="#neighborhoods">neighborhoods</a>
          <a href="#about">about</a>
          <a href="#submit">add a place</a>
        </nav>
      </header>

      {/* Main Content */}
      <main style={{ padding: '12px' }}>
        {/* Search */}
        <div id="search" style={{ marginBottom: '20px', border: '1px solid #808080', padding: '8px', backgroundColor: '#F5F5F5' }}>
          <form>
            <input 
              type="text" 
              placeholder="search venues, neighborhoods, cuisine..." 
              className="search-input"
              style={{ width: '300px', marginRight: '8px' }}
            />
            <button type="submit" className="btn-primary">search</button>
          </form>
          <div style={{ marginTop: '6px', fontSize: '11px' }}>
            <span>popular: </span>
            <a href="/search?q=mission+tacos" className="directory-link">mission tacos</a> | 
            <a href="/search?q=marina+brunch" className="directory-link">marina brunch</a> | 
            <a href="/search?q=castro+bars" className="directory-link">castro bars</a> | 
            <a href="/search?q=coffee+wifi" className="directory-link">coffee + wifi</a>
          </div>
        </div>

        {/* Main Directory Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          
          {/* Categories */}
          {categories.map((category, idx) => (
            <div key={idx} style={{ border: '1px solid #CCCCCC' }}>
              <h2 className="category-header">{category.name}</h2>
              <div className="directory-list" style={{ padding: '8px' }}>
                {category.items.map((item, itemIdx) => (
                  <div key={itemIdx} className="directory-item">
                    <a href={`/category/${item.slug}`} className="directory-link">
                      {item.name}
                    </a>
                    <span className="venue-info"> ({item.count})</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Neighborhoods */}
          <div style={{ border: '1px solid #CCCCCC' }}>
            <h2 className="category-header">Neighborhoods</h2>
            <div className="directory-list" style={{ padding: '8px' }}>
              {neighborhoods.map((hood, idx) => (
                <div key={idx} className="directory-item">
                  <a href={`/neighborhood/${hood.toLowerCase().replace(/\s+/g, '-')}`} className="directory-link">
                    {hood}
                  </a>
                  <span className="venue-info"> ({getCountByNeighborhood(hood)})</span>
                </div>
              ))}
            </div>
          </div>

          {/* Featured Listings */}
          <div style={{ border: '1px solid #CCCCCC' }}>
            <h2 className="category-header">Featured This Week</h2>
            <div className="directory-list" style={{ padding: '8px' }}>
              <div className="directory-item featured">
                <a href="/venue/sample" className="directory-link">
                  <strong>Sample Featured Venue</strong>
                </a>
                <span className="price-3"></span>
                <div className="venue-info">Mission District - Modern American</div>
                <div className="venue-info">Award-winning chef, outdoor seating, reservations recommended</div>
              </div>
              <div style={{ fontSize: '11px', marginTop: '8px', fontStyle: 'italic' }}>
                Want your business featured? <a href="/advertise" className="directory-link">Learn more</a>
              </div>
            </div>
          </div>

        </div>

        {/* FAQ Section - Based on keyword research */}
        <div id="about" style={{ marginTop: '30px', border: '1px solid #CCCCCC' }}>
          <h2 className="category-header">About My Local Guide</h2>
          <div style={{ padding: '12px', fontSize: '13px', lineHeight: '1.4' }}>
            <p style={{ margin: '0 0 8px 0' }}>
              <strong>What is My Local Guide?</strong><br />
              A curated directory of San Francisco's best venues, focusing on substance over style. 
              No reviews, no ratings - just well-researched recommendations from locals who know the city.
            </p>
            <p style={{ margin: '8px 0' }}>
              <strong>How is this different from Yelp?</strong><br />
              We prioritize information density and authentic local knowledge over photos and user reviews. 
              Think Craigslist's simplicity meets a city insider's expertise.
            </p>
            <p style={{ margin: '8px 0' }}>
              <strong>How do you find the best restaurants in San Francisco?</strong><br />
              Our team personally visits venues and focuses on what locals actually care about: quality, 
              atmosphere, and whether it's worth your time and money.
            </p>
            <p style={{ margin: '8px 0' }}>
              <strong>Do you cover all San Francisco neighborhoods?</strong><br />
              Yes - from Mission District taquerias to Marina brunch spots to Castro bars. 
              Every neighborhood has hidden gems worth discovering.
            </p>
          </div>
        </div>

        {/* Development Tools - Remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{ marginTop: '20px', padding: '8px', backgroundColor: '#FFFFCC', border: '1px solid #FFCC00', fontSize: '11px' }}>
            <strong>DEV MODE:</strong> Total venues: {allVenues.length} | 
            <a 
              href="/api/seed" 
              className="btn-primary"
              style={{ marginLeft: '8px', textDecoration: 'none', display: 'inline-block' }}
            >
              Seed Database
            </a>
          </div>
        )}

        {/* Footer */}
        <footer style={{ marginTop: '30px', padding: '12px', borderTop: '1px solid #CCCCCC', fontSize: '11px', color: '#666666' }}>
          <div>
            mylocalguide © 2025 | 
            <a href="/privacy" className="directory-link">privacy</a> | 
            <a href="/terms" className="directory-link">terms</a> | 
            <a href="/advertise" className="directory-link">advertise</a> | 
            <a href="/contact" className="directory-link">contact</a>
          </div>
          <div style={{ marginTop: '4px' }}>
            Made for locals, by locals. San Francisco venue discovery without the noise.
          </div>
        </footer>

      </main>
    </div>
  );
}
