'use client';

import React, { useState } from 'react';
import { FunFact, FunFactCategory } from '../../lib/types/fun-facts';

interface FunFactsSectionProps {
  facts: FunFact[];
  neighborhoodName: string;
}

export function FunFactsSection({ facts, neighborhoodName }: FunFactsSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<FunFactCategory | 'all'>('all');
  const [showLocalKnowledge, setShowLocalKnowledge] = useState(false);

  const categories: (FunFactCategory | 'all')[] = [
    'all', 'History', 'Culture', 'Food', 'Architecture', 'Street Art', 'Music', 
    'Quirky', 'Celebrity', 'Hidden', 'Film & TV'
  ];

  const filteredFacts = facts.filter(fact => {
    const categoryMatch = selectedCategory === 'all' || fact.category === selectedCategory;
    const knowledgeMatch = !showLocalKnowledge || fact.local_knowledge;
    return categoryMatch && knowledgeMatch;
  });

  const getCategoryIcon = (category: FunFactCategory) => {
    const icons: Record<FunFactCategory, string> = {
      History: '🏛️',
      Culture: '🎭',
      Food: '🍽️',
      Architecture: '🏗️',
      Celebrity: '⭐',
      Quirky: '🤪',
      Hidden: '🔍',
      'Film & TV': '🎬',
      Music: '🎵',
      'Street Art': '🎨'
    };
    return icons[category] || '💡';
  };

  const getFunRatingStars = (rating: number) => {
    return '⭐'.repeat(rating);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mt-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          🎯 Fun Facts about {neighborhoodName}
        </h2>
        <div className="text-sm text-gray-600">
          {filteredFacts.length} {filteredFacts.length === 1 ? 'fact' : 'facts'}
        </div>
      </div>

      {/* Filter Controls */}
      <div className="mb-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Category
          </label>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category === 'all' ? 'All' : `${getCategoryIcon(category as FunFactCategory)} ${category}`}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="localKnowledge"
            checked={showLocalKnowledge}
            onChange={(e) => setShowLocalKnowledge(e.target.checked)}
            className="mr-2 rounded"
          />
          <label htmlFor="localKnowledge" className="text-sm text-gray-700">
            🤫 Show only local secrets & insider knowledge
          </label>
        </div>
      </div>

      {/* Fun Facts Grid */}
      {filteredFacts.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
          {filteredFacts.map((fact) => (
            <div
              key={fact.id}
              className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                fact.local_knowledge ? 'border-orange-200 bg-orange-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getCategoryIcon(fact.category)}</span>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {fact.category}
                  </span>
                  {fact.local_knowledge && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                      🤫 Local Secret
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <span title="Fun Rating">{getFunRatingStars(fact.fun_rating)}</span>
                  <span title="Tourist Appeal">👥{fact.tourist_appeal}</span>
                </div>
              </div>

              <h3 className="font-semibold text-gray-900 mb-2">{fact.title}</h3>
              <p className="text-gray-700 mb-3 leading-relaxed">{fact.fact}</p>

              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                {(fact as any).time_period && (
                  <span className="inline-flex items-center px-2 py-1 rounded bg-blue-100 text-blue-700">
                    📅 {(fact as any).time_period}
                  </span>
                )}
                {(fact as any).address && (
                  <span className="inline-flex items-center px-2 py-1 rounded bg-green-100 text-green-700">
                    📍 {(fact as any).address}
                  </span>
                )}
                <span className={`inline-flex items-center px-2 py-1 rounded ${
                  fact.verified 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {fact.verified ? '✅ Verified' : '❓ Legend'}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">🔍</div>
          <p>No facts match your current filters.</p>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setShowLocalKnowledge(false);
            }}
            className="mt-2 text-blue-600 hover:text-blue-800 underline"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Fun Facts Summary */}
      {facts.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
            <div>
              <div className="font-semibold text-lg text-blue-600">
                {facts.length}
              </div>
              <div className="text-gray-600">Total Facts</div>
            </div>
            <div>
              <div className="font-semibold text-lg text-orange-600">
                {facts.filter(f => f.local_knowledge).length}
              </div>
              <div className="text-gray-600">Local Secrets</div>
            </div>
            <div>
              <div className="font-semibold text-lg text-green-600">
                {facts.filter(f => f.verified).length}
              </div>
              <div className="text-gray-600">Verified</div>
            </div>
            <div>
              <div className="font-semibold text-lg text-purple-600">
                {new Set(facts.map(f => f.category)).size}
              </div>
              <div className="text-gray-600">Categories</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}