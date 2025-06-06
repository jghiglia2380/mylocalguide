-- Migration: Add Multi-City Support
-- This migration adds support for multiple cities across different states

-- Create states table
CREATE TABLE IF NOT EXISTS states (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create cities table
CREATE TABLE IF NOT EXISTS cities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  state_code TEXT NOT NULL,
  is_capital BOOLEAN DEFAULT FALSE,
  is_major_tourist_city BOOLEAN DEFAULT FALSE,
  population INTEGER,
  latitude REAL,
  longitude REAL,
  timezone TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (state_code) REFERENCES states(code)
);

-- Add city_id to venues table
ALTER TABLE venues ADD COLUMN city_id INTEGER REFERENCES cities(id);

-- Add city_id to neighborhoods table
ALTER TABLE neighborhoods ADD COLUMN city_id INTEGER REFERENCES cities(id);

-- Create indexes for performance
CREATE INDEX idx_cities_state_code ON cities(state_code);
CREATE INDEX idx_cities_slug ON cities(slug);
CREATE INDEX idx_venues_city_id ON venues(city_id);
CREATE INDEX idx_neighborhoods_city_id ON neighborhoods(city_id);

-- Insert all 50 states
INSERT OR IGNORE INTO states (code, name, slug) VALUES
('AL', 'Alabama', 'alabama'),
('AK', 'Alaska', 'alaska'),
('AZ', 'Arizona', 'arizona'),
('AR', 'Arkansas', 'arkansas'),
('CA', 'California', 'california'),
('CO', 'Colorado', 'colorado'),
('CT', 'Connecticut', 'connecticut'),
('DE', 'Delaware', 'delaware'),
('FL', 'Florida', 'florida'),
('GA', 'Georgia', 'georgia'),
('HI', 'Hawaii', 'hawaii'),
('ID', 'Idaho', 'idaho'),
('IL', 'Illinois', 'illinois'),
('IN', 'Indiana', 'indiana'),
('IA', 'Iowa', 'iowa'),
('KS', 'Kansas', 'kansas'),
('KY', 'Kentucky', 'kentucky'),
('LA', 'Louisiana', 'louisiana'),
('ME', 'Maine', 'maine'),
('MD', 'Maryland', 'maryland'),
('MA', 'Massachusetts', 'massachusetts'),
('MI', 'Michigan', 'michigan'),
('MN', 'Minnesota', 'minnesota'),
('MS', 'Mississippi', 'mississippi'),
('MO', 'Missouri', 'missouri'),
('MT', 'Montana', 'montana'),
('NE', 'Nebraska', 'nebraska'),
('NV', 'Nevada', 'nevada'),
('NH', 'New Hampshire', 'new-hampshire'),
('NJ', 'New Jersey', 'new-jersey'),
('NM', 'New Mexico', 'new-mexico'),
('NY', 'New York', 'new-york'),
('NC', 'North Carolina', 'north-carolina'),
('ND', 'North Dakota', 'north-dakota'),
('OH', 'Ohio', 'ohio'),
('OK', 'Oklahoma', 'oklahoma'),
('OR', 'Oregon', 'oregon'),
('PA', 'Pennsylvania', 'pennsylvania'),
('RI', 'Rhode Island', 'rhode-island'),
('SC', 'South Carolina', 'south-carolina'),
('SD', 'South Dakota', 'south-dakota'),
('TN', 'Tennessee', 'tennessee'),
('TX', 'Texas', 'texas'),
('UT', 'Utah', 'utah'),
('VT', 'Vermont', 'vermont'),
('VA', 'Virginia', 'virginia'),
('WA', 'Washington', 'washington'),
('WV', 'West Virginia', 'west-virginia'),
('WI', 'Wisconsin', 'wisconsin'),
('WY', 'Wyoming', 'wyoming');

-- Insert state capitals and major tourist cities
INSERT OR IGNORE INTO cities (name, slug, state_code, is_capital, is_major_tourist_city, latitude, longitude) VALUES
-- State Capitals
('Montgomery', 'montgomery', 'AL', TRUE, FALSE, 32.3792, -86.3077),
('Juneau', 'juneau', 'AK', TRUE, FALSE, 58.3019, -134.4197),
('Phoenix', 'phoenix', 'AZ', TRUE, TRUE, 33.4484, -112.0740),
('Little Rock', 'little-rock', 'AR', TRUE, FALSE, 34.7465, -92.2896),
('Sacramento', 'sacramento', 'CA', TRUE, FALSE, 38.5816, -121.4944),
('Denver', 'denver', 'CO', TRUE, TRUE, 39.7392, -104.9903),
('Hartford', 'hartford', 'CT', TRUE, FALSE, 41.7658, -72.6734),
('Dover', 'dover', 'DE', TRUE, FALSE, 39.1582, -75.5244),
('Tallahassee', 'tallahassee', 'FL', TRUE, FALSE, 30.4383, -84.2807),
('Atlanta', 'atlanta', 'GA', TRUE, TRUE, 33.7490, -84.3880),
('Honolulu', 'honolulu', 'HI', TRUE, TRUE, 21.3099, -157.8581),
('Boise', 'boise', 'ID', TRUE, FALSE, 43.6150, -116.2023),
('Springfield', 'springfield', 'IL', TRUE, FALSE, 39.7817, -89.6501),
('Indianapolis', 'indianapolis', 'IN', TRUE, FALSE, 39.7684, -86.1581),
('Des Moines', 'des-moines', 'IA', TRUE, FALSE, 41.5868, -93.6250),
('Topeka', 'topeka', 'KS', TRUE, FALSE, 39.0473, -95.6752),
('Frankfort', 'frankfort', 'KY', TRUE, FALSE, 38.2009, -84.8733),
('Baton Rouge', 'baton-rouge', 'LA', TRUE, FALSE, 30.4515, -91.1871),
('Augusta', 'augusta', 'ME', TRUE, FALSE, 44.3106, -69.7795),
('Annapolis', 'annapolis', 'MD', TRUE, FALSE, 38.9784, -76.4922),
('Boston', 'boston', 'MA', TRUE, TRUE, 42.3601, -71.0589),
('Lansing', 'lansing', 'MI', TRUE, FALSE, 42.7335, -84.5555),
('Saint Paul', 'saint-paul', 'MN', TRUE, FALSE, 44.9537, -93.0900),
('Jackson', 'jackson', 'MS', TRUE, FALSE, 32.2988, -90.1848),
('Jefferson City', 'jefferson-city', 'MO', TRUE, FALSE, 38.5767, -92.1735),
('Helena', 'helena', 'MT', TRUE, FALSE, 46.5891, -112.0391),
('Lincoln', 'lincoln', 'NE', TRUE, FALSE, 40.8136, -96.7026),
('Carson City', 'carson-city', 'NV', TRUE, FALSE, 39.1638, -119.7674),
('Concord', 'concord', 'NH', TRUE, FALSE, 43.2081, -71.5376),
('Trenton', 'trenton', 'NJ', TRUE, FALSE, 40.2171, -74.7429),
('Santa Fe', 'santa-fe', 'NM', TRUE, TRUE, 35.6870, -105.9378),
('Albany', 'albany', 'NY', TRUE, FALSE, 42.6526, -73.7562),
('Raleigh', 'raleigh', 'NC', TRUE, FALSE, 35.7796, -78.6382),
('Bismarck', 'bismarck', 'ND', TRUE, FALSE, 46.8083, -100.7837),
('Columbus', 'columbus', 'OH', TRUE, FALSE, 39.9612, -82.9988),
('Oklahoma City', 'oklahoma-city', 'OK', TRUE, FALSE, 35.4676, -97.5164),
('Salem', 'salem', 'OR', TRUE, FALSE, 44.9429, -123.0351),
('Harrisburg', 'harrisburg', 'PA', TRUE, FALSE, 40.2732, -76.8867),
('Providence', 'providence', 'RI', TRUE, FALSE, 41.8240, -71.4128),
('Columbia', 'columbia', 'SC', TRUE, FALSE, 34.0007, -81.0348),
('Pierre', 'pierre', 'SD', TRUE, FALSE, 44.3683, -100.3510),
('Nashville', 'nashville', 'TN', TRUE, TRUE, 36.1627, -86.7816),
('Austin', 'austin', 'TX', TRUE, TRUE, 30.2672, -97.7431),
('Salt Lake City', 'salt-lake-city', 'UT', TRUE, TRUE, 40.7608, -111.8910),
('Montpelier', 'montpelier', 'VT', TRUE, FALSE, 44.2601, -72.5754),
('Richmond', 'richmond', 'VA', TRUE, FALSE, 37.5407, -77.4360),
('Olympia', 'olympia', 'WA', TRUE, FALSE, 47.0379, -122.9007),
('Charleston', 'charleston', 'WV', TRUE, FALSE, 38.3498, -81.6326),
('Madison', 'madison', 'WI', TRUE, FALSE, 43.0731, -89.4012),
('Cheyenne', 'cheyenne', 'WY', TRUE, FALSE, 41.1400, -104.8202),

-- Major Tourist Cities (non-capitals)
('Birmingham', 'birmingham', 'AL', FALSE, TRUE, 33.5207, -86.8025),
('Anchorage', 'anchorage', 'AK', FALSE, TRUE, 61.2181, -149.9003),
('Tucson', 'tucson', 'AZ', FALSE, TRUE, 32.2226, -110.9747),
('Scottsdale', 'scottsdale', 'AZ', FALSE, TRUE, 33.4942, -111.9261),
('San Francisco', 'san-francisco', 'CA', FALSE, TRUE, 37.7749, -122.4194),
('Los Angeles', 'los-angeles', 'CA', FALSE, TRUE, 34.0522, -118.2437),
('San Diego', 'san-diego', 'CA', FALSE, TRUE, 32.7157, -117.1611),
('Aspen', 'aspen', 'CO', FALSE, TRUE, 39.1911, -106.8175),
('Boulder', 'boulder', 'CO', FALSE, TRUE, 40.0150, -105.2705),
('Miami', 'miami', 'FL', FALSE, TRUE, 25.7617, -80.1918),
('Orlando', 'orlando', 'FL', FALSE, TRUE, 28.5383, -81.3792),
('Tampa', 'tampa', 'FL', FALSE, TRUE, 27.9506, -82.4572),
('Savannah', 'savannah', 'GA', FALSE, TRUE, 32.0809, -81.0912),
('Chicago', 'chicago', 'IL', FALSE, TRUE, 41.8781, -87.6298),
('New Orleans', 'new-orleans', 'LA', FALSE, TRUE, 29.9511, -90.0715),
('Portland', 'portland', 'ME', FALSE, TRUE, 43.6591, -70.2568),
('Baltimore', 'baltimore', 'MD', FALSE, TRUE, 39.2904, -76.6122),
('Detroit', 'detroit', 'MI', FALSE, TRUE, 42.3314, -83.0458),
('Minneapolis', 'minneapolis', 'MN', FALSE, TRUE, 44.9778, -93.2650),
('Kansas City', 'kansas-city', 'MO', FALSE, TRUE, 39.0997, -94.5786),
('St. Louis', 'st-louis', 'MO', FALSE, TRUE, 38.6270, -90.1994),
('Las Vegas', 'las-vegas', 'NV', FALSE, TRUE, 36.1699, -115.1398),
('Reno', 'reno', 'NV', FALSE, TRUE, 39.5296, -119.8138),
('Atlantic City', 'atlantic-city', 'NJ', FALSE, TRUE, 39.3643, -74.4229),
('Albuquerque', 'albuquerque', 'NM', FALSE, TRUE, 35.0844, -106.6504),
('New York City', 'new-york-city', 'NY', FALSE, TRUE, 40.7128, -74.0060),
('Buffalo', 'buffalo', 'NY', FALSE, TRUE, 42.8864, -78.8784),
('Charlotte', 'charlotte', 'NC', FALSE, TRUE, 35.2271, -80.8431),
('Asheville', 'asheville', 'NC', FALSE, TRUE, 35.5951, -82.5515),
('Cincinnati', 'cincinnati', 'OH', FALSE, TRUE, 39.1031, -84.5120),
('Cleveland', 'cleveland', 'OH', FALSE, TRUE, 41.4993, -81.6944),
('Portland', 'portland-or', 'OR', FALSE, TRUE, 45.5152, -122.6784),
('Philadelphia', 'philadelphia', 'PA', FALSE, TRUE, 39.9526, -75.1652),
('Pittsburgh', 'pittsburgh', 'PA', FALSE, TRUE, 40.4406, -79.9959),
('Charleston', 'charleston-sc', 'SC', FALSE, TRUE, 32.7765, -79.9311),
('Memphis', 'memphis', 'TN', FALSE, TRUE, 35.1495, -90.0490),
('Dallas', 'dallas', 'TX', FALSE, TRUE, 32.7767, -96.7970),
('Houston', 'houston', 'TX', FALSE, TRUE, 29.7604, -95.3698),
('San Antonio', 'san-antonio', 'TX', FALSE, TRUE, 29.4241, -98.4936),
('Virginia Beach', 'virginia-beach', 'VA', FALSE, TRUE, 36.8529, -75.9780),
('Seattle', 'seattle', 'WA', FALSE, TRUE, 47.6062, -122.3321),
('Milwaukee', 'milwaukee', 'WI', FALSE, TRUE, 43.0389, -87.9065),
('Jackson Hole', 'jackson-hole', 'WY', FALSE, TRUE, 43.4799, -110.7624);

-- Update existing San Francisco venues and neighborhoods to use the new city_id
UPDATE venues 
SET city_id = (SELECT id FROM cities WHERE slug = 'san-francisco')
WHERE city_id IS NULL;

UPDATE neighborhoods 
SET city_id = (SELECT id FROM cities WHERE slug = 'san-francisco')
WHERE city = 'San Francisco' OR city_id IS NULL;

-- Create a view for easy querying of venues with city and state info
CREATE VIEW IF NOT EXISTS venues_with_location AS
SELECT 
  v.*,
  c.name as city_name,
  c.slug as city_slug,
  s.name as state_name,
  s.code as state_code,
  s.slug as state_slug
FROM venues v
JOIN cities c ON v.city_id = c.id
JOIN states s ON c.state_code = s.code;

-- Create a view for neighborhoods with city and state info
CREATE VIEW IF NOT EXISTS neighborhoods_with_location AS
SELECT 
  n.*,
  c.name as city_name,
  c.slug as city_slug,
  s.name as state_name,
  s.code as state_code,
  s.slug as state_slug
FROM neighborhoods n
JOIN cities c ON n.city_id = c.id
JOIN states s ON c.state_code = s.code;