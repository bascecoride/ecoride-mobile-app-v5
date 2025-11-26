import { View, Text, FlatList, Image, Alert, TouchableOpacity, StyleSheet, Platform } from "react-native";
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
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/utils/Constants";
import { chatNotificationService } from "@/service/chatNotificationService";
// Note: disapprovalService is now handled directly in WSProvider for reliability

const RiderHome = () => {
  const isFocused = useIsFocused();
  const { emit, on, off, disconnect } = useWS();
  const { onDuty, setLocation, user } = useRiderStore();
  const { token } = useAuthStore();

  // State management
  const [rideOffers, setRideOffers] = useState<any[]>([]);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [acceptedRide, setAcceptedRide] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'error'>('connecting');
  const [unreadCount, setUnreadCount] = useState(0);
  
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

  // Initial load of rides and setup chat notifications
  useEffect(() => {
    getMyRides(false);
    
    // Note: Account disapproval is now handled directly in WSProvider for reliability
    // No need to initialize disapprovalService here
    
    // Subscribe to chat notification service for real-time updates
    const unsubscribe = chatNotificationService.subscribe((count) => {
      console.log(`🏠 Rider Home: Unread count updated to ${count}`);
      setUnreadCount(count);
    });

    // Initial fetch of unread count
    chatNotificationService.refreshUnreadCount();

    // Listen for new messages via socket (real-time)
    const handleNewMessage = (message: any) => {
      console.log(`🔔 Rider Home: New message received in chat ${message.chatId}`);
      // Only increment if message is not from current user
      if (message.sender?.userId?._id !== message.sender?.userId) {
        chatNotificationService.incrementUnreadCount();
      }
    };

    // Listen for unread count updates from server
    const handleUnreadCountUpdate = (data: any) => {
      console.log(`🔔 Rider Home: Unread count update from server:`, data);
      if (data.unreadCount !== undefined) {
        chatNotificationService.setUnreadCount(data.unreadCount);
      }
    };

    // Listen for messages marked as read
    const handleMessagesRead = (data: any) => {
      console.log(`✅ Rider Home: Messages marked as read in chat ${data.chatId}`);
      chatNotificationService.refreshUnreadCount();
    };

    on("newMessage", handleNewMessage);
    on("unreadCountUpdate", handleUnreadCountUpdate);
    on("messagesRead", handleMessagesRead);

    // Refresh unread count every 60 seconds as backup (reduced from 30s)
    const unreadInterval = setInterval(() => {
      chatNotificationService.refreshUnreadCount();
    }, 60000);

    return () => {
      unsubscribe();
      off("newMessage");
      off("unreadCountUpdate");
      off("messagesRead");
      clearInterval(unreadInterval);
    };
  }, [on, off]);

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
            // Use fallback location for San Ildefonso, Bulacan
            const fallbackLocation = {
              latitude: 14.9500,
              longitude: 120.9500,
              address: "San Ildefonso, Bulacan (Fallback)",
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
          // Use fallback location for San Ildefonso, Bulacan
          const fallbackLocation = {
            latitude: 14.9500,
            longitude: 120.9500,
            address: "San Ildefonso, Bulacan (Fallback)",
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
        // Use fallback location for San Ildefonso, Bulacan
        const fallbackLocation = {
          latitude: 14.9500,
          longitude: 120.9500,
          address: "San Ildefonso, Bulacan (Fallback)",
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
        
        // Show ALL rides (mismatched ones will be unclickable with visual feedback)
        const allRides = response.data.rides;
        
        // Log vehicle type breakdown
        if (allRides.length > 0) {
          const vehicleBreakdown = allRides.reduce((acc: any, ride: any) => {
            acc[ride.vehicle] = (acc[ride.vehicle] || 0) + 1;
            return acc;
          }, {});
          console.log(`💾 API Backup: Showing ${allRides.length} rides - Vehicle types: ${JSON.stringify(vehicleBreakdown)}`);
        }
        
        // Only update if we have rides or if socket has failed
        if (allRides.length > 0 || socketFailedRef.current) {
          setRideOffers(allRides);
          logCurrentRides(allRides);
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
        
        // Show ALL rides (mismatched ones will be unclickable with visual feedback)
        const allRides = rides || [];
        
        if (allRides.length > 0) {
          console.log(`📋 Showing ${allRides.length} rides (including all vehicle types)`);
          console.log(`📋 Ride IDs: ${allRides.map(r => r._id).join(', ')}`);
          
          // Log vehicle type breakdown
          const vehicleBreakdown = allRides.reduce((acc: any, ride: any) => {
            acc[ride.vehicle] = (acc[ride.vehicle] || 0) + 1;
            return acc;
          }, {});
          console.log(`🚗 Vehicle types: ${JSON.stringify(vehicleBreakdown)}`);
        }
        
        setRideOffers(allRides);
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
        
        // Show ALL rides (mismatched ones will be unclickable with visual feedback)
        const riderVehicleType = user?.vehicleType;
        const isMatch = !riderVehicleType || rideDetails.vehicle === riderVehicleType;
        console.log(`🚗 Ride vehicle: ${rideDetails.vehicle}, Your vehicle: ${riderVehicleType}, Match: ${isMatch ? '✅' : '❌ (will show as locked)'}`);
        
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

      // Listen for ride cancellations from ride room (when customer/rider cancels)
      on("rideCanceled", (data: any) => {
        // Update last response time
        lastSocketResponseRef.current = Date.now();
        socketFailedRef.current = false;
        
        const rideId = typeof data === 'string' ? data : data?.ride?._id || data?.rideId;
        const cancelledBy = data?.cancelledBy || 'unknown';
        if (rideId) {
          console.log(`❌ Ride ${rideId} canceled by ${cancelledBy} - removing from list`);
          removeRide(rideId);
        }
      });

      // Listen for ride completions to remove from list
      on("rideCompleted", (data: any) => {
        // Update last response time
        lastSocketResponseRef.current = Date.now();
        socketFailedRef.current = false;
        
        const rideId = typeof data === 'string' ? data : data?._id || data?.rideId;
        if (rideId) {
          console.log(`✅ Ride completed, removing from list: ${rideId}`);
          removeRide(rideId);
        }
      });

      on("rideOfferTimeout", (rideId: string) => {
        // Update last response time
        lastSocketResponseRef.current = Date.now();
        socketFailedRef.current = false;
        
        console.log(`⏰ Ride offer timed out: ${rideId}`);
        removeRide(rideId);
      });

      // Listen for rides removed specifically for this rider (when they cancel)
      on("rideRemovedForYou", (rideId: string) => {
        // Update last response time
        lastSocketResponseRef.current = Date.now();
        socketFailedRef.current = false;
        
        console.log(`🚫 Ride ${rideId} removed from your screen (you cancelled it)`);
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
        off("rideCanceled");
        off("rideCompleted");
        off("rideRemovedForYou");
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
                  : user?.vehicleType 
                    ? `🔍 Searching for rides city-wide...\nStay Active!`
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
            {onDuty && user?.vehicleType && (
              <CustomText fontSize={9} style={{ color: '#666', textAlign: 'center', marginTop: 8, fontStyle: 'italic' }}>
                All rides shown • Mismatched vehicle types appear locked 🔒
              </CustomText>
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

      {/* Floating Chat Button */}
      <TouchableOpacity
        style={styles.floatingChatButton}
        onPress={() => router.push("/rider/chatlist")}
        activeOpacity={0.8}
      >
        <Ionicons name="chatbubbles" size={28} color="#fff" />
        {unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <CustomText fontSize={10} style={styles.unreadText}>
              {unreadCount > 99 ? "99+" : unreadCount}
            </CustomText>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  floatingChatButton: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 100 : 80,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    zIndex: 999,
  },
  unreadBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#FF3B30",
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: "#fff",
  },
  unreadText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 10,
  },
});

export default RiderHome;
