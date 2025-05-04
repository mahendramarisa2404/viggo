
import React, { useEffect } from 'react';
import { useNavigation } from '@/contexts/NavigationContext';
import { useLocation } from '@/contexts/LocationContext';
import { Clock, MapPin, Volume2, VolumeX, RefreshCw } from 'lucide-react';
import { formatRemainingTime, formatDistance } from '@/utils/mapboxUtils';
import { initAlarmAudio, stopAlarmSound, playAlarmSound } from '@/utils/notificationUtils';

const ETADisplay: React.FC = () => {
  const { eta, isNavigating, isLoadingRoute } = useNavigation();
  const { isNearCollege } = useLocation();
  const [soundEnabled, setSoundEnabled] = React.useState<boolean>(true);

  // Initialize the audio element when component mounts
  useEffect(() => {
    initAlarmAudio();
    return () => {
      // Clean up by stopping any playing alarm when component unmounts
      stopAlarmSound();
    };
  }, []);

  // Control alarm sound based on proximity to college
  useEffect(() => {
    if (isNearCollege && soundEnabled) {
      playAlarmSound();
    } else {
      stopAlarmSound();
    }
  }, [isNearCollege, soundEnabled]);

  // Toggle sound on/off
  const toggleSound = () => {
    if (soundEnabled) {
      stopAlarmSound();
    } else if (isNearCollege) {
      playAlarmSound();
    }
    setSoundEnabled(!soundEnabled);
  };

  if (!isNavigating) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-700">Navigation</h3>
        </div>
        <div className="flex items-center justify-center py-3">
          <p className="text-gray-500 text-sm">Navigation not active</p>
        </div>
      </div>
    );
  }
  
  if (isLoadingRoute && !eta) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-700">ETA</h3>
          <div className="flex items-center">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-500 mr-1" />
            <span className="text-xs text-gray-500">Loading...</span>
          </div>
        </div>
        <div className="flex justify-center items-center space-x-2 py-3">
          <div className="w-4 h-4 bg-blue-100 rounded-full animate-pulse"></div>
          <div className="w-4 h-4 bg-blue-200 rounded-full animate-pulse delay-75"></div>
          <div className="w-4 h-4 bg-blue-300 rounded-full animate-pulse delay-150"></div>
        </div>
      </div>
    );
  }

  if (!eta) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-700">ETA</h3>
        </div>
        <div className="flex items-center justify-center py-3">
          <p className="text-gray-500 text-sm">Calculating route...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-blue-600">ETA</h3>
        <div className="flex items-center">
          {isNearCollege && (
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded mr-2">
              Near College
            </span>
          )}
          <button 
            onClick={toggleSound}
            className="p-1 rounded-full hover:bg-gray-100"
            aria-label={soundEnabled ? "Mute alarm" : "Enable alarm"}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-purple-600" />
            ) : (
              <VolumeX className="w-4 h-4 text-gray-400" />
            )}
          </button>
          {isLoadingRoute && <RefreshCw className="w-4 h-4 ml-2 text-blue-500 animate-spin" />}
        </div>
      </div>

      <div className="flex items-center mb-2">
        <Clock className="w-5 h-5 text-purple-600 mr-2" />
        <div>
          <div className="font-bold text-xl">
            {eta.arrivalTime.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
          <div className="text-sm text-gray-600">
            {formatRemainingTime(eta.remainingTime)} remaining
          </div>
        </div>
      </div>

      <div className="flex items-center">
        <MapPin className="w-5 h-5 text-purple-600 mr-2" />
        <div className="text-sm text-gray-600">
          {formatDistance(eta.remainingDistance)} to destination
        </div>
      </div>
    </div>
  );
};

export default ETADisplay;
