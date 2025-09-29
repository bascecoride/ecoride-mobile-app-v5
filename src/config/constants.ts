// API configuration
export const API_URL = 'http://localhost:3000';
export const API_AUTH_URL = `${API_URL}/api/auth`;
export const API_RIDE_URL = `${API_URL}/ride`;

// Socket configuration
export const SOCKET_URL = 'http://localhost:3000';

// Ride status constants
export const RIDE_STATUS = {
  SEARCHING: 'SEARCHING_FOR_RIDER',
  START: 'START',
  ARRIVED: 'ARRIVED',
  COMPLETED: 'COMPLETED',
};

// Refresh intervals (in milliseconds)
export const REFRESH_INTERVALS = {
  SOCKET_REFRESH: 3000,
  API_BACKUP_REFRESH: 5000,
  LOCATION_UPDATE: 10000,
};

// Default location (Manila, Philippines)
export const DEFAULT_LOCATION = {
  latitude: 14.5995,
  longitude: 120.9842,
  address: "Manila, Philippines (Fallback)",
  heading: 0,
};
