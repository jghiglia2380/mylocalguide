const Database = require('better-sqlite3');
const fs = require('fs');

// Create basic SEO pages without AI generation
function createBasicSEOPages() {
  const db = new Database('./cicerone-sf.db');
  
  try {
    console.log('🎯 Creating basic SEO pages...');
    
    // Get venues data
    const venues = db.prepare('SELECT * FROM venues WHERE active = 1').all();
    console.log(`Found ${venues.length} venues`);
    
    // Get neighborhoods
    const neighborhoods = db.prepare(`
      SELECT neighborhood, COUNT(*) as venue_count 
      FROM venues WHERE active = 1
      GROUP BY neighborhood 
      ORDER BY venue_count DESC
    `).all();
    
    // Get categories
    const categories = db.prepare(`
      SELECT category, COUNT(*) as venue_count 
      FROM venues WHERE active = 1
      GROUP BY category 
      ORDER BY venue_count DESC
    `).all();
    
    console.log(`📍 Found ${neighborhoods.length} neighborhoods`);
    console.log(`📂 Found ${categories.length} categories`);
    
    // Create SEO pages table if it doesn't exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS seo_pages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        meta_description TEXT NOT NULL,
        h1_title TEXT NOT NULL,
        content TEXT NOT NULL,
        keywords TEXT,
        target_keyword TEXT,
        page_type TEXT DEFAULT 'landing',
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    const insertPage = db.prepare(`
      INSERT OR REPLACE INTO seo_pages 
      (slug, title, meta_description, h1_title, content, keywords, target_keyword, page_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    let pagesCreated = 0;
    
    // Create neighborhood pages
    for (const hood of neighborhoods) {
      const slug = createSlug(`${hood.neighborhood}-san-francisco`);
      const venuesInHood = venues.filter(v => v.neighborhood === hood.neighborhood);
      
      const title = `${hood.neighborhood} San Francisco - Local Directory`;
      const description = `Discover ${hood.venue_count} local venues in ${hood.neighborhood}, San Francisco. Restaurants, bars, cafes and more.`;
      const h1 = `${hood.neighborhood} Directory - San Francisco`;
      
      const content = createNeighborhoodContent(hood.neighborhood, venuesInHood);
      
      const keywords = JSON.stringify([
        `${hood.neighborhood} san francisco`,
        `${hood.neighborhood} sf`,
        `things to do ${hood.neighborhood}`,
        `${hood.neighborhood} restaurants`,
        `${hood.neighborhood} bars`
      ]);
      
      insertPage.run(slug, title, description, h1, content, keywords, `${hood.neighborhood} san francisco`, 'neighborhood');
      pagesCreated++;
      console.log(`✓ Created neighborhood page: ${hood.neighborhood}`);
    }
    
    // Create category pages
    for (const cat of categories) {
      const slug = createSlug(`best-${cat.category}-san-francisco`);
      const venuesInCat = venues.filter(v => v.category === cat.category);
      
      const title = `Best ${cat.category} in San Francisco - Local Directory`;
      const description = `Find the top ${cat.category.toLowerCase()} in San Francisco. ${cat.venue_count} carefully selected venues across the city.`;
      const h1 = `Best ${cat.category} in San Francisco`;
      
      const content = createCategoryContent(cat.category, venuesInCat);
      
      const keywords = JSON.stringify([
        `best ${cat.category.toLowerCase()} san francisco`,
        `${cat.category.toLowerCase()} sf`,
        `san francisco ${cat.category.toLowerCase()}`,
        `top ${cat.category.toLowerCase()} sf`
      ]);
      
      insertPage.run(slug, title, description, h1, content, keywords, `best ${cat.category.toLowerCase()} san francisco`, 'category');
      pagesCreated++;
      console.log(`✓ Created category page: ${cat.category}`);
    }
    
    // Create featured collections
    const collections = [
      {
        title: 'Top Rated Places in San Francisco',
        venues: venues.slice(0, 8),
        keywords: ['best san francisco', 'top rated sf', 'highest rated venues']
      },
      {
        title: 'Mission District Guide',
        venues: venues.filter(v => v.neighborhood === 'Mission District').slice(0, 6),
        keywords: ['mission district sf', 'mission restaurants', 'mission bars']
      },
      {
        title: 'Best Coffee Shops in SF',
        venues: venues.filter(v => v.category === 'Cafes & Coffee'),
        keywords: ['sf coffee', 'san francisco cafes', 'best coffee shops']
      }
    ];
    
    for (const collection of collections) {
      if (collection.venues.length >= 3) {
        const slug = createSlug(collection.title);
        const title = `${collection.title} - Curated Guide`;
        const description = `Discover ${collection.venues.length} handpicked venues in our ${collection.title.toLowerCase()} guide.`;
        const h1 = collection.title;
        
        const content = createCollectionContent(collection);
        
        insertPage.run(slug, title, description, h1, content, JSON.stringify(collection.keywords), collection.keywords[0], 'collection');
        pagesCreated++;
        console.log(`✓ Created collection: ${collection.title}`);
      }
    }
    
    // Create long-tail keyword pages
    const longTailPages = [
      {
        keyword: 'romantic restaurants san francisco',
        venues: venues.filter(v => v.category === 'Restaurants').slice(0, 5),
        description: 'Find the most romantic restaurants in San Francisco for your special date night.'
      },
      {
        keyword: 'best brunch spots sf',
        venues: venues.filter(v => v.category === 'Restaurants' || v.category === 'Cafes & Coffee').slice(0, 6),
        description: 'Discover the best brunch spots in San Francisco for weekend dining.'
      },
      {
        keyword: 'craft cocktail bars san francisco',
        venues: venues.filter(v => v.category === 'Bars & Nightlife'),
        description: 'Explore San Francisco\'s best craft cocktail bars and mixology scenes.'
      }
    ];
    
    for (const page of longTailPages) {
      if (page.venues.length >= 3) {
        const slug = createSlug(page.keyword);
        const title = `${titleCase(page.keyword)} - Local Guide`;
        const description = `${page.description} ${page.venues.length} top-rated venues.`;
        const h1 = titleCase(page.keyword);
        
        const content = createLongTailContent(page);
        
        const keywords = JSON.stringify([page.keyword, ...generateRelatedKeywords(page.keyword)]);
        
        insertPage.run(slug, title, description, h1, content, keywords, page.keyword, 'guide');
        pagesCreated++;
        console.log(`✓ Created long-tail page: ${page.keyword}`);
      }
    }
    
    // Generate sitemap
    createSitemap(db);
    
    console.log(`\n✅ SEO page generation completed!`);
    console.log(`📄 Created ${pagesCreated} SEO pages`);
    console.log(`🗺️  Generated sitemap.xml`);
    
  } catch (error) {
    console.error('❌ Error creating SEO pages:', error);
  } finally {
    db.close();
  }
}

function createSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function titleCase(str) {
  return str.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
}

function createNeighborhoodContent(neighborhood, venues) {
  const categories = [...new Set(venues.map(v => v.category))];
  
  return `
# ${neighborhood} San Francisco Directory

${neighborhood} is one of San Francisco's vibrant neighborhoods, offering a diverse mix of dining, entertainment, and local businesses. Our directory features ${venues.length} carefully curated venues that capture the unique character of this area.

## What to Expect in ${neighborhood}

• ${venues.length} local venues and businesses
• Diverse dining and entertainment options
• Authentic neighborhood character
• Mix of local favorites and hidden gems

## Featured Venues in ${neighborhood}

${venues.slice(0, 8).map(venue => `**${venue.name}** - ${venue.description || 'A local favorite in the neighborhood.'}`).join('\n\n')}

## Categories Available

${categories.map(cat => `• ${cat} (${venues.filter(v => v.category === cat).length} venues)`).join('\n')}

*Discover all ${venues.length} venues in our ${neighborhood} directory.*
  `.trim();
}

function createCategoryContent(category, venues) {
  const neighborhoods = [...new Set(venues.map(v => v.neighborhood))];
  
  return `
# Best ${category} in San Francisco

San Francisco offers an incredible variety of ${category.toLowerCase()} options across its diverse neighborhoods. Our directory features ${venues.length} carefully selected venues that represent the best of what the city has to offer.

## Why Choose These ${category}

Each venue in our ${category.toLowerCase()} directory has been selected for its quality, atmosphere, and contribution to San Francisco's vibrant scene. From neighborhood favorites to destination spots, these venues represent the diversity and excellence that makes SF special.

## Featured ${category}

${venues.slice(0, 8).map(venue => `**${venue.name}** (${venue.neighborhood}) - ${venue.description || 'A highly rated local venue.'}`).join('\n\n')}

## Neighborhoods with Great ${category}

${neighborhoods.map(hood => `• ${hood} (${venues.filter(v => v.neighborhood === hood).length} ${category.toLowerCase()})`).join('\n')}

*Browse all ${venues.length} ${category.toLowerCase()} venues across San Francisco.*
  `.trim();
}

function createCollectionContent(collection) {
  return `
# ${collection.title}

${collection.title} represents our carefully curated selection of standout venues in San Francisco. Each location has been chosen for its unique character, quality, and contribution to the city's vibrant scene.

## Featured Venues

${collection.venues.map(venue => `**${venue.name}** (${venue.neighborhood})  
${venue.description || 'A standout venue in San Francisco.'}
`).join('\n')}

## Why These Venues Made Our List

Each venue in this curated collection represents the best of what San Francisco has to offer. Our selection criteria includes community recommendations, unique offerings, and venues that capture the authentic spirit of their neighborhoods.

*Discover more curated collections across San Francisco.*
  `.trim();
}

function createLongTailContent(page) {
  return `
# ${titleCase(page.keyword)}

${page.description} Whether you're a local or visiting San Francisco, these ${page.venues.length} venues offer exceptional experiences that capture what makes the city special.

## Featured Venues

${page.venues.map(venue => `**${venue.name}** (${venue.neighborhood})  
${venue.description || 'A highly recommended venue for this experience.'}
`).join('\n')}

## What Makes These Special

These venues were selected for their authentic San Francisco character, quality offerings, and unique atmosphere. Each location contributes to the diverse and vibrant scene that makes San Francisco a world-class destination.

*Explore more curated guides and venue collections.*
  `.trim();
}

function generateRelatedKeywords(keyword) {
  const keywordMap = {
    'romantic restaurants': ['date night sf', 'couples dining', 'intimate restaurants'],
    'brunch spots': ['weekend brunch', 'breakfast restaurants', 'morning dining'],
    'craft cocktail': ['mixology bars', 'specialty drinks', 'artisan cocktails']
  };

  for (const [key, related] of Object.entries(keywordMap)) {
    if (keyword.includes(key)) {
      return related;
    }
  }
  return [];
}

function createSitemap(db) {
  const baseUrl = 'https://sf.cicerone.city';
  const pages = db.prepare('SELECT slug, updated_at FROM seo_pages WHERE status = "active"').all();
  const venues = db.prepare('SELECT id, name, neighborhood, updated_at FROM venues WHERE active = 1').all();
  
  const sitemapEntries = [
    `<url><loc>${baseUrl}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>`
  ];

  // Add SEO pages
  for (const page of pages) {
    const lastmod = new Date(page.updated_at || Date.now()).toISOString().split('T')[0];
    sitemapEntries.push(
      `<url><loc>${baseUrl}/${page.slug}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`
    );
  }

  // Add venue pages
  for (const venue of venues) {
    const slug = createSlug(`${venue.name}-${venue.neighborhood}`);
    const lastmod = new Date(venue.updated_at || Date.now()).toISOString().split('T')[0];
    sitemapEntries.push(
      `<url><loc>${baseUrl}/venue/${slug}</loc><lastmod>${lastmod}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>`
    );
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries.join('\n')}
</urlset>`;

  fs.writeFileSync('./public/sitemap.xml', sitemap);
  console.log('✓ Generated sitemap.xml');
}

// Run the script
createBasicSEOPages();