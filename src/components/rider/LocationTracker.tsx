import React, { useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { useRiderStore } from '@/store/riderStore';
import { useWS } from '@/service/WSProvider';
import { AppState, AppStateStatus } from 'react-native';

const LocationTracker: React.FC = () => {
  const { onDuty, setLocation } = useRiderStore();
  const { emit } = useWS();
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const appState = useRef(AppState.currentState);

  // Handle location tracking
  const startLocationTracking = async () => {
    try {
      // Prevent multiple simultaneous location tracking attempts
      if (locationSubscription.current) {
        console.log('Location tracking already active');
        return;
      }

      // Request both foreground and background permissions
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      if (foregroundStatus !== 'granted') {
        console.log('Foreground location permission denied');
        return;
      }

      // Check if location services are enabled
      const isLocationEnabled = await Location.hasServicesEnabledAsync();
      if (!isLocationEnabled) {
        console.log('Location services are not enabled - using fallback location');
        // Use fallback location for testing
        const fallbackLocation = {
          latitude: 14.5995,
          longitude: 120.9842,
          address: "Manila, Philippines (Fallback)",
          heading: 0,
        };
        setLocation(fallbackLocation);
        emit("goOnDuty", fallbackLocation);
        return;
      }

      // Get initial location with better error handling
      let initialLocation;
      try {
        initialLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced, // Changed from High to Balanced
        });
      } catch (locationError) {
        console.log('Failed to get current location, using fallback:', locationError);
        // Use fallback location
        const fallbackLocation = {
          latitude: 14.5995,
          longitude: 120.9842,
          address: "Manila, Philippines (Fallback)",
          heading: 0,
        };
        setLocation(fallbackLocation);
        emit("goOnDuty", fallbackLocation);
        return;
      }
      
      const { latitude, longitude, heading } = initialLocation.coords;
      
      // Update local store
      setLocation({
        latitude,
        longitude,
        address: 'Current Location',
        heading: heading || 0,
      });
      
      // Send initial location to server
      emit('updateLocation', {
        latitude,
        longitude,
        heading: heading || 0,
      });

      // Start watching position
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 10, // Update every 10 meters
          timeInterval: 5000, // Or at least every 5 seconds
        },
        (location) => {
          const { latitude, longitude, heading } = location.coords;
          
          // Update local store
          setLocation({
            latitude,
            longitude,
            address: 'Current Location',
            heading: heading || 0,
          });
          
          // Send location update to server
          emit('updateLocation', {
            latitude,
            longitude,
            heading: heading || 0,
          });
        }
      );
    } catch (error) {
      console.error('Error starting location tracking:', error);
    }
  };

  const stopLocationTracking = () => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
  };

  // Handle app state changes
  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (onDuty) {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App has come to the foreground
        startLocationTracking();
      } else if (
        appState.current === 'active' &&
        nextAppState.match(/inactive|background/)
      ) {
        // App has gone to the background
        stopLocationTracking();
      }
    }
    appState.current = nextAppState;
  };

  useEffect(() => {
    // Start or stop location tracking based on duty status
    if (onDuty) {
      startLocationTracking();
    } else {
      stopLocationTracking();
    }

    // Set up app state change listener
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      stopLocationTracking();
      subscription.remove();
    };
  }, [onDuty]);

  // This component doesn't render anything
  return null;
};

export default LocationTracker;
