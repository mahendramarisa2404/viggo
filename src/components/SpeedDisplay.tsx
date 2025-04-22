
import React from 'react';
import { useLocation } from '@/contexts/LocationContext';
import { GaugeIcon, WifiIcon, WifiOffIcon } from 'lucide-react';

const SpeedDisplay: React.FC = () => {
  const { speedData, gpsAccuracy } = useLocation();

  // Get appropriate connection icon based on GPS accuracy
  const ConnectionIcon = () => {
    if (gpsAccuracy.level === 'unknown') {
      return <WifiOffIcon className="w-4 h-4 text-gray-400" />;
    }
    
    if (gpsAccuracy.level === 'low') {
      return <WifiIcon className="w-4 h-4 text-red-500" />;
    }
    
    if (gpsAccuracy.level === 'medium') {
      return <WifiIcon className="w-4 h-4 text-yellow-500" />;
    }
    
    return <WifiIcon className="w-4 h-4 text-green-500" />;
  };

  return (
    <div className="bg-white p-3 rounded-lg shadow-md text-center space-y-1 w-full md:w-48 max-w-[200px]">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-sss-blue">Speed</h3>
        <ConnectionIcon />
      </div>
      
      <div className="flex items-center justify-center">
        <div className="text-2xl font-bold text-sss-blue">{speedData.speed}</div>
        <div className="ml-1 text-sm text-gray-600">km/h</div>
      </div>
      
      <div className="text-xs text-gray-500">
        {speedData.source === 'GPS' ? 'GPS Data' : 'CAN Protocol'}
      </div>
      
      {gpsAccuracy.value !== null && (
        <div className="text-xs text-gray-500">
          Accuracy: ±{Math.round(gpsAccuracy.value)} m
        </div>
      )}
    </div>
  );
};

export default SpeedDisplay;
