/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://mylocalguide.co',
  generateRobotsTxt: true,
  sitemapSize: 7000,
  changefreq: 'weekly',
  priority: 0.7,
  exclude: ['/api/*'],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
      },
      {
        userAgent: '*',
        disallow: '/api/',
      },
    ],
    additionalSitemaps: [
      'https://mylocalguide.co/sitemap.xml',
    ],
  },
  additionalPaths: async (config) => {
    const categories = [
      'restaurants', 'bars-nightlife', 'cafes-coffee', 'specialty-food',
      'thrift-vintage', 'fashion', 'books-media', 'live-entertainment',
      'arts-culture', 'outdoor-activities', 'work-spaces', 'personal-services'
    ];
    
    const neighborhoods = [
      'mission-district', 'castro', 'marina-district', 'north-beach', 'soma',
      'haight-ashbury', 'lower-haight', 'chinatown', 'financial-district', 'nob-hill'
    ];

    const paths = [];
    
    // Add category pages
    categories.forEach(category => {
      paths.push({
        loc: `/category/${category}`,
        changefreq: 'weekly',
        priority: 0.8,
        lastmod: new Date().toISOString(),
      });
    });
    
    // Add neighborhood pages
    neighborhoods.forEach(neighborhood => {
      paths.push({
        loc: `/neighborhood/${neighborhood}`,
        changefreq: 'weekly', 
        priority: 0.8,
        lastmod: new Date().toISOString(),
      });
    });

    return paths;
  },
};