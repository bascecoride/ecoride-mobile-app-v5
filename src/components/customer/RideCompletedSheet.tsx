import { View, Text, Image, TouchableOpacity, BackHandler, Alert } from "react-native";
import React, { FC, useState, useEffect } from "react";
import { rideStyles } from "@/styles/rideStyles";
import { commonStyles } from "@/styles/commonStyles";
import CustomText from "../shared/CustomText";
import { vehicleIcons } from "@/utils/mapUtils";
import { MaterialCommunityIcons, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { resetAndNavigate } from "@/utils/Helpers";
import AnonymousRatingModal from "./AnonymousRatingModal";
import PaymentMethodModal from "./PaymentMethodModal";
import { router } from "expo-router";

type VehicleType = "Single Motorcycle" | "Tricycle" | "Cab";

interface RideItem {
  _id: string;
  vehicle?: VehicleType;
  pickup?: { address: string };
  drop?: { address: string };
  fare?: number;
  otp?: string;
  rider: any;
  status: string;
  paymentMethod?: "CASH" | "GCASH" | null;
}

interface RideCompletedSheetProps {
  item: RideItem;
  onNavigateHome?: () => void;
}

const RideCompletedSheet: FC<RideCompletedSheetProps> = ({ item, onNavigateHome }) => {
  const [countdown, setCountdown] = useState(4);
  const [isAutoNavigating, setIsAutoNavigating] = useState(false); // Disabled auto-navigation - wait for payment selection
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(true); // Show payment modal immediately
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"CASH" | "GCASH" | null>(item.paymentMethod || null);

  console.log('🎬 RideCompletedSheet rendered - countdown:', countdown, 'isAutoNavigating:', isAutoNavigating);

  // Disable hardware back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      console.log('🚫 Hardware back button disabled on completed ride screen');
      return true; // Prevent default back behavior
    });

    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    console.log('🔄 RideCompletedSheet - Countdown:', countdown, 'isAutoNavigating:', isAutoNavigating);
    if (isAutoNavigating && countdown > 0) {
      const timer = setTimeout(() => {
        console.log('⏱️ Countdown decreasing from', countdown, 'to', countdown - 1);
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && isAutoNavigating) {
      console.log('🏠 Countdown reached 0, navigating to home...');
      handleCleanupAndNavigate();
    }
  }, [countdown, isAutoNavigating]);

  const handleCleanupAndNavigate = () => {
    console.log('🧹 Cleaning up socket listeners and navigating to home');
    setIsAutoNavigating(false);
    // Call the cleanup function passed from parent
    if (onNavigateHome) {
      onNavigateHome();
    } else {
      resetAndNavigate("/customer/home");
    }
  };

  const handleManualNavigation = () => {
    setIsAutoNavigating(false);
    handleCleanupAndNavigate();
  };

  const cancelAutoNavigation = () => {
    setIsAutoNavigating(false);
  };

  // Handle payment method selection
  const handlePaymentSelected = (method: "CASH" | "GCASH") => {
    console.log('💳 Payment method selected:', method);
    setSelectedPaymentMethod(method);
    setPaymentModalVisible(false);
    
    // Show alert and redirect to ride history for rating
    Alert.alert(
      "Payment Recorded! 💳",
      `Payment method: ${method}\n\nYou will be redirected to Ride History.\nPlease don't forget to rate your ride!`,
      [
        {
          text: "Go to Ride History",
          onPress: () => {
            console.log('🚗 Navigating to ride history for rating...');
            // Navigate to ride history with flag to show home button instead of back
            router.push({
              pathname: "/customer/ridehistory",
              params: { fromRideCompletion: "true" }
            });
          },
        },
      ],
      { cancelable: false }
    );
  };

  // If payment method already selected (from previous session), skip modal
  useEffect(() => {
    if (item.paymentMethod) {
      setPaymentModalVisible(false);
      setSelectedPaymentMethod(item.paymentMethod);
    }
  }, [item.paymentMethod]);

  // Log countdown UI visibility
  console.log('🎨 Countdown UI should show:', isAutoNavigating && countdown > 0);

  return (
    <View style={{ paddingBottom: 20 }}>
      {/* Back Button */}
      <TouchableOpacity
        style={{
          position: 'absolute',
          top: 10,
          left: 10,
          zIndex: 10,
          backgroundColor: 'white',
          borderRadius: 20,
          padding: 8,
          elevation: 3,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
        }}
        onPress={handleCleanupAndNavigate}
      >
        <MaterialIcons name="arrow-back" size={24} color="#333" />
      </TouchableOpacity>

      {/* Success Header */}
      <View style={[rideStyles?.headerContainer, { backgroundColor: '#4CAF50', borderRadius: 10, margin: 10 }]}>
        <View style={commonStyles.flexRowGap}>
          <Ionicons name="checkmark-circle" size={40} color="white" />
          <View>
            <CustomText fontSize={16} fontFamily="Bold" style={{ color: 'white' }}>
              Ride Completed! 🎉
            </CustomText>
            <CustomText fontSize={12} style={{ color: 'white', opacity: 0.9 }}>
              Thank you for using our service
            </CustomText>
          </View>
        </View>
      </View>

      {/* Ride Summary */}
      <View style={{ padding: 10 }}>
        <CustomText fontFamily="SemiBold" fontSize={14} style={{ marginBottom: 10 }}>
          Ride Summary
        </CustomText>

        {/* Vehicle Info */}
        <View style={[commonStyles.flexRowGap, { marginBottom: 15 }]}>
          {item.vehicle && (
            <Image
              source={vehicleIcons[item.vehicle]?.icon}
              style={rideStyles.rideIcon}
            />
          )}
          <View>
            <CustomText fontSize={12} fontFamily="Medium">
              {item?.vehicle} ride
            </CustomText>
            <CustomText fontSize={10} style={{ color: '#666' }}>
              Rider: {item?.rider?.name || 'N/A'}
            </CustomText>
          </View>
        </View>

        {/* Location Details */}
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

        {/* Payment Summary */}
        <View style={{ 
          backgroundColor: '#f5f5f5', 
          padding: 15, 
          borderRadius: 10, 
          marginVertical: 10 
        }}>
          <View style={[commonStyles.flexRowBetween, { marginBottom: 10 }]}>
            <View style={commonStyles.flexRow}>
              <MaterialCommunityIcons
                name="credit-card"
                size={24}
                color="#4CAF50"
              />
              <CustomText
                style={{ marginLeft: 10 }}
                fontFamily="SemiBold"
                fontSize={14}
              >
                Total Payment
              </CustomText>
            </View>

            <CustomText fontFamily="Bold" fontSize={18} style={{ color: '#4CAF50' }}>
              ₱ {item?.fare != null ? item.fare.toFixed(2) : "0.00"}
            </CustomText>
          </View>

          {selectedPaymentMethod ? (
            <View style={[commonStyles.flexRow, { alignItems: 'center' }]}>
              <Image
                source={selectedPaymentMethod === "CASH" 
                  ? require("@/assets/icons/rupee.png")
                  : require("@/assets/images/gcash-logo.png")
                }
                style={{ width: 20, height: 20, marginRight: 8 }}
                resizeMode="contain"
              />
              <CustomText fontSize={11} style={{ color: '#666' }}>
                Payment via {selectedPaymentMethod === "CASH" ? "Cash" : "GCash"} - Paid to rider
              </CustomText>
            </View>
          ) : (
            <CustomText fontSize={11} style={{ color: '#666' }}>
              Please select payment method
            </CustomText>
          )}
        </View>

        {/* Rating Section */}
        <TouchableOpacity
          onPress={() => setRatingModalVisible(true)}
          style={{ 
            backgroundColor: '#fff3cd', 
            padding: 15, 
            borderRadius: 10, 
            marginVertical: 10,
            borderLeftWidth: 4,
            borderLeftColor: '#ffc107'
          }}
        >
          <View style={[commonStyles.flexRowBetween, { alignItems: 'center' }]}>
            <View style={{ flex: 1 }}>
              <CustomText fontFamily="SemiBold" fontSize={12} style={{ marginBottom: 5 }}>
                Rate Your Experience 🔒
              </CustomText>
              <CustomText fontSize={10} style={{ color: '#666' }}>
                Your rating will be anonymous - tap to rate
              </CustomText>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ffc107" />
          </View>
        </TouchableOpacity>
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
                Redirecting you back to the home screen in {countdown} second{countdown !== 1 ? 's' : ''}
              </CustomText>
              <CustomText fontSize={10} style={{ color: '#666', marginTop: 2 }}>
                Please wait...
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
          style={[rideStyles.backButton2, { backgroundColor: '#4CAF50', flex: 1 }]}
          onPress={handleManualNavigation}
        >
          <CustomText style={[rideStyles.backButtonText, { color: 'white' }]}>
            {isAutoNavigating ? 'Go to Home Now' : 'Book Another Ride'}
          </CustomText>
        </TouchableOpacity>
      </View>

      {/* Anonymous Rating Modal */}
      <AnonymousRatingModal
        visible={ratingModalVisible}
        onClose={() => setRatingModalVisible(false)}
        rideId={item._id}
        riderName={item?.rider?.name}
      />

      {/* Payment Method Modal */}
      <PaymentMethodModal
        visible={paymentModalVisible}
        rideId={item._id}
        fare={item.fare || 0}
        onPaymentSelected={handlePaymentSelected}
      />
    </View>
  );
};

export default RideCompletedSheet;
