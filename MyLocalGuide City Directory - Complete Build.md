# MyLocalGuide City Directory - Complete Build Instructions

## Project Overview

Build a comprehensive local discovery platform that combines the simplicity of Craigslist with the depth of a modern city guide. The platform should follow John Rush's directory methodology for maximum SEO effectiveness and minimal ongoing maintenance.

### Core Concept
- **Name:** MyLocalGuide.co (starting with San Francisco)
- **Positioning:** "The anti-Yelp" - substance over style, information density over pretty pictures
- **Target:** Locals and visitors seeking authentic, well-curated city experiences
- **Maintenance Goal:** Maximum 1 hour per month after launch

## Visual Design Philosophy

### Deliberately Antiquated Aesthetic
- **Inspired by Craigslist's minimalism** - functional, fast, trustworthy
- **Color scheme:** Simple blues, blacks, minimal color usage
- **Typography:** Clean, readable fonts - nothing fancy
- **Layout:** Text-heavy lists, minimal images, information density prioritized
- **Logo concept:** "MyLocalGuide" in cracklin bacon skin font arched over city skyline

### Technical Requirements
- **Lightning fast loading** (under 2 seconds)
- **Mobile-first responsive design**
- **No unnecessary animations or effects**
- **High information density per screen**
- **Easy scanning and quick navigation**

## Technical Stack

### Recommended Architecture
```
Frontend: Next.js (SEO optimized, fast loading)
Backend: Node.js with Express
Database: PostgreSQL or SQLite (for simplicity)
Hosting: Vercel or Netlify (easy deployment)
Content Management: Markdown files or simple headless CMS
Search: Built-in search functionality
Analytics: Google Analytics 4
```

### Key Technical Features
- **Server-side rendering** for SEO
- **Structured data markup** for Google rich snippets
- **Sitemap generation** for all categories and venues
- **Fast full-text search** across all venues and categories
- **Mobile-optimized filtering system**
- **Contact forms** for business owners
- **Simple admin panel** for content updates

## Content Strategy & Structure

### Primary Categories

#### Food & Drink
- **Restaurants:** By cuisine, price point, neighborhood, atmosphere
- **Bars & Nightlife:** Wine bars, craft cocktail, dive bars, sports bars, clubs
- **Cafes & Coffee:** Study spots, meeting places, specialty roasters
- **Specialty Food:** Wine shops, cheese shops, bakeries, gourmet markets
- **Food Trucks & Markets:** Farmers markets, food halls, mobile vendors
- **Non-Alcoholic:** Juice bars, tea houses, sober-friendly spaces

#### Shopping & Retail
- **Thrift & Vintage:** Consignment, vintage clothing, antiques
- **Fashion:** Boutiques, local designers, couture, casual wear
- **Books & Media:** Bookstores, record shops, comic shops
- **Specialty Retail:** Art supplies, music gear, hobby shops
- **Local Markets:** Flea markets, artisan goods, handmade items

#### Activities & Entertainment
- **Live Entertainment:** Music venues, comedy clubs, theaters, open mic nights
- **Arts & Culture:** Galleries, museums, cultural centers, art walks
- **Outdoor Activities:** Parks, hiking trails, beaches, dog parks, gardens
- **Recreation:** Gyms, yoga studios, sports facilities, pools
- **Games & Fun:** Bowling, mini golf, arcades, escape rooms, board game cafes

#### Services & Practical
- **Work Spaces:** Co-working spaces, study spots, meeting rooms
- **Personal Services:** Barber shops, salons, spa services, wellness
- **Practical Services:** Tailors, repair shops, dry cleaners, printing
- **Professional Services:** Meeting spaces, event venues

### Advanced Filtering System

#### Geographic Filters
- **Neighborhood-specific** (hyperlocal focus)
- **Distance from landmarks** (transit stations, major intersections)
- **Walkability scores** and public transit access

#### Demographic Targeting
- **Kids (0-12):** Play areas, kid menus, family bathrooms, stroller-friendly
- **Teens (13-17):** All-ages venues, study spots, affordable options, social spaces
- **College/Young Adults (18-25):** Late night, budget-friendly, social scenes, student discounts
- **Young Professionals (26-35):** Happy hours, date spots, networking venues, after-work hangouts
- **Families (all ages):** Kid-friendly, outdoor seating, casual dining, parking available
- **Adults (35-55):** Wine bars, upscale dining, cultural activities, mature atmosphere
- **Seniors (55+):** Quiet spots, accessible venues, early hours, comfortable seating

#### Atmosphere & Vibe Tags
- **Energy Level:** Quiet/peaceful, moderate, lively/energetic, loud/party
- **Social Setting:** Intimate/romantic, small groups, large groups, solo-friendly
- **Ambiance:** Cozy, industrial, modern, vintage, rustic, elegant
- **Lighting:** Bright, dim, candlelit, natural light, neon
- **Music:** Live music, DJ, background music, quiet/no music

#### Practical Features
- **Seating:** Outdoor seating, bar seating, communal tables, private booths
- **Climate:** Fireplace, air conditioning, outdoor heaters, covered patio
- **Technology:** WiFi, charging stations, TV screens, projection
- **Accessibility:** Wheelchair accessible, hearing loop, large print menus, accessible bathrooms
- **Parking:** Street parking, parking lot, valet, bike racks
- **Payment:** Cash only, credit cards, mobile payments, cryptocurrency

#### Dietary & Lifestyle
- **Dietary Options:** Vegan, vegetarian, gluten-free, keto, kosher, halal
- **Health Conscious:** Organic, farm-to-table, low-sodium, sugar-free
- **Lifestyle:** Pet-friendly, LGBTQ+ friendly, family-friendly, adult-only

#### Timing & Schedule
- **Hours:** Early bird (before 8am), late night (after 10pm), 24/7, weekend-only
- **Special Times:** Happy hour, brunch, late-night dining, breakfast all day
- **Events:** Trivia nights, live music, art shows, themed nights

### Content Generation Strategy

#### Initial Data Collection
1. **Scrape existing sources:** Google Places, Yelp, city tourism sites
2. **Research local publications:** Food blogs, event calendars, neighborhood guides
3. **Manual curation:** Personal knowledge, local recommendations
4. **AI enhancement:** Generate descriptions focusing on vibe and practical details

#### Content Quality Standards
- **Unique descriptions** emphasizing atmosphere and experience over basic facts
- **Local insider knowledge** that you won't find on major platforms
- **Practical details** that matter to decision-making
- **Regular updates** for trending spots and seasonal changes

## SEO Strategy (Following John Rush Methodology)

### Keyword Research & Targeting
- **Primary keywords:** "[cuisine] restaurants [neighborhood]", "bars in [area]", "things to do [neighborhood]"
- **Long-tail opportunities:** "quiet coffee shops for studying [neighborhood]", "kid-friendly restaurants with outdoor seating", "late night eats [city]"
- **Demographic-specific:** "date spots [neighborhood]", "family restaurants [area]", "senior-friendly venues"
- **Vibe-based:** "cozy bars with fireplaces", "rooftop restaurants [city]", "dive bars [neighborhood]"

### Content Structure for SEO
- **Landing pages** for each neighborhood with comprehensive guides
- **Category pages** optimized for specific searches
- **Featured collections** targeting seasonal and trending searches
- **FAQ sections** answering common local questions
- **Blog content** covering city events, seasonal guides, new openings

### Technical SEO Implementation
- **Structured data markup** for local businesses
- **Fast loading times** (under 2 seconds)
- **Mobile-first indexing** optimization
- **Internal linking** between related venues and neighborhoods
- **XML sitemaps** for all pages and categories
- **Meta descriptions** optimized for click-through rates

### Link Building Strategy
- **Local blog outreach** for neighborhood guides
- **Social media promotion** on city-specific groups and pages
- **Reddit community engagement** in local subreddits
- **Directory submissions** to other local business directories

## Launch Strategy

### Phase 1: Initial Build (Week 1-2)
1. **Domain purchase and hosting setup**
2. **Basic site architecture and design**
3. **Core category structure implementation**
4. **Initial data collection and entry (200-500 venues)**
5. **Basic SEO setup and analytics**

### Phase 2: Content Population (Week 3-4)
1. **Complete venue database for target city**
2. **Generate optimized descriptions for all venues**
3. **Create neighborhood landing pages**
4. **Implement filtering and search functionality**
5. **FAQ and help sections**

### Phase 3: Promotion (Week 5-6)
1. **Reddit promotion** in local subreddits
2. **Social media outreach** to local influencers and bloggers
3. **Directory submissions** to relevant platforms
4. **Local press outreach** for launch coverage
5. **Google Search Console and Analytics setup**

### Phase 4: Optimization (Month 2)
1. **Monitor search console data** for keyword opportunities
2. **A/B test** filtering and navigation elements
3. **Add content** based on search query insights
4. **Expand featured sections** for trending searches
5. **Begin monetization setup**

## Monetization Strategy

### Revenue Streams (in order of implementation)
1. **Featured listings** - Restaurants pay for top placement in category/neighborhood
2. **Banner advertising** - Local businesses and city-wide brands
3. **Affiliate partnerships** - Reservation platforms, delivery services, event tickets
4. **Sponsored content** - "Best [category] in [neighborhood]" sponsored posts
5. **Premium access** - Enhanced filtering for power users
6. **Data insights** - Anonymized trend reports for local businesses
7. **Event promotion** - Paid promotion for special events and new openings
8. **Brand partnerships** - Ongoing sponsorship deals with relevant brands

### Pricing Strategy
- **Featured listings:** $50-200/month depending on category and competition
- **Banner ads:** $100-500/month based on traffic and placement
- **Sponsored content:** $200-1000 per article depending on reach
- **Premium subscriptions:** $10-20/month for enhanced features

## Ongoing Maintenance Strategy

### Weekly Tasks (15-20 minutes)
- **Monitor local food/entertainment blogs** for new hot spots
- **Check social media** for trending venues and events
- **Add 1-2 new venues** if discovered
- **Update any closed/changed venues** reported by users

### Monthly Tasks (30-45 minutes)
- **Review Google Search Console** for new keyword opportunities
- **Update seasonal content** (summer patios, winter fireplaces, holiday events)
- **Check competitor sites** for missed venues or categories
- **Review and respond to** business owner inquiries

### Quarterly Tasks (1-2 hours)
- **Major content audit** and cleanup
- **SEO performance review** and strategy adjustment
- **Consider new category additions** based on search data
- **Outreach to businesses** for featured listing opportunities

## Expansion Strategy

### Multi-City Rollout
- **Template approach:** Use successful city as template for rapid expansion
- **Domain strategy:** mylocalguide.co with city-specific subdomains or paths
- **Content replication:** Adapt successful categories and structure
- **Local customization:** Adjust for regional preferences and culture

### Target Cities (in order of priority)
1. **San Francisco** (tech-savvy, food-focused, neighborhood-centric)
2. **Los Angeles** (entertainment, diverse dining, sprawling geography)
3. **New York** (dense market, high search volume, competitive)
4. **Austin** (food scene, music culture, young demographics)
5. **Portland** (local culture, food trucks, unique venues)

### Success Metrics for Expansion
- **Minimum 10K monthly visitors** in initial city
- **Positive revenue** from monetization
- **Strong local brand recognition** and backlinks
- **Manageable maintenance time** (under 2 hours/month)

## Technical Implementation Notes

### Database Schema
```sql
-- Venues table
venues (
  id, name, address, neighborhood, category, subcategory,
  description, phone, website, hours, price_range,
  atmosphere_tags, demographic_tags, feature_tags,
  lat, lng, created_at, updated_at, featured, active
)

-- Categories table
categories (
  id, name, slug, parent_id, description, seo_title, meta_description
)

-- Neighborhoods table
neighborhoods (
  id, name, slug, city, description, boundary_coords
)

-- Tags table (for flexible filtering)
tags (
  id, name, type, color, description
)

-- Venue_tags relationship table
venue_tags (
  venue_id, tag_id
)
```

### API Endpoints
- `GET /api/venues` - List venues with filtering
- `GET /api/venues/:id` - Individual venue details
- `GET /api/categories` - List all categories
- `GET /api/neighborhoods` - List neighborhoods
- `GET /api/search` - Full-text search
- `POST /api/contact` - Contact form submission

### Performance Optimization
- **Image optimization** and lazy loading
- **CDN implementation** for static assets
- **Caching strategy** for frequently accessed data
- **Database indexing** for fast filtering and search
- **Minified CSS/JS** for faster loading

## Content Examples

### Sample Venue Description
```
Mario's North Beach Deli
Classic Italian deli that's been slinging massive sandwiches since 1958. 
Counter seating only, cash preferred, loud and crowded during lunch rush. 
Perfect for a quick, authentic bite between exploring North Beach. 
Locals line up for the meatball sub - arrive before noon or after 2pm to avoid the wait.

Tags: Quick bite, Authentic, Cash preferred, Counter seating, Busy lunch, Local favorite
Neighborhood: North Beach
Good for: Quick lunch, Solo dining, Authentic experience
Avoid if: You need quiet, Want table service, Dining with large groups
```

### Sample Neighborhood Guide
```
The Mission District Food Scene
San Francisco's most dynamic food neighborhood blends authentic taquerias 
with innovative restaurants and everything in between. Valencia Street anchors 
the scene with trendy spots, while Mission Street keeps it real with family-run 
establishments. Don't miss the weekend farmers market at Mission Dolores Park.

Best for: Adventurous eaters, Budget-conscious diners, Late-night cravings
```

## Success Metrics & KPIs

### Traffic Goals
- **Month 1:** 1,000 unique visitors
- **Month 3:** 5,000 unique visitors  
- **Month 6:** 15,000 unique visitors
- **Month 12:** 50,000 unique visitors

### Engagement Goals
- **Average session duration:** 3+ minutes
- **Pages per session:** 4+ pages
- **Bounce rate:** Under 60%
- **Return visitor rate:** 25%+

### Revenue Goals
- **Month 6:** $500/month (break-even)
- **Month 12:** $2,000/month
- **Month 18:** $5,000/month
- **Long-term:** $10,000+/month per city

### Content Goals
- **Launch:** 300+ venues across all categories
- **Month 3:** 500+ venues with full descriptions
- **Month 6:** 750+ venues, neighborhood guides complete
- **Month 12:** 1,000+ venues, seasonal content library

## Risk Mitigation

### Potential Challenges
1. **Competition from established platforms** - Differentiate through curation and local focus
2. **Content maintenance burden** - Automate where possible, focus on high-value updates
3. **Slow initial SEO growth** - Supplement with social media and community building
4. **Local business resistance** - Provide clear value proposition and easy opt-in process

### Contingency Plans
- **Low traffic scenarios:** Pivot to different neighborhood or category focus
- **High maintenance burden:** Simplify content strategy or outsource specific tasks
- **Monetization struggles:** Focus on affiliate revenue and premium features
- **Technical issues:** Have backup hosting and simple rollback procedures

---

## Final Notes for Claude Code

1. **Follow John Rush methodology exactly** - validate through keyword research, build fast, promote strategically
2. **Prioritize speed over features** - Get MVP live quickly, iterate based on actual usage
3. **Focus on local SEO** - This is a local business, optimize accordingly
4. **Make it genuinely useful** - The antiquated look only works if the content quality is exceptional
5. **Plan for scale** - Architecture should easily replicate to new cities
6. **Keep maintenance minimal** - This is a side project, not a full-time commitment

Build this following the philosophy: "Looks like 1995, works like 2025."