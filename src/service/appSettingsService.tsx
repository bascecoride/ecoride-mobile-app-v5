import { BASE_URL } from "./config";

// Cache for distance radius to avoid frequent API calls
let cachedDistanceRadius: number | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 60000; // 1 minute cache

export interface DistanceRadiusResponse {
  distanceRadius: number;
  unit: string;
  meters: number;
}

/**
 * Fetch the distance radius setting from the server
 * This is a public endpoint that doesn't require authentication
 */
export const getDistanceRadius = async (): Promise<DistanceRadiusResponse> => {
  try {
    // Check if cache is valid
    if (cachedDistanceRadius !== null && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
      console.log(`📏 Using cached distance radius: ${cachedDistanceRadius / 1000}km`);
      return {
        distanceRadius: cachedDistanceRadius / 1000,
        unit: "km",
        meters: cachedDistanceRadius
      };
    }

    console.log("📏 Fetching distance radius from server...");
    const response = await fetch(`${BASE_URL}/api/app-settings/distance-radius`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch distance radius");
    }

    const data = await response.json();
    
    // Cache the result
    cachedDistanceRadius = data.meters;
    cacheTimestamp = Date.now();
    
    console.log(`📏 Distance radius fetched: ${data.distanceRadius}km (${data.meters}m)`);
    return data;
  } catch (error) {
    console.error("❌ Error fetching distance radius:", error);
    // Return default value if fetch fails
    return {
      distanceRadius: 3,
      unit: "km",
      meters: 3000
    };
  }
};

/**
 * Get distance radius in meters (convenience function)
 */
export const getDistanceRadiusInMeters = async (): Promise<number> => {
  const data = await getDistanceRadius();
  return data.meters;
};

/**
 * Clear the cached distance radius (useful when admin updates the setting)
 */
export const clearDistanceRadiusCache = () => {
  cachedDistanceRadius = null;
  cacheTimestamp = null;
  console.log("📏 Distance radius cache cleared");
};
