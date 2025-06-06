'use client';

import { useState } from 'react';

export default function SupabaseMigrationPage() {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const runMigration = async () => {
    setLoading(true);
    setStatus('Running migration...');
    
    try {
      const response = await fetch('/api/supabase-migrate', {
        method: 'POST'
      });
      
      const data = await response.json();
      setResult(data);
      
      if (data.success) {
        setStatus('✅ Migration completed successfully!');
      } else {
        setStatus('❌ Migration failed. See details below.');
      }
    } catch (error: any) {
      setStatus('❌ Error: ' + error.message);
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const runScraping = async () => {
    setLoading(true);
    setStatus('Starting LIMITED venue scraping (FREE test)...');
    
    try {
      const response = await fetch('/api/automation/scrape-limited', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          testMode: true
        })
      });
      
      const data = await response.json();
      setResult(data);
      
      if (data.success) {
        setStatus('✅ Scraping completed successfully!');
      } else {
        setStatus('⚠️ Scraping completed with some errors.');
      }
    } catch (error: any) {
      setStatus('❌ Error: ' + error.message);
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Supabase Migration & Data Loading</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Step 1: Database Setup</h2>
          <p className="text-gray-600 mb-4">
            First, go to your Supabase SQL Editor and run the schema from <code>/lib/supabase-schema.sql</code>
          </p>
          <a 
            href="https://jnqxpuvksqfpkcxinxbx.supabase.co/project/jnqxpuvksqfpkcxinxbx/sql/new"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Open Supabase SQL Editor →
          </a>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Step 2: Migrate Seed Data</h2>
          <p className="text-gray-600 mb-4">
            Import the initial 39 venues from seed data into Supabase.
          </p>
          <button
            onClick={runMigration}
            disabled={loading}
            className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? 'Running...' : 'Run Migration'}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Step 3: Load Comprehensive Data</h2>
          <p className="text-gray-600 mb-4">
            Scrape thousands of venues from Google Places, Yelp, and other sources.
          </p>
          <button
            onClick={runScraping}
            disabled={loading}
            className="bg-purple-500 text-white px-6 py-2 rounded hover:bg-purple-600 disabled:opacity-50"
          >
            {loading ? 'Scraping...' : 'Run Comprehensive Scraping'}
          </button>
          <p className="text-sm text-gray-500 mt-2">
            This will use your configured Google Places and Yelp API keys.
          </p>
        </div>

        {status && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold mb-2">Status</h3>
            <p className={status.includes('✅') ? 'text-green-600' : status.includes('❌') ? 'text-red-600' : 'text-blue-600'}>
              {status}
            </p>
          </div>
        )}

        {result && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-2">Result</h3>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <div className="mt-8 text-sm text-gray-500">
          <p>Current configuration:</p>
          <ul className="list-disc list-inside mt-2">
            <li>Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ Configured' : '✗ Missing'}</li>
            <li>Google Places API: {process.env.GOOGLE_PLACES_API_KEY ? '✓ Configured' : '✗ Missing'}</li>
            <li>Yelp API: {process.env.YELP_API_KEY ? '✓ Configured' : '✗ Missing'}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}