'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function AddNeighborhoodsPage() {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const addMissingNeighborhoods = async () => {
    setLoading(true);
    setStatus('Adding missing neighborhoods and mapping unmapped venues...');
    
    try {
      const response = await fetch('/api/add-missing-neighborhoods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ confirm: true })
      });
      
      const data = await response.json();
      setResult(data);
      
      if (data.success) {
        setStatus(`✅ Success! Added ${data.data.neighborhoodsAdded} neighborhoods and mapped ${data.data.venuesMapped} venues`);
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
        
        <h1 className="text-3xl font-bold mb-8">Add Missing Neighborhoods</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">7 Unmapped Venues Need These Neighborhoods:</h2>
          
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div>
              <h3 className="font-semibold mb-2">Missing Neighborhoods:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li><strong>Hayes Valley</strong> (94102) - Ritual Coffee, Azalea Boutique</li>
                <li><strong>Richmond District</strong> (94118) - Green Apple Books</li>
                <li><strong>Presidio</strong> (94129) - Crissy Field</li>
                <li><strong>Tenderloin</strong> (94102) - Old Siam Thai</li>
                <li><strong>Union Square</strong> (94102) - Kin Khao</li>
                <li><strong>West Portal</strong> (94127) - Khao Tiew</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Current Status:</h3>
              <div className="bg-yellow-50 p-3 rounded text-sm">
                <p><strong>96 venues mapped</strong> ✓</p>
                <p><strong>7 venues unmapped</strong> ⚠️</p>
                <p><strong>10 neighborhoods</strong> exist</p>
                <p><strong>6 neighborhoods</strong> missing</p>
              </div>
            </div>
          </div>
          
          <button
            onClick={addMissingNeighborhoods}
            disabled={loading}
            className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded font-semibold disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add Missing Neighborhoods & Map Venues'}
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