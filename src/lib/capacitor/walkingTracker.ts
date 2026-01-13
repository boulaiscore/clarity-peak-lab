import { Geolocation, Position, WatchPositionCallback } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

export interface WalkingProgress {
  distanceMeters: number;
  durationMinutes: number;
  isTracking: boolean;
  lastPosition: Position | null;
}

// Minimum movement speed to count as walking (m/s) - approx 2 km/h
const MIN_WALKING_SPEED = 0.5;
// Maximum speed to count as walking (m/s) - approx 10 km/h (to filter out driving)
const MAX_WALKING_SPEED = 3.0;

class WalkingTrackerService {
  private watchId: string | null = null;
  private startTime: Date | null = null;
  private positions: Position[] = [];
  private totalDistance: number = 0;
  private onProgressCallback: ((progress: WalkingProgress) => void) | null = null;

  async checkPermissions(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      // In browser, check if geolocation is available
      return 'geolocation' in navigator;
    }
    
    try {
      const status = await Geolocation.checkPermissions();
      return status.location === 'granted';
    } catch (error) {
      console.error('Error checking permissions:', error);
      return false;
    }
  }

  async requestPermissions(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      // In browser, permissions are requested when starting
      return true;
    }
    
    try {
      const status = await Geolocation.requestPermissions();
      return status.location === 'granted';
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }

  async startTracking(onProgress: (progress: WalkingProgress) => void): Promise<boolean> {
    const hasPermission = await this.checkPermissions();
    
    if (!hasPermission) {
      const granted = await this.requestPermissions();
      if (!granted) {
        console.error('Location permission denied');
        return false;
      }
    }

    this.onProgressCallback = onProgress;
    this.startTime = new Date();
    this.positions = [];
    this.totalDistance = 0;

    try {
      if (Capacitor.isNativePlatform()) {
        // Native platform - use Capacitor Geolocation
        this.watchId = await Geolocation.watchPosition(
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 3000,
          },
          (position, err) => {
            if (err) {
              console.error('Watch position error:', err);
              return;
            }
            if (position) {
              this.handleNewPosition(position);
            }
          }
        );
      } else {
        // Browser fallback - use web API
        if ('geolocation' in navigator) {
          const id = navigator.geolocation.watchPosition(
            (pos) => {
              const position: Position = {
                coords: {
                  latitude: pos.coords.latitude,
                  longitude: pos.coords.longitude,
                  accuracy: pos.coords.accuracy,
                  altitude: pos.coords.altitude,
                  altitudeAccuracy: pos.coords.altitudeAccuracy,
                  heading: pos.coords.heading,
                  speed: pos.coords.speed,
                },
                timestamp: pos.timestamp,
              };
              this.handleNewPosition(position);
            },
            (error) => console.error('Geolocation error:', error),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 3000 }
          );
          this.watchId = id.toString();
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error starting tracking:', error);
      return false;
    }
  }

  private handleNewPosition(position: Position) {
    if (this.positions.length > 0) {
      const lastPos = this.positions[this.positions.length - 1];
      const distance = this.calculateDistance(
        lastPos.coords.latitude,
        lastPos.coords.longitude,
        position.coords.latitude,
        position.coords.longitude
      );
      
      const timeDiff = (position.timestamp - lastPos.timestamp) / 1000; // seconds
      const speed = timeDiff > 0 ? distance / timeDiff : 0;
      
      // Only count distance if speed is within walking range
      if (speed >= MIN_WALKING_SPEED && speed <= MAX_WALKING_SPEED) {
        this.totalDistance += distance;
      }
    }

    this.positions.push(position);
    this.notifyProgress();
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    // Haversine formula
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  private notifyProgress() {
    if (this.onProgressCallback && this.startTime) {
      const durationMs = Date.now() - this.startTime.getTime();
      const durationMinutes = Math.floor(durationMs / 60000);
      
      this.onProgressCallback({
        distanceMeters: Math.round(this.totalDistance),
        durationMinutes,
        isTracking: true,
        lastPosition: this.positions.length > 0 ? this.positions[this.positions.length - 1] : null,
      });
    }
  }

  async stopTracking(): Promise<WalkingProgress> {
    const progress: WalkingProgress = {
      distanceMeters: Math.round(this.totalDistance),
      durationMinutes: this.startTime 
        ? Math.floor((Date.now() - this.startTime.getTime()) / 60000)
        : 0,
      isTracking: false,
      lastPosition: this.positions.length > 0 ? this.positions[this.positions.length - 1] : null,
    };

    if (this.watchId) {
      try {
        if (Capacitor.isNativePlatform()) {
          await Geolocation.clearWatch({ id: this.watchId });
        } else if ('geolocation' in navigator) {
          navigator.geolocation.clearWatch(parseInt(this.watchId));
        }
      } catch (error) {
        console.error('Error stopping tracking:', error);
      }
    }

    this.watchId = null;
    this.startTime = null;
    this.positions = [];
    this.totalDistance = 0;
    this.onProgressCallback = null;

    return progress;
  }

  isTracking(): boolean {
    return this.watchId !== null;
  }

  getCurrentProgress(): WalkingProgress {
    return {
      distanceMeters: Math.round(this.totalDistance),
      durationMinutes: this.startTime 
        ? Math.floor((Date.now() - this.startTime.getTime()) / 60000)
        : 0,
      isTracking: this.isTracking(),
      lastPosition: this.positions.length > 0 ? this.positions[this.positions.length - 1] : null,
    };
  }
}

export const walkingTracker = new WalkingTrackerService();
