
import React from 'react';
import { useLocation } from '@/contexts/LocationContext';
import { GaugeIcon, WifiIcon, WifiOffIcon } from 'lucide-react';

const SpeedDisplay: React.FC = () => {
  const { speedData, gpsAccuracy } = useLocation();

  // Get appropriate connection icon based on GPS accuracy
  const ConnectionIcon = () => {
    if (gpsAccuracy.level === 'unknown') {
      return <WifiOffIcon className="w-5 h-5 text-gray-400" />;
    }
    
    if (gpsAccuracy.level === 'low') {
      return <WifiIcon className="w-5 h-5 text-red-500" />;
    }
    
    if (gpsAccuracy.level === 'medium') {
      return <WifiIcon className="w-5 h-5 text-yellow-500" />;
    }
    
    return <WifiIcon className="w-5 h-5 text-green-500" />;
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-sss-blue">Current Speed</h3>
        <ConnectionIcon />
      </div>
      
      <div className="flex items-center justify-center">
        <div className="text-4xl font-bold text-sss-blue">{speedData.speed}</div>
        <div className="ml-2 text-lg text-gray-600">km/h</div>
      </div>
      
      <div className="text-xs text-gray-500 mt-2 text-center">
        {speedData.source === 'GPS' ? 'GPS Data' : 'CAN Protocol'}
      </div>
      
      {gpsAccuracy.value !== null && (
        <div className="text-xs text-gray-500 mt-1 text-center">
          Accuracy: ±{Math.round(gpsAccuracy.value)} m
        </div>
      )}
    </div>
  );
};

export default SpeedDisplay;
