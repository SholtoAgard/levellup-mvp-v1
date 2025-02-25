
import React from 'react';

export const ScoringLoader: React.FC = () => {
  return (
    <div className="text-center space-y-4">
      <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
      <p className="text-lg font-medium text-gray-700">Analyzing your conversation...</p>
      <p className="text-sm text-gray-500">This may take a few moments</p>
    </div>
  );
};
