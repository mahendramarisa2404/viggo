
import React, { useEffect, useState } from 'react';
import MapView from '@/components/MapView';
import SpeedDisplay from '@/components/SpeedDisplay';
import ETADisplay from '@/components/ETADisplay';
import AccuracyIndicator from '@/components/AccuracyIndicator';
import NavigationBar from '@/components/NavigationBar';
import LocationFallback from '@/components/LocationFallback';
import { useLocation } from '@/contexts/LocationContext';
import { initAlarmAudio } from '@/utils/notificationUtils';
import { toast } from '@/components/ui/sonner';

const MapPage: React.FC = () => {
  const { startLocationTracking, isTracking, currentLocation } = useLocation();
  const [locationError, setLocationError] = useState<string | null>(null);

  // Handle permissions for notifications and audio
  useEffect(() => {
    // Initialize audio early to handle user gesture requirements
    initAlarmAudio();
    
    // Request permission for notifications
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

    // Audio context setup (for mobile devices that require user gesture)
    const setupAudioContext = () => {
      // Create and resume AudioContext to enable audio on mobile
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        const audioCtx = new AudioContext();
        if (audioCtx.state === 'suspended') {
          audioCtx.resume();
        }
      }
    };

    // Add event listeners to handle user interaction for audio
    document.addEventListener('click', setupAudioContext, { once: true });
    document.addEventListener('touchstart', setupAudioContext, { once: true });

    return () => {
      document.removeEventListener('click', setupAudioContext);
      document.removeEventListener('touchstart', setupAudioContext);
    };
  }, []);

  // Start location tracking when the component mounts
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

  // Show fallback if location error or no location after 5 seconds
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
        <div className="h-full rounded-lg overflow-hidden shadow-lg">
          <MapView />
        </div>

        {/* Floating info panels */}
        <div className="absolute top-8 right-4 w-56 space-y-4">
          <SpeedDisplay />
          <ETADisplay />
        </div>

        {/* Accuracy bar at the bottom */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-11/12 max-w-md">
          <AccuracyIndicator />
        </div>
      </div>
    </div>
  );
};

export default MapPage;
