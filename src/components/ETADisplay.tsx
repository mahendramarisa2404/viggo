
import React, { useEffect } from 'react';
import { useNavigation } from '@/contexts/NavigationContext';
import { useLocation } from '@/contexts/LocationContext';
import { Clock, MapPin, Volume2, VolumeX } from 'lucide-react';
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

  if (!isNavigating || !eta) {
    return null;
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-sss-blue">ETA</h3>
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
              <Volume2 className="w-4 h-4 text-sss-purple" />
            ) : (
              <VolumeX className="w-4 h-4 text-gray-400" />
            )}
          </button>
          {isLoadingRoute && <div className="text-xs text-gray-500 ml-2">Updating...</div>}
        </div>
      </div>

      <div className="flex items-center mb-2">
        <Clock className="w-5 h-5 text-sss-purple mr-2" />
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
        <MapPin className="w-5 h-5 text-sss-purple mr-2" />
        <div className="text-sm text-gray-600">
          {formatDistance(eta.remainingDistance)} to destination
        </div>
      </div>
    </div>
  );
};

export default ETADisplay;
