
import { Location, GpsAccuracy } from '@/types';

/**
 * Calculate distance between two coordinates using the Haversine formula
 * @param location1 First location
 * @param location2 Second location
 * @returns Distance in meters
 */
export const calculateDistance = (location1: Location, location2: Location): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (location1.latitude * Math.PI) / 180;
  const φ2 = (location2.latitude * Math.PI) / 180;
  const Δφ = ((location2.latitude - location1.latitude) * Math.PI) / 180;
  const Δλ = ((location2.longitude - location1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

/**
 * Calculate speed based on two locations with timestamps
 * @param oldLocation Previous location with timestamp
 * @param newLocation Current location with timestamp
 * @returns Speed in km/h
 */
export const calculateSpeed = (oldLocation: Location, newLocation: Location): number => {
  if (!oldLocation.timestamp || !newLocation.timestamp) {
    return 0;
  }

  const distance = calculateDistance(oldLocation, newLocation); // in meters
  const timeDiff = (newLocation.timestamp - oldLocation.timestamp) / 1000; // in seconds
  
  // Return 0 for invalid time differences or very small movements
  if (timeDiff <= 0 || timeDiff > 10 || distance < 1) {
    return 0;
  }
  
  // Speed in m/s converted to km/h
  const speedMps = distance / timeDiff;
  
  // Filter out unrealistically high speeds (for example due to GPS jumps)
  if (speedMps > 50) { // Over 180 km/h is likely an error
    return 0;
  }
  
  const speedKmh = speedMps * 3.6;
  
  return Math.round(speedKmh * 10) / 10; // Round to 1 decimal place
};

/**
 * Calculate a more accurate speed by using multiple location points
 * @param locations Array of recent locations with timestamps
 * @returns Speed in km/h
 */
export const calculateAverageSpeed = (locations: Location[]): number => {
  if (locations.length < 2) return 0;
  
  // Sort locations by timestamp
  const sortedLocs = [...locations].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
  
  // Calculate speeds between consecutive locations
  const speeds: number[] = [];
  for (let i = 0; i < sortedLocs.length - 1; i++) {
    const speed = calculateSpeed(sortedLocs[i], sortedLocs[i+1]);
    if (speed > 0) speeds.push(speed);
  }
  
  // Return 0 if no valid speeds
  if (speeds.length === 0) return 0;
  
  // Remove outliers (highest and lowest if we have enough data points)
  if (speeds.length >= 4) {
    speeds.sort((a, b) => a - b);
    speeds.pop(); // Remove highest
    speeds.shift(); // Remove lowest
  }
  
  // Calculate average
  return speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length;
};

/**
 * Determine GPS accuracy level
 * @param accuracy Accuracy in meters
 * @returns GpsAccuracy object with level and value
 */
export const getGpsAccuracyLevel = (accuracy: number | undefined): GpsAccuracy => {
  if (accuracy === undefined) {
    return { level: 'unknown', value: null };
  }
  
  if (accuracy <= 5) {
    return { level: 'high', value: accuracy };
  } else if (accuracy <= 15) {
    return { level: 'medium', value: accuracy };
  } else {
    return { level: 'low', value: accuracy };
  }
};

/**
 * Check if user is within notification radius of college
 * @param userLocation Current user location
 * @param collegeLocation College location
 * @param radius Radius in meters
 * @returns Boolean indicating if user is within radius
 */
export const isWithinRadius = (
  userLocation: Location, 
  collegeLocation: Location, 
  radius: number
): boolean => {
  const distance = calculateDistance(userLocation, collegeLocation);
  return distance <= radius;
};
