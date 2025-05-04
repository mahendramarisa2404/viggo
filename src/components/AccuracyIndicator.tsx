
import React from 'react';
import { useLocation } from '@/contexts/LocationContext';
import { Signal, SignalHigh, SignalMedium, SignalLow, SignalZero, Loader2 } from 'lucide-react';

const AccuracyIndicator: React.FC = () => {
  const { gpsAccuracy, isTracking } = useLocation();

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

  const getAccuracyIcon = () => {
    if (!isTracking) {
      return <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />;
    }
    
    switch (gpsAccuracy.level) {
      case 'high':
        return <SignalHigh className="w-5 h-5 text-green-500" />;
      case 'medium':
        return <SignalMedium className="w-5 h-5 text-yellow-500" />;
      case 'low':
        return <SignalLow className="w-5 h-5 text-red-500" />;
      default:
        return <SignalZero className="w-5 h-5 text-gray-400" />;
    }
  };

  const getAccuracyText = () => {
    if (!isTracking) {
      return 'Waiting for GPS...';
    }
    
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

  const getAccuracyPercentage = () => {
    if (!isTracking || gpsAccuracy.level === 'unknown') return 0;
    if (gpsAccuracy.level === 'low') return 33;
    if (gpsAccuracy.level === 'medium') return 66;
    return 100;
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Signal className="w-5 h-5 text-gray-600" />
          <div className="text-sm font-medium text-gray-600">GPS Signal</div>
        </div>
        {getAccuracyIcon()}
      </div>
      
      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden mb-2">
        <div 
          className={`h-full ${getAccuracyColor()} transition-all duration-500 ease-out`} 
          style={{ width: `${getAccuracyPercentage()}%` }}
        />
      </div>
      
      <div className="flex justify-between items-center text-xs">
        <div className="font-medium text-sm text-gray-700">{getAccuracyText()}</div>
        {gpsAccuracy.value !== null && (
          <div className={`px-2 py-0.5 rounded ${
            gpsAccuracy.level === 'high' ? 'bg-green-100 text-green-800' :
            gpsAccuracy.level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            ±{Math.round(gpsAccuracy.value)}m
          </div>
        )}
      </div>
    </div>
  );
};

export default AccuracyIndicator;
