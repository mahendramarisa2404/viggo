
import React, { useEffect, useState, useCallback } from 'react';
import { useLocation } from '@/contexts/LocationContext';
import { GaugeIcon, WifiIcon, WifiOffIcon } from 'lucide-react';

const SpeedDisplay: React.FC = () => {
  const { speedData, gpsAccuracy } = useLocation();
  const [displaySpeed, setDisplaySpeed] = useState(0);
  const [speedAnimation, setSpeedAnimation] = useState<string>('');
  const [speedTrend, setSpeedTrend] = useState<'rising' | 'falling' | 'stable'>('stable');

  // Enhanced smoothing for speed updates with adaptive smoothing factor
  useEffect(() => {
    // Adjust smoothing based on GPS accuracy
    const accuracyFactor = gpsAccuracy.value !== null ? 
      Math.min(1, 10 / (gpsAccuracy.value || 10)) : 0.5;
    
    const smoothingFactor = 0.2 + (0.3 * accuracyFactor); // 0.2-0.5 range based on accuracy
    
    // Previous speed value
    const prevSpeed = displaySpeed;
    
    // New smoothed speed value
    setDisplaySpeed(prev => {
      // For very large changes, use direct value to avoid lag in important updates
      if (Math.abs(prev - speedData.speed) > 10) {
        return speedData.speed;
      }
      return prev * (1 - smoothingFactor) + speedData.speed * smoothingFactor;
    });

    // Set speed trend for visual indication
    if (Math.abs(speedData.speed - prevSpeed) > 0.5) {
      setSpeedTrend(speedData.speed > prevSpeed ? 'rising' : 'falling');
    } else {
      setSpeedTrend('stable');
    }

    // Brief animation on speed change
    setSpeedAnimation('animate-pulse');
    const timer = setTimeout(() => {
      setSpeedAnimation('');
    }, 300);
    return () => clearTimeout(timer);
  }, [speedData.speed, gpsAccuracy.value]);

  // Round to 1 decimal place for display
  const roundedSpeed = Math.round(displaySpeed * 10) / 10;

  const getSpeedColor = useCallback((speed: number) => {
    if (speed >= 60) return 'text-red-600 animate-pulse';
    if (speed >= 45) return 'text-orange-500';
    if (speed >= 30) return 'text-yellow-500';
    return 'text-green-500';
  }, []);

  const getAccuracyDisplay = useCallback(() => {
    if (gpsAccuracy.level === 'unknown') return 'Acquiring GPS...';
    if (gpsAccuracy.level === 'low') return 'Low GPS Accuracy';
    if (gpsAccuracy.level === 'medium') return 'Good GPS Signal';
    return 'High GPS Accuracy';
  }, [gpsAccuracy.level]);

  const ConnectionIcon = useCallback(() => {
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
  }, [gpsAccuracy.level]);

  const getTrendIndicator = () => {
    if (speedTrend === 'rising') {
      return <span className="text-green-500 ml-1">↑</span>;
    }
    if (speedTrend === 'falling') {
      return <span className="text-red-500 ml-1">↓</span>;
    }
    return null;
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
        <div className={`text-4xl font-bold ${getSpeedColor(roundedSpeed)} ${speedAnimation}`}>
          {roundedSpeed.toFixed(1)}
          {getTrendIndicator()}
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
          className={`h-full transition-all duration-300 ${getSpeedColor(roundedSpeed)}`}
          style={{ width: `${Math.min((roundedSpeed / 60) * 100, 100)}%` }}
        />
      </div>
    </div>
  );
};

export default SpeedDisplay;
