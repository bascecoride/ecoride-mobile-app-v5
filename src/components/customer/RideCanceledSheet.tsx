import { View, Text, Image, TouchableOpacity } from "react-native";
import React, { FC, useState, useEffect } from "react";
import { rideStyles } from "@/styles/rideStyles";
import { commonStyles } from "@/styles/commonStyles";
import CustomText from "../shared/CustomText";
import { vehicleIcons } from "@/utils/mapUtils";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { resetAndNavigate } from "@/utils/Helpers";

type VehicleType = "Single Motorcycle" | "Tricycle" | "Cab";

interface RideItem {
  _id: string;
  vehicle?: VehicleType;
  pickup?: { address: string };
  drop?: { address: string };
  fare?: number;
  otp?: string;
  rider: any;
  customer: any;
  status: string;
  cancelledBy?: string;
  cancelledAt?: string;
}

const RideCanceledSheet: FC<{ item: RideItem }> = ({ item }) => {
  const [countdown, setCountdown] = useState(5);
  const [isAutoNavigating, setIsAutoNavigating] = useState(true);

  useEffect(() => {
    if (isAutoNavigating && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && isAutoNavigating) {
      resetAndNavigate("/customer/home");
    }
  }, [countdown, isAutoNavigating]);

  const handleManualNavigation = () => {
    setIsAutoNavigating(false);
    resetAndNavigate("/customer/home");
  };

  const cancelAutoNavigation = () => {
    setIsAutoNavigating(false);
  };

  return (
    <View>
      {/* Canceled Header */}
      <View style={[rideStyles?.headerContainer, { backgroundColor: '#ff4444', borderRadius: 10, margin: 10 }]}>
        <View style={commonStyles.flexRowGap}>
          <Ionicons name="close-circle" size={40} color="white" />
          <View>
            <CustomText fontSize={16} fontFamily="Bold" style={{ color: 'white' }}>
              Ride Canceled
            </CustomText>
            <CustomText fontSize={12} style={{ color: 'white', opacity: 0.9 }}>
              This ride has been canceled
            </CustomText>
          </View>
        </View>
      </View>

      {/* Ride Summary */}
      <View style={{ padding: 10 }}>
        <CustomText fontFamily="SemiBold" fontSize={14} style={{ marginBottom: 10 }}>
          Ride Details
        </CustomText>

        {/* Vehicle Info */}
        {item.vehicle && (
          <View style={[commonStyles.flexRowGap, { marginBottom: 15 }]}>
            <Image
              source={vehicleIcons[item.vehicle]?.icon}
              style={rideStyles.rideIcon}
            />
            <View>
              <CustomText fontSize={12} fontFamily="Medium">
                {item?.vehicle} ride
              </CustomText>
              <CustomText fontSize={10} style={{ color: '#666' }}>
                Status: Canceled
              </CustomText>
            </View>
          </View>
        )}

        {/* Location Details */}
        {item.pickup?.address && (
          <View
            style={[
              commonStyles.flexRowGap,
              { marginVertical: 10, width: "90%" },
            ]}
          >
            <Image
              source={require("@/assets/icons/marker.png")}
              style={rideStyles.pinIcon}
            />
            <View style={{ flex: 1 }}>
              <CustomText fontSize={10} style={{ color: '#666' }}>From</CustomText>
              <CustomText fontSize={11} numberOfLines={2}>
                {item?.pickup?.address}
              </CustomText>
            </View>
          </View>
        )}

        {item.drop?.address && (
          <View style={[commonStyles.flexRowGap, { width: "90%", marginBottom: 15 }]}>
            <Image
              source={require("@/assets/icons/drop_marker.png")}
              style={rideStyles.pinIcon}
            />
            <View style={{ flex: 1 }}>
              <CustomText fontSize={10} style={{ color: '#666' }}>To</CustomText>
              <CustomText fontSize={11} numberOfLines={2}>
                {item?.drop?.address}
              </CustomText>
            </View>
          </View>
        )}

        {/* Cancellation Info */}
        <View style={{ 
          backgroundColor: '#fff3cd', 
          padding: 15, 
          borderRadius: 10, 
          marginVertical: 10,
          borderLeftWidth: 4,
          borderLeftColor: '#ffc107'
        }}>
          <CustomText fontFamily="SemiBold" fontSize={12} style={{ marginBottom: 5 }}>
            Why was this ride canceled?
          </CustomText>
          <CustomText fontSize={10} style={{ color: '#666' }}>
            This ride was canceled by {
              item.cancelledBy === 'customer' 
                ? 'you' 
                : item.cancelledBy === 'rider' 
                ? `the rider${item.rider ? ` (${item.rider.firstName} ${item.rider.lastName})` : ''}` 
                : item.rider ? 'the rider' : 'you'
            }. No charges have been applied.
          </CustomText>
          {item.cancelledAt && (
            <CustomText fontSize={9} style={{ color: '#999', marginTop: 5 }}>
              Canceled at: {new Date(item.cancelledAt).toLocaleString()}
            </CustomText>
          )}
        </View>
      </View>

      {/* Auto-Navigation Countdown */}
      {isAutoNavigating && countdown > 0 && (
        <View style={{ 
          backgroundColor: '#e3f2fd', 
          padding: 15, 
          borderRadius: 10, 
          margin: 10,
          borderLeftWidth: 4,
          borderLeftColor: '#2196F3'
        }}>
          <View style={[commonStyles.flexRowBetween, { alignItems: 'center' }]}>
            <View style={{ flex: 1 }}>
              <CustomText fontFamily="SemiBold" fontSize={12} style={{ color: '#1976D2' }}>
                Returning to home in {countdown}s
              </CustomText>
              <CustomText fontSize={10} style={{ color: '#666', marginTop: 2 }}>
                You'll be taken back to the home screen automatically
              </CustomText>
            </View>
            <TouchableOpacity
              onPress={cancelAutoNavigation}
              style={{ 
                backgroundColor: '#fff', 
                paddingHorizontal: 12, 
                paddingVertical: 6, 
                borderRadius: 15,
                borderWidth: 1,
                borderColor: '#2196F3'
              }}
            >
              <CustomText fontSize={10} style={{ color: '#2196F3' }}>Cancel</CustomText>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <View style={rideStyles.bottomButtonContainer}>
        <TouchableOpacity
          style={[rideStyles.backButton2, { backgroundColor: '#2196F3', flex: 1 }]}
          onPress={handleManualNavigation}
        >
          <CustomText style={[rideStyles.backButtonText, { color: 'white' }]}>
            {isAutoNavigating ? 'Go to Home Now' : 'Back to Home'}
          </CustomText>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default RideCanceledSheet;
