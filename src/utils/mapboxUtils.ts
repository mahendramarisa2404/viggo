
import axios from 'axios';
import { Location, RouteInfo, EtaInfo } from '@/types';

// Using the Mapbox token from the user's request
const MAPBOX_TOKEN = 'pk.eyJ1IjoibWFoaW5kcmF4OTQ0MSIsImEiOiJjbTlteGRuaHcwZzJ4MmpxdXZuaTB4dno5In0.3E8Cne4Zb52xaNyXJlSa4Q';

/**
 * Get directions from Mapbox API
 * @param origin Starting location
 * @param destination Ending location
 * @returns Promise with route information
 */
export const getDirections = async (
  origin: Location,
  destination: Location
): Promise<RouteInfo | null> => {
  try {
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`;
    
    const response = await axios.get(url, {
      params: {
        access_token: MAPBOX_TOKEN,
        geometries: 'geojson',
        overview: 'full',
        steps: true,
      },
    });

    if (response.data.routes && response.data.routes.length > 0) {
      const route = response.data.routes[0];
      return {
        distance: route.distance,
        duration: route.duration,
        geometry: route.geometry,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching directions from Mapbox:', error);
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
  } else {
    return `${minutes}m`;
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
