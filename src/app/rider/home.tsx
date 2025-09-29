import { View, Text, FlatList, Image, Alert } from "react-native";
import React, { useEffect, useState, useRef } from "react";
import { useIsFocused } from "@react-navigation/native";
import { useWS } from "@/service/WSProvider";
import { useRiderStore } from "@/store/riderStore";
import { getMyRides } from "@/service/rideService";
import * as Location from "expo-location";
import { homeStyles } from "@/styles/homeStyles";
import { StatusBar } from "expo-status-bar";
import RiderHeader from "@/components/rider/RiderHeader";
import { riderStyles } from "@/styles/riderStyles";
import CustomText from "@/components/shared/CustomText";
import RiderRidesItem from "@/components/rider/RiderRidesItem";
import OtpDisplayModal from "@/components/rider/OtpDisplayModal";
import axios from "axios";
import { REFRESH_INTERVALS } from "@/config/constants";
import { BASE_URL } from "@/service/config";
import { useAuthStore } from "@/store/authStore";

const RiderHome = () => {
  const isFocused = useIsFocused();
  const { emit, on, off } = useWS();
  const { onDuty, setLocation } = useRiderStore();
  const { token } = useAuthStore();

  // State management
  const [rideOffers, setRideOffers] = useState<any[]>([]);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [acceptedRide, setAcceptedRide] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'error'>('connecting');
  
  // Refs for tracking socket status
  const socketFailedRef = useRef<boolean>(false);
  const lastSocketResponseRef = useRef<number>(Date.now());
  const socketTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debug log for token
  useEffect(() => {
    if (token) {
      console.log("Auth token available:", token.substring(0, 15) + "...");
    } else {
      console.log("No auth token available!");
    }
  }, [token]);

  // Initial load of rides
  useEffect(() => {
    getMyRides(false);
  }, []);

  // Location tracking setup
  useEffect(() => {
    let locationsSubscription: any;
    const startLocationUpdates = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          // Check if location services are enabled
          const isLocationEnabled = await Location.hasServicesEnabledAsync();
          if (!isLocationEnabled) {
            console.log('Location services not enabled, using fallback location');
            // Use fallback location for Manila
            const fallbackLocation = {
              latitude: 14.5995,
              longitude: 120.9842,
              address: "Manila, Philippines (Fallback)",
              heading: 0,
            };
            setLocation(fallbackLocation);
            emit("updateLocation", {
              latitude: fallbackLocation.latitude,
              longitude: fallbackLocation.longitude,
              heading: fallbackLocation.heading,
            });
            return;
          }

          locationsSubscription = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.Balanced, // Changed from High to Balanced for better compatibility
              timeInterval: 10000,
              distanceInterval: 10,
            },
            (location) => {
              const { latitude, longitude, heading } = location.coords;
              setLocation({
                latitude: latitude,
                longitude: longitude,
                address: "Current Location",
                heading: heading as number,
              });
              emit("updateLocation", {
                latitude,
                longitude,
                heading,
              });
            }
          );
        } else {
          console.log('Location permission denied, using fallback location');
          // Use fallback location for Manila
          const fallbackLocation = {
            latitude: 14.5995,
            longitude: 120.9842,
            address: "Manila, Philippines (Fallback)",
            heading: 0,
          };
          setLocation(fallbackLocation);
          emit("updateLocation", {
            latitude: fallbackLocation.latitude,
            longitude: fallbackLocation.longitude,
            heading: fallbackLocation.heading,
          });
        }
      } catch (error) {
        console.log('Error with location services, using fallback:', error);
        // Use fallback location for Manila
        const fallbackLocation = {
          latitude: 14.5995,
          longitude: 120.9842,
          address: "Manila, Philippines (Fallback)",
          heading: 0,
        };
        setLocation(fallbackLocation);
        emit("updateLocation", {
          latitude: fallbackLocation.latitude,
          longitude: fallbackLocation.longitude,
          heading: fallbackLocation.heading,
        });
      }
    };

    if (onDuty && isFocused) {
      startLocationUpdates();
    }

    return () => {
      if (locationsSubscription) {
        locationsSubscription.remove();
      }
    };
  }, [onDuty, isFocused, emit, setLocation]);

  // Socket approach for real-time ride requests
  const requestRidesViaSocket = () => {
    console.log("🔄 Requesting all searching rides via socket...");
    emit("requestAllSearchingRides");
    
    // Set a timeout to check if socket response is received
    if (socketTimeoutRef.current) {
      clearTimeout(socketTimeoutRef.current);
    }
    
    const socketTimeout = REFRESH_INTERVALS.SOCKET_REFRESH * 1.5;
    
    socketTimeoutRef.current = setTimeout(() => {
      // If no socket response within timeout period, mark socket as failed
      const timeSinceLastResponse = Date.now() - lastSocketResponseRef.current;
      if (timeSinceLastResponse > socketTimeout) {
        console.log(`⚠️ Socket response timeout (${Math.round(timeSinceLastResponse/1000)}s) - falling back to API`);
        socketFailedRef.current = true;
        setConnectionStatus('error');
        
        // Fallback to API
        fetchSearchingRidesAPI();
        
        // Show alert to user
        Alert.alert(
          "Connection Issue",
          "Having trouble connecting to the server. Switching to backup mode to ensure you don't miss any rides.",
          [{ text: "OK" }]
        );
      }
    }, socketTimeout);
  };
  
  // API backup approach for fetching rides
  const fetchSearchingRidesAPI = async () => {
    if (!token || !onDuty) return;
    
    try {
      setIsLoading(true);
      console.log("💾 API Backup: Fetching searching rides...");
      const response = await axios.get(`${BASE_URL}/api/v1/ride/searching`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data && response.data.rides) {
        console.log(`💾 API Backup: Found ${response.data.rides.length} rides`);
        setLastRefreshTime(new Date());
        
        // Only update if we have rides or if socket has failed
        if (response.data.rides.length > 0 || socketFailedRef.current) {
          setRideOffers(response.data.rides);
          logCurrentRides(response.data.rides);
        }
      } else {
        console.log("💾 API Backup: No rides found or invalid response format", response.data);
      }
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      setConnectionStatus('error');
      console.error("❌ API Backup: Error fetching rides:", error);
      
      // Log more details about the error
      if (axios.isAxiosError(error)) {
        console.error(`Status: ${error.response?.status}, Message: ${error.response?.data?.message || error.message}`);
        
        // Show error to user
        Alert.alert(
          "Connection Error",
          `Unable to connect to server: ${error.response?.data?.message || error.message}`,
          [{ text: "OK" }]
        );
      }
    }
  };
  
  // Debug function to log current rides
  const logCurrentRides = (rides: any[]) => {
    console.log(`📊 Current ride offers: ${rides.length}`);
    if (rides.length > 0) {
      console.log(`📝 Ride IDs: ${rides.map(r => r._id).join(', ')}`);
    }
  };

  // Main effect for handling ride requests
  useEffect(() => {
    if (onDuty && isFocused) {
      console.log("🚦 Rider going on duty - setting up ride listeners");
      
      // Reset state and references
      setRideOffers([]);
      setIsLoading(true);
      setConnectionStatus('connecting');
      socketFailedRef.current = false;
      lastSocketResponseRef.current = Date.now();
      
      // Immediately request all searching rides via socket
      console.log("🔍 Initial request for all searching rides");
      emit("requestAllSearchingRides");
      
      // Also make an initial API request as backup
      fetchSearchingRidesAPI();
      
      // Set up socket refresh using constant interval
      const socketRefreshInterval = setInterval(() => {
        requestRidesViaSocket();
      }, REFRESH_INTERVALS.SOCKET_REFRESH);
      
      // Set up API backup refresh (less frequent to reduce load)
      const apiBackupInterval = setInterval(() => {
        // Only use API backup if socket has failed or it's been more than 10 seconds since last socket response
        const timeSinceLastResponse = Date.now() - lastSocketResponseRef.current;
        if (socketFailedRef.current || timeSinceLastResponse > REFRESH_INTERVALS.SOCKET_REFRESH * 3) {
          console.log("💾 API Backup: Socket may be unreliable, using API backup");
          fetchSearchingRidesAPI();
        }
      }, REFRESH_INTERVALS.API_BACKUP_REFRESH);

      // Listen for ALL searching rides response
      on("allSearchingRides", (rides: any[]) => {
        // Update last response time to indicate socket is working
        lastSocketResponseRef.current = Date.now();
        socketFailedRef.current = false;
        setIsLoading(false);
        setConnectionStatus('connected');
        setLastRefreshTime(new Date());
        
        console.log(`✅ Received ${rides?.length || 0} searching rides via socket`);
        if (rides?.length > 0) {
          console.log(`📋 Ride IDs: ${rides.map(r => r._id).join(', ')}`);
        }
        setRideOffers(rides || []);
      });

      // Listen for new ride requests in real-time
      on("newRideRequest", (rideDetails: any) => {
        // Update last response time
        lastSocketResponseRef.current = Date.now();
        socketFailedRef.current = false;
        
        if (!rideDetails || !rideDetails._id) {
          console.log("⚠️ Received invalid ride request data");
          return;
        }
        
        console.log(`🆕 New ride request received: ${rideDetails._id}`);
        console.log(`📍 From: ${rideDetails.pickup?.address || 'Unknown'} to ${rideDetails.drop?.address || 'Unknown'}`);
        console.log(`💰 Fare: ${rideDetails.fare || 'Unknown'}, Vehicle: ${rideDetails.vehicle || 'Unknown'}`);
        
        setRideOffers((prevOffers) => {
          // Create a deep copy to ensure state updates properly
          const currentOffers = [...prevOffers];
          const existingIndex = currentOffers.findIndex(offer => offer._id === rideDetails._id);
          
          if (existingIndex === -1) {
            console.log(`➕ Adding new ride ${rideDetails._id} to list`);
            const updatedOffers = [...currentOffers, rideDetails];
            logCurrentRides(updatedOffers);
            return updatedOffers;
          } else {
            console.log(`🔄 Updating existing ride ${rideDetails._id} in list`);
            currentOffers[existingIndex] = rideDetails;
            return [...currentOffers];
          }
        });
      });

      // Keep the old rideOffer listener for backward compatibility
      on("rideOffer", (rideDetails: any) => {
        // Update last response time
        lastSocketResponseRef.current = Date.now();
        socketFailedRef.current = false;
        
        if (!rideDetails || !rideDetails._id) {
          console.log("⚠️ Received invalid ride offer data");
          return;
        }
        
        console.log(`📢 Ride offer received: ${rideDetails._id}`);
        
        setRideOffers((prevOffers) => {
          const currentOffers = [...prevOffers];
          const existingIndex = currentOffers.findIndex(offer => offer._id === rideDetails._id);
          
          if (existingIndex === -1) {
            console.log(`➕ Adding ride offer ${rideDetails._id} to list`);
            return [...currentOffers, rideDetails];
          }
          return currentOffers;
        });
      });

      // Listen for ride acceptance confirmation with OTP
      on("rideAccepted", (rideData: any) => {
        // Update last response time
        lastSocketResponseRef.current = Date.now();
        socketFailedRef.current = false;
        
        console.log(`✅ Ride accepted event received: ${typeof rideData === 'string' ? rideData : rideData?._id}`);
        
        if (typeof rideData === 'string') {
          console.log(`🗑️ Removing accepted ride ${rideData} from offers list`);
          removeRide(rideData);
        } else if (rideData && rideData._id) {
          console.log(`🎫 Showing OTP modal for ride ${rideData._id}, OTP: ${rideData.otp}`);
          setAcceptedRide(rideData);
          setShowOtpModal(true);
          removeRide(rideData._id);
        } else {
          console.log("⚠️ Received invalid ride acceptance data");
        }
      });

      // Listen for ride cancellations
      on("rideOfferCanceled", (rideId: string) => {
        // Update last response time
        lastSocketResponseRef.current = Date.now();
        socketFailedRef.current = false;
        
        console.log(`❌ Ride offer canceled: ${rideId}`);
        removeRide(rideId);
      });

      on("rideOfferTimeout", (rideId: string) => {
        // Update last response time
        lastSocketResponseRef.current = Date.now();
        socketFailedRef.current = false;
        
        console.log(`⏰ Ride offer timed out: ${rideId}`);
        removeRide(rideId);
      });

      return () => {
        console.log("🧹 Cleaning up ride listeners and intervals");
        clearInterval(socketRefreshInterval);
        clearInterval(apiBackupInterval);
        if (socketTimeoutRef.current) {
          clearTimeout(socketTimeoutRef.current);
        }
        
        // Remove socket listeners
        off("allSearchingRides");
        off("newRideRequest");
        off("rideOffer");
        off("rideAccepted");
        off("rideOfferCanceled");
        off("rideOfferTimeout");
      };
    } else {
      // Clear rides when going off duty
      console.log("🚫 Rider going off duty - clearing rides");
      setRideOffers([]);
      socketFailedRef.current = false;
      
      // Clear any pending timeouts
      if (socketTimeoutRef.current) {
        clearTimeout(socketTimeoutRef.current);
      }
    }
  }, [onDuty, isFocused, token, emit, on, off]);

  // Function to remove a ride from the list
  const removeRide = (id: string) => {
    if (!id) {
      console.log("⚠️ Attempted to remove ride with invalid ID");
      return;
    }
    
    console.log(`🗑️ Removing ride ${id} from offers list`);
    
    setRideOffers((prevOffers) => {
      const filteredOffers = prevOffers.filter((offer) => offer._id !== id);
      console.log(`📊 Rides count after removal: ${filteredOffers.length}`);
      return filteredOffers;
    });
  };

  // Render individual ride item
  const renderRides = ({ item }: any) => {
    return (
      <RiderRidesItem removeIt={() => removeRide(item?._id)} item={item} />
    );
  };

  return (
    <View style={homeStyles.container}>
      <StatusBar style="light" backgroundColor="orange" translucent={false} />
      <RiderHeader />

      <FlatList
        data={!onDuty ? [] : rideOffers}
        renderItem={renderRides}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 10, paddingBottom: 120 }}
        keyExtractor={(item: any) => item?._id || Math.random().toString()}
        ListEmptyComponent={
          <View style={riderStyles?.emptyContainer}>
            <Image
              source={require("@/assets/icons/ride.jpg")}
              style={riderStyles?.emptyImage}
            />
            <CustomText fontSize={12} style={{ textAlign: "center" }}>
              {onDuty
                ? isLoading 
                  ? "🔄 Loading rides... Please wait" 
                  : "🔍 Searching for rides city-wide...\nStay Active!"
                : "You're currently OFF-DUTY, please go ON-DUTY to start earning"}
            </CustomText>
            {onDuty && (
              <View style={{
                backgroundColor: connectionStatus === 'error' ? '#ff6b6b' : '#4CAF50',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 15,
                marginTop: 10,
                alignSelf: 'center'
              }}>
                <CustomText fontSize={10} style={{ color: 'white', textAlign: 'center' }}>
                  {connectionStatus === 'error' 
                    ? '⚠️ Using backup connection' 
                    : '🌍 Monitoring ALL city rides'}
                </CustomText>
              </View>
            )}
            {lastRefreshTime && onDuty && (
              <CustomText fontSize={9} style={{ color: '#888', textAlign: 'center', marginTop: 5 }}>
                Last updated: {lastRefreshTime.toLocaleTimeString()}
              </CustomText>
            )}
          </View>
        }
      />

      <OtpDisplayModal
        visible={showOtpModal}
        onClose={() => {
          setShowOtpModal(false);
          setAcceptedRide(null);
        }}
        otp={acceptedRide?.otp || ""}
        rideId={acceptedRide?._id || ""}
      />
    </View>
  );
};

export default RiderHome;
