'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function SmartMappingFinalPage() {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const runSmartMapping = async (testMode = false) => {
    setLoading(true);
    setStatus(testMode ? 'Running smart mapping test...' : 'Running comprehensive smart venue mapping...');
    
    try {
      const response = await fetch('/api/smart-venue-mapping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ confirm: true, testMode })
      });
      
      const data = await response.json();
      setResult(data);
      
      if (data.success) {
        setStatus(`✅ ${data.message}`);
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
      <div className="max-w-6xl mx-auto">
        <Link href="/admin/supabase" className="text-blue-500 hover:underline mb-4 inline-block">
          ← Back to Admin
        </Link>
        
        <h1 className="text-4xl font-bold mb-8">🧠 AI-Powered Smart Venue Mapping</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">5-Layer Fallback System</h2>
          <p className="mb-6 text-lg">
            <strong>Guarantee:</strong> 100% of venues will be categorized - no venue left behind!
          </p>
          
          <div className="grid md:grid-cols-5 gap-4 mb-8">
            <div className="bg-green-50 p-4 rounded border-l-4 border-green-500">
              <h3 className="font-bold text-green-700">Layer 1: Zip Codes</h3>
              <p className="text-sm text-green-600">94110 → Mission<br/>94114 → Castro<br/>94123 → Marina</p>
              <div className="text-xs mt-2 bg-green-100 px-2 py-1 rounded">Highest Confidence</div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded border-l-4 border-blue-500">
              <h3 className="font-bold text-blue-700">Layer 2: Street Ranges</h3>
              <p className="text-sm text-blue-600">Mission St 2000-4000<br/>Castro St 200-600<br/>Chestnut St 2000-3500</p>
              <div className="text-xs mt-2 bg-blue-100 px-2 py-1 rounded">High Confidence</div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded border-l-4 border-purple-500">
              <h3 className="font-bold text-purple-700">Layer 3: Landmarks</h3>
              <p className="text-sm text-purple-600">Crissy Field → Presidio<br/>Ferry Building → FiDi<br/>Union Square → Union Sq</p>
              <div className="text-xs mt-2 bg-purple-100 px-2 py-1 rounded">Medium Confidence</div>
            </div>
            
            <div className="bg-orange-50 p-4 rounded border-l-4 border-orange-500">
              <h3 className="font-bold text-orange-700">Layer 4: AI Inference</h3>
              <p className="text-sm text-orange-600">Smart keyword analysis<br/>Context understanding<br/>Pattern recognition</p>
              <div className="text-xs mt-2 bg-orange-100 px-2 py-1 rounded">Medium Confidence</div>
            </div>
            
            <div className="bg-red-50 p-4 rounded border-l-4 border-red-500">
              <h3 className="font-bold text-red-700">Layer 5: Fallback</h3>
              <p className="text-sm text-red-600">Geocoding API<br/>Default to SoMa<br/>Never fails!</p>
              <div className="text-xs mt-2 bg-red-100 px-2 py-1 rounded">Guaranteed Result</div>
            </div>
          </div>
          
          <div className="bg-yellow-50 p-6 rounded-lg mb-6">
            <h3 className="font-semibold text-yellow-800 mb-3">Why This Adds Massive Value:</h3>
            <ul className="list-disc list-inside space-y-2 text-yellow-700">
              <li><strong>Google/Yelp miss 10-15%</strong> of venue neighborhoods</li>
              <li><strong>We achieve 100% categorization</strong> through smart fallbacks</li>
              <li><strong>Better user experience</strong> - every venue findable by neighborhood</li>
              <li><strong>SEO advantage</strong> - complete neighborhood coverage</li>
              <li><strong>Business value</strong> - venues pay more for guaranteed categorization</li>
            </ul>
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={() => runSmartMapping(true)}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded font-semibold disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Test with 10 Venues (FREE)'}
            </button>
            
            <button
              onClick={() => runSmartMapping(false)}
              disabled={loading}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded font-semibold disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Map ALL Venues (100% Guarantee)'}
            </button>
          </div>
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
            <h3 className="text-lg font-semibold mb-4">Results</h3>
            
            {result.data && (
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 p-4 rounded">
                  <h4 className="font-semibold text-green-700">Categorization Success</h4>
                  <p className="text-2xl font-bold text-green-600">
                    {result.data.mappedVenues || 0}/{result.data.totalVenues || 0}
                  </p>
                  <p className="text-sm text-green-600">
                    {Math.round(((result.data.mappedVenues || 0) / (result.data.totalVenues || 1)) * 100)}% categorized
                  </p>
                </div>
                
                <div className="bg-blue-50 p-4 rounded">
                  <h4 className="font-semibold text-blue-700">Confidence Levels</h4>
                  {result.data.confidenceDistribution && (
                    <div className="text-sm">
                      <p>High: {result.data.confidenceDistribution.high}</p>
                      <p>Medium: {result.data.confidenceDistribution.medium}</p>
                      <p>Low: {result.data.confidenceDistribution.low}</p>
                    </div>
                  )}
                </div>
                
                <div className="bg-purple-50 p-4 rounded">
                  <h4 className="font-semibold text-purple-700">Methods Used</h4>
                  {result.data.methodDistribution && (
                    <div className="text-sm">
                      {Object.entries(result.data.methodDistribution).map(([method, count]: [string, any]) => (
                        <p key={method}>{method}: {count}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <details className="mt-4">
              <summary className="cursor-pointer font-semibold text-gray-700">View Raw Results</summary>
              <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm mt-2">
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}