import { View, Text, Alert } from "react-native";
import React, { useEffect, useState } from "react";
import { useRiderStore } from "@/store/riderStore";
import { useWS } from "@/service/WSProvider";
import { useRoute } from "@react-navigation/native";
import * as Location from "expo-location";
import { resetAndNavigate } from "@/utils/Helpers";
import { StatusBar } from "expo-status-bar";
import { rideStyles } from "@/styles/rideStyles";
import RiderLiveTracking from "@/components/rider/RiderLiveTracking";
import { updateRideStatus, cancelRideOffer } from "@/service/rideService";
import RiderActionButton from "@/components/rider/RiderActionButton";
import OtpInputModal from "@/components/rider/OtpInputModal";
import CustomText from "@/components/shared/CustomText";
import { TouchableOpacity } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";

const LiveRide = () => {
  const [isOtpModalVisible, setOtpModalVisible] = useState(false);
  const { setLocation, location, setOnDuty } = useRiderStore();
  const { emit, on, off } = useWS();
  const [rideData, setRideData] = useState<any>(null);
  const [currentLocation, setCurrentLocation] = useState(location);
  const route = useRoute() as any;
  const params = route?.params || {};
  const id = params.id;

  const handleCancelRide = async () => {
    Alert.alert(
      "Cancel Ride",
      "Are you sure you want to cancel this ride?",
      [
        {
          text: "No",
          style: "cancel",
        },
        {
          text: "Yes",
          onPress: async () => {
            const success = await cancelRideOffer(id);
            if (success) {
              Alert.alert("Ride Cancelled", "The ride has been cancelled successfully.");
              resetAndNavigate("/rider/home");
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    let locationSubscription: any;

    const startLocationUpdates = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          console.log("🚀 Starting live location tracking for rider...");
          
          locationSubscription = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.High,
              timeInterval: 3000, // Update every 3 seconds for smoother tracking
              distanceInterval: 10, // Update every 10 meters for more precise tracking
            },
            (locationData) => {
              const { latitude, longitude, heading, speed } = locationData.coords;
              
              const newLocation = {
                latitude: latitude,
                longitude: longitude,
                address: "Live Location",
                heading: heading as number,
                speed: speed || 0,
                timestamp: Date.now(),
              };

              // Update both store and local state
              setLocation(newLocation);
              setCurrentLocation(newLocation);
              setOnDuty(true);

              // Emit location updates to server
              emit("goOnDuty", {
                latitude: latitude,
                longitude: longitude,
                heading: heading as number,
              });

              emit("updateLocation", {
                latitude,
                longitude,
                heading,
                speed,
                rideId: id,
              });

              console.log(
                `🏍️ Live location: Lat ${latitude.toFixed(6)}, Lon ${longitude.toFixed(6)}, Heading: ${heading?.toFixed(0)}°, Speed: ${speed?.toFixed(1)} m/s`
              );
            }
          );
        } else {
          console.log("❌ Location permission denied");
          Alert.alert("Permission Required", "Location permission is required for live tracking");
        }
      } catch (error) {
        console.error("❌ Error starting location tracking:", error);
      }
    };

    startLocationUpdates();

    return () => {
      if (locationSubscription) {
        console.log("🛑 Stopping live location tracking");
        locationSubscription.remove();
      }
    };
  }, [id]);

  useEffect(() => {
    if (id) {
      emit("subscribeRide", id);

      on("rideData", (data) => {
        setRideData(data);
      });

      on("rideCanceled", (error) => {
        console.log("Ride error:", error);
        resetAndNavigate("/rider/home");
        Alert.alert("Ride Canceled");
      });

      on("rideUpdate", (data) => {
        setRideData(data);
      });

      on("error", (error) => {
        console.log("Ride error:", error);
        resetAndNavigate("/rider/home");
        Alert.alert("Oh Dang! There was an error");
      });
    }

    return () => {
      off("rideData");
      off("error");
    };
  }, [id, emit, on, off]);

  return (
    <View style={rideStyles.container}>
      <StatusBar style="light" backgroundColor="orange" translucent={false} />

      {rideData && (
        <View style={{ flex: 1 }}>
          <RiderLiveTracking
            status={rideData?.status}
            drop={{
              latitude: parseFloat(rideData?.drop.latitude),
              longitude: parseFloat(rideData?.drop.longitude),
            }}
            pickup={{
              latitude: parseFloat(rideData?.pickup.latitude),
              longitude: parseFloat(rideData?.pickup.longitude),
            }}
            rider={{
              latitude: currentLocation?.latitude || location?.latitude,
              longitude: currentLocation?.longitude || location?.longitude,
              heading: currentLocation?.heading || location?.heading,
            }}
          />

          {/* Cancel Button Overlay - No OTP */}
          <View style={{
            position: 'absolute',
            top: 60,
            right: 20,
            zIndex: 1000,
          }}>
            <TouchableOpacity
              style={{
                backgroundColor: '#ff4444',
                padding: 12,
                borderRadius: 25,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
                elevation: 5,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onPress={handleCancelRide}
            >
              <Ionicons name="close" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <RiderActionButton
        ride={rideData}
        title={
          rideData?.status === "START"
            ? "ARRIVED"
            : rideData?.status === "ARRIVED"
            ? "COMPLETED"
            : "SUCCESS"
        }
        onPress={async () => {
          if (rideData?.status === "START") {
            setOtpModalVisible(true);
            return;
          }
          const isSuccess = await updateRideStatus(rideData?._id, "COMPLETED");
          if (isSuccess) {
            Alert.alert("Congratulations! you rock🎉");
            resetAndNavigate("/rider/home");
          } else {
            Alert.alert("There was an error");
          }
        }}
        color="#228B22"
      />

      {isOtpModalVisible && (
        <OtpInputModal
          visible={isOtpModalVisible}
          onClose={() => setOtpModalVisible(false)}
          title="Enter OTP Below"
          onConfirm={async (otp) => {
            if (otp === rideData?.otp) {
              const isSuccess = await updateRideStatus(
                rideData?._id,
                "ARRIVED"
              );
              if (isSuccess) {
                setOtpModalVisible(false);
              } else {
                Alert.alert("Technical Error");
              }
            } else {
              Alert.alert("Wrong OTP");
            }
          }}
        />
      )}
    </View>
  );
};

export default LiveRide;
