import { Location } from '@/types';

// Size of the sliding window for speed calculation (in locations)
const WINDOW_SIZE = 5;

// Maximum acceleration/deceleration in m/s²
const MAX_ACCELERATION = 3.5;

// Default time window in milliseconds
const DEFAULT_TIME_WINDOW_MS = 5000;

export interface SpeedSample {
  speed: number;
  timestamp: number;
  confidence: number; // 0 to 1
}

export class SpeedCalculator {
  private locationHistory: Location[] = [];
  private speedHistory: SpeedSample[] = [];
  private lastCalculatedSpeed: number = 0;
  private lastTimestamp: number = 0;
  private calibrationFactor: number = 1.0;

  /**
   * Add a new location to the calculator
   * @param location The new location to add
   * @returns The calculated speed
   */
  public addLocation(location: Location): number {
    // Check if location has valid data
    if (!location || !location.timestamp || location.latitude === undefined || location.longitude === undefined) {
      return this.lastCalculatedSpeed;
    }
    
    // Add to history
    this.locationHistory.push(location);
    
    // Keep history size limited
    if (this.locationHistory.length > WINDOW_SIZE) {
      this.locationHistory.shift();
    }
    
    // Need at least 2 locations to calculate speed
    if (this.locationHistory.length < 2) {
      return 0;
    }
    
    return this.calculateCurrentSpeed();
  }
  
  /**
   * Calculate current speed using the sliding window approach
   */
  private calculateCurrentSpeed(): number {
    if (this.locationHistory.length < 2) {
      return 0;
    }
    
    const currentLocation = this.locationHistory[this.locationHistory.length - 1];
    const currentTime = currentLocation.timestamp;

    // Calculate speeds for each segment with proper weighting
    let totalWeight = 0;
    let weightedSpeedSum = 0;
    let avgConfidence = 0;
    
    // Get all available segments from history
    for (let i = 0; i < this.locationHistory.length - 1; i++) {
      const start = this.locationHistory[i];
      const end = this.locationHistory[i + 1];
      
      // Skip invalid segments
      if (!start.timestamp || !end.timestamp) continue;
      
      const timeDiff = end.timestamp - start.timestamp;
      // Skip segments with too small time difference (likely duplicate readings)
      if (timeDiff < 200) continue;
      
      // Calculate raw speed for this segment
      const segmentSpeed = this.calculateSpeedBetweenPoints(start, end);
      
      // Calculate weight based on recency and accuracy
      const recency = 1 - (currentTime - end.timestamp) / DEFAULT_TIME_WINDOW_MS;
      const recencyWeight = Math.max(0.1, Math.min(1, recency));
      
      // Calculate accuracy weight
      const accuracy1 = start.accuracy || 100;
      const accuracy2 = end.accuracy || 100;
      const accuracyFactor = Math.min(1, 10 / Math.max(accuracy1, accuracy2));
      
      // Combined weight
      const weight = recencyWeight * (0.5 + 0.5 * accuracyFactor);
      
      // Add to weighted sum
      weightedSpeedSum += segmentSpeed * weight;
      totalWeight += weight;
      
      // Track confidence
      avgConfidence += accuracyFactor;
    }
    
    // Calculate final speed
    if (totalWeight > 0) {
      const avgSpeed = weightedSpeedSum / totalWeight;
      avgConfidence = avgConfidence / (this.locationHistory.length - 1);
      
      // Apply physics-based constraints
      const speedSample: SpeedSample = {
        speed: this.applyPhysicsConstraints(avgSpeed),
        timestamp: currentTime,
        confidence: avgConfidence
      };
      
      // Add to speed history
      this.speedHistory.push(speedSample);
      if (this.speedHistory.length > WINDOW_SIZE) {
        this.speedHistory.shift();
      }
      
      // Apply calibration factor
      const calibratedSpeed = speedSample.speed * this.calibrationFactor;
      
      // Round to one decimal place
      this.lastCalculatedSpeed = Math.round(calibratedSpeed * 10) / 10;
      this.lastTimestamp = currentTime;
      
      return this.lastCalculatedSpeed;
    }
    
    return this.lastCalculatedSpeed;
  }
  
  /**
   * Apply physics-based constraints to the speed calculation
   * @param rawSpeed The raw calculated speed
   * @returns The constrained speed
   */
  private applyPhysicsConstraints(rawSpeed: number): number {
    if (this.lastTimestamp === 0) {
      return rawSpeed;
    }
    
    const currentTime = this.locationHistory[this.locationHistory.length - 1].timestamp;
    const timeDiff = (currentTime - this.lastTimestamp) / 1000; // Convert to seconds
    
    if (timeDiff <= 0) {
      return this.lastCalculatedSpeed;
    }
    
    // Calculate maximum allowed speed change based on physics
    const maxSpeedChange = MAX_ACCELERATION * timeDiff;
    
    // Constrain speed change
    if (Math.abs(rawSpeed - this.lastCalculatedSpeed) > maxSpeedChange) {
      if (rawSpeed > this.lastCalculatedSpeed) {
        return this.lastCalculatedSpeed + maxSpeedChange;
      } else {
        return this.lastCalculatedSpeed - maxSpeedChange;
      }
    }
    
    return rawSpeed;
  }
  
  /**
   * Calculate speed between two points in km/h
   */
  private calculateSpeedBetweenPoints(start: Location, end: Location): number {
    const R = 6371000; // Earth radius in meters
    const φ1 = this.toRadians(start.latitude);
    const φ2 = this.toRadians(end.latitude);
    const Δφ = this.toRadians(end.latitude - start.latitude);
    const Δλ = this.toRadians(end.longitude - start.longitude);
    
    // Haversine formula
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // in meters
    
    const timeDiff = (end.timestamp - start.timestamp) / 1000 / 60 / 60; // in hours
    
    if (timeDiff <= 0) return 0;
    
    // speed in km/h
    return (distance / 1000) / timeDiff;
  }
  
  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * Math.PI / 180;
  }
  
  /**
   * Set calibration factor
   * @param factor The calibration factor (e.g., 1.05 for +5% adjustment)
   */
  public setCalibrationFactor(factor: number): void {
    if (factor > 0.5 && factor < 1.5) {
      this.calibrationFactor = factor;
    }
  }
  
  /**
   * Get the last calculated speed
   */
  public getSpeed(): number {
    return this.lastCalculatedSpeed;
  }
  
  /**
   * Get confidence in current speed calculation (0-1)
   */
  public getConfidence(): number {
    if (this.speedHistory.length === 0) return 0;
    
    // Average of recent confidence values
    return this.speedHistory.reduce((sum, sample) => sum + sample.confidence, 0) / 
           this.speedHistory.length;
  }
  
  /**
   * Reset the calculator
   */
  public reset(): void {
    this.locationHistory = [];
    this.speedHistory = [];
    this.lastCalculatedSpeed = 0;
    this.lastTimestamp = 0;
  }
}

// Create and export a singleton instance
export const speedCalculator = new SpeedCalculator();
