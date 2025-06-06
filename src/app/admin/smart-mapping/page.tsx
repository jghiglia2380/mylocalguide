'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function SmartMappingPage() {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const runSmartMapping = async () => {
    setLoading(true);
    setStatus('Creating neighborhoods with smart geospatial mapping...');
    
    try {
      const response = await fetch('/api/create-neighborhoods-smart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ confirm: true })
      });
      
      const data = await response.json();
      setResult(data);
      
      if (data.success) {
        setStatus(`✅ Success! Created ${data.data.neighborhoodsCreated} neighborhoods and mapped ${data.data.venuesMapped} venues`);
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
        
        <h1 className="text-3xl font-bold mb-8">Smart Neighborhood Mapping</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Geospatial Intelligence</h2>
          <p className="mb-4">
            This uses advanced mapping logic to assign venues to neighborhoods based on:
          </p>
          
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded">
              <h3 className="font-semibold text-blue-700">1. Zip Codes</h3>
              <p className="text-sm">94110 → Mission District<br/>94114 → Castro<br/>94123 → Marina</p>
            </div>
            <div className="bg-green-50 p-4 rounded">
              <h3 className="font-semibold text-green-700">2. Street Ranges</h3>
              <p className="text-sm">Mission St 2000-4000<br/>Castro St 200-600<br/>Chestnut St 2000-3500</p>
            </div>
            <div className="bg-purple-50 p-4 rounded">
              <h3 className="font-semibold text-purple-700">3. Keywords</h3>
              <p className="text-sm">"Mission District"<br/>"North Beach"<br/>"Chinatown"</p>
            </div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded mb-4">
            <h3 className="font-semibold text-yellow-700">Sample Address Processing:</h3>
            <div className="text-sm space-y-1">
              <p><strong>"2889 Mission St, San Francisco, CA 94110"</strong> → The Mission (zip code match)</p>
              <p><strong>"552 Green St, San Francisco, CA 94133"</strong> → North Beach (zip code match)</p>
              <p><strong>"2355 Chestnut St, San Francisco, CA 94123"</strong> → Marina District (zip + street range)</p>
            </div>
          </div>
          
          <button
            onClick={runSmartMapping}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded font-semibold disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Run Smart Neighborhood Mapping'}
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
      </div>
    </div>
  );
}