import { View, Text } from "react-native";
import React, { FC, useState, useEffect } from "react";
import { Colors } from "@/utils/Constants";
import { Ionicons } from "@expo/vector-icons";
import SwipeButton from "rn-swipe-button";
import { rideStyles } from "@/styles/rideStyles";
import { commonStyles } from "@/styles/commonStyles";
import CustomText from "../shared/CustomText";
import { orderStyles } from "@/styles/riderStyles";
import { RFValue } from "react-native-responsive-fontsize";

const RiderActionButton: FC<{
  ride: any;
  color?: string;
  title: string;
  onPress: () => void;
  riderLocation?: { latitude: number; longitude: number };
}> = ({ ride, color = Colors.iosColor, title, onPress, riderLocation }) => {
  const [eta, setEta] = useState<string>("Calculating...");

  // Calculate ETA based on distance and average speed
  const calculateETA = () => {
    if (!riderLocation || !ride) {
      setEta("Calculating...");
      return;
    }

    try {
      // Determine destination based on ride status
      let destination;
      if (ride.status === "START") {
        // Going to pickup location
        destination = ride.pickup;
      } else if (ride.status === "ARRIVED") {
        // Going to drop location
        destination = ride.drop;
      } else {
        setEta("--");
        return;
      }

      if (!destination?.latitude || !destination?.longitude) {
        setEta("--");
        return;
      }

      // Calculate distance using Haversine formula
      const R = 6371; // Earth's radius in km
      const dLat = ((destination.latitude - riderLocation.latitude) * Math.PI) / 180;
      const dLon = ((destination.longitude - riderLocation.longitude) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((riderLocation.latitude * Math.PI) / 180) *
          Math.cos((destination.latitude * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c; // Distance in km

      // Average speeds based on vehicle type (km/h)
      const speeds: { [key: string]: number } = {
        "Single Motorcycle": 30,
        "Tricycle": 25,
        "Cab": 35,
      };

      const averageSpeed = speeds[ride.vehicle] || 30;
      const timeInHours = distance / averageSpeed;
      const timeInMinutes = Math.ceil(timeInHours * 60);

      if (timeInMinutes < 1) {
        setEta("< 1 min");
      } else if (timeInMinutes === 1) {
        setEta("1 min");
      } else {
        setEta(`${timeInMinutes} mins`);
      }
    } catch (error) {
      console.error("Error calculating ETA:", error);
      setEta("--");
    }
  };

  // Recalculate ETA when rider location or ride status changes
  useEffect(() => {
    calculateETA();
    // Update ETA every 10 seconds for real-time accuracy
    const interval = setInterval(calculateETA, 10000);
    return () => clearInterval(interval);
  }, [riderLocation, ride?.status, ride?.pickup, ride?.drop]);

  const CheckoutButton = () => (
    <Ionicons
      name="arrow-forward-sharp"
      style={{ bottom: 2 }}
      size={32}
      color="#fff"
    />
  );

  return (
    <View style={rideStyles?.swipeableContaninerRider}>
      {/* Ride ID and ETA Row */}
      <View style={commonStyles?.flexRowBetween}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <CustomText
            fontSize={10}
            style={{ color: '#666' }}
            fontFamily="Medium"
          >
            Ride ID:
          </CustomText>
          <CustomText
            fontSize={11}
            style={{ color: Colors.primary }}
            fontFamily="SemiBold"
          >
            #RID{ride?._id?.slice(-8).toUpperCase()}
          </CustomText>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="time-outline" size={14} color="#666" />
          <CustomText
            fontSize={11}
            style={{ color: '#666' }}
            fontFamily="Medium"
          >
            ETA:
          </CustomText>
          <CustomText
            fontSize={11}
            style={{ color: Colors.primary }}
            fontFamily="SemiBold"
          >
            {eta}
          </CustomText>
        </View>
      </View>

      <View style={commonStyles?.flexRowBetween}>
        <CustomText
          fontSize={11}
          style={{ marginTop: 10, marginBottom: 3 }}
          numberOfLines={1}
          fontFamily="Medium"
        >
          Meet the Customer
        </CustomText>
        <CustomText
          fontSize={11}
          style={{ marginTop: 10, marginBottom: 3 }}
          numberOfLines={1}
          fontFamily="Medium"
        >
          {" "}
          {ride?.customer?.phone &&
            ride?.customer?.phone?.slice(0, 5) +
              " " +
              ride?.customer?.phone?.slice(5)}
        </CustomText>
      </View>

      <View style={orderStyles.locationsContainer}>
        <View style={orderStyles.flexRowBase}>
          <View>
            <View style={orderStyles.pickupHollowCircle} />
            <View style={orderStyles.continuousLine} />
          </View>
          <View style={orderStyles.infoText}>
            <CustomText fontSize={11} numberOfLines={1} fontFamily="SemiBold">
              {ride?.pickup?.address?.slice(0, 10)}
            </CustomText>
            <CustomText
              numberOfLines={2}
              fontSize={9.5}
              fontFamily="Medium"
              style={orderStyles.label}
            >
              {ride?.pickup?.address}
            </CustomText>
          </View>
        </View>

        <View style={orderStyles.flexRowBase}>
          <View style={orderStyles.dropHollowCircle} />
          <View style={orderStyles.infoText}>
            <CustomText fontSize={11} numberOfLines={1} fontFamily="SemiBold">
              {ride?.drop?.address?.slice(0, 10)}
            </CustomText>
            <CustomText
              numberOfLines={2}
              fontSize={9.5}
              fontFamily="Medium"
              style={orderStyles.label}
            >
              {ride?.drop?.address}
            </CustomText>
          </View>
        </View>
      </View>

      <SwipeButton
        containerStyles={rideStyles.swipeButtonContainer}
        height={30}
        shouldResetAfterSuccess={true}
        resetAfterSuccessAnimDelay={200}
        onSwipeSuccess={onPress}
        railBackgroundColor={color}
        railStyles={rideStyles.railStyles}
        railBorderColor="transparent"
        railFillBackgroundColor="rgba(255,255,255,0.6)"
        railFillBorderColor="rgba(255,255,255,0.6)"
        titleColor="#fff"
        titleFontSize={RFValue(13)}
        titleStyles={rideStyles.titleStyles}
        thumbIconComponent={CheckoutButton}
        thumbIconStyles={rideStyles.thumbIconStyles}
        title={title.toUpperCase()}
        thumbIconBackgroundColor="transparent"
        thumbIconBorderColor="transparent"
        thumbIconHeight={50}
        thumbIconWidth={60}
      />
    </View>
  );
};

export default RiderActionButton;
