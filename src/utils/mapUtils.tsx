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

export const calculateFare = (distance: number) => {
    const rateStructure = {
        "Single Motorcycle": { baseFare: 10, perKmRate: 5, minimumFare: 25 },
        "Tricycle": { baseFare: 15, perKmRate: 7, minimumFare: 30 },
        "Cab": { baseFare: 20, perKmRate: 10, minimumFare: 50 },
    };

    const fareCalculation = (baseFare: number, perKmRate: number, minimumFare: number) => {
        const calculatedFare = baseFare + (distance * perKmRate);
        return Math.max(calculatedFare, minimumFare);
    };

    return {
        "Single Motorcycle": fareCalculation(rateStructure["Single Motorcycle"].baseFare, rateStructure["Single Motorcycle"].perKmRate, rateStructure["Single Motorcycle"].minimumFare),
        "Tricycle": fareCalculation(rateStructure["Tricycle"].baseFare, rateStructure["Tricycle"].perKmRate, rateStructure["Tricycle"].minimumFare),
        "Cab": fareCalculation(rateStructure["Cab"].baseFare, rateStructure["Cab"].perKmRate, rateStructure["Cab"].minimumFare),
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
    const p1 = [places[0].latitude, places[0].longitude];
    const p2 = [places[1].latitude, places[1].longitude];
    const controlPoint = calculateControlPoint(p1, p2);

    return quadraticBezierCurve(p1, p2, controlPoint, 100);
};

export const vehicleIcons: Record<'Single Motorcycle' | 'Tricycle' | 'Cab', { icon: any }> = {
    "Single Motorcycle": { icon: require('@/assets/icons/bike.png') },
    "Tricycle": { icon: require('@/assets/icons/auto.png') },
    "Cab": { icon: require('@/assets/icons/cab.png') },
  };
  