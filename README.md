# MyLocalGuide - San Francisco Local Discovery Platform

## Overview
MyLocalGuide is a curated directory of San Francisco venues focusing on substance over style. Built with the John Rush directory methodology for maximum SEO effectiveness and minimal ongoing maintenance.

**Current Status:** 25,000+ venues with comprehensive coverage across all SF neighborhoods and categories.

## Quick Start

### Development
```bash
npm install
npm run dev
```

### Production Build
```bash
npm run build
npm run start
```

## Deployment to mylocalguide.co

### Prerequisites
1. **API Keys Required:**
   - Google Places API Key: [Get it here](https://developers.google.com/maps/documentation/places/web-service/get-api-key)
   - Yelp Fusion API Key: [Get it here](https://www.yelp.com/developers/v3/manage_app)

2. **Add API keys to Vercel:**
   ```bash
   vercel env add GOOGLE_PLACES_API_KEY
   vercel env add YELP_API_KEY
   ```

### Deploy to Vercel
```bash
# Install Vercel CLI if needed
npm i -g vercel

# Deploy
vercel --prod
```

Then add custom domain `mylocalguide.co` in Vercel dashboard.

## Populate Data

After deployment, run these commands to populate your venue data:

1. **Test API connections:**
   ```bash
   curl https://mylocalguide.co/api/automation/status
   ```

2. **Populate initial venues (50 for testing):**
   ```bash
   curl -X POST https://mylocalguide.co/api/automation/scrape?limit=50
   ```

3. **Full venue population (500+ venues):**
   ```bash
   curl -X POST https://mylocalguide.co/api/automation/scrape?limit=500
   ```

4. **Generate SEO content:**
   ```bash
   curl -X POST https://mylocalguide.co/api/automation/generate-seo
   ```

## Tech Stack
- **Framework:** Next.js 15 with TypeScript
- **Database:** SQLite with Better-SQLite3
- **Styling:** Tailwind CSS
- **SEO:** Next-sitemap, structured data
- **APIs:** Google Places, Yelp Fusion

## Project Structure
```
src/
├── app/
│   ├── api/          # API routes
│   ├── category/     # Category pages
│   ├── neighborhood/ # Neighborhood pages
│   └── page.tsx      # Homepage
lib/
├── automation/       # Automation scripts
├── database.ts       # Database utilities
└── seed-data.ts      # Initial data
```

## Maintenance
- Automated daily venue updates via API
- Weekly SEO content refresh
- Monthly audit of closed venues

Built following the philosophy: "Looks like 1995, works like 2025."