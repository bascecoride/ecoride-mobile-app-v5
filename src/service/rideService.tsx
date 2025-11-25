import { router } from "expo-router";
import { api } from "./apiInterceptors";
import { Alert } from "react-native";
import { resetAndNavigate } from "@/utils/Helpers";

interface coords {
  address: string;
  latitude: number;
  longitude: number;
  landmark?: string; // Landmark description to help driver find passenger
}

// Vehicle passenger limits
export const VEHICLE_PASSENGER_LIMITS = {
  "Single Motorcycle": 1,
  "Tricycle": 3,
  "Cab": 4,
} as const;

export type VehicleType = keyof typeof VEHICLE_PASSENGER_LIMITS;

export const createRide = async (payload: {
  vehicle: VehicleType;
  pickup: coords;
  drop: coords;
  passengerCount?: number; // Number of passengers joining the ride
}) => {
  try {
    console.log("Sending ride creation request with payload:", JSON.stringify(payload, null, 2));
    
    const res = await api.post(`/ride/create`, payload);
    
    console.log("Ride created successfully:", res.data);
    
    router?.navigate({
      pathname: "/customer/liveride",
      params: {
        id: res?.data?.ride?._id,
      },
    });
  } catch (error: any) {
    console.error("Error:Create Ride ", error);
    
    // Enhanced error logging
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
      console.error("Response headers:", error.response.headers);
      
      // Show specific error message from server if available
      const errorMessage = error.response.data?.message || error.response.data?.error || "Failed to create ride";
      Alert.alert("Error", errorMessage);
    } else if (error.request) {
      console.error("Request error:", error.request);
      Alert.alert("Network Error", "Unable to connect to server. Please check your internet connection.");
    } else {
      console.error("Error message:", error.message);
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    }
  }
};

export const getMyRides = async (isCustomer: boolean = true) => {
  try {
    const res = await api.get(`/ride/rides`);
    // Only navigate to ACTIVE rides (exclude COMPLETED, CANCELLED, TIMEOUT)
    const activeRides = res.data.rides?.filter(
      (ride: any) => 
        ride?.status === "SEARCHING_FOR_RIDER" || 
        ride?.status === "START" || 
        ride?.status === "ARRIVED"
    );
    
    if (activeRides?.length > 0) {
      console.log(`🚗 Found ${activeRides.length} active ride(s), navigating to first one`);
      router?.navigate({
        pathname: isCustomer ? "/customer/liveride" : "/rider/liveride",
        params: {
          id: activeRides[0]?._id,
        },
      });
    } else {
      console.log('✅ No active rides found');
    }
  } catch (error: any) {
    Alert.alert("Oh! Dang there was an error");
    console.log("Error:GET MY Ride ", error);
  }
};

export const getRideHistoryCompleted = async () => {
  try {
    const res = await api.get(`/ride/rides?status=COMPLETED`);
    return res.data.rides || [];
  } catch (error: any) {
    console.log("Error: Get Completed Ride History ", error);
    Alert.alert("Error", "Failed to fetch ride history");
    return [];
  }
};

export const acceptRideOffer = async (rideId: string) => {
  try {
    const res = await api.patch(`/ride/accept/${rideId}`);
    resetAndNavigate({
      pathname: "/rider/liveride",
      params: { id: rideId },
    });
  } catch (error: any) {
    Alert.alert("Oh! Dang there was an error");
    console.log(error);
  }
};

export const updateRideStatus = async (rideId: string, status: string) => {
  try {
    const res = await api.patch(`/ride/update/${rideId}`, { status });
    return true;
  } catch (error: any) {
    Alert.alert("Oh! Dang there was an error");
    console.log(error);
    return false;
  }
};

export const getRideHistory = async (status?: string) => {
  try {
    // If no status specified, only return completed rides for history
    const queryParams = status ? `?status=${status}` : '?status=COMPLETED';
    const res = await api.get(`/ride/rides${queryParams}`);
    return res.data.rides || [];
  } catch (error: any) {
    console.log("Error: Get Ride History ", error);
    Alert.alert("Error", "Failed to fetch ride history");
    return [];
  }
};

// Rating related functions
export const submitRating = async (rideId: string, rating: number, comment?: string, displayName?: string) => {
  try {
    const res = await api.post('/rating/create', {
      rideId,
      rating,
      comment,
      displayName
    });
    return { success: true, data: res.data };
  } catch (error: any) {
    console.log("Error: Submit Rating ", error);
    Alert.alert("Error", "Failed to submit rating");
    return { success: false, error };
  }
};

// Create rating with anonymous display name support
export const createRating = async (data: { rideId: string; rating: number; comment?: string; displayName?: string }) => {
  try {
    const res = await api.post('/rating/create', data);
    return res.data;
  } catch (error: any) {
    console.log("Error: Create Rating ", error);
    throw error;
  }
};

export const checkRideRating = async (rideId: string) => {
  try {
    const res = await api.get(`/rating/check/${rideId}`);
    return { rated: res.data.rated, rating: res.data.rating };
  } catch (error: any) {
    console.log("Error: Check Ride Rating ", error);
    return { rated: false, rating: null };
  }
};

export const getRiderRatings = async (riderId: string) => {
  try {
    const res = await api.get(`/rating/rider/${riderId}`);
    return res.data;
  } catch (error: any) {
    console.log("Error: Get Rider Ratings ", error);
    Alert.alert("Error", "Failed to fetch rider ratings");
    return { count: 0, averageRating: 0, ratings: [] };
  }
};

export const getMyRatings = async () => {
  try {
    const res = await api.get('/rating/my-ratings');
    return res.data;
  } catch (error: any) {
    console.log("Error: Get My Ratings ", error);
    Alert.alert("Error", "Failed to fetch your ratings");
    return { count: 0, averageRating: 0, ratings: [] };
  }
};

export const cancelRideOffer = async (rideId: string, reason?: string) => {
  try {
    const res = await api.delete(`/ride/cancel/${rideId}`, {
      data: { reason }
    });
    return true;
  } catch (error: any) {
    Alert.alert("Error", "Failed to cancel ride offer");
    console.log("Error: Cancel Ride Offer ", error);
    return false;
  }
};

// Update payment method for a completed ride
export const updatePaymentMethod = async (rideId: string, paymentMethod: "CASH" | "GCASH") => {
  try {
    const res = await api.patch(`/ride/payment/${rideId}`, { paymentMethod });
    return { success: true, data: res.data };
  } catch (error: any) {
    console.log("Error: Update Payment Method ", error);
    Alert.alert("Error", "Failed to update payment method");
    return { success: false, error };
  }
};
