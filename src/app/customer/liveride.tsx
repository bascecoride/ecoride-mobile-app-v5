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
          // Auto-navigate to home after 10 seconds when ride is completed
          setTimeout(() => {
            console.log('Auto-navigating to home after ride completion');
            resetAndNavigate("/customer/home");
          }, 10000);
        }
      });

      on("rideCanceled", (error) => {
        console.log('Ride canceled:', error);
        setError('Ride was canceled');
        setIsLoading(false);
        resetAndNavigate("/customer/home");
        Alert.alert("Ride Canceled");
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

  // Auto-navigate to home when ride status becomes COMPLETED
  useEffect(() => {
    if (rideData?.status === "COMPLETED") {
      console.log('Ride completed, setting up auto-navigation timer');
      const timer = setTimeout(() => {
        console.log('Auto-navigating to home after ride completion');
        resetAndNavigate("/customer/home");
      }, 10000); // 10 seconds delay

      return () => {
        console.log('Clearing auto-navigation timer');
        clearTimeout(timer);
      };
    }
  }, [rideData?.status]);

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
              <RideCompletedSheet item={rideData} />
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
