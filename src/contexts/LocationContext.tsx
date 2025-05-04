
import React, { createContext, useState, useEffect, useContext, ReactNode, useRef } from 'react';
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
  startLocationTracking: () => Promise<boolean>;
  stopLocationTracking: () => void;
  isTracking: boolean;
  locationError: string | null;
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
    source: 'Advanced',
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
  const [locationError, setLocationError] = useState<string | null>(null);
  const lastProximityCheckRef = useRef<number>(0);
  const locationRetryCount = useRef<number>(0);
  const maxRetries = 3;

  const updateLocation = (location: Location) => {
    // Only process valid locations
    if (!location || location.latitude === undefined || location.longitude === undefined) {
      return;
    }
    
    // Reset error state when we get valid location
    setLocationError(null);
    locationRetryCount.current = 0;
    
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
      source: 'Advanced',
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

  const startLocationTracking = async (): Promise<boolean> => {
    if (isTracking) return true; // Already tracking
    
    try {
      // Check if geolocation is supported
      if (!navigator.geolocation) {
        setLocationError('Geolocation is not supported by your browser');
        return false;
      }

      // Request permission first
      const permissionStatus = await getLocationPermission();
      if (!permissionStatus) {
        setLocationError('Location permission denied');
        return false;
      }
      
      // Reset speed calculator when starting tracking
      speedCalculator.reset();
      
      // Also check for notifications permission
      if ('Notification' in window && Notification.permission !== 'granted' && 
          Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
      
      // Start tracking
      console.log("Starting location tracking...");
      const id = navigator.geolocation.watchPosition(
        (position) => {
          console.log("Got position:", position.coords);
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
          setLocationError(`${error.message}. Please check location permissions and try again.`);
          
          if (locationRetryCount.current < maxRetries) {
            locationRetryCount.current += 1;
            toast.error(`Location error (attempt ${locationRetryCount.current}/${maxRetries})`, {
              description: `Retrying in 2 seconds...`,
            });
            
            // Retry after a delay
            setTimeout(() => {
              if (isTracking) {
                stopLocationTracking();
                startLocationTracking();
              }
            }, 2000);
          } else {
            toast.error("Location tracking failed", {
              description: "Maximum retry attempts reached. Please check your device settings."
            });
          }
        },
        {
          enableHighAccuracy: true,
          maximumAge: 100, // Reduced for more frequent updates
          timeout: 5000, // Increased timeout for slower connections
        }
      );
      
      setWatchId(id);
      setIsTracking(true);
      toast.success("Location tracking started", {
        description: "Your location is now being tracked for navigation"
      });
      
      return true;
    } catch (error) {
      console.error("Failed to start location tracking:", error);
      setLocationError("Failed to start location tracking");
      toast.error("Location tracking failed", {
        description: "Please enable location permissions in your browser settings"
      });
      return false;
    }
  };

  // Helper to get location permission
  const getLocationPermission = async (): Promise<boolean> => {
    if (!navigator.permissions) {
      // Older browsers don't support permissions API, just try to get location
      return true;
    }
    
    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      if (result.state === 'granted') {
        return true;
      } else if (result.state === 'prompt') {
        // Will prompt the user
        return true;
      } else {
        // Permission denied
        setLocationError('Location permission denied');
        toast.error("Location access denied", {
          description: "Please enable location permissions in your browser settings"
        });
        return false;
      }
    } catch (err) {
      console.error("Error checking permissions:", err);
      // Just try to get the location anyway
      return true;
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
    // Auto-start location tracking when component mounts
    startLocationTracking();
    
    return () => {
      if (watchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

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
        locationError,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};
