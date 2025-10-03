import { View, Text, Platform, ActivityIndicator, Alert } from "react-native";
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

const androidHeights = [screenHeight * 0.12, screenHeight * 0.42];
const iosHeights = [screenHeight * 0.2, screenHeight * 0.5];

const LiveRide = () => {
  const { emit, on, off } = useWS();
  const [rideData, setRideData] = useState<any>(null);
  const [riderCoords, setriderCoords] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
    if (index == 1) {
      height = screenHeight * 0.5;
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
      });

      on("riderCancelledRide", (data) => {
        console.log("Rider cancelled ride:", data);
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
          <BottomSheetScrollView contentContainerStyle={rideStyles?.container}>
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
