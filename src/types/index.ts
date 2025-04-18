
// Common types for the application

export interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
}

export interface RouteInfo {
  distance: number; // in meters
  duration: number; // in seconds
  geometry: {
    coordinates: [number, number][];
    type: string;
  };
}

export interface SpeedData {
  speed: number; // in km/h
  timestamp: number;
  source: 'GPS' | 'CAN' | 'ESTIMATED';
}

export interface EtaInfo {
  arrivalTime: Date;
  remainingDistance: number; // in meters
  remainingTime: number; // in seconds
}

export interface CollegeInfo {
  name: string;
  location: Location;
  address: string;
  notificationRadius: number; // in meters
}

export interface GpsAccuracy {
  level: 'high' | 'medium' | 'low' | 'unknown';
  value: number | null; // in meters
}
