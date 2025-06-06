'use client';

import { useState } from 'react';

export default function BudgetScrapingPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [budget, setBudget] = useState(10);

  const runBudgetScraping = async () => {
    setIsRunning(true);
    try {
      const response = await fetch('/api/budget-scraping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxBudget: budget })
      });
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Scraping failed:', error);
    }
    setIsRunning(false);
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Budget Venue Scraping</h1>
      
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-2">Strategy:</h2>
        <ul className="list-disc list-inside text-sm">
          <li>FREE Yelp API (5,000 calls/day) for comprehensive venue discovery</li>
          <li>Minimal Google Places API only for critical gaps (${budget} budget)</li>
          <li>Smart neighborhood mapping for all venues</li>
          <li>Target: 5,000+ venues for San Francisco</li>
        </ul>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Google API Budget: $
          <input 
            type="number" 
            value={budget} 
            onChange={(e) => setBudget(Number(e.target.value))}
            className="ml-2 p-1 border rounded"
            min="5"
            max="50"
          />
        </label>
      </div>

      <button 
        onClick={runBudgetScraping}
        disabled={isRunning}
        className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50"
      >
        {isRunning ? 'Running Budget Scraping...' : 'Start $10 SF Venue Scraping'}
      </button>

      {results && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Results:</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Yelp Venues:</strong> {results.yelpVenues || 0}
            </div>
            <div>
              <strong>Google Venues:</strong> {results.googleVenues || 0}
            </div>
            <div>
              <strong>Total Venues:</strong> {results.totalVenues || 0}
            </div>
            <div>
              <strong>Google API Cost:</strong> ${results.googleCost?.toFixed(2) || '0.00'}
            </div>
            <div>
              <strong>Mapped to Neighborhoods:</strong> {results.mappedVenues || 0}
            </div>
            <div>
              <strong>Processing Time:</strong> {results.processingTime || 'N/A'}
            </div>
          </div>
          
          {results.categoryBreakdown && (
            <div className="mt-4">
              <strong>Categories Processed:</strong>
              <ul className="list-disc list-inside ml-4 text-sm">
                {Object.entries(results.categoryBreakdown).map(([category, count]) => (
                  <li key={category}>{category}: {count as number} venues</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}