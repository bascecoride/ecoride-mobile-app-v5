import axios from "axios";
import { useUserStore } from "@/store/userStore";

export const getLatLong = async (placeId: string) => {
    try {
        const response = await axios.get("https://maps.googleapis.com/maps/api/place/details/json", {
            params: {
                placeid: placeId,
                key: process.env.EXPO_PUBLIC_MAP_API_KEY,
            },
        });
        const data = response.data;
        if (data.status === 'OK' && data.result) {
            const location = data.result.geometry.location;
            const address = data.result.formatted_address;

            return {
                latitude: location.lat,
                longitude: location.lng,
                address: address,
            };
        } else {
            throw new Error('Unable to fetch location details');
        }
    } catch (error) {
        throw new Error('Unable to fetch location details');
    }
}

// Simple in-memory cache for geocoding results
const geocodeCache: Record<string, { address: string, timestamp: number }> = {};

// Cache expiration time: 1 hour
const CACHE_EXPIRATION = 60 * 60 * 1000;

// Round coordinates to reduce API calls for very similar locations
const roundCoordinates = (coord: number): number => {
    // Round to 5 decimal places (about 1.1 meters precision)
    return Math.round(coord * 100000) / 100000;
};

export const reverseGeocode = async (latitude: number, longitude: number) => {
    if (!latitude || !longitude) {
        console.log('Invalid coordinates for reverse geocoding');
        return "";
    }
    
    // Round coordinates to reduce unnecessary API calls
    const roundedLat = roundCoordinates(latitude);
    const roundedLng = roundCoordinates(longitude);
    
    // Create cache key
    const cacheKey = `${roundedLat},${roundedLng}`;
    
    // Check cache first
    const now = Date.now();
    if (geocodeCache[cacheKey] && (now - geocodeCache[cacheKey].timestamp) < CACHE_EXPIRATION) {
        console.log(`Using cached address for: ${roundedLat}, ${roundedLng}`);
        return geocodeCache[cacheKey].address;
    }

    try {
        console.log(`Reverse geocoding for: ${roundedLat}, ${roundedLng}`);
        const response = await axios.get(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.EXPO_PUBLIC_MAP_API_KEY}`,
            { timeout: 10000 } // 10 second timeout
        );
        
        if (response.data.status === 'OK' && response.data.results && response.data.results.length > 0) {
            const address = response.data.results[0].formatted_address;
            console.log(`Address found: ${address}`);
            
            // Cache the result
            geocodeCache[cacheKey] = {
                address: address,
                timestamp: now
            };
            
            return address;
        } else {
            console.log('Geocoding failed: ', response.data.status, response.data.error_message || 'No error message');
            return "Selected location";
        }
    } catch (error) {
        console.log('Error during reverse geocoding: ', error);
        return "Selected location";
    }
};

function extractPlaceData(data: any) {
    return data.map((item: any) => ({
        place_id: item.place_id,
        title: item.structured_formatting.main_text,
        description: item.description
    }));
}

export const getPlacesSuggestions = async (query: string) => {
    const { location } = useUserStore.getState();
    try {
        const response = await axios.get(
            `https://maps.googleapis.com/maps/api/place/autocomplete/json`, {
            params: {
                input: query,
                location: `${location?.latitude},${location?.longitude}`,
                radius: 50000,
                components: 'country:PH',
                key: process.env.EXPO_PUBLIC_MAP_API_KEY,
            }
        }
        );
        return extractPlaceData(response.data.predictions)

    } catch (error) {
        console.error('Error fetching autocomplete suggestions:', error);
        return [];
    }
};

export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    // Safety check: ensure all coordinates are valid numbers
    if (lat1 == null || lon1 == null || lat2 == null || lon2 == null ||
        isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
        console.log('⚠️ calculateDistance: Invalid coordinates', { lat1, lon1, lat2, lon2 });
        return 0;
    }
    
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

/**
 * Calculate fare based on distance and dynamic rate structure from server
 * @param distance - Distance in kilometers
 * @param rateStructure - Optional custom rate structure (if not provided, uses default)
 */
export const calculateFare = (
    distance: number, 
    rateStructure?: Record<string, { minimumRate: number; perKmRate: number }>
) => {
    // Default rate structure (fallback if server rates not available)
    const defaultRates = {
        "Single Motorcycle": { minimumRate: 15, perKmRate: 2.5 },
        "Tricycle": { minimumRate: 20, perKmRate: 2.8 },
        "Cab": { minimumRate: 30, perKmRate: 3 },
    };

    // Use provided rate structure or default
    const rates = rateStructure || defaultRates;

    const fareCalculation = (minimumRate: number, perKmRate: number) => {
        const calculatedFare = distance * perKmRate;
        return Math.max(calculatedFare, minimumRate);
    };

    return {
        "Single Motorcycle": fareCalculation(
            rates["Single Motorcycle"].minimumRate, 
            rates["Single Motorcycle"].perKmRate
        ),
        "Tricycle": fareCalculation(
            rates["Tricycle"].minimumRate, 
            rates["Tricycle"].perKmRate
        ),
        "Cab": fareCalculation(
            rates["Cab"].minimumRate, 
            rates["Cab"].perKmRate
        ),
    };
}

function quadraticBezierCurve(p1: any, p2: any, controlPoint: any, numPoints: any) {
    const points = [];
    const step = 1 / (numPoints - 1);

    for (let t = 0; t <= 1; t += step) {
        const x =
            (1 - t) ** 2 * p1[0] +
            2 * (1 - t) * t * controlPoint[0] +
            t ** 2 * p2[0];
        const y =
            (1 - t) ** 2 * p1[1] +
            2 * (1 - t) * t * controlPoint[1] +
            t ** 2 * p2[1];
        const coord = { latitude: x, longitude: y };
        points.push(coord);
    }

    return points;
}

const calculateControlPoint = (p1: any, p2: any) => {
    const d = Math.sqrt((p2[0] - p1[0]) ** 2 + (p2[1] - p1[1]) ** 2);
    const scale = 1; // Scale factor to reduce bending
    const h = d * scale; // Reduced distance from midpoint
    const w = d / 2;
    const x_m = (p1[0] + p2[0]) / 2;
    const y_m = (p1[1] + p2[1]) / 2;

    const x_c =
        x_m +
        ((h * (p2[1] - p1[1])) /
            (2 * Math.sqrt((p2[0] - p1[0]) ** 2 + (p2[1] - p1[1]) ** 2))) *
        (w / d);
    const y_c =
        y_m -
        ((h * (p2[0] - p1[0])) /
            (2 * Math.sqrt((p2[0] - p1[0]) ** 2 + (p2[1] - p1[1]) ** 2))) *
        (w / d);

    const controlPoint = [x_c, y_c];
    return controlPoint;
};

export const getPoints = (places: any) => {
    // Safety check: ensure places array exists and has valid coordinates
    if (!places || !Array.isArray(places) || places.length < 2) {
        console.log('⚠️ getPoints: Invalid places array');
        return [];
    }
    
    const place0 = places[0];
    const place1 = places[1];
    
    // Check if both places have valid latitude and longitude
    if (!place0?.latitude || !place0?.longitude || !place1?.latitude || !place1?.longitude) {
        console.log('⚠️ getPoints: Missing coordinates in places', { place0, place1 });
        return [];
    }
    
    const p1 = [place0.latitude, place0.longitude];
    const p2 = [place1.latitude, place1.longitude];
    const controlPoint = calculateControlPoint(p1, p2);

    return quadraticBezierCurve(p1, p2, controlPoint, 100);
};

export const vehicleIcons: Record<'Single Motorcycle' | 'Tricycle' | 'Cab', { icon: any }> = {
    "Single Motorcycle": { icon: require('@/assets/icons/SingleMotorcycle-NoBG.png') },
    "Tricycle": { icon: require('@/assets/icons/Tricycle-NoBG.png') },
    "Cab": { icon: require('@/assets/icons/Car-NoBG.png') },
  };

// Calculate estimated travel time using Google Maps Distance Matrix API
export const getEstimatedTravelTime = async (
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number,
    vehicleType: 'Single Motorcycle' | 'Tricycle' | 'Cab' = 'Single Motorcycle'
) => {
    try {
        // Use motorcycle mode for bikes, driving for others
        const travelMode = vehicleType === 'Single Motorcycle' ? 'driving' : 'driving';
        
        const response = await axios.get(
            'https://maps.googleapis.com/maps/api/distancematrix/json',
            {
                params: {
                    origins: `${originLat},${originLng}`,
                    destinations: `${destLat},${destLng}`,
                    mode: travelMode,
                    key: process.env.EXPO_PUBLIC_MAP_API_KEY,
                },
                timeout: 10000
            }
        );

        if (response.data.status === 'OK' && response.data.rows[0]?.elements[0]?.status === 'OK') {
            const element = response.data.rows[0].elements[0];
            const durationInSeconds = element.duration.value;
            const distanceInMeters = element.distance.value;
            
            // Adjust duration based on vehicle type (motorcycles can be faster in traffic)
            let adjustedDuration = durationInSeconds;
            if (vehicleType === 'Single Motorcycle') {
                adjustedDuration = Math.round(durationInSeconds * 0.85); // 15% faster
            } else if (vehicleType === 'Tricycle') {
                adjustedDuration = Math.round(durationInSeconds * 1.1); // 10% slower
            }
            
            return {
                durationInSeconds: adjustedDuration,
                durationText: formatDuration(adjustedDuration),
                distanceInMeters,
                distanceText: element.distance.text,
            };
        } else {
            throw new Error('Distance Matrix API returned no results');
        }
    } catch (error) {
        console.log('Error fetching travel time from Google Maps:', error);
        // Fallback to simple calculation based on distance
        return calculateFallbackTravelTime(originLat, originLng, destLat, destLng, vehicleType);
    }
};

// Fallback calculation when API fails
const calculateFallbackTravelTime = (
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number,
    vehicleType: 'Single Motorcycle' | 'Tricycle' | 'Cab'
) => {
    const distanceKm = calculateDistance(originLat, originLng, destLat, destLng);
    const distanceInMeters = distanceKm * 1000;
    
    // Average speeds in km/h for different vehicle types in city traffic
    const averageSpeeds = {
        'Single Motorcycle': 30, // Faster due to maneuverability
        'Tricycle': 20,          // Slower, local roads
        'Cab': 25,               // Moderate speed
    };
    
    const speed = averageSpeeds[vehicleType];
    const durationInHours = distanceKm / speed;
    const durationInSeconds = Math.round(durationInHours * 3600);
    
    return {
        durationInSeconds,
        durationText: formatDuration(durationInSeconds),
        distanceInMeters,
        distanceText: `${distanceKm.toFixed(1)} km`,
    };
};

// Format duration in seconds to human-readable text
const formatDuration = (seconds: number): string => {
    if (seconds < 60) {
        return '< 1 min';
    }
    
    const minutes = Math.round(seconds / 60);
    
    if (minutes < 60) {
        return `${minutes} min`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
        return `${hours} hr`;
    }
    
    return `${hours} hr ${remainingMinutes} min`;
};

// Calculate estimated arrival time
export const calculateArrivalTime = (durationInSeconds: number): string => {
    const now = new Date();
    const arrivalTime = new Date(now.getTime() + durationInSeconds * 1000);
    
    // Format time as "h:mm am/pm"
    let hours = arrivalTime.getHours();
    const minutes = arrivalTime.getMinutes();
    const ampm = hours >= 12 ? 'pm' : 'am';
    
    hours = hours % 12;
    hours = hours ? hours : 12; // Convert 0 to 12
    
    const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
    
    return `${hours}:${minutesStr} ${ampm}`;
};
  