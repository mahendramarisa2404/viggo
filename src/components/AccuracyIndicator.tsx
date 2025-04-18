
import React from 'react';
import { useLocation } from '@/contexts/LocationContext';

const AccuracyIndicator: React.FC = () => {
  const { gpsAccuracy } = useLocation();

  const getAccuracyColor = () => {
    switch (gpsAccuracy.level) {
      case 'high':
        return 'bg-green-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-red-500';
      default:
        return 'bg-gray-300';
    }
  };

  const getAccuracyText = () => {
    switch (gpsAccuracy.level) {
      case 'high':
        return 'High Accuracy';
      case 'medium':
        return 'Medium Accuracy';
      case 'low':
        return 'Low Accuracy';
      default:
        return 'GPS Signal Unknown';
    }
  };

  return (
    <div className="bg-white p-3 rounded-lg shadow-md">
      <div className="text-sm text-gray-600 mb-2">GPS Signal</div>
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full ${getAccuracyColor()}`} 
          style={{ 
            width: gpsAccuracy.level === 'unknown' 
              ? '0%' 
              : gpsAccuracy.level === 'low' 
                ? '33%' 
                : gpsAccuracy.level === 'medium' 
                  ? '66%' 
                  : '100%' 
          }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <div className="text-xs text-gray-500">{getAccuracyText()}</div>
        {gpsAccuracy.value !== null && (
          <div className="text-xs text-gray-500">±{Math.round(gpsAccuracy.value)}m</div>
        )}
      </div>
    </div>
  );
};

export default AccuracyIndicator;
