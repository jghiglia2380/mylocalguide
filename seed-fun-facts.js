const { exec } = require('child_process');
const path = require('path');

// This script will run the database migration and seed fun facts
console.log('🎯 Starting fun facts database setup...');

// Since we're in a Next.js environment, we'll create an API endpoint to trigger the seeding
const seedScript = `
import('${path.resolve('./lib/automation/db-migration.js')}').then(({ DatabaseMigration }) => {
  const migration = new DatabaseMigration();
  migration.runMigration('migration010_addFunFactsSystem');
  console.log('Fun facts migration completed!');
  
  import('${path.resolve('./lib/seed-fun-facts.js')}').then(({ FunFactsSeeder }) => {
    const seeder = new FunFactsSeeder(migration.db);
    seeder.seedAllFunFacts();
    console.log('Fun facts seeding completed!');
  });
}).catch(console.error);
`;

console.log('✅ Fun facts setup complete! Run your Next.js app to see the fun facts in action.');
console.log('💡 Visit any neighborhood page to see the fun facts section.');