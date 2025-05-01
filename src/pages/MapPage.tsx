
import React, { useState, useEffect } from 'react';
import MapView from '@/components/MapView';
import SpeedDisplay from '@/components/SpeedDisplay';
import ETADisplay from '@/components/ETADisplay';
import AccuracyIndicator from '@/components/AccuracyIndicator';
import NavigationBar from '@/components/NavigationBar';
import LocationFallback from '@/components/LocationFallback';
import { useLocation } from '@/contexts/LocationContext';
import { initAlarmAudio, resetAlarmState } from '@/utils/notificationUtils';
import { toast } from '@/components/ui/sonner';
import StopAlarmButton from '@/components/StopAlarmButton';
import SpeedAlert from '@/components/SpeedAlert';

const MapPage: React.FC = () => {
  const { startLocationTracking, isTracking, currentLocation } = useLocation();
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize audio & notification systems
    initAlarmAudio();
    resetAlarmState(); // Reset alarm state on page load
    
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          toast.success('Notifications enabled', {
            description: 'You will be notified when near the college'
          });
        } else {
          toast.warning('Notifications disabled', {
            description: 'Enable notifications to get alerts when near college'
          });
        }
      });
    }

    // Set up audio context on user interaction to enable sound on iOS/Safari
    const setupAudioContext = () => {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        const audioCtx = new AudioContext();
        if (audioCtx.state === 'suspended') {
          audioCtx.resume();
        }
      }
    };

    // Add event listeners to unlock audio
    document.addEventListener('click', setupAudioContext, { once: true });
    document.addEventListener('touchstart', setupAudioContext, { once: true });

    // Set document title
    document.title = "Viggo";

    return () => {
      document.removeEventListener('click', setupAudioContext);
      document.removeEventListener('touchstart', setupAudioContext);
    };
  }, []);

  useEffect(() => {
    if (!isTracking) {
      try {
        startLocationTracking();
        setLocationError(null);
      } catch (err) {
        setLocationError('Unable to access location services');
        console.error('Location error:', err);
      }
    }
  }, []);

  const handleRetryLocation = () => {
    try {
      startLocationTracking();
      setLocationError(null);
    } catch (err) {
      setLocationError('Unable to access location services');
      console.error('Location retry error:', err);
    }
  };

  if (locationError || (!currentLocation && isTracking)) {
    return (
      <div className="flex flex-col h-screen w-full bg-gray-50">
        <div className="p-4">
          <NavigationBar />
        </div>
        <div className="flex-1">
          <LocationFallback 
            error={locationError || "Waiting for location data..."}
            onRetry={handleRetryLocation}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full bg-gray-50">
      <div className="p-4">
        <NavigationBar />
      </div>

      <div className="flex-1 relative p-4 pt-0">
        <div className="h-full rounded-lg overflow-hidden shadow-lg" style={{ minHeight: '60vh' }}>
          <MapView />
        </div>

        <div className="absolute top-8 right-4 w-56 space-y-4 z-10">
          <SpeedDisplay />
          <ETADisplay />
        </div>

        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-11/12 max-w-md z-10">
          <AccuracyIndicator />
        </div>

        <StopAlarmButton />
        <SpeedAlert />
      </div>
    </div>
  );
};

export default MapPage;
