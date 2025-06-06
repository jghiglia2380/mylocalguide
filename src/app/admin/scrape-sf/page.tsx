'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ScrapeSFPage() {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [mode, setMode] = useState<'test' | 'full'>('test');

  const runScraping = async () => {
    setLoading(true);
    setStatus(mode === 'test' ? 'Running FREE test (50 venues)...' : 'Running comprehensive SF scraping...');
    
    try {
      const response = await fetch('/api/automation/scrape-sf-comprehensive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          confirm: mode === 'full',
          testMode: mode === 'test'
        })
      });
      
      const data = await response.json();
      setResult(data);
      
      if (data.success) {
        setStatus(`✅ Success! Added ${data.data.venuesAdded} venues`);
      } else if (data.warning) {
        setStatus('⚠️ Please confirm to proceed');
      } else {
        setStatus('❌ Error occurred');
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
        <Link href="/admin/supabase" className="text-blue-500 hover:underline mb-4 inline-block">
          ← Back to Admin
        </Link>
        
        <h1 className="text-3xl font-bold mb-8">San Francisco Comprehensive Venue Scraping</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Scraping Configuration</h2>
          
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Select Mode:</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="test"
                  checked={mode === 'test'}
                  onChange={(e) => setMode('test')}
                  className="mr-2"
                />
                <span>
                  <strong>Test Mode (FREE)</strong> - 50 venues across categories
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="full"
                  checked={mode === 'full'}
                  onChange={(e) => setMode('full')}
                  className="mr-2"
                />
                <span>
                  <strong>Full Mode ($100-200)</strong> - 1,500-2,500 venues comprehensive coverage
                </span>
              </label>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded mb-4">
            <h3 className="font-semibold mb-2">What This Will Scrape:</h3>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>Restaurants (Mexican, Italian, Chinese, Japanese, Thai, Vietnamese)</li>
              <li>Bars & Nightlife (Cocktail bars, Wine bars, Dive bars)</li>
              <li>Coffee Shops & Cafes</li>
              <li>Tourist Attractions & Museums</li>
              <li>Parks & Outdoor Activities</li>
              <li>Shopping & Boutiques</li>
            </ul>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded mb-4">
            <h3 className="font-semibold mb-2">Coverage Areas:</h3>
            <p className="text-sm">
              Mission, Castro, Marina, North Beach, Chinatown, SoMa, Haight-Ashbury, 
              Financial District, Pacific Heights, Nob Hill
            </p>
          </div>
          
          {mode === 'full' && (
            <div className="bg-red-50 p-4 rounded mb-4">
              <h3 className="font-semibold text-red-700 mb-2">Cost Estimate:</h3>
              <ul className="text-sm space-y-1">
                <li>• Google Places API: ~1,000-2,000 calls</li>
                <li>• Estimated cost: $17-34 (uses your $200 free monthly credit)</li>
                <li>• Plus FREE Yelp data enrichment</li>
                <li>• <strong>Total venues: 1,500-2,500</strong></li>
              </ul>
            </div>
          )}
          
          <button
            onClick={runScraping}
            disabled={loading}
            className={`${
              mode === 'test' 
                ? 'bg-green-500 hover:bg-green-600' 
                : 'bg-red-500 hover:bg-red-600'
            } text-white px-6 py-3 rounded font-semibold disabled:opacity-50`}
          >
            {loading ? 'Running...' : `Run ${mode === 'test' ? 'FREE Test' : 'Full Scraping ($100-200)'}`}
          </button>
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
        
        <div className="mt-8 text-sm text-gray-600">
          <h3 className="font-semibold mb-2">Next Steps After Scraping:</h3>
          <ol className="list-decimal list-inside space-y-1">
            <li>Check venue data at <a href="/" className="text-blue-500 hover:underline">mylocalguide.com</a></li>
            <li>Monitor SEO rankings over next 30-60 days</li>
            <li>Add business listing features for monetization</li>
            <li>Track organic traffic growth</li>
          </ol>
        </div>
      </div>
    </div>
  );
}