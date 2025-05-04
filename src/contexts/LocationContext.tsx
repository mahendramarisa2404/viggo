import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Location, GpsAccuracy, SpeedData, CollegeInfo } from '@/types';
import { getGpsAccuracyLevel, isWithinRadius } from '@/utils/locationUtils';
import { showProximityNotification, isAlarmManuallyDisabled } from '@/utils/notificationUtils';
import { speedCalculator } from '@/utils/speedCalculator';
import { toast } from '@/components/ui/sonner';

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
    source: 'Advanced', // This is now valid with our updated type
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
  const lastProximityCheckRef = React.useRef<number>(0);

  const updateLocation = (location: Location) => {
    // Only process valid locations
    if (!location || location.latitude === undefined || location.longitude === undefined) {
      return;
    }
    
    // Store previous location
    if (currentLocation) {
      setPreviousLocation(currentLocation);
    }
    
    setCurrentLocation(location);
    
    // Update GPS accuracy
    if (location.accuracy !== undefined) {
      setGpsAccuracy(getGpsAccuracyLevel(location.accuracy));
    }
    
    // Calculate speed using the advanced calculator
    const calculatedSpeed = speedCalculator.addLocation(location);
    
    // Update speed data
    setSpeedData({
      speed: calculatedSpeed,
      timestamp: location.timestamp || Date.now(),
      source: 'Advanced', // Now valid with our updated type
    });
    
    // Check if near college with throttling to avoid duplicate notifications
    if (location && collegeInfo) {
      const now = Date.now();
      // Only check proximity every 2 seconds to reduce processing
      if (now - lastProximityCheckRef.current > 2000) {
        lastProximityCheckRef.current = now;
        
        const nearCollege = isWithinRadius(
          location,
          collegeInfo.location,
          collegeInfo.notificationRadius
        );
        
        if (nearCollege && !isNearCollege) {
          setIsNearCollege(true);
          if (!hasShownProximityAlert && !isAlarmManuallyDisabled) {
            showProximityNotification(collegeInfo.name);
            setHasShownProximityAlert(true);
            
            toast.info(`Near ${collegeInfo.name}`, {
              description: `You are within ${collegeInfo.notificationRadius} meters of your destination`,
            });
          }
        } else if (!nearCollege && isNearCollege) {
          setIsNearCollege(false);
        }
      }
    }
  };

  const startLocationTracking = () => {
    if (!isTracking && navigator.geolocation) {
      try {
        if ('Notification' in window && Notification.permission !== 'granted' && 
            Notification.permission !== 'denied') {
          Notification.requestPermission();
        }
        
        // Reset speed calculator when starting tracking
        speedCalculator.reset();
        
        const id = navigator.geolocation.watchPosition(
          (position) => {
            const newLocation: Location = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: position.timestamp,
              speed: position.coords.speed !== null ? position.coords.speed * 3.6 : undefined, // Convert m/s to km/h
            };
            updateLocation(newLocation);
          },
          (error) => {
            console.error('Error getting location:', error);
            toast.error("Location error", {
              description: `${error.message}. Please check location permissions and try again.`
            });
          },
          {
            enableHighAccuracy: true,
            maximumAge: 100, // Reduced for more frequent updates
            timeout: 3000,
          }
        );
        
        setWatchId(id);
        setIsTracking(true);
        toast.success("Location tracking started", {
          description: "Your location is now being tracked for navigation"
        });
      } catch (error) {
        console.error("Failed to start location tracking:", error);
        toast.error("Location tracking failed", {
          description: "Please enable location permissions in your browser settings"
        });
      }
    }
  };

  const stopLocationTracking = () => {
    if (isTracking && watchId !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      setIsTracking(false);
      toast.info("Location tracking stopped");
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
