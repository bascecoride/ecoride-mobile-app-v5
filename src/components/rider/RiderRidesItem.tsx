import { View, Text, Image, TouchableOpacity, Alert } from "react-native";
import React, { FC, memo } from "react";
import { useRiderStore } from "@/store/riderStore";
import { acceptRideOffer, cancelRideOffer } from "@/service/rideService";
import Animated, { FadeInLeft, FadeOutRight } from "react-native-reanimated";
import { orderStyles } from "@/styles/riderStyles";
import { commonStyles } from "@/styles/commonStyles";
import CustomText from "../shared/CustomText";
import { calculateDistance, vehicleIcons } from "@/utils/mapUtils";
import { Ionicons } from "@expo/vector-icons";
import CounterButton from "./CounterButton";

type VehicleType = "Single Motorcycle" | "Tricycle" | "Cab";

interface RideItem {
  _id: string;
  vehicle?: VehicleType;
  pickup: { address: string; latitude: number; longitude: number; landmark?: string };
  drop?: { address: string; latitude: number; longitude: number; landmark?: string };
  fare?: number;
  distance: number;
  passengerCount?: number;
}

const RiderRidesItem: FC<{ item: RideItem; removeIt: () => void; maxDistanceMeters?: number }> = ({
  item,
  removeIt,
  maxDistanceMeters = 50000, // Default 50km if not provided
}) => {
  const { location, user } = useRiderStore();
  
  // Check if ride matches rider's vehicle type
  const riderVehicleType = user?.vehicleType;
  const isVehicleMatch = !riderVehicleType || item.vehicle === riderVehicleType;
  
  // Calculate distance from rider to pickup location in meters
  const distanceToPickupKm = (location?.latitude && location?.longitude && item?.pickup?.latitude && item?.pickup?.longitude)
    ? calculateDistance(
        item.pickup.latitude,
        item.pickup.longitude,
        location.latitude,
        location.longitude
      )
    : 0;
  const distanceToPickupMeters = distanceToPickupKm * 1000;
  
  // Check if ride is within the max distance radius
  const isTooFar = distanceToPickupMeters > maxDistanceMeters;
  const maxDistanceKm = (maxDistanceMeters / 1000).toFixed(1);
  
  // Determine if ride can be accepted
  const canAccept = isVehicleMatch && !isTooFar;
  
  // Determine the reason for being disabled
  const getDisabledReason = () => {
    if (!isVehicleMatch) return "vehicle";
    if (isTooFar) return "distance";
    return null;
  };
  const disabledReason = getDisabledReason();
  
  const acceptRide = async () => {
    // Prevent accepting if vehicle type doesn't match
    if (!isVehicleMatch) {
      Alert.alert(
        "Vehicle Type Mismatch",
        `This ride requires a ${item.vehicle}, but your vehicle type is ${riderVehicleType}. Please update your profile or choose a matching ride.`,
        [{ text: "OK" }]
      );
      return;
    }
    
    // Prevent accepting if too far (shouldn't happen since button is disabled, but just in case)
    if (isTooFar) {
      Alert.alert(
        "Too Far Away",
        `This pickup location is ${distanceToPickupKm.toFixed(1)}km away. Maximum allowed distance is ${maxDistanceKm}km. Please move closer to accept this ride.`,
        [{ text: "OK" }]
      );
      return;
    }
    
    acceptRideOffer(item?._id);
  };

  const cancelRide = async () => {
    const success = await cancelRideOffer(item?._id);
    if (success) {
      removeIt();
    }
  };

  return (
    <Animated.View
      entering={FadeInLeft.duration(500)}
      exiting={FadeOutRight.duration(500)}
      style={[
        orderStyles.container,
        // Add visual styling for disabled rides
        !canAccept && {
          opacity: 0.6,
          backgroundColor: '#f5f5f5',
          borderColor: disabledReason === 'distance' ? '#ff9800' : '#ff6b6b',
          borderWidth: 2,
        }
      ]}
    >
      {/* Too Far Warning Banner */}
      {isTooFar && (
        <View style={{
          backgroundColor: '#ff9800',
          padding: 8,
          marginBottom: 10,
          borderRadius: 5,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        }}>
          <Ionicons name="location-outline" size={20} color="white" />
          <CustomText fontSize={10} style={{ color: 'white', flex: 1 }}>
            📍 Too Far: {distanceToPickupKm.toFixed(1)}km away (Max: {maxDistanceKm}km)
          </CustomText>
        </View>
      )}
      
      {/* Vehicle Type Mismatch Warning Banner */}
      {!isVehicleMatch && !isTooFar && (
        <View style={{
          backgroundColor: '#ff6b6b',
          padding: 8,
          marginBottom: 10,
          borderRadius: 5,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        }}>
          <Ionicons name="warning" size={20} color="white" />
          <CustomText fontSize={10} style={{ color: 'white', flex: 1 }}>
            ⚠️ Vehicle Mismatch: Requires {item.vehicle}, you have {riderVehicleType}
          </CustomText>
        </View>
      )}
      <View style={commonStyles.flexRowBetween}>
        <View style={commonStyles.flexRow}>
          {item.vehicle && (
            <Image
              source={vehicleIcons![item.vehicle]?.icon}
              style={[
                orderStyles.rideIcon,
                !isVehicleMatch && { opacity: 0.5 }
              ]}
            />
          )}
          <CustomText style={{ textTransform: "capitalize" }} fontSize={11}>
            {item?.vehicle}
            {!isVehicleMatch && " ❌"}
          </CustomText>
        </View>
      </View>

      <View style={orderStyles?.locationsContainer}>
        <View style={orderStyles?.flexRowBase}>
          <View>
            <View style={orderStyles?.pickupHollowCircle} />
            <View style={orderStyles?.continuousLine} />
          </View>
          <View style={orderStyles?.infoText}>
            <CustomText fontSize={11} numberOfLines={1} fontFamily="SemiBold">
              {item?.pickup?.address?.slice(0, 10)}
            </CustomText>
            <CustomText
              numberOfLines={2}
              fontSize={9.5}
              fontFamily="Medium"
              style={orderStyles.label}
            >
              {item?.pickup?.address}
            </CustomText>
            {/* Pickup Landmark description */}
            {item?.pickup?.landmark && (
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: 4,
                backgroundColor: '#E8F5E9',
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 6,
                borderWidth: 1,
                borderColor: '#4CAF50',
              }}>
                <Ionicons name="navigate" size={12} color="#4CAF50" />
                <CustomText
                  numberOfLines={2}
                  fontSize={9}
                  fontFamily="Medium"
                  style={{ marginLeft: 4, color: '#666', flex: 1 }}
                >
                  📍 {item?.pickup?.landmark}
                </CustomText>
              </View>
            )}
          </View>
        </View>

        <View style={orderStyles.flexRowBase}>
          <View style={orderStyles.dropHollowCircle} />
          <View style={orderStyles.infoText}>
            <CustomText fontSize={11} numberOfLines={1} fontFamily="SemiBold">
              {item?.drop?.address?.slice(0, 10)}
            </CustomText>
            <CustomText
              numberOfLines={2}
              fontSize={9.5}
              fontFamily="Medium"
              style={orderStyles.label}
            >
              {item?.drop?.address}
            </CustomText>
            {/* Landmark description */}
            {item?.drop?.landmark && (
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: 4,
                backgroundColor: '#FFF9E6',
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 6,
                borderWidth: 1,
                borderColor: '#FFD700',
              }}>
                <Ionicons name="location" size={12} color="#FF6B6B" />
                <CustomText
                  numberOfLines={2}
                  fontSize={9}
                  fontFamily="Medium"
                  style={{ marginLeft: 4, color: '#666', flex: 1 }}
                >
                  📍 {item?.drop?.landmark}
                </CustomText>
              </View>
            )}
          </View>
        </View>
      </View>

      <View style={[commonStyles?.flexRowGap]}>
        <View>
          <CustomText
            fontFamily="Medium"
            fontSize={9}
            style={orderStyles.label}
          >
            Pickup
          </CustomText>

          <CustomText fontSize={11} fontFamily="SemiBold">
            {(location?.latitude && location?.longitude && item?.pickup?.latitude && item?.pickup?.longitude)
              ? calculateDistance(
                  item.pickup.latitude,
                  item.pickup.longitude,
                  location.latitude,
                  location.longitude
                ).toFixed(2)
              : "--"}{" "}
            Km
          </CustomText>
        </View>

        <View style={orderStyles.borderLine}>
          <CustomText
            fontSize={9}
            fontFamily="Medium"
            style={orderStyles.label}
          >
            Drop
          </CustomText>
          <CustomText fontSize={11} fontFamily="SemiBold">
            {item?.distance?.toFixed(2) || "--"} Km
          </CustomText>
        </View>

        {/* Passenger Count Display */}
        <View style={orderStyles.borderLine}>
          <CustomText
            fontSize={9}
            fontFamily="Medium"
            style={orderStyles.label}
          >
            Passengers
          </CustomText>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="people" size={14} color="#4CAF50" />
            <CustomText fontSize={11} fontFamily="SemiBold" style={{ marginLeft: 4 }}>
              {item?.passengerCount || 1}
            </CustomText>
          </View>
        </View>
      </View>

      <View style={orderStyles?.flexRowEnd}>
        <TouchableOpacity onPress={cancelRide}>
          <Ionicons name="close-circle" size={24} color="red" />
        </TouchableOpacity>

        <CounterButton
          onCountdownEnd={removeIt}
          initialCount={30}
          onPress={acceptRide}
          title={canAccept ? "Accept" : (isTooFar ? "Too Far" : "Locked")}
          disabled={!canAccept}
        />
      </View>
    </Animated.View>
  );
};

export default memo(RiderRidesItem);
