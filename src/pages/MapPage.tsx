
import React, { useState, useEffect } from 'react';
import MapView from '@/components/MapView';
import SpeedDisplay from '@/components/SpeedDisplay';
import ETADisplay from '@/components/ETADisplay';
import AccuracyIndicator from '@/components/AccuracyIndicator';
import NavigationBar from '@/components/NavigationBar';
import LocationFallback from '@/components/LocationFallback';
import { useLocation } from '@/contexts/LocationContext';
import { useNavigation } from '@/contexts/NavigationContext';
import { initAlarmAudio, resetAlarmState } from '@/utils/notificationUtils';
import { toast } from '@/components/ui/sonner';
import StopAlarmButton from '@/components/StopAlarmButton';
import SpeedAlert from '@/components/SpeedAlert';
import { MapPin } from 'lucide-react';

const MapPage: React.FC = () => {
  const { startLocationTracking, isTracking, currentLocation, locationError } = useLocation();
  const { isNavigating, startNavigation, destination } = useNavigation();
  const [isInitializing, setIsInitializing] = useState(true);

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
    
    // Mark initialization as complete
    setTimeout(() => setIsInitializing(false), 2000);

    return () => {
      document.removeEventListener('click', setupAudioContext);
      document.removeEventListener('touchstart', setupAudioContext);
    };
  }, []);

  useEffect(() => {
    const initializeTracking = async () => {
      if (!isTracking) {
        try {
          const success = await startLocationTracking();
          if (!success) {
            console.error("Failed to start location tracking");
          }
        } catch (err) {
          console.error('Location initialization error:', err);
        }
      }
    };
    
    initializeTracking();
  }, [isTracking, startLocationTracking]);

  // Auto-start navigation to college when we have a location but no navigation active
  useEffect(() => {
    if (currentLocation && !isNavigating && !isInitializing && !destination) {
      // Small delay to ensure UI is ready
      console.log("Auto-starting navigation to college");
      setTimeout(() => {
        startNavigation().catch(err => {
          console.error("Error auto-starting navigation:", err);
        });
      }, 1000);
    }
  }, [currentLocation, isNavigating, isInitializing, destination, startNavigation]);

  const handleRetryLocation = async () => {
    try {
      const success = await startLocationTracking();
      if (!success) {
        toast.error("Location tracking failed", { 
          description: "Please check your device settings and try again" 
        });
      }
    } catch (err) {
      console.error('Location retry error:', err);
    }
  };

  // Show loading screen during initial startup
  if (isInitializing) {
    return (
      <div className="flex flex-col h-screen w-full bg-gray-50">
        <div className="p-4">
          <NavigationBar />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-700">Initializing Viggo</h2>
            <p className="text-gray-500 mt-2">Getting location and navigation ready...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show fallback if there's a location error or we're still waiting for first location
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
        
        {!isNavigating && currentLocation && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white bg-opacity-90 p-4 rounded-lg shadow-lg z-10 text-center">
            <MapPin className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <h3 className="font-semibold text-lg">Starting Navigation</h3>
            <p className="text-gray-600 text-sm mb-3">Tap anywhere to continue</p>
            <button 
              onClick={() => startNavigation()}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg"
            >
              Navigate to College
            </button>
          </div>
        )}

        <StopAlarmButton />
        <SpeedAlert />
      </div>
    </div>
  );
};

export default MapPage;
