# Cicerone SF - Automation Quick Start Guide

## Ready for Immediate Execution 🚀

Everything has been prepared for rapid deployment of the automated San Francisco directory following John Rush's methodology. All code is written, APIs are ready, and the pipeline is prepared for execution.

## Phase 1: Environment Setup ⚙️

### Required Environment Variables
Create `.env.local` file with:

```bash
# Google Places API (for venue data)
GOOGLE_PLACES_API_KEY=your_google_places_api_key

# Yelp Fusion API (for venue data and reviews)
YELP_API_KEY=your_yelp_api_key

# Anthropic Claude API (for content generation)
ANTHROPIC_API_KEY=your_anthropic_api_key
```

### Quick Commands to Execute:

```bash
# 1. Install dependencies (if not already done)
npm install

# 2. Start the development server
npm run dev

# 3. Check system status
curl http://localhost:3000/api/automation/status

# 4. Run database migrations (prepare for automation)
curl -X POST http://localhost:3000/api/automation/migrate \
  -H "Content-Type: application/json" \
  -d '{"action": "migrate"}'
```

## Phase 2: Data Pipeline Execution 📊

### Step 1: Scrape SF Venues (5-10 minutes)
```bash
# Scrape 300-500 venues across all SF neighborhoods
curl -X POST http://localhost:3000/api/automation/scrape \
  -H "Content-Type: application/json" \
  -d '{"maxVenuesPerCategory": 50, "runMode": "full"}'
```

**Expected Results:**
- 300-500 SF venues scraped from Google Places + Yelp
- All neighborhoods covered (Mission, Castro, Marina, etc.)
- All categories populated (restaurants, bars, coffee, etc.)
- Automatic deduplication and quality scoring

### Step 2: Generate AI Content (10-15 minutes)
```bash
# Generate descriptions for all venues
curl -X POST http://localhost:3000/api/automation/generate-content \
  -H "Content-Type: application/json" \
  -d '{"contentType": "venues", "batchSize": 10}'

# Generate neighborhood content
curl -X POST http://localhost:3000/api/automation/generate-content \
  -H "Content-Type: application/json" \
  -d '{"contentType": "neighborhoods"}'

# Generate category content  
curl -X POST http://localhost:3000/api/automation/generate-content \
  -H "Content-Type: application/json" \
  -d '{"contentType": "categories"}'

# Generate featured collections
curl -X POST http://localhost:3000/api/automation/generate-content \
  -H "Content-Type: application/json" \
  -d '{"contentType": "collections"}'
```

## Phase 3: SEO Landing Pages (5-10 minutes) 🎯

### Generate Complete SEO Architecture
```bash
# Generate all SEO content: neighborhoods, categories, long-tail pages, FAQs
curl -X POST http://localhost:3000/api/automation/generate-seo \
  -H "Content-Type: application/json" \
  -d '{"pageTypes": ["neighborhood", "category", "collection", "longtail", "faq"]}'
```

**Generated Content:**
- 16+ neighborhood landing pages (Mission District SF, Castro SF, etc.)
- 6+ category pages (Best Restaurants SF, Best Bars SF, etc.)
- 10+ long-tail keyword pages (Romantic Restaurants SF, Cheap Eats SF, etc.)
- 5+ featured collections (Top Rated Places, Best Brunch Spots, etc.)
- FAQ pages answering common SF venue questions
- Automatic sitemap.xml generation

## Phase 4: Verification & Launch 🎉

### Check Final Status
```bash
# Comprehensive system check
curl http://localhost:3000/api/automation/status
```

**Expected Final Numbers:**
- 300-500 venues with AI-generated descriptions
- 30+ SEO landing pages ready for traffic
- Complete neighborhood and category coverage
- Structured data and meta tags optimized
- Sitemap.xml ready for search engines

### View Your Directory
```bash
# Open in browser
open http://localhost:3000

# Key pages to check:
# - Homepage with real venue counts
# - Category pages: /restaurants, /bars, /coffee
# - Neighborhood pages: /mission-district, /castro
# - Individual venue pages
# - SEO pages for long-tail keywords
```

## Production Deployment Options 🌐

### 1. Vercel (Recommended - Free)
```bash
# Deploy to Vercel
npx vercel

# Add environment variables in Vercel dashboard
# Point custom domain (mylocalguide.co)
```

### 2. Manual Server Setup
```bash
# Build for production
npm run build

# Start production server
npm start
```

## Ongoing Automation (Set & Forget) 🔄

### Daily Updates (Recommended Schedule)
```bash
# Morning: Update venue data (5 minutes)
curl -X POST http://localhost:3000/api/automation/scrape \
  -d '{"maxVenuesPerCategory": 10, "runMode": "incremental"}'

# Evening: Generate content for new venues (5 minutes)  
curl -X POST http://localhost:3000/api/automation/generate-content \
  -d '{"contentType": "venues", "batchSize": 5}'
```

### Weekly SEO Updates
```bash
# Generate new long-tail pages based on search trends
curl -X POST http://localhost:3000/api/automation/generate-seo \
  -d '{"pageTypes": ["longtail"], "regenerateExisting": false}'
```

## Key Features Ready to Use ✨

### 1. Craigslist-Inspired Design ✓
- Times New Roman font, minimal colors
- "1995 looks, 2025 functionality"
- Fast loading, no bloat

### 2. Comprehensive SF Coverage ✓
- All major neighborhoods represented
- All venue categories populated
- Real data from Google Places + Yelp

### 3. SEO Optimization ✓
- Long-tail keyword targeting
- Local SEO optimization
- Structured data ready
- Automatic sitemap generation

### 4. Content Generation ✓
- AI-powered venue descriptions
- Neighborhood guides
- Category overviews
- Featured collections

### 5. John Rush Methodology ✓
- Minimal maintenance required
- Automated content pipeline
- SEO-first approach
- Fast, lean architecture

## Troubleshooting 🔧

### If APIs Return Errors:
```bash
# Check API key configuration
curl http://localhost:3000/api/automation/status

# Verify environment variables are set
echo $GOOGLE_PLACES_API_KEY
echo $YELP_API_KEY  
echo $ANTHROPIC_API_KEY
```

### If Database Issues:
```bash
# Reset and remigrate database
rm cicerone-sf.db
curl -X POST http://localhost:3000/api/automation/migrate
```

### Monitor Progress:
```bash
# Watch the terminal for real-time progress updates
# Each API call shows detailed logging
# Status endpoint provides comprehensive metrics
```

## Success Metrics 📈

### After Phase 1 (Setup):
- ✅ Database version 5
- ✅ All API keys configured
- ✅ Development server running

### After Phase 2 (Data):
- ✅ 300-500 venues scraped
- ✅ All neighborhoods covered
- ✅ AI descriptions generated

### After Phase 3 (SEO):
- ✅ 30+ landing pages created
- ✅ Long-tail keywords targeted
- ✅ Sitemap.xml generated

### Production Ready:
- ✅ Fast loading directory
- ✅ Search engine optimized
- ✅ Minimal maintenance required
- ✅ John Rush methodology implemented

---

**Ready to execute?** Run the commands above in order and watch your SF directory come to life! 🌉