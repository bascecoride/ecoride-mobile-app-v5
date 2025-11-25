import { View, Text, Platform, ActivityIndicator, Alert, TouchableOpacity, StyleSheet } from "react-native";
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { screenHeight } from "@/utils/Constants";
import { useWS } from "@/service/WSProvider";
import { useRoute } from "@react-navigation/native";
import { rideStyles } from "@/styles/rideStyles";
import { StatusBar } from "expo-status-bar";
import LiveTrackingMap from "@/components/customer/LiveTrackingMap";
import CustomText from "@/components/shared/CustomText";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import SearchingRideSheet from "@/components/customer/SearchingRideSheet";
import LiveTrackingSheet from "@/components/customer/LiveTrackingSheet";
import RideCompletedSheet from "@/components/customer/RideCompletedSheet";
import RideCanceledSheet from "@/components/customer/RideCanceledSheet";
import { resetAndNavigate } from "@/utils/Helpers";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { getOrCreateChat } from "@/service/chatService";

const androidHeights = [screenHeight * 0.12, screenHeight * 0.42, screenHeight * 0.85];
const iosHeights = [screenHeight * 0.2, screenHeight * 0.5, screenHeight * 0.85];

const LiveRide = () => {
  const { emit, on, off } = useWS();
  const [rideData, setRideData] = useState<any>(null);
  const [riderCoords, setriderCoords] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const route = useRoute() as any;
  const params = route?.params || {};
  const id = params.id;
  const bottomSheetRef = useRef(null);
  const navigationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoad = useRef(true);
  const snapPoints = useMemo(
    () => (Platform.OS === "ios" ? iosHeights : androidHeights),
    []
  );
  const [mapHeight, setMapHeight] = useState(snapPoints[0]);

  const handleSheetChanges = useCallback((index: number) => {
    let height = screenHeight * 0.8;
    if (index === 0) {
      height = screenHeight * 0.88; // Collapsed - show more map
    } else if (index === 1) {
      height = screenHeight * 0.58; // Half expanded
    } else if (index === 2) {
      height = screenHeight * 0.15; // Fully expanded - show less map
    }
    setMapHeight(height);
  }, []);

  useEffect(() => {
    if (id) {
      console.log('Subscribing to ride:', id);
      emit("subscribeRide", id);

      on("rideData", (data) => {
        console.log('Received ride data:', JSON.stringify(data, null, 2));
        
        // Only redirect if ride is already finished on INITIAL LOAD (not during the ride)
        if (isInitialLoad.current && (data?.status === "CANCELLED" || data?.status === "COMPLETED" || data?.status === "TIMEOUT")) {
          console.log(`⚠️ Ride is already ${data.status} on initial load, navigating to home immediately`);
          emit("leaveRide", id);
          resetAndNavigate("/customer/home");
          return;
        }
        
        // Mark that initial load is complete
        isInitialLoad.current = false;
        
        setRideData(data);
        setIsLoading(false);
        setError(null);
        if (data?.status === "SEARCHING_FOR_RIDER") {
          emit("searchrider", id);
        }
      });

      on("rideUpdate", (data) => {
        console.log('Received ride update:', JSON.stringify(data, null, 2));
        setRideData(data);
        setError(null);
      });

      on("rideAccepted", (data) => {
        console.log('Ride accepted event received:', JSON.stringify(data, null, 2));
        if (data) {
          setRideData(data);
        }
      });

      on("rideCompleted", (data) => {
        console.log('Ride completed event received:', JSON.stringify(data, null, 2));
        if (data) {
          setRideData(data);
          // Leave the ride room immediately to stop receiving updates
          emit("leaveRide", id);
        }
      });

      on("rideCanceled", (data) => {
        console.log('Ride canceled:', data);
        // CRITICAL: Only process if this is OUR ride
        const cancelledRideId = data?.ride?._id || data?.rideId;
        if (cancelledRideId === id) {
          if (data?.ride) {
            setRideData(data.ride);
            // Leave the ride room immediately to stop receiving updates
            emit("leaveRide", id);
          } else {
            setError('Ride was canceled');
            setIsLoading(false);
            emit("leaveRide", id);
            cleanupAndNavigateHome();
          }
        } else {
          console.log(`Ignoring cancellation for different ride: ${cancelledRideId} (our ride: ${id})`);
        }
      });

      on("riderCancelledRide", (data) => {
        console.log("Rider cancelled ride:", data);
        // CRITICAL: Only show alert if this is OUR ride
        if (data?.rideId === id) {
          // Leave the ride room immediately
          emit("leaveRide", id);
          Alert.alert(
            "Rider Cancelled Ride",
            `${data.riderName} has cancelled the ride. You will be redirected to the home screen.`,
            [
              {
                text: "OK",
                onPress: () => {
                  resetAndNavigate("/customer/home");
                }
              }
            ]
          );
        } else {
          console.log(`Ignoring rider cancellation for different ride: ${data?.rideId} (our ride: ${id})`);
        }
      });

      on("error", (error) => {
        console.error('Ride error:', error);
        setError('Failed to load ride data');
        setIsLoading(false);
        resetAndNavigate("/customer/home");
        Alert.alert("Oh Dang! No Riders Found");
      });
    }

    return () => {
      off("rideData");
      off("rideUpdate");
      off("rideAccepted");
      off("rideCompleted");
      off("rideCanceled");
      off("riderCancelledRide");
      off("error");
    };
  }, [id, emit, on, off]);

  useEffect(() => {
    if (rideData?.rider?._id) {
      console.log('Subscribing to rider location:', rideData.rider._id);
      emit("subscribeToriderLocation", rideData.rider._id);
      on("riderLocationUpdate", (data) => {
        console.log('Received rider location update:', JSON.stringify(data, null, 2));
        if (data?.coords) {
          console.log('Setting rider coordinates:', data.coords);
          setriderCoords(data.coords);
        } else {
          console.log('No coords in rider location update');
        }
      });
    }

    return () => {
      off("riderLocationUpdate");
    };
  }, [rideData?.rider?._id]);

  // Force refresh ride data every 3 seconds to ensure we get updates
  useEffect(() => {
    if (id && rideData?.status === "SEARCHING_FOR_RIDER") {
      const interval = setInterval(() => {
        console.log('Force refreshing ride data...');
        emit("subscribeRide", id);
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [id, rideData?.status, emit]);

  // Cleanup function to clear all socket listeners and navigate home
  const cleanupAndNavigateHome = useCallback(() => {
    console.log('🧹 Starting cleanup process...');
    
    // Clear any pending navigation timers
    if (navigationTimerRef.current) {
      clearTimeout(navigationTimerRef.current);
      navigationTimerRef.current = null;
    }
    
    // Leave the ride room
    if (id) {
      console.log('📤 Leaving ride room:', id);
      emit("leaveRide", id);
    }
    
    // Unsubscribe from rider location updates
    if (rideData?.rider?._id) {
      console.log('📍 Unsubscribing from rider location');
      emit("unsubscribeFromriderLocation", rideData.rider._id);
    }
    
    // Clear all socket listeners
    console.log('🔌 Clearing all socket listeners');
    off("rideData");
    off("rideUpdate");
    off("rideAccepted");
    off("rideCompleted");
    off("rideCanceled");
    off("riderCancelledRide");
    off("riderLocationUpdate");
    off("error");
    
    // Navigate to home
    console.log('🏠 Navigating to home screen');
    resetAndNavigate("/customer/home");
  }, [id, rideData?.rider?._id, emit, off]);

  // Auto-navigate to home when ride status becomes COMPLETED or CANCELLED
  useEffect(() => {
    if (rideData?.status === "COMPLETED") {
      console.log('✅ Ride completed - leaving ride room');
      // Leave the ride room to stop receiving updates
      emit("leaveRide", id);
    } else if (rideData?.status === "CANCELLED") {
      console.log('❌ Ride canceled - setting up auto-navigation timer');
      // Leave the ride room to stop receiving updates
      emit("leaveRide", id);
      navigationTimerRef.current = setTimeout(() => {
        console.log('Auto-navigating to home after ride cancellation');
        cleanupAndNavigateHome();
      }, 5000); // 5 seconds delay

      return () => {
        if (navigationTimerRef.current) {
          clearTimeout(navigationTimerRef.current);
          navigationTimerRef.current = null;
        }
      };
    }
  }, [rideData?.status, emit, id, cleanupAndNavigateHome]);

  // Setup chat and listen for new messages when rider is assigned
  useEffect(() => {
    if (rideData?.rider?._id && (rideData?.status === "START" || rideData?.status === "ARRIVED")) {
      // Get or create chat to get the chat ID
      const setupChat = async () => {
        try {
          const chat = await getOrCreateChat(rideData.rider._id, "rider");
          setCurrentChatId(chat._id);
          
          // Join the chat room for real-time updates
          emit("joinChat", { chatId: chat._id });
          
          // Set initial unread count
          const myUnread = chat.unreadCount?.customer || 0;
          setUnreadCount(myUnread);
          console.log(`💬 Chat setup complete. Unread: ${myUnread}`);
        } catch (error) {
          console.error("Error setting up chat:", error);
        }
      };
      
      setupChat();
      
      // Listen for new messages
      const handleNewMessage = (message: any) => {
        console.log(`📩 New message received:`, message);
        // Only increment if message is from rider (not from us)
        if (message.sender?.role === "rider" || message.sender?.userId?.role === "rider") {
          setUnreadCount(prev => prev + 1);
          console.log(`🔴 Unread count incremented`);
        }
      };
      
      // Listen for unread count updates from server
      const handleUnreadCountUpdate = (data: any) => {
        console.log(`📊 Unread count update:`, data);
        if (data.unreadCount !== undefined) {
          setUnreadCount(data.unreadCount);
        }
      };
      
      on("newMessage", handleNewMessage);
      on("unreadCountUpdate", handleUnreadCountUpdate);
      
      return () => {
        off("newMessage");
        off("unreadCountUpdate");
        if (currentChatId) {
          emit("leaveChat", { chatId: currentChatId });
        }
      };
    }
  }, [rideData?.rider?._id, rideData?.status]);

  // Handle chat with rider
  const handleChatWithRider = async () => {
    if (!rideData?.rider?._id) {
      Alert.alert("Chat Unavailable", "No rider assigned yet. Please wait for a rider to accept your ride.");
      return;
    }

    // Reset unread count when opening chat
    setUnreadCount(0);
    
    setChatLoading(true);
    try {
      console.log(`💬 Opening chat with rider: ${rideData.rider._id}`);
      const chat = await getOrCreateChat(rideData.rider._id, "rider");
      
      router.push({
        pathname: "/customer/chatroom",
        params: {
          chatId: chat._id,
          otherUserId: rideData.rider._id,
          otherUserName: `${rideData.rider.firstName || ''} ${rideData.rider.lastName || ''}`.trim() || 'Rider',
          otherUserPhoto: rideData.rider.photo || "",
          otherUserRole: "rider",
          vehicleType: rideData.rider.vehicleType || rideData.vehicle || "",
        },
      });
    } catch (error) {
      console.error("Error opening chat:", error);
      Alert.alert("Error", "Failed to open chat. Please try again.");
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <View style={rideStyles.container}>
      <StatusBar style="light" backgroundColor="orange" translucent={false} />

      {rideData ? (
        <LiveTrackingMap
          height={mapHeight}
          status={rideData?.status || 'UNKNOWN'}
          drop={{
            latitude: rideData?.drop?.latitude ? parseFloat(rideData.drop.latitude) : null,
            longitude: rideData?.drop?.longitude ? parseFloat(rideData.drop.longitude) : null,
          }}
          pickup={{
            latitude: rideData?.pickup?.latitude ? parseFloat(rideData.pickup.latitude) : null,
            longitude: rideData?.pickup?.longitude ? parseFloat(rideData.pickup.longitude) : null,
          }}
          rider={
            riderCoords && riderCoords.latitude && riderCoords.longitude
              ? {
                  latitude: riderCoords.latitude,
                  longitude: riderCoords.longitude,
                  heading: riderCoords.heading || 0,
                }
              : null
          }
          vehicleType={rideData?.vehicle}
        />
      ) : isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
          <ActivityIndicator size="large" color="orange" />
          <CustomText fontSize={14} style={{ marginTop: 10, color: '#666' }}>Loading ride data...</CustomText>
        </View>
      ) : (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
          <CustomText fontSize={14} style={{ color: '#666' }}>No ride data available</CustomText>
        </View>
      )}

      {/* Floating Chat Button - Only show when rider is assigned (START or ARRIVED status) */}
      {rideData?.rider?._id && (rideData?.status === "START" || rideData?.status === "ARRIVED") && (
        <TouchableOpacity
          style={styles.floatingChatButton}
          onPress={handleChatWithRider}
          activeOpacity={0.8}
          disabled={chatLoading}
        >
          {chatLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="chatbubble-ellipses" size={24} color="#fff" />
          )}
          {/* Red Badge for Unread Messages */}
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <CustomText fontSize={10} style={styles.unreadText}>
                {unreadCount > 99 ? "99+" : unreadCount}
              </CustomText>
            </View>
          )}
        </TouchableOpacity>
      )}

      {rideData ? (
        <BottomSheet
          ref={bottomSheetRef}
          index={1}
          handleIndicatorStyle={{
            backgroundColor: "#ccc",
          }}
          enableOverDrag={false}
          enableDynamicSizing={false}
          style={{ zIndex: 4 }}
          snapPoints={snapPoints}
          onChange={handleSheetChanges}
        >
          <BottomSheetScrollView contentContainerStyle={[rideStyles?.container, { paddingBottom: 30 }]}>
            {rideData?.status === "SEARCHING_FOR_RIDER" ? (
              <SearchingRideSheet item={rideData} />
            ) : rideData?.status === "COMPLETED" ? (
              <RideCompletedSheet item={rideData} onNavigateHome={cleanupAndNavigateHome} />
            ) : rideData?.status === "CANCELLED" ? (
              <RideCanceledSheet item={rideData} />
            ) : (
              <LiveTrackingSheet item={rideData} />
            )}
          </BottomSheetScrollView>
        </BottomSheet>
      ) : isLoading ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <CustomText variant="h8">Fetching Information...</CustomText>
          <ActivityIndicator color="orange" size="large" />
        </View>
      ) : (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <CustomText variant="h8">No ride data available</CustomText>
          {error && <CustomText fontSize={12} style={{ color: 'red', marginTop: 10 }}>{error}</CustomText>}
        </View>
      )}
    </View>
  );
};

export default memo(LiveRide);

const styles = StyleSheet.create({
  floatingChatButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    backgroundColor: '#2196F3',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    zIndex: 1000,
    borderWidth: 2,
    borderColor: 'white',
  },
  unreadBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ff3b30',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: 'white',
  },
  unreadText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
