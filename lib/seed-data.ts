import { getDatabase, insertVenue } from '@lib/database';

export const realSFVenues = [
  // Mission District Restaurants
  {
    name: "La Taqueria",
    address: "2889 Mission St, San Francisco, CA 94110",
    neighborhood: "Mission District",
    category: "Restaurants",
    subcategory: "Mexican",
    description: "James Beard Foundation 'classic' American restaurant. Named best burrito-maker in America by FiveThirtyEight. No-frills taqueria serving hulking Mission-style burritos since 1973.",
    phone: "(415) 285-7117",
    website: "http://www.lataqueria.com",
    hours: "11am-9pm daily",
    price_range: 1,
    atmosphere_tags: JSON.stringify(["Casual", "Authentic", "No-frills"]),
    demographic_tags: JSON.stringify(["Students", "Locals", "Tourists"]),
    feature_tags: JSON.stringify(["Counter seating", "Cash preferred", "Quick service"]),
    featured: false,
    active: true
  },
  {
    name: "Foreign Cinema",
    address: "2534 Mission St, San Francisco, CA 94110",
    neighborhood: "Mission District", 
    category: "Restaurants",
    subcategory: "California-Mediterranean",
    description: "SF Chronicle 'Top 100 Restaurant' for 18 consecutive years. California-Mediterranean menu with full oyster bar. Movies screened on outdoor patio. Iconic Mission dining destination.",
    phone: "(415) 648-7600",
    website: "http://www.foreigncinema.com",
    hours: "6pm-10pm Tue-Sun",
    price_range: 3,
    atmosphere_tags: JSON.stringify(["Romantic", "Unique", "Upscale"]),
    demographic_tags: JSON.stringify(["Date night", "Young professionals", "Foodies"]),
    feature_tags: JSON.stringify(["Outdoor seating", "Full bar", "Reservations recommended"]),
    featured: true,
    active: true
  },
  {
    name: "Lazy Bear",
    address: "3416 19th St, San Francisco, CA 94110",
    neighborhood: "Mission District",
    category: "Restaurants", 
    subcategory: "Contemporary American",
    description: "Two Michelin-starred restaurant featuring communal dining experience. Multi-course tasting menu with creative, seasonal dishes. SF culinary institution requiring advance reservations.",
    phone: "(415) 874-9921",
    website: "https://lazybear-sf.com",
    hours: "6pm-10pm Wed-Sat",
    price_range: 4,
    atmosphere_tags: JSON.stringify(["Fine dining", "Communal", "Innovative"]),
    demographic_tags: JSON.stringify(["Foodies", "Special occasion", "Adults"]),
    feature_tags: JSON.stringify(["Prix fixe", "Reservations required", "Wine pairing"]),
    featured: true,
    active: true
  },
  {
    name: "Rintaro",
    address: "82 14th St, San Francisco, CA 94103",
    neighborhood: "Mission District",
    category: "Restaurants",
    subcategory: "Japanese",
    description: "Perfect Japanese izakaya by Sylvan Mishima Brackett. Traditional atmosphere with modern execution. Exceptional sake selection and authentic Japanese small plates in intimate setting.",
    phone: "(415) 589-7022", 
    website: "http://www.rintarosf.com",
    hours: "5:30pm-10pm Wed-Mon",
    price_range: 3,
    atmosphere_tags: JSON.stringify(["Intimate", "Authentic", "Cozy"]),
    demographic_tags: JSON.stringify(["Foodies", "Date night", "Young professionals"]),
    feature_tags: JSON.stringify(["Sake bar", "Reservations recommended", "Omakase available"]),
    featured: false,
    active: true
  },

  // Castro Bars
  {
    name: "Harvey's",
    address: "500 Castro St, San Francisco, CA 94114",
    neighborhood: "Castro",
    category: "Bars & Nightlife",
    subcategory: "Gay Bar",
    description: "Historic Castro neighborhood bar named after Harvey Milk. LGBTQ+ institution with friendly atmosphere, strong drinks, and community feel. Multiple rooms and outdoor patio.",
    phone: "(415) 431-4278",
    website: undefined,
    hours: "2pm-2am daily",
    price_range: 2,
    atmosphere_tags: JSON.stringify(["Historic", "Community", "Friendly"]),
    demographic_tags: JSON.stringify(["LGBTQ+", "Locals", "All ages"]),
    feature_tags: JSON.stringify(["Patio", "Pool table", "Jukebox"]),
    featured: false,
    active: true
  },
  {
    name: "Twin Peaks Tavern",
    address: "401 Castro St, San Francisco, CA 94114", 
    neighborhood: "Castro",
    category: "Bars & Nightlife",
    subcategory: "Gay Bar",
    description: "First gay bar in America with floor-to-ceiling windows. Historic landmark offering neighborhood bar atmosphere since 1972. Known for strong drinks and Castro corner location.",
    phone: "(415) 864-9470",
    website: undefined,
    hours: "12pm-2am daily",
    price_range: 2,
    atmosphere_tags: JSON.stringify(["Historic", "Neighborhood", "Classic"]),
    demographic_tags: JSON.stringify(["LGBTQ+", "Seniors", "Locals"]),
    feature_tags: JSON.stringify(["Full windows", "Corner location", "Historic landmark"]),
    featured: false,
    active: true
  },

  // Marina District Restaurants
  {
    name: "Greens Restaurant",
    address: "2 Marina Blvd, Building A, San Francisco, CA 94123",
    neighborhood: "Marina District",
    category: "Restaurants",
    subcategory: "Vegetarian",
    description: "Waterfront vegetarian fine dining since 1979. Dramatic views of Golden Gate Bridge and Marin Headlands. Pioneer of plant-based cuisine with elegant atmosphere and seasonal menu.",
    phone: "(415) 771-6222",
    website: "https://www.greensrestaurant.com",
    hours: "5:30pm-9pm Tue-Sat, 11am-2pm & 5:30pm-9pm Sun",
    price_range: 4,
    atmosphere_tags: JSON.stringify(["Upscale", "Scenic", "Historic"]),
    demographic_tags: JSON.stringify(["Fine dining", "Special occasion", "Adults"]),
    feature_tags: JSON.stringify(["Waterfront views", "Vegetarian", "Wine list"]),
    featured: true,
    active: true
  },
  {
    name: "A16",
    address: "2355 Chestnut St, San Francisco, CA 94123",
    neighborhood: "Marina District",
    category: "Restaurants", 
    subcategory: "Italian",
    description: "James Beard Award-winning wine list and Michelin Bib Gourmand. Southern Italian cuisine with house-made pasta and Neapolitan pizza. Intimate Marina neighborhood gem.",
    phone: "(415) 771-2216",
    website: "https://www.a16pizza.com",
    hours: "5pm-10pm Wed-Mon",
    price_range: 3,
    atmosphere_tags: JSON.stringify(["Intimate", "Authentic", "Cozy"]),
    demographic_tags: JSON.stringify(["Date night", "Young professionals", "Foodies"]),
    feature_tags: JSON.stringify(["Wine bar", "Wood-fired pizza", "Reservations recommended"]),
    featured: false,
    active: true
  },
  {
    name: "Delarosa",
    address: "2175 Chestnut St, San Francisco, CA 94123",
    neighborhood: "Marina District",
    category: "Restaurants",
    subcategory: "Pizza",
    description: "Roman-style pizza with small plates, craft beer, and Italian wines. Neighborhood favorite since 2010. Casual atmosphere perfect for groups and families.",
    phone: "(415) 673-7100", 
    website: "https://www.delarosasf.com",
    hours: "11:30am-10pm daily",
    price_range: 2,
    atmosphere_tags: JSON.stringify(["Casual", "Lively", "Neighborhood"]),
    demographic_tags: JSON.stringify(["Families", "Young professionals", "Groups"]),
    feature_tags: JSON.stringify(["Roman pizza", "Craft beer", "Group friendly"]),
    featured: false,
    active: true
  },

  // Coffee Shops across neighborhoods
  {
    name: "Blue Bottle Coffee - Ferry Building",
    address: "1 Ferry Building, #7, San Francisco, CA 94111",
    neighborhood: "Financial District",
    category: "Cafes & Coffee",
    subcategory: "Specialty Coffee",
    description: "Flagship location in historic Ferry Building Marketplace. Third-wave coffee pioneer with single-origin beans and meticulous brewing. Tourist destination with local following.",
    phone: "(510) 653-3394",
    website: "https://bluebottlecoffee.com",
    hours: "7am-7pm daily",
    price_range: 3,
    atmosphere_tags: JSON.stringify(["Busy", "Quality-focused", "Modern"]),
    demographic_tags: JSON.stringify(["Tourists", "Coffee enthusiasts", "Workers"]),
    feature_tags: JSON.stringify(["Specialty roasts", "Ferry Building", "To-go focused"]),
    featured: false,
    active: true
  },
  {
    name: "Sightglass Coffee - Mission",
    address: "3014 20th St, San Francisco, CA 94110",
    neighborhood: "Mission District",
    category: "Cafes & Coffee",
    subcategory: "Coffee Roastery",
    description: "Neighborhood coffee bar and roastery. Industrial-chic space with in-house roasting. Popular with locals and laptop workers. High-quality single-origin and blends.",
    phone: "(415) 861-1313",
    website: "https://sightglasscoffee.com",
    hours: "7am-6pm daily",
    price_range: 2,
    atmosphere_tags: JSON.stringify(["Industrial", "Spacious", "Roastery"]),
    demographic_tags: JSON.stringify(["Locals", "Remote workers", "Coffee enthusiasts"]),
    feature_tags: JSON.stringify(["In-house roasting", "WiFi", "Large space"]),
    featured: false,
    active: true
  },
  {
    name: "Philz Coffee - Castro",
    address: "4541 18th St, San Francisco, CA 94114",
    neighborhood: "Castro",
    category: "Cafes & Coffee",
    subcategory: "Specialty Coffee",
    description: "Custom-blended coffee made to order. Neighborhood institution known for personalized service and unique flavor combinations. Community gathering spot with local charm.",
    phone: "(415) 875-9943",
    website: "https://philzcoffee.com",
    hours: "5:30am-8pm daily",
    price_range: 2,
    atmosphere_tags: JSON.stringify(["Community", "Personalized", "Eclectic"]),
    demographic_tags: JSON.stringify(["Locals", "Students", "Neighborhood regulars"]),
    feature_tags: JSON.stringify(["Custom blends", "Personal service", "Community board"]),
    featured: false,
    active: true
  },

  // North Beach venues
  {
    name: "Caffe Trieste", 
    address: "601 Vallejo St, San Francisco, CA 94133",
    neighborhood: "North Beach",
    category: "Cafes & Coffee",
    subcategory: "Espresso Bar",
    description: "First espresso-based coffee shop on West Coast, open since 1956. Historic literary hangout with opera performances on weekends. Classic Italian atmosphere and strong espresso.",
    phone: "(415) 392-6739",
    website: "http://www.caffetrieste.com",
    hours: "6:30am-10pm daily",
    price_range: 2,
    atmosphere_tags: JSON.stringify(["Historic", "Literary", "Authentic"]),
    demographic_tags: JSON.stringify(["Locals", "Writers", "Tourists"]),
    feature_tags: JSON.stringify(["Historic landmark", "Opera performances", "Literary history"]),
    featured: false,
    active: true
  },
  {
    name: "Mario's Bohemian Cigar Store Cafe",
    address: "566 Columbus Ave, San Francisco, CA 94133",
    neighborhood: "North Beach", 
    category: "Restaurants",
    subcategory: "Italian Deli",
    description: "No-frills Italian deli serving massive sandwiches since 1972. Counter seating only, cash preferred. Perfect for quick authentic bite between exploring North Beach. Local institution.",
    phone: "(415) 362-6539",
    website: undefined,
    hours: "10am-6pm Mon-Sat",
    price_range: 1,
    atmosphere_tags: JSON.stringify(["No-frills", "Authentic", "Quick"]),
    demographic_tags: JSON.stringify(["Locals", "Workers", "Tourists"]),
    feature_tags: JSON.stringify(["Counter seating", "Cash only", "Quick service"]),
    featured: false,
    active: true
  },

  // Activities & Entertainment - Live Entertainment
  {
    name: "The Fillmore",
    address: "1805 Geary Blvd, San Francisco, CA 94115",
    neighborhood: "Haight-Ashbury",
    category: "Live Entertainment",
    subcategory: "Music Venue",
    description: "Legendary concert hall where Jimi Hendrix, Janis Joplin, and the Grateful Dead performed. Iconic venue with psychedelic posters and world-class sound system. Must-see for music lovers.",
    phone: "(415) 346-6000",
    website: "https://www.thefillmore.com",
    hours: "Show nights only",
    price_range: 3,
    atmosphere_tags: JSON.stringify(["Legendary", "Historic", "Electric"]),
    demographic_tags: JSON.stringify(["Music lovers", "Young adults", "Tourists"]),
    feature_tags: JSON.stringify(["Historic venue", "General admission", "Poster giveaways"]),
    featured: false,
    active: true
  },
  {
    name: "Cobb's Comedy Club",
    address: "915 Columbus Ave, San Francisco, CA 94133",
    neighborhood: "North Beach",
    category: "Live Entertainment", 
    subcategory: "Comedy Club",
    description: "Premier comedy club featuring national headliners and rising stars. Intimate setting with full bar and dinner menu. Robin Williams, Dave Chappelle regular performers here.",
    phone: "(415) 928-4320",
    website: "https://www.cobbscomedy.com",
    hours: "Show nights 7pm & 9:30pm",
    price_range: 3,
    atmosphere_tags: JSON.stringify(["Intimate", "Professional", "Lively"]),
    demographic_tags: JSON.stringify(["Date night", "Young professionals", "Comedy fans"]),
    feature_tags: JSON.stringify(["Two-drink minimum", "Dinner shows", "National acts"]),
    featured: false,
    active: true
  },

  // Arts & Culture
  {
    name: "San Francisco Museum of Modern Art",
    address: "151 3rd St, San Francisco, CA 94103",
    neighborhood: "SoMa",
    category: "Arts & Culture",
    subcategory: "Museum",
    description: "World-class modern and contemporary art museum. Seven floors of galleries featuring works by Picasso, Warhol, and Jackson Pollock. Architectural marvel in downtown SF.",
    phone: "(415) 357-4000",
    website: "https://www.sfmoma.org",
    hours: "10am-5pm Fri-Tue, 10am-9pm Thu",
    price_range: 3,
    atmosphere_tags: JSON.stringify(["Inspiring", "Modern", "Spacious"]),
    demographic_tags: JSON.stringify(["Art lovers", "Tourists", "Families"]),
    feature_tags: JSON.stringify(["World-class collection", "Museum store", "Audio guides"]),
    featured: false,
    active: true
  },
  {
    name: "City Lights Bookstore",
    address: "261 Columbus Ave, San Francisco, CA 94133",
    neighborhood: "North Beach",
    category: "Arts & Culture",
    subcategory: "Bookstore",
    description: "Historic independent bookstore and Beat Generation landmark. Three floors of books, poetry readings, and literary history. Founded by poet Lawrence Ferlinghetti in 1953.",
    phone: "(415) 362-8193",
    website: "https://citylights.com",
    hours: "10am-midnight daily",
    price_range: 2,
    atmosphere_tags: JSON.stringify(["Historic", "Literary", "Bohemian"]),
    demographic_tags: JSON.stringify(["Writers", "Students", "Book lovers"]),
    feature_tags: JSON.stringify(["Three floors", "Poetry section", "Late hours"]),
    featured: false,
    active: true
  },

  // Outdoor Activities
  {
    name: "Dolores Park",
    address: "Dolores St & 19th St, San Francisco, CA 94114",
    neighborhood: "Mission District",
    category: "Outdoor Activities",
    subcategory: "Park",
    description: "Popular hilltop park with stunning city views and vibrant weekend scene. Perfect for picnics, people-watching, and sunny day lounging. Food trucks and local vendors.",
    phone: undefined,
    website: "https://sfrecpark.org",
    hours: "5am-10pm daily",
    price_range: 1,
    atmosphere_tags: JSON.stringify(["Sunny", "Social", "Scenic"]),
    demographic_tags: JSON.stringify(["Young professionals", "Families", "Dog owners"]),
    feature_tags: JSON.stringify(["City views", "Dog park", "Food trucks"]),
    featured: false,
    active: true
  },
  {
    name: "Crissy Field",
    address: "1199 E Beach, San Francisco, CA 94129",
    neighborhood: "Marina District",
    category: "Outdoor Activities",
    subcategory: "Beach/Waterfront",
    description: "Waterfront park with Golden Gate Bridge views. Popular for jogging, kite flying, and beach walks. Former military airfield turned into recreational paradise.",
    phone: "(415) 561-4700",
    website: "https://www.nps.gov/goga",
    hours: "24 hours",
    price_range: 1,
    atmosphere_tags: JSON.stringify(["Scenic", "Active", "Windy"]),
    demographic_tags: JSON.stringify(["Joggers", "Families", "Dog owners"]),
    feature_tags: JSON.stringify(["Golden Gate views", "Beach access", "Kite flying"]),
    featured: false,
    active: true
  },

  // Work Spaces
  {
    name: "The Commons",
    address: "512 2nd St, San Francisco, CA 94107",
    neighborhood: "SoMa",
    category: "Work Spaces",
    subcategory: "Coworking",
    description: "Modern coworking space with high-speed internet, conference rooms, and networking events. Popular with tech startups and freelancers. Industrial-chic design.",
    phone: "(415) 814-0180",
    website: "https://thecommons.com",
    hours: "8am-8pm Mon-Fri",
    price_range: 3,
    atmosphere_tags: JSON.stringify(["Modern", "Professional", "Collaborative"]),
    demographic_tags: JSON.stringify(["Entrepreneurs", "Remote workers", "Startups"]),
    feature_tags: JSON.stringify(["High-speed WiFi", "Conference rooms", "Networking events"]),
    featured: false,
    active: true
  },
  {
    name: "Ritual Coffee Roasters - Hayes Valley",
    address: "432B Octavia St, San Francisco, CA 94102",
    neighborhood: "Haight-Ashbury",
    category: "Work Spaces",
    subcategory: "Coffee Shop Workspace",
    description: "Laptop-friendly coffee shop with strong WiFi and ample seating. Local roaster with excellent single-origin coffee. Quiet atmosphere perfect for remote work.",
    phone: "(415) 641-1011",
    website: "https://ritualroasters.com",
    hours: "6am-7pm daily",
    price_range: 2,
    atmosphere_tags: JSON.stringify(["Focused", "Quiet", "Quality coffee"]),
    demographic_tags: JSON.stringify(["Remote workers", "Students", "Freelancers"]),
    feature_tags: JSON.stringify(["Strong WiFi", "Laptop friendly", "Power outlets"]),
    featured: false,
    active: true
  },

  // Personal Services
  {
    name: "Fellow Barber",
    address: "2195 Fillmore St, San Francisco, CA 94115",
    neighborhood: "Haight-Ashbury",
    category: "Personal Services",
    subcategory: "Barber Shop",
    description: "Modern barbershop with classic service. Traditional hot towel shaves, precision cuts, and grooming products. Appointment recommended but walk-ins welcome.",
    phone: "(415) 872-1200",
    website: "https://fellowbarber.com",
    hours: "9am-8pm Tue-Sat, 10am-6pm Sun",
    price_range: 3,
    atmosphere_tags: JSON.stringify(["Classic", "Professional", "Relaxing"]),
    demographic_tags: JSON.stringify(["Working professionals", "Men", "Grooming focused"]),
    feature_tags: JSON.stringify(["Hot towel shaves", "Appointments", "Grooming products"]),
    featured: false,
    active: true
  },
  {
    name: "Kabuki Springs & Spa",
    address: "1750 Geary Blvd, San Francisco, CA 94115",
    neighborhood: "Haight-Ashbury",
    category: "Personal Services",
    subcategory: "Spa",
    description: "Traditional Japanese-style spa with hot and cold baths, sauna, and massage services. Clothing-optional communal baths with separate days for men and women.",
    phone: "(415) 922-6000",
    website: "https://kabukisprings.com",
    hours: "10am-9:45pm daily",
    price_range: 3,
    atmosphere_tags: JSON.stringify(["Relaxing", "Traditional", "Zen"]),
    demographic_tags: JSON.stringify(["Adults", "Wellness focused", "Locals"]),
    feature_tags: JSON.stringify(["Traditional baths", "Massage services", "Gender-specific days"]),
    featured: false,
    active: true
  },

  // Shopping & Retail - Thrift & Vintage
  {
    name: "Crossroads Trading",
    address: "1901 Fillmore St, San Francisco, CA 94115",
    neighborhood: "Haight-Ashbury",
    category: "Thrift & Vintage",
    subcategory: "Consignment",
    description: "Curated consignment shop with designer and contemporary brands. Buy, sell, trade model. High-quality secondhand clothing at reasonable prices.",
    phone: "(415) 775-8885",
    website: "https://crossroadstrading.com",
    hours: "11am-8pm Mon-Sat, 11am-7pm Sun",
    price_range: 2,
    atmosphere_tags: JSON.stringify(["Curated", "Trendy", "Organized"]),
    demographic_tags: JSON.stringify(["Young adults", "Fashion conscious", "Budget shoppers"]),
    feature_tags: JSON.stringify(["Buy/sell/trade", "Designer brands", "Quality curation"]),
    featured: false,
    active: true
  },
  {
    name: "Wasteland",
    address: "1660 Haight St, San Francisco, CA 94117",
    neighborhood: "Haight-Ashbury",
    category: "Thrift & Vintage",
    subcategory: "Vintage Clothing",
    description: "Iconic vintage clothing store on Haight Street. Huge selection of authentic vintage pieces from 1960s-1990s. Rock star fashion and unique finds.",
    phone: "(415) 863-3150",
    website: "https://wastelandvintage.com",
    hours: "11am-8pm Mon-Thu, 11am-9pm Fri-Sat, 11am-7pm Sun",
    price_range: 2,
    atmosphere_tags: JSON.stringify(["Eclectic", "Authentic", "Rock'n'roll"]),
    demographic_tags: JSON.stringify(["Fashion lovers", "Vintage enthusiasts", "Tourists"]),
    feature_tags: JSON.stringify(["Authentic vintage", "Large selection", "Haight Street icon"]),
    featured: false,
    active: true
  },

  // Fashion
  {
    name: "Azalea Boutique",
    address: "411 Hayes St, San Francisco, CA 94102",
    neighborhood: "Haight-Ashbury",
    category: "Fashion",
    subcategory: "Boutique",
    description: "Local designer boutique featuring emerging SF and West Coast designers. Unique pieces, sustainable fashion, and locally-made accessories.",
    phone: "(415) 861-9888",
    website: "https://azaleaboutique.com",
    hours: "11am-7pm Mon-Sat, 12pm-6pm Sun",
    price_range: 3,
    atmosphere_tags: JSON.stringify(["Local", "Sustainable", "Unique"]),
    demographic_tags: JSON.stringify(["Fashion forward", "Local supporters", "Young professionals"]),
    feature_tags: JSON.stringify(["Local designers", "Sustainable fashion", "Unique pieces"]),
    featured: false,
    active: true
  },
  {
    name: "Union Made",
    address: "493 Sanchez St, San Francisco, CA 94114",
    neighborhood: "Castro",
    category: "Fashion",
    subcategory: "Men's Clothing",
    description: "Curated men's clothing and accessories from heritage American brands. High-quality denim, boots, leather goods, and classic menswear.",
    phone: "(415) 861-3373",
    website: "https://unionmadegoods.com",
    hours: "11am-7pm Mon-Sat, 12pm-6pm Sun",
    price_range: 4,
    atmosphere_tags: JSON.stringify(["Heritage", "Quality", "Classic"]),
    demographic_tags: JSON.stringify(["Men", "Quality focused", "Style conscious"]),
    feature_tags: JSON.stringify(["Heritage brands", "Quality materials", "Classic style"]),
    featured: false,
    active: true
  },

  // Books & Media
  {
    name: "Green Apple Books",
    address: "506 Clement St, San Francisco, CA 94118",
    neighborhood: "Chinatown",
    category: "Books & Media",
    subcategory: "Independent Bookstore",
    description: "Beloved independent bookstore with new and used books across three floors. Extensive selection, knowledgeable staff, and late hours. SF institution since 1967.",
    phone: "(415) 387-2272",
    website: "https://greenapplebooks.com",
    hours: "10am-10:30pm Mon-Sat, 10am-10pm Sun",
    price_range: 2,
    atmosphere_tags: JSON.stringify(["Cozy", "Literary", "Browsing-friendly"]),
    demographic_tags: JSON.stringify(["Book lovers", "Students", "Locals"]),
    feature_tags: JSON.stringify(["Three floors", "Used books", "Late hours"]),
    featured: false,
    active: true
  },
  {
    name: "Amoeba Music",
    address: "1855 Haight St, San Francisco, CA 94117",
    neighborhood: "Haight-Ashbury",
    category: "Books & Media",
    subcategory: "Record Store",
    description: "Legendary independent record store with massive selection of vinyl, CDs, and memorabilia. Buy, sell, trade music. Essential Haight Street destination.",
    phone: "(415) 831-1200",
    website: "https://amoeba.com",
    hours: "11am-8pm Mon-Sat, 11am-7pm Sun",
    price_range: 2,
    atmosphere_tags: JSON.stringify(["Legendary", "Music-focused", "Browsing paradise"]),
    demographic_tags: JSON.stringify(["Music lovers", "Vinyl collectors", "All ages"]),
    feature_tags: JSON.stringify(["Vinyl paradise", "Buy/sell/trade", "Listening stations"]),
    featured: false,
    active: true
  },

  // Specialty Food
  {
    name: "Rainbow Grocery",
    address: "1745 Folsom St, San Francisco, CA 94103",
    neighborhood: "Mission District",
    category: "Specialty Food",
    subcategory: "Cooperative Grocery",
    description: "Worker-owned cooperative grocery store with extensive organic, local, and bulk foods. Vegetarian/vegan friendly with amazing cheese and wine selection.",
    phone: "(415) 863-0620",
    website: "https://rainbow.coop",
    hours: "9am-9pm daily",
    price_range: 2,
    atmosphere_tags: JSON.stringify(["Community-focused", "Organic", "Alternative"]),
    demographic_tags: JSON.stringify(["Health conscious", "Vegetarians", "Local supporters"]),
    feature_tags: JSON.stringify(["Worker cooperative", "Bulk bins", "Local products"]),
    featured: false,
    active: true
  },
  {
    name: "Molinari Delicatessen",
    address: "373 Columbus Ave, San Francisco, CA 94133",
    neighborhood: "North Beach",
    category: "Specialty Food",
    subcategory: "Italian Deli",
    description: "Family-owned Italian deli since 1896. House-made salami, imported cheeses, and authentic Italian groceries. North Beach institution with incredible sandwiches.",
    phone: "(415) 421-2337",
    website: "https://molinaridelicatessen.com",
    hours: "8am-5:30pm Mon-Sat",
    price_range: 3,
    atmosphere_tags: JSON.stringify(["Authentic", "Family-owned", "Traditional"]),
    demographic_tags: JSON.stringify(["Foodies", "Locals", "Italian food lovers"]),
    feature_tags: JSON.stringify(["House-made meats", "Imported goods", "Historic"]),
    featured: false,
    active: true
  },

  // Chinatown venues
  {
    name: "R&G Lounge",
    address: "631 Kearny St, San Francisco, CA 94108",
    neighborhood: "Chinatown",
    category: "Restaurants",
    subcategory: "Chinese",
    description: "Upscale Cantonese restaurant famous for salt and pepper crab. Two-floor establishment with banquet rooms upstairs. Chinatown fine dining institution.",
    phone: "(415) 982-7877",
    website: undefined,
    hours: "11:30am-9:30pm daily",
    price_range: 3,
    atmosphere_tags: JSON.stringify(["Upscale", "Authentic", "Banquet-style"]),
    demographic_tags: JSON.stringify(["Families", "Special occasions", "Foodies"]),
    feature_tags: JSON.stringify(["Famous crab", "Banquet rooms", "Cantonese cuisine"]),
    featured: false,
    active: true
  },
  {
    name: "Red Blossom Tea Company",
    address: "831 Grant Ave, San Francisco, CA 94108",
    neighborhood: "Chinatown",
    category: "Cafes & Coffee",
    subcategory: "Tea House",
    description: "Traditional Chinese tea shop with over 300 varieties. Family-owned since 1965, offering tea tastings and education. Authentic tea ceremony experience.",
    phone: "(415) 395-0868",
    website: "https://redblossomtea.com",
    hours: "10am-6pm daily",
    price_range: 2,
    atmosphere_tags: JSON.stringify(["Traditional", "Educational", "Calm"]),
    demographic_tags: JSON.stringify(["Tea enthusiasts", "Tourists", "Wellness focused"]),
    feature_tags: JSON.stringify(["300+ tea varieties", "Tea education", "Family-owned"]),
    featured: false,
    active: true
  },

  // Lower Haight venues  
  {
    name: "Bar Jabroni",
    address: "390 Haight St, San Francisco, CA 94102",
    neighborhood: "Lower Haight",
    category: "Bars & Nightlife",
    subcategory: "Wine Bar",
    description: "Natural wine bar with Italian small plates. Cozy neighborhood spot with knowledgeable staff and rotating selection of natural and orange wines.",
    phone: "(415) 829-2825",
    website: undefined,
    hours: "5pm-12am Wed-Mon",
    price_range: 3,
    atmosphere_tags: JSON.stringify(["Cozy", "Wine-focused", "Intimate"]),
    demographic_tags: JSON.stringify(["Wine lovers", "Foodies", "Date night"]),
    feature_tags: JSON.stringify(["Natural wines", "Italian plates", "Expert staff"]),
    featured: false,
    active: true
  },
  {
    name: "Toronado",
    address: "547 Haight St, San Francisco, CA 94117",
    neighborhood: "Lower Haight",
    category: "Bars & Nightlife",
    subcategory: "Beer Bar",
    description: "Legendary craft beer bar with 50+ taps and no-nonsense atmosphere. Cash only, loud music, incredible beer selection. SF beer culture institution.",
    phone: "(415) 863-2276",
    website: undefined,
    hours: "11:30am-2am daily",
    price_range: 2,
    atmosphere_tags: JSON.stringify(["No-nonsense", "Loud", "Authentic"]),
    demographic_tags: JSON.stringify(["Beer enthusiasts", "Locals", "Young adults"]),
    feature_tags: JSON.stringify(["50+ taps", "Cash only", "Legendary status"]),
    featured: false,
    active: true
  },
  {
    name: "The Mill",
    address: "736 Divisadero St, San Francisco, CA 94117",
    neighborhood: "Lower Haight",
    category: "Cafes & Coffee",
    subcategory: "Coffee & Toast",
    description: "Artisanal coffee and toast bar featuring Four Barrel coffee and house-made breads. Minimalist design, long communal tables. Famous for $4 toast.",
    phone: "(415) 345-1953",
    website: "https://themillsf.com",
    hours: "7am-7pm daily",
    price_range: 3,
    atmosphere_tags: JSON.stringify(["Minimalist", "Artisanal", "Trendy"]),
    demographic_tags: JSON.stringify(["Coffee enthusiasts", "Brunch crowd", "Design lovers"]),
    feature_tags: JSON.stringify(["Artisanal toast", "Four Barrel coffee", "Communal tables"]),
    featured: false,
    active: true
  },

  // Nob Hill venues
  {
    name: "Tonga Room & Hurricane Bar",
    address: "950 Mason St, San Francisco, CA 94108",
    neighborhood: "Nob Hill",
    category: "Bars & Nightlife",
    subcategory: "Tiki Bar",
    description: "Legendary tiki bar inside the Fairmont Hotel with indoor lagoon and tropical storms every 30 minutes. Kitsch paradise with strong tropical drinks since 1945.",
    phone: "(415) 772-5278",
    website: "https://tongaroom.com",
    hours: "5pm-12:30am Wed-Sun",
    price_range: 4,
    atmosphere_tags: JSON.stringify(["Kitschy", "Legendary", "Tropical"]),
    demographic_tags: JSON.stringify(["Tourists", "Special occasions", "Tiki lovers"]),
    feature_tags: JSON.stringify(["Indoor lagoon", "Tropical storms", "Historic hotel"]),
    featured: false,
    active: true
  },
  {
    name: "Acquerello",
    address: "1722 Sacramento St, San Francisco, CA 94109",
    neighborhood: "Nob Hill",
    category: "Restaurants",
    subcategory: "Italian Fine Dining",
    description: "Michelin two-star Italian restaurant in former chapel. Sophisticated Northern Italian cuisine with extensive wine list. Jacket required, reservations essential.",
    phone: "(415) 567-5432",
    website: "https://acquerello.com",
    hours: "5:30pm-9pm Tue-Sat",
    price_range: 4,
    atmosphere_tags: JSON.stringify(["Elegant", "Romantic", "Sophisticated"]),
    demographic_tags: JSON.stringify(["Special occasions", "Fine dining", "Adults"]),
    feature_tags: JSON.stringify(["Michelin starred", "Former chapel", "Dress code"]),
    featured: true,
    active: true
  }
];

export function seedDatabase() {
  console.log('Seeding database with real SF venues...');
  
  const db = getDatabase();
  
  // In development, we allow reseeding. In production, check for existing venues
  if (process.env.NODE_ENV === 'production') {
    const existingVenues = db.prepare('SELECT COUNT(*) as count FROM venues').get() as { count: number };
    
    if (existingVenues.count > 0) {
      console.log(`Database already has ${existingVenues.count} venues. Skipping seed.`);
      return existingVenues.count;
    }
  }
  
  const successCount = realSFVenues.reduce((count, venue) => {
    try {
      insertVenue(venue);
      return count + 1;
    } catch (error) {
      console.error(`Failed to insert venue ${venue.name}:`, error);
      return count;
    }
  }, 0);

  console.log(`Successfully seeded ${successCount} venues out of ${realSFVenues.length} total venues.`);
  return successCount;
}