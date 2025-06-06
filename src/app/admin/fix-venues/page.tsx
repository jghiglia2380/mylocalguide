'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function FixVenuesPage() {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const fixNeighborhoods = async () => {
    setLoading(true);
    setStatus('Assigning neighborhoods to all venues...');
    
    try {
      const response = await fetch('/api/fix-neighborhoods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ confirm: true })
      });
      
      const data = await response.json();
      setResult(data);
      
      if (data.success) {
        setStatus(`✅ Success! Assigned ${data.data.venuesAssigned} venues to neighborhoods`);
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
        
        <h1 className="text-3xl font-bold mb-8">Fix Venue Neighborhoods</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Problem</h2>
          <p className="mb-4">
            All 103 venues currently have no neighborhood assignments, so they don't show up on the website properly.
          </p>
          
          <h2 className="text-xl font-semibold mb-4">Solution</h2>
          <p className="mb-4">
            This will analyze each venue's address and assign it to the correct SF neighborhood:
          </p>
          <ul className="list-disc list-inside mb-6 space-y-1">
            <li>Mission District (Mission St, Valencia St, 94110)</li>
            <li>Castro (Castro St, 94114)</li>
            <li>Marina District (Chestnut St, Union St, 94123)</li>
            <li>North Beach (Columbus Ave, 94133)</li>
            <li>Chinatown (Grant Ave, 94108)</li>
            <li>And 5 more neighborhoods...</li>
          </ul>
          
          <button
            onClick={fixNeighborhoods}
            disabled={loading}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded font-semibold disabled:opacity-50"
          >
            {loading ? 'Fixing...' : 'Fix All Venue Neighborhoods'}
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