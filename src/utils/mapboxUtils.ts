
import axios from 'axios';
import { Location, RouteInfo, EtaInfo } from '@/types';

// Using the same Mapbox token for consistency
const MAPBOX_TOKEN = 'pk.eyJ1IjoibWFoaW5kcmF4OTQ0MSIsImEiOiJjbTlteGRuaHcwZzJ4MmpxdXZuaTB4dno5In0.3E8Cne4Zb52xaNyXJlSa4Q';

// Cache for routes to reduce API calls
const routeCache = new Map<string, {
  routeInfo: RouteInfo;
  timestamp: number;
}>();

// Cache TTL in milliseconds (30 seconds)
const CACHE_TTL = 30000;

/**
 * Generate a cache key for a route
 * @param origin Starting location
 * @param destination Ending location
 * @returns Cache key string
 */
const generateCacheKey = (origin: Location, destination: Location): string => {
  return `${origin.latitude.toFixed(5)},${origin.longitude.toFixed(5)}_${destination.latitude.toFixed(5)},${destination.longitude.toFixed(5)}`;
};

/**
 * Get directions from Mapbox API with caching and fallbacks
 * @param origin Starting location
 * @param destination Ending location
 * @returns Promise with route information
 */
export const getDirections = async (
  origin: Location,
  destination: Location
): Promise<RouteInfo | null> => {
  try {
    // Check cache first
    const cacheKey = generateCacheKey(origin, destination);
    const cachedRoute = routeCache.get(cacheKey);
    
    if (cachedRoute && Date.now() - cachedRoute.timestamp < CACHE_TTL) {
      return cachedRoute.routeInfo;
    }
    
    // Try with traffic profile first
    const trafficRoute = await fetchDirections(origin, destination, 'driving-traffic');
    
    if (trafficRoute) {
      // Cache the result
      routeCache.set(cacheKey, {
        routeInfo: trafficRoute,
        timestamp: Date.now()
      });
      
      return trafficRoute;
    }
    
    // Fall back to regular driving profile if traffic profile fails
    const regularRoute = await fetchDirections(origin, destination, 'driving');
    
    if (regularRoute) {
      // Cache the result
      routeCache.set(cacheKey, {
        routeInfo: regularRoute,
        timestamp: Date.now()
      });
      
      return regularRoute;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching directions from Mapbox:', error);
    return null;
  }
};

/**
 * Internal function to fetch directions from Mapbox API
 * @param origin Starting location
 * @param destination Ending location
 * @param profile Routing profile to use
 * @returns Promise with route information
 */
const fetchDirections = async (
  origin: Location,
  destination: Location,
  profile: 'driving' | 'driving-traffic' | 'walking' | 'cycling'
): Promise<RouteInfo | null> => {
  try {
    const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`;
    
    const response = await axios.get(url, {
      params: {
        access_token: MAPBOX_TOKEN,
        geometries: 'geojson',
        overview: 'full',
        steps: true,
        alternatives: true, // Get alternative routes if available
        annotations: 'distance,duration,speed,congestion', // Get additional route details
        language: 'en',
      },
      timeout: 5000, // 5 second timeout to prevent UI freezing
    });

    if (response.data.routes && response.data.routes.length > 0) {
      // Pick the fastest route
      const routes = response.data.routes;
      
      // Sort by duration
      routes.sort((a: any, b: any) => a.duration - b.duration);
      
      const route = routes[0];
      return {
        distance: route.distance,
        duration: route.duration,
        geometry: route.geometry,
      };
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching ${profile} directions:`, error);
    return null;
  }
};

/**
 * Calculate ETA based on route information and current time
 * @param routeInfo Route information from Mapbox
 * @returns ETA information
 */
export const calculateEta = (routeInfo: RouteInfo): EtaInfo => {
  const now = new Date();
  const arrivalTime = new Date(now.getTime() + routeInfo.duration * 1000);
  
  return {
    arrivalTime,
    remainingDistance: routeInfo.distance,
    remainingTime: routeInfo.duration,
  };
};

/**
 * Format remaining time in a human-readable format
 * @param seconds Time in seconds
 * @returns Formatted time string (e.g., "1h 25m")
 */
export const formatRemainingTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m`;
  } else {
    return `<1m`;
  }
};

/**
 * Format distance in a human-readable format
 * @param meters Distance in meters
 * @returns Formatted distance string (e.g., "1.2 km" or "800 m")
 */
export const formatDistance = (meters: number): string => {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  } else {
    return `${Math.round(meters)} m`;
  }
};

/**
 * Create a GeoJSON source for Mapbox from route geometry
 * @param routeInfo Route information from Mapbox
 * @returns GeoJSON object for Mapbox
 */
export const createRouteGeoJson = (routeInfo: RouteInfo): GeoJSON.Feature => {
  return {
    type: 'Feature' as const,
    properties: {},
    geometry: routeInfo.geometry as GeoJSON.Geometry,
  };
};
