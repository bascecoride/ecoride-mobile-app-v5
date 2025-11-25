import { api } from "./apiInterceptors";
import { Alert } from "react-native";

// Cache for fare rates to reduce API calls
let fareRatesCache: any = null;
let lastFetchTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

export interface FareRate {
  vehicleType: string;
  minimumRate: number;
  perKmRate: number;
  updatedBy?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Get all fare rates from server
 * Uses caching to reduce API calls
 */
export const getAllFareRates = async (forceRefresh: boolean = false): Promise<FareRate[]> => {
  try {
    const now = Date.now();
    
    // Return cached data if available and not expired
    if (!forceRefresh && fareRatesCache && (now - lastFetchTime) < CACHE_DURATION) {
      console.log('📊 Using cached fare rates');
      return fareRatesCache;
    }

    console.log('📊 Fetching fare rates from server...');
    const response = await api.get('/api/fare-rates');
    
    if (response.data && response.data.fareRates) {
      fareRatesCache = response.data.fareRates;
      lastFetchTime = now;
      console.log('✅ Fare rates fetched successfully:', fareRatesCache.length);
      return fareRatesCache;
    }
    
    throw new Error('Invalid response format');
  } catch (error: any) {
    console.error('❌ Error fetching fare rates:', error.response?.data || error.message);
    
    // Return default rates as fallback
    console.log('⚠️ Using default fare rates as fallback');
    return getDefaultFareRates();
  }
};

/**
 * Get fare rate for specific vehicle type
 */
export const getFareRateByVehicle = async (vehicleType: string): Promise<FareRate | null> => {
  try {
    const fareRates = await getAllFareRates();
    const rate = fareRates.find(rate => rate.vehicleType === vehicleType);
    return rate || null;
  } catch (error) {
    console.error('Error getting fare rate for vehicle:', error);
    return null;
  }
};

/**
 * Get default fare rates (fallback when server is unavailable)
 */
export const getDefaultFareRates = (): FareRate[] => {
  return [
    { vehicleType: "Single Motorcycle", minimumRate: 15, perKmRate: 2.5 },
    { vehicleType: "Tricycle", minimumRate: 20, perKmRate: 2.8 },
    { vehicleType: "Cab", minimumRate: 30, perKmRate: 3 },
  ];
};

/**
 * Clear fare rates cache (useful when you know rates have been updated)
 */
export const clearFareRatesCache = () => {
  fareRatesCache = null;
  lastFetchTime = 0;
  console.log('🗑️ Fare rates cache cleared');
};

/**
 * Get fare rates as a map for easy lookup
 */
export const getFareRatesMap = async (): Promise<Record<string, { minimumRate: number; perKmRate: number }>> => {
  const fareRates = await getAllFareRates();
  const ratesMap: Record<string, { minimumRate: number; perKmRate: number }> = {};
  
  fareRates.forEach(rate => {
    ratesMap[rate.vehicleType] = {
      minimumRate: rate.minimumRate,
      perKmRate: rate.perKmRate,
    };
  });
  
  return ratesMap;
};
