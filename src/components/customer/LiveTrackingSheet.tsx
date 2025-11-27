import { View, Text, Image, TouchableOpacity, BackHandler, ActivityIndicator, Alert } from "react-native";
import React, { FC, useState, useEffect } from "react";
import { useWS } from "@/service/WSProvider";
import { rideStyles } from "@/styles/rideStyles";
import { commonStyles } from "@/styles/commonStyles";
import CustomText from "../shared/CustomText";
import { vehicleIcons } from "@/utils/mapUtils";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { resetAndNavigate } from "@/utils/Helpers";
import CancelRideModal from "./CancelRideModal";

type VehicleType = "Single Motorcycle" | "Tricycle" | "Cab";

interface RideItem {
  _id: string;
  vehicle?: VehicleType;
  pickup?: { address: string; landmark?: string };
  drop?: { address: string; landmark?: string };
  fare?: number;
  otp?: string;
  rider: any;
  status: string;
  passengerCount?: number;
}

const LiveTrackingSheet: FC<{ item: RideItem }> = ({ item }) => {
  const { emit, on, off } = useWS();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  
  console.log('LiveTrackingSheet rendered with item:', item);
  console.log('Item status:', item?.status);
  console.log('Item OTP:', item?.otp);

  // Disable hardware back button during active ride
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      console.log('🚫 Hardware back button disabled during active ride');
      return true; // Prevent default back behavior
    });

    return () => backHandler.remove();
  }, []);

  // Listen for cancellation responses
  useEffect(() => {
    const handleCancelSuccess = (data: any) => {
      console.log('✅ Ride cancelled successfully:', data);
      setCancelLoading(false);
      setShowCancelModal(false);
      
      if (data.success) {
        Alert.alert(
          "Ride Cancelled",
          "Your ride has been cancelled successfully.",
          [
            {
              text: "OK",
              onPress: () => {
                resetAndNavigate("/customer/home");
              }
            }
          ]
        );
      }
    };

    const handleCancelError = (data: any) => {
      console.log('❌ Cancel error:', data);
      setCancelLoading(false);
      Alert.alert("Error", data.message || "Failed to cancel ride. Please try again.");
    };

    on("rideCanceled", handleCancelSuccess);
    on("cancelError", handleCancelError);

    return () => {
      off("rideCanceled");
      off("cancelError");
    };
  }, [on, off]);

  return (
    <View>
      <View style={rideStyles?.headerContainer}>
        <View style={commonStyles.flexRowGap}>
          {item.vehicle && (
            <Image
              source={vehicleIcons[item.vehicle]?.icon}
              style={rideStyles.rideIcon}
            />
          )}
          <View>
            <CustomText fontSize={10}>
              {item?.status === "START"
                ? "Rider OTW to You..."
                : item?.status === "ARRIVED"
                ? "RIDE IN PROGRESS..."
                : "RIDE COMPLETED! 🎉"}
            </CustomText>

            {item?.status === "START" && item?.otp && (
              <View style={{ 
                backgroundColor: '#ff6b35', 
                paddingHorizontal: 8, 
                paddingVertical: 4, 
                borderRadius: 6, 
                marginTop: 4 
              }}>
                <CustomText fontFamily="Bold" fontSize={14} style={{ color: 'white' }}>
                  OTP: {item.otp}
                </CustomText>
              </View>
            )}
            
            {item?.status === "START" && !item?.otp && (
              <CustomText fontSize={10} style={{ color: 'red' }}>
                Waiting for OTP...
              </CustomText>
            )}
          </View>
        </View>

        {item?.rider?.phone && (
          <CustomText fontSize={11} numberOfLines={1} fontFamily="Medium">
            {" "}
            {item?.rider?.phone &&
              item?.rider?.phone?.slice(0, 5) +
                " " +
                item?.rider?.phone?.slice(5)}
          </CustomText>
        )}
      </View>

      {/* Rider Name Display - Only show when ride is in progress */}
      {(item?.status === "START" || item?.status === "ARRIVED") && item?.rider && (
        <View style={{
          backgroundColor: '#2196F3',
          marginHorizontal: 10,
          marginTop: 10,
          paddingHorizontal: 14,
          paddingVertical: 12,
          borderRadius: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 3.84,
          elevation: 3,
          flexDirection: 'row',
          alignItems: 'center',
        }}>
          {/* Rider Profile Photo */}
          <View style={{ marginRight: 12 }}>
            {item.rider.photo ? (
              <Image
                source={{ uri: item.rider.photo }}
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 25,
                  borderWidth: 2,
                  borderColor: 'white',
                  backgroundColor: '#E0E0E0',
                }}
              />
            ) : (
              <View style={{
                width: 50,
                height: 50,
                borderRadius: 25,
                backgroundColor: 'rgba(255,255,255,0.3)',
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 2,
                borderColor: 'white',
              }}>
                <Ionicons name="person" size={24} color="white" />
              </View>
            )}
          </View>
          
          {/* Rider Info */}
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
              <Ionicons name="person-circle" size={14} color="rgba(255,255,255,0.9)" style={{ marginRight: 4 }} />
              <CustomText fontFamily="Bold" fontSize={10} style={{ color: 'rgba(255,255,255,0.9)' }}>
                Your Rider
              </CustomText>
            </View>
            <CustomText fontFamily="SemiBold" fontSize={15} style={{ color: 'white' }}>
              {item.rider.firstName} {item.rider.lastName}
            </CustomText>
            {item.rider.vehicleType && (
              <View style={{ 
                backgroundColor: 'rgba(255,255,255,0.2)', 
                paddingHorizontal: 8, 
                paddingVertical: 2, 
                borderRadius: 10, 
                alignSelf: 'flex-start',
                marginTop: 4,
              }}>
                <CustomText fontSize={9} style={{ color: 'white' }}>
                  🏍️ {item.rider.vehicleType}
                </CustomText>
              </View>
            )}
          </View>
        </View>
      )}

      <View style={{ padding: 10 }}>
        <CustomText fontFamily="SemiBold" fontSize={12}>
          Location Details
        </CustomText>

        <View
          style={[
            commonStyles.flexRowGap,
            { marginVertical: 15, width: "90%" },
          ]}
        >
          <Image
            source={require("@/assets/icons/marker.png")}
            style={rideStyles.pinIcon}
          />
          <View style={{ flex: 1 }}>
            <CustomText fontSize={10} numberOfLines={2}>
              {item?.pickup?.address}
            </CustomText>
            {/* Pickup Landmark Description */}
            {item?.pickup?.landmark && (
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: 6,
                backgroundColor: '#E8F5E9',
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#4CAF50',
              }}>
                <Ionicons name="navigate" size={14} color="#4CAF50" />
                <CustomText
                  numberOfLines={2}
                  fontSize={10}
                  fontFamily="Medium"
                  style={{ marginLeft: 6, color: '#666', flex: 1 }}
                >
                  📍 {item?.pickup?.landmark}
                </CustomText>
              </View>
            )}
          </View>
        </View>

        <View style={[commonStyles.flexRowGap, { width: "90%" }]}>
          <Image
            source={require("@/assets/icons/drop_marker.png")}
            style={rideStyles.pinIcon}
          />
          <View style={{ flex: 1 }}>
            <CustomText fontSize={10} numberOfLines={2}>
              {item?.drop?.address}
            </CustomText>
            {/* Landmark Description */}
            {item?.drop?.landmark && (
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: 6,
                backgroundColor: '#FFF9E6',
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#FFD700',
              }}>
                <Ionicons name="location" size={14} color="#FF6B6B" />
                <CustomText
                  numberOfLines={2}
                  fontSize={10}
                  fontFamily="Medium"
                  style={{ marginLeft: 6, color: '#666', flex: 1 }}
                >
                  📍 {item?.drop?.landmark}
                </CustomText>
              </View>
            )}
          </View>
        </View>

        {/* Passenger Count Display */}
        {item?.passengerCount && item.passengerCount > 0 && (
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 12,
            backgroundColor: '#E8F5E9',
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: '#4CAF50',
          }}>
            <View style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: '#4CAF50',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 10,
            }}>
              <Ionicons name="people" size={20} color="white" />
            </View>
            <View style={{ flex: 1 }}>
              <CustomText fontSize={10} style={{ color: '#666' }}>
                Number of Passengers
              </CustomText>
              <CustomText fontFamily="Bold" fontSize={16} style={{ color: '#4CAF50' }}>
                {item.passengerCount} {item.passengerCount === 1 ? 'Passenger' : 'Passengers'}
              </CustomText>
            </View>
          </View>
        )}

        <View style={{ marginVertical: 20 }}>
          <View style={[commonStyles.flexRowBetween]}>
            <View style={commonStyles.flexRow}>
              <MaterialCommunityIcons
                name="credit-card"
                size={24}
                color="black"
              />
              <CustomText
                style={{ marginLeft: 10 }}
                fontFamily="SemiBold"
                fontSize={12}
              >
                Payment
              </CustomText>
            </View>

            <CustomText fontFamily="SemiBold" fontSize={14}>
              ₱ {item?.fare != null ? item.fare.toFixed(2) : "0.00"}
            </CustomText>
          </View>

    
        </View>
      </View>

      <View style={rideStyles.bottomButtonContainer}>
        {/* Only show Cancel button during active ride - full width */}
        <TouchableOpacity
          style={[rideStyles.cancelButton, { flex: 1 }]}
          onPress={() => {
            console.log('Cancel button pressed, opening modal...');
            setShowCancelModal(true);
          }}
        >
          <CustomText style={rideStyles.cancelButtonText}>Cancel Ride</CustomText>
        </TouchableOpacity>
      </View>

      {showCancelModal && (
        <CancelRideModal
          visible={showCancelModal}
          onClose={() => {
            console.log('Modal closed');
            setShowCancelModal(false);
          }}
          onConfirm={(reason) => {
            console.log('🚫 Cancellation confirmed with reason:', reason);
            console.log('🚫 Ride ID:', item?._id);
            setCancelLoading(true);
            // Use the new customerCancelRide event that works for any ride status
            emit("customerCancelRide", { rideId: item?._id, reason });
            // Don't close modal or reset loading here - wait for server response
          }}
          loading={cancelLoading}
        />
      )}
      
    </View>
  );
};

export default LiveTrackingSheet;
