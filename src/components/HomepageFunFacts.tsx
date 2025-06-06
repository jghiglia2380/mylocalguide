import React from 'react';

interface FunFact {
  id: number;
  title: string;
  fact: string;
  category: string;
  neighborhood_name?: string;
}

interface HomepageFunFactsProps {
  facts: FunFact[];
}

export function HomepageFunFacts({ facts }: HomepageFunFactsProps) {
  if (!facts || facts.length === 0) return null;

  return (
    <div className="mb-8 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-orange-200 rounded-lg">
      <h3 className="text-lg font-bold mb-3 text-orange-900">
        🎯 Did You Know? SF Fun Facts
      </h3>
      <div className="space-y-3">
        {facts.map((fact) => (
          <div key={fact.id} className="border-l-4 border-orange-400 pl-3">
            <p className="text-sm font-medium text-gray-900 mb-1">
              {fact.title}
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">
              {fact.fact}
            </p>
            {fact.neighborhood_name && (
              <p className="text-xs text-gray-500 mt-1">
                📍 {fact.neighborhood_name}
              </p>
            )}
          </div>
        ))}
      </div>
      <p className="text-xs text-center mt-3 text-gray-600">
        🔄 Refresh page for new facts • 
        <a href="/fun-facts" className="text-blue-600 hover:underline ml-1">
          Explore all SF fun facts →
        </a>
      </p>
    </div>
  );
}