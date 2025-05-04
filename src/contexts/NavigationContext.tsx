
import React, { createContext, useState, useContext, useEffect, useRef, ReactNode } from 'react';
import { RouteInfo, EtaInfo, Location } from '@/types';
import { getDirections, calculateEta } from '@/utils/mapboxUtils';
import { useLocation } from './LocationContext';
import { toast } from '@/components/ui/sonner';

interface NavigationContextType {
  destination: Location | null;
  route: RouteInfo | null;
  eta: EtaInfo | null;
  isNavigating: boolean;
  isLoadingRoute: boolean;
  error: string | null;
  navigationHistory: Location[];
  startNavigation: (destination?: Location) => Promise<void>;
  stopNavigation: () => void;
  updateRoute: () => Promise<void>;
  clearNavigationHistory: () => void;
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

// Store navigation history in localStorage
const NAVIGATION_HISTORY_KEY = 'navigation_history';
const MAX_HISTORY_ITEMS = 5;

// Load saved history from localStorage
const loadNavigationHistory = (): Location[] => {
  try {
    const saved = localStorage.getItem(NAVIGATION_HISTORY_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Error loading navigation history:', error);
    return [];
  }
};

// Save history to localStorage
const saveNavigationHistory = (history: Location[]) => {
  try {
    localStorage.setItem(NAVIGATION_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Error saving navigation history:', error);
  }
};

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ children }) => {
  const { currentLocation, collegeInfo } = useLocation();
  const [destination, setDestination] = useState<Location | null>(null);
  const [route, setRoute] = useState<RouteInfo | null>(null);
  const [eta, setEta] = useState<EtaInfo | null>(null);
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const [isLoadingRoute, setIsLoadingRoute] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [navigationHistory, setNavigationHistory] = useState<Location[]>(loadNavigationHistory);
  const routeUpdateInterval = useRef<NodeJS.Timeout | null>(null);
  const lastDestination = useRef<Location | null>(null);
  const routeRetryCount = useRef<number>(0);
  const maxRetries = 3;

  // Start navigation to a destination
  const startNavigation = async (dest: Location = collegeInfo.location) => {
    try {
      console.log("Starting navigation to:", dest);
      
      if (!currentLocation) {
        throw new Error('Current location is not available');
      }
      
      // Check if this is a new destination or same as current
      const isSameDestination = 
        lastDestination.current && 
        Math.abs(lastDestination.current.latitude - dest.latitude) < 0.0001 &&
        Math.abs(lastDestination.current.longitude - dest.longitude) < 0.0001;
      
      if (isSameDestination && isNavigating) {
        // If same destination and already navigating, just return
        return;
      }
      
      // Update last destination reference
      lastDestination.current = dest;
      
      setDestination(dest);
      setIsNavigating(true);
      setIsLoadingRoute(true);
      setError(null);
      routeRetryCount.current = 0;
      
      await fetchAndSetRoute(currentLocation, dest);
      
      // Add to navigation history if this is a new destination
      if (!isSameDestination) {
        // Only store destination if it has name or address property
        if (dest.name || dest.address) {
          const newHistory = [
            dest,
            ...navigationHistory.filter(
              item => 
                item.latitude !== dest.latitude || 
                item.longitude !== dest.longitude
            )
          ].slice(0, MAX_HISTORY_ITEMS);
          
          setNavigationHistory(newHistory);
          saveNavigationHistory(newHistory);
        }
      }
      
      // Clear any existing interval
      if (routeUpdateInterval.current) {
        clearInterval(routeUpdateInterval.current);
      }
      
      // Set up interval to periodically update route (every 5 seconds)
      const interval = setInterval(updateRoute, 5000);
      routeUpdateInterval.current = interval;
      
      console.log("Navigation started successfully");
    } catch (err) {
      console.error("Navigation error:", err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      toast.error("Navigation error", {
        description: err instanceof Error ? err.message : 'Failed to get directions'
      });
    } finally {
      setIsLoadingRoute(false);
    }
  };

  // Helper function to fetch route with retries
  const fetchAndSetRoute = async (origin: Location, dest: Location): Promise<boolean> => {
    try {
      const routeInfo = await getDirections(origin, dest);
      
      if (!routeInfo) {
        throw new Error('Could not get directions');
      }
      
      setRoute(routeInfo);
      setEta(calculateEta(routeInfo));
      return true;
    } catch (err) {
      console.error('Error fetching route:', err);
      
      // Retry logic
      if (routeRetryCount.current < maxRetries) {
        routeRetryCount.current++;
        console.log(`Retrying route fetch (${routeRetryCount.current}/${maxRetries})`);
        
        // Wait a bit before retry
        await new Promise(resolve => setTimeout(resolve, 2000));
        return fetchAndSetRoute(origin, dest);
      }
      
      throw err; // Rethrow after max retries
    }
  };

  // Stop navigation
  const stopNavigation = () => {
    console.log("Stopping navigation");
    setIsNavigating(false);
    // Keep the destination and route in memory for reference
    // but mark navigation as inactive
    
    // Clear route update interval
    if (routeUpdateInterval.current) {
      clearInterval(routeUpdateInterval.current);
      routeUpdateInterval.current = null;
    }
  };

  // Update route based on current location
  const updateRoute = async () => {
    if (!currentLocation || !destination || !isNavigating) {
      return;
    }
    
    try {
      console.log("Updating route...");
      setIsLoadingRoute(true);
      
      const routeInfo = await getDirections(currentLocation, destination);
      
      if (!routeInfo) {
        console.warn("Could not update directions");
        return;
      }
      
      console.log("Route updated successfully");
      setRoute(routeInfo);
      setEta(calculateEta(routeInfo));
    } catch (err) {
      console.error('Error updating route:', err);
      // Don't set error state for updates, just log it
    } finally {
      setIsLoadingRoute(false);
    }
  };

  // Clear navigation history
  const clearNavigationHistory = () => {
    setNavigationHistory([]);
    saveNavigationHistory([]);
    toast.success("Navigation history cleared");
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (routeUpdateInterval.current) {
        clearInterval(routeUpdateInterval.current);
      }
    };
  }, []);

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
        navigationHistory,
        startNavigation,
        stopNavigation,
        updateRoute,
        clearNavigationHistory,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};
