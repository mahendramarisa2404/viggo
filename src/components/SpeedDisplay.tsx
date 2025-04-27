
import React, { useEffect, useState } from 'react';
import { useLocation } from '@/contexts/LocationContext';
import { GaugeIcon, WifiIcon, WifiOffIcon } from 'lucide-react';

const SpeedDisplay: React.FC = () => {
  const { speedData, gpsAccuracy } = useLocation();
  const [speedAnimation, setSpeedAnimation] = useState<string>('');

  useEffect(() => {
    setSpeedAnimation('animate-pulse');
    const timer = setTimeout(() => {
      setSpeedAnimation('');
    }, 500);
    return () => clearTimeout(timer);
  }, [speedData.speed]);

  const getSpeedColor = (speed: number) => {
    if (speed >= 60) return 'text-red-600 animate-pulse';
    if (speed >= 45) return 'text-orange-500';
    if (speed >= 30) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getAccuracyDisplay = () => {
    if (gpsAccuracy.level === 'unknown') return 'Acquiring GPS...';
    if (gpsAccuracy.level === 'low') return 'Low GPS Accuracy';
    if (gpsAccuracy.level === 'medium') return 'Good GPS Signal';
    return 'High GPS Accuracy';
  };

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
        <div className="flex items-center gap-2">
          <GaugeIcon className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-800">Speed</h3>
        </div>
        <ConnectionIcon />
      </div>
      
      <div className="flex items-center justify-center">
        <div className={`text-4xl font-bold ${getSpeedColor(speedData.speed)} ${speedAnimation}`}>
          {speedData.speed.toFixed(1)}
        </div>
        <div className="ml-2 text-lg text-gray-600">km/h</div>
      </div>
      
      <div className="text-xs text-gray-500 mt-2 text-center">
        {speedData.source === 'GPS' ? 'GPS Speed' : 'Calculated Speed'}
      </div>
      
      <div className="text-xs text-gray-500 mt-1 text-center">
        {getAccuracyDisplay()}
        {gpsAccuracy.value !== null && (
          <span className="text-xs"> (±{Math.round(gpsAccuracy.value)}m)</span>
        )}
      </div>
      
      <div className="w-full h-1.5 bg-gray-100 rounded-full mt-3 overflow-hidden">
        <div 
          className={`h-full transition-all duration-500 ${getSpeedColor(speedData.speed)}`}
          style={{ width: `${Math.min((speedData.speed / 60) * 100, 100)}%` }}
        />
      </div>
    </div>
  );
};

export default SpeedDisplay;
