
import React, { useEffect, useState } from 'react';
import MapView from '@/components/MapView';
import SpeedDisplay from '@/components/SpeedDisplay';
import ETADisplay from '@/components/ETADisplay';
import AccuracyIndicator from '@/components/AccuracyIndicator';
import NavigationBar from '@/components/NavigationBar';
import LocationFallback from '@/components/LocationFallback';
import { useLocation } from '@/contexts/LocationContext';

const MapPage: React.FC = () => {
  const { startLocationTracking, isTracking, currentLocation } = useLocation();
  const [locationError, setLocationError] = useState<string | null>(null);

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

    // Request permission for notifications
    if ('Notification' in window) {
      Notification.requestPermission();
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

        {/* Floating info panels with responsive layout */}
        <div className="absolute top-4 right-4 space-y-2 md:space-y-4 w-auto max-w-[250px]">
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
