-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- States table
CREATE TABLE IF NOT EXISTS states (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code CHAR(2) UNIQUE NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cities table with geospatial support
CREATE TABLE IF NOT EXISTS cities (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  state_code CHAR(2) NOT NULL REFERENCES states(code),
  county VARCHAR(100),
  population INTEGER,
  location GEOGRAPHY(POINT),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  timezone VARCHAR(50),
  is_capital BOOLEAN DEFAULT false,
  is_major_tourist_city BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(slug, state_code)
);

-- Neighborhoods table
CREATE TABLE IF NOT EXISTS neighborhoods (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  city_id INTEGER REFERENCES cities(id),
  description TEXT,
  boundary GEOGRAPHY(POLYGON),
  characteristics JSONB,
  best_for JSONB,
  price_level INTEGER CHECK (price_level BETWEEN 1 AND 5),
  walkability INTEGER CHECK (walkability BETWEEN 1 AND 5),
  safety INTEGER CHECK (safety BETWEEN 1 AND 5),
  transit_access INTEGER CHECK (transit_access BETWEEN 1 AND 5),
  featured BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(slug, city_id)
);

-- Enhanced venues table with full-text search
CREATE TABLE IF NOT EXISTS venues (
  id SERIAL PRIMARY KEY,
  external_id VARCHAR(255),
  source VARCHAR(50), -- google, yelp, tripadvisor, foursquare
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255),
  address TEXT,
  neighborhood_id INTEGER REFERENCES neighborhoods(id),
  city_id INTEGER REFERENCES cities(id),
  location GEOGRAPHY(POINT),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Categories
  category VARCHAR(100),
  subcategory VARCHAR(100),
  cuisine_type VARCHAR(100),
  
  -- Details
  description TEXT,
  phone VARCHAR(50),
  website TEXT,
  email VARCHAR(255),
  hours JSONB,
  price_range INTEGER CHECK (price_range BETWEEN 1 AND 4),
  
  -- Ratings from different sources
  google_rating DECIMAL(2, 1),
  google_review_count INTEGER,
  yelp_rating DECIMAL(2, 1),
  yelp_review_count INTEGER,
  tripadvisor_rating DECIMAL(2, 1),
  tripadvisor_review_count INTEGER,
  foursquare_rating DECIMAL(2, 1),
  foursquare_review_count INTEGER,
  
  -- Computed fields
  aggregate_rating DECIMAL(2, 1),
  total_reviews INTEGER,
  popularity_score INTEGER,
  
  -- Features and tags
  features JSONB,
  atmosphere_tags TEXT[],
  demographic_tags TEXT[],
  amenities TEXT[],
  
  -- Media
  photos JSONB,
  cover_photo_url TEXT,
  
  -- Status
  verified BOOLEAN DEFAULT false,
  claimed BOOLEAN DEFAULT false,
  permanently_closed BOOLEAN DEFAULT false,
  featured BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  
  -- Timestamps
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes for uniqueness
  UNIQUE(external_id, source),
  UNIQUE(slug, city_id)
);

-- Hotels table for comprehensive lodging
CREATE TABLE IF NOT EXISTS hotels (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  city_id INTEGER REFERENCES cities(id),
  address TEXT,
  location GEOGRAPHY(POINT),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Hotel specifics
  star_rating INTEGER CHECK (star_rating BETWEEN 1 AND 5),
  total_rooms INTEGER,
  check_in_time TIME,
  check_out_time TIME,
  
  -- Pricing
  price_range VARCHAR(20),
  avg_nightly_rate DECIMAL(10, 2),
  
  -- Details
  description TEXT,
  amenities JSONB,
  photos JSONB,
  website TEXT,
  phone VARCHAR(50),
  email VARCHAR(255),
  
  -- Booking platforms
  booking_com_id VARCHAR(100),
  expedia_id VARCHAR(100),
  hotels_com_id VARCHAR(100),
  airbnb_url TEXT,
  
  -- Status
  featured BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews table for aggregating reviews
CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  venue_id INTEGER REFERENCES venues(id),
  source VARCHAR(50),
  external_review_id VARCHAR(255),
  author_name VARCHAR(255),
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  title TEXT,
  content TEXT,
  helpful_count INTEGER DEFAULT 0,
  verified_purchase BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE,
  imported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(external_review_id, source)
);

-- Create indexes for performance
CREATE INDEX idx_venues_location ON venues USING GIST (location);
CREATE INDEX idx_venues_city ON venues(city_id);
CREATE INDEX idx_venues_neighborhood ON venues(neighborhood_id);
CREATE INDEX idx_venues_category ON venues(category);
CREATE INDEX idx_venues_aggregate_rating ON venues(aggregate_rating DESC);
CREATE INDEX idx_venues_popularity ON venues(popularity_score DESC);

-- Full-text search indexes
CREATE INDEX idx_venues_name_fts ON venues USING GIN (to_tsvector('english', name));
CREATE INDEX idx_venues_description_fts ON venues USING GIN (to_tsvector('english', description));

-- Create materialized view for fast neighborhood stats
CREATE MATERIALIZED VIEW neighborhood_stats AS
SELECT 
  n.id,
  n.name,
  COUNT(DISTINCT v.id) as venue_count,
  COUNT(DISTINCT CASE WHEN v.category = 'Restaurants' THEN v.id END) as restaurant_count,
  COUNT(DISTINCT CASE WHEN v.category = 'Bars & Nightlife' THEN v.id END) as bar_count,
  COUNT(DISTINCT CASE WHEN v.category = 'Cafes & Coffee' THEN v.id END) as cafe_count,
  AVG(v.aggregate_rating) as avg_rating,
  AVG(v.price_range) as avg_price_level
FROM neighborhoods n
LEFT JOIN venues v ON v.neighborhood_id = n.id AND v.active = true
GROUP BY n.id, n.name;

-- Create function for nearby venues
CREATE OR REPLACE FUNCTION nearby_venues(
  lat DECIMAL,
  lng DECIMAL,
  radius_meters INTEGER DEFAULT 1000,
  limit_count INTEGER DEFAULT 20
)
RETURNS TABLE (
  id INTEGER,
  name VARCHAR,
  category VARCHAR,
  distance_meters FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.id,
    v.name,
    v.category,
    ST_Distance(v.location::geometry, ST_MakePoint(lng, lat)::geometry) as distance_meters
  FROM venues v
  WHERE ST_DWithin(
    v.location::geometry,
    ST_MakePoint(lng, lat)::geometry,
    radius_meters
  )
  AND v.active = true
  ORDER BY distance_meters
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS) policies
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public venues are viewable by everyone" ON venues
  FOR SELECT USING (active = true);

CREATE POLICY "Public reviews are viewable by everyone" ON reviews
  FOR SELECT USING (true);

-- Insert initial data
INSERT INTO states (name, code, slug) VALUES 
  ('California', 'CA', 'california')
ON CONFLICT (code) DO NOTHING;

INSERT INTO cities (name, slug, state_code, latitude, longitude, population, is_major_tourist_city) VALUES 
  ('San Francisco', 'san-francisco', 'CA', 37.7749, -122.4194, 873965, true)
ON CONFLICT (slug, state_code) DO NOTHING;