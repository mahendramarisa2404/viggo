
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { RouteInfo, EtaInfo, Location } from '@/types';
import { getDirections, calculateEta } from '@/utils/mapboxUtils';
import { useLocation } from './LocationContext';

interface NavigationContextType {
  destination: Location | null;
  route: RouteInfo | null;
  eta: EtaInfo | null;
  isNavigating: boolean;
  isLoadingRoute: boolean;
  error: string | null;
  startNavigation: (destination?: Location) => Promise<void>;
  stopNavigation: () => void;
  updateRoute: () => Promise<void>;
}

export const NavigationContext = createContext<NavigationContextType | null>(null);

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

interface NavigationProviderProps {
  children: ReactNode;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ children }) => {
  const { currentLocation, collegeInfo } = useLocation();
  const [destination, setDestination] = useState<Location | null>(null);
  const [route, setRoute] = useState<RouteInfo | null>(null);
  const [eta, setEta] = useState<EtaInfo | null>(null);
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const [isLoadingRoute, setIsLoadingRoute] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [routeUpdateInterval, setRouteUpdateInterval] = useState<NodeJS.Timeout | null>(null);

  // Start navigation to a destination
  const startNavigation = async (dest: Location = collegeInfo.location) => {
    try {
      if (!currentLocation) {
        throw new Error('Current location is not available');
      }
      
      setDestination(dest);
      setIsNavigating(true);
      setIsLoadingRoute(true);
      setError(null);
      
      const routeInfo = await getDirections(currentLocation, dest);
      
      if (!routeInfo) {
        throw new Error('Could not get directions');
      }
      
      setRoute(routeInfo);
      setEta(calculateEta(routeInfo));
      
      // Set up interval to periodically update route (every 5 seconds instead of 30)
      const interval = setInterval(updateRoute, 5000);
      setRouteUpdateInterval(interval);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoadingRoute(false);
    }
  };

  // Stop navigation
  const stopNavigation = () => {
    setIsNavigating(false);
    setDestination(null);
    setRoute(null);
    setEta(null);
    
    // Clear route update interval
    if (routeUpdateInterval) {
      clearInterval(routeUpdateInterval);
      setRouteUpdateInterval(null);
    }
  };

  // Update route based on current location
  const updateRoute = async () => {
    try {
      if (!currentLocation || !destination) {
        return;
      }
      
      setIsLoadingRoute(true);
      
      const routeInfo = await getDirections(currentLocation, destination);
      
      if (!routeInfo) {
        throw new Error('Could not update directions');
      }
      
      setRoute(routeInfo);
      setEta(calculateEta(routeInfo));
    } catch (err) {
      console.error('Error updating route:', err);
      // Don't set error state for updates, just log it
    } finally {
      setIsLoadingRoute(false);
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (routeUpdateInterval) {
        clearInterval(routeUpdateInterval);
      }
    };
  }, [routeUpdateInterval]);

  // Update route when current location changes significantly
  useEffect(() => {
    if (isNavigating && currentLocation && destination) {
      updateRoute();
    }
  }, [currentLocation, isNavigating, destination]);

  return (
    <NavigationContext.Provider
      value={{
        destination,
        route,
        eta,
        isNavigating,
        isLoadingRoute,
        error,
        startNavigation,
        stopNavigation,
        updateRoute,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};
