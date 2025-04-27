
import axios from 'axios';
import { Location, RouteInfo, EtaInfo } from '@/types';

// Centralized Mapbox token - this should be a valid public token
// Note: If token expires, replace with a new one from mapbox.com
export const MAPBOX_TOKEN = 'pk.eyJ1IjoibG92YWJsZS1kZXYiLCJhIjoiY2xzOXJ0cWt2MGE5cDJrcGF0cDR2MXltbiJ9.7J83dSH6KZ_367YgfrmTJg';

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
    // Updated to use driving-traffic profile for real-time traffic conditions
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`;
    
    const response = await axios.get(url, {
      params: {
        access_token: MAPBOX_TOKEN,
        geometries: 'geojson',
        overview: 'full',
        steps: true,
        alternatives: true, // Get alternative routes if available
        annotations: 'distance,duration,speed', // Get additional route details
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

/**
 * Check if Mapbox token is valid
 * @returns Promise that resolves to true if token is valid
 */
export const verifyMapboxToken = async (): Promise<boolean> => {
  try {
    const response = await axios.get(
      `https://api.mapbox.com/tokens/v2?access_token=${MAPBOX_TOKEN}`
    );
    return response.status === 200;
  } catch (error) {
    console.error('Mapbox token validation error:', error);
    return false;
  }
};
