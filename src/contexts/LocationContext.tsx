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
  hasShownProximityAlert: boolean;
  updateLocation: (location: Location) => void;
  updateCollegeInfo: (info: CollegeInfo) => void;
  startLocationTracking: () => void;
  stopLocationTracking: () => void;
  isTracking: boolean;
}

const DEFAULT_COLLEGE_INFO: CollegeInfo = {
  name: 'Vignan Institute of Information Technology',
  location: {
    latitude: 17.7097776,  // Updated Vignan Institute coordinates
    longitude: 83.1669508, // Visakhapatnam
  },
  address: 'Vignan college Besides VSEZ Vadlapudi Duvvada, Gajuwaka, Visakhapatnam, Andhra Pradesh 530049',
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
  const [hasShownProximityAlert, setHasShownProximityAlert] = useState<boolean>(false);
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [watchId, setWatchId] = useState<number | null>(null);

  const updateLocation = (location: Location) => {
    if (currentLocation) {
      setPreviousLocation(currentLocation);
    }
    
    setCurrentLocation(location);
    
    if (location.accuracy !== undefined) {
      setGpsAccuracy(getGpsAccuracyLevel(location.accuracy));
    }
    
    if (previousLocation && previousLocation.timestamp && location.timestamp) {
      const speed = calculateSpeed(previousLocation, location);
      const smoothedSpeed = speedData.speed * 0.3 + speed * 0.7; // Apply smoothing
      
      setSpeedData({
        speed: Number(smoothedSpeed.toFixed(1)),
        timestamp: location.timestamp,
        source: 'GPS',
      });
    }
    
    if (location && collegeInfo) {
      const nearCollege = isWithinRadius(
        location,
        collegeInfo.location,
        collegeInfo.notificationRadius
      );
      
      if (nearCollege && !isNearCollege) {
        setIsNearCollege(true);
        if (!hasShownProximityAlert) {
          showProximityNotification(collegeInfo.name);
          setHasShownProximityAlert(true);
        }
      } else if (!nearCollege && isNearCollege) {
        setIsNearCollege(false);
      }
    }
  };

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
          maximumAge: 500,
          timeout: 5000,
        }
      );
      
      setWatchId(id);
      setIsTracking(true);
    }
  };

  const stopLocationTracking = () => {
    if (isTracking && watchId !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      setIsTracking(false);
    }
  };

  const updateCollegeInfo = (info: CollegeInfo) => {
    setCollegeInfo(info);
    
    if (currentLocation) {
      const nearCollege = isWithinRadius(
        currentLocation,
        info.location,
        info.notificationRadius
      );
      setIsNearCollege(nearCollege);
    }
  };

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
        hasShownProximityAlert,
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
