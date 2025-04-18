
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Location, GpsAccuracy, SpeedData, CollegeInfo } from '@/types';
import { calculateSpeed, getGpsAccuracyLevel, isWithinRadius } from '@/utils/locationUtils';
import { showProximityNotification } from '@/utils/notificationUtils';

interface LocationContextType {
  currentLocation: Location | null;
  previousLocation: Location | null;
  speedData: SpeedData;
  gpsAccuracy: GpsAccuracy;
  collegeInfo: CollegeInfo;
  isNearCollege: boolean;
  updateLocation: (location: Location) => void;
  updateCollegeInfo: (info: CollegeInfo) => void;
  startLocationTracking: () => void;
  stopLocationTracking: () => void;
  isTracking: boolean;
}

// Default college location (can be updated in settings)
const DEFAULT_COLLEGE_INFO: CollegeInfo = {
  name: 'My College',
  location: {
    latitude: 37.7749, // Default coordinates - should be updated
    longitude: -122.4194, // Default coordinates - should be updated
  },
  address: '123 College Street, City, State',
  notificationRadius: 500, // 500 meters
};

export const LocationContext = createContext<LocationContextType | null>(null);

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

interface LocationProviderProps {
  children: ReactNode;
}

export const LocationProvider: React.FC<LocationProviderProps> = ({ children }) => {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [previousLocation, setPreviousLocation] = useState<Location | null>(null);
  const [speedData, setSpeedData] = useState<SpeedData>({
    speed: 0,
    timestamp: Date.now(),
    source: 'GPS',
  });
  const [gpsAccuracy, setGpsAccuracy] = useState<GpsAccuracy>({
    level: 'unknown',
    value: null,
  });
  const [collegeInfo, setCollegeInfo] = useState<CollegeInfo>(DEFAULT_COLLEGE_INFO);
  const [isNearCollege, setIsNearCollege] = useState<boolean>(false);
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [watchId, setWatchId] = useState<number | null>(null);

  // Update location and related data
  const updateLocation = (location: Location) => {
    if (currentLocation) {
      setPreviousLocation(currentLocation);
    }
    
    setCurrentLocation(location);
    
    // Update GPS accuracy
    if (location.accuracy !== undefined) {
      setGpsAccuracy(getGpsAccuracyLevel(location.accuracy));
    }
    
    // Update speed if previous location exists
    if (previousLocation && previousLocation.timestamp && location.timestamp) {
      const speed = calculateSpeed(previousLocation, location);
      setSpeedData({
        speed,
        timestamp: location.timestamp,
        source: 'GPS',
      });
    }
    
    // Check if near college
    if (location && collegeInfo) {
      const nearCollege = isWithinRadius(
        location,
        collegeInfo.location,
        collegeInfo.notificationRadius
      );
      setIsNearCollege(nearCollege);
      
      // Trigger notification if near college and wasn't before
      if (nearCollege && !isNearCollege) {
        // Show browser notification (would use Firebase Cloud Messaging in a complete implementation)
        showProximityNotification(collegeInfo.name);
      }
    }
  };

  // Start tracking location
  const startLocationTracking = () => {
    if (!isTracking && navigator.geolocation) {
      const id = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation: Location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          };
          updateLocation(newLocation);
        },
        (error) => {
          console.error('Error getting location:', error);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 5000,
        }
      );
      
      setWatchId(id);
      setIsTracking(true);
    }
  };

  // Stop tracking location
  const stopLocationTracking = () => {
    if (isTracking && watchId !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      setIsTracking(false);
    }
  };
  
  // Update college information
  const updateCollegeInfo = (info: CollegeInfo) => {
    setCollegeInfo(info);
    
    // Check if current location is near the new college location
    if (currentLocation) {
      const nearCollege = isWithinRadius(
        currentLocation,
        info.location,
        info.notificationRadius
      );
      setIsNearCollege(nearCollege);
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (watchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  return (
    <LocationContext.Provider
      value={{
        currentLocation,
        previousLocation,
        speedData,
        gpsAccuracy,
        collegeInfo,
        isNearCollege,
        updateLocation,
        updateCollegeInfo,
        startLocationTracking,
        stopLocationTracking,
        isTracking,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};
