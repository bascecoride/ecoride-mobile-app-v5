import { View, Text, ActivityIndicator, TouchableOpacity, BackHandler } from "react-native";
import React, { FC, useState, useEffect } from "react";
import { useWS } from "@/service/WSProvider";
import { rideStyles } from "@/styles/rideStyles";
import { commonStyles } from "@/styles/commonStyles";
import { Image } from "react-native";
import CustomText from "../shared/CustomText";
import { vehicleIcons } from "@/utils/mapUtils";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import CancelRideModal from "./CancelRideModal";

type VehicleType = "Single Motorcycle" | "Tricycle" | "Cab";

interface RideItem {
  vehicle?: VehicleType;
  _id: string;
  pickup?: { address: string };
  drop?: { address: string };
  fare?: number;
}

const SearchingRideSheet: FC<{ item: RideItem }> = ({ item }) => {
  const { emit } = useWS();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  // Disable hardware back button during ride searching
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      console.log('🚫 Hardware back button disabled during ride searching');
      return true; // Prevent default back behavior
    });

    return () => backHandler.remove();
  }, []);

  return (
    <View>
      <View style={rideStyles?.headerContainer}>
        <View style={commonStyles.flexRowBetween}>
          {item?.vehicle && (
            <Image
              source={vehicleIcons[item.vehicle]?.icon}
              style={rideStyles?.rideIcon}
            />
          )}
          <View style={{ marginLeft: 10 }}>
            <CustomText fontSize={10}>Looking for your</CustomText>
            <CustomText fontFamily="Medium" fontSize={12}>
              {item?.vehicle} ride
            </CustomText>
          </View>
        </View>

        <ActivityIndicator color="black" size="small" />
      </View>

      <View style={{ padding: 10 }}>
        <CustomText fontFamily="SemiBold" fontSize={12}>
          Location Details
        </CustomText>

        <View
          style={[
            commonStyles?.flexRowGap,
            { marginVertical: 15, width: "90%" },
          ]}
        >
          <Image
            source={require("@/assets/icons/marker.png")}
            style={rideStyles?.pinIcon}
          />
          <CustomText fontSize={10} numberOfLines={2}>
            {item?.pickup?.address}
          </CustomText>
        </View>

        <View style={[commonStyles.flexRowGap, { width: "90%" }]}>
          <Image
            source={require("@/assets/icons/drop_marker.png")}
            style={rideStyles.pinIcon}
          />
          <CustomText fontSize={10} numberOfLines={2}>
            {item?.drop?.address}
          </CustomText>
        </View>

        <View style={{ marginVertical: 20 }}>
          <View style={[commonStyles.flexRowBetween]}>
            <View style={[commonStyles.flexRow]}>
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

      <View style={rideStyles?.bottomButtonContainer}>
        <TouchableOpacity
          style={[rideStyles.cancelButton, { flex: 1, marginLeft: 0 }]}
          onPress={() => {
            console.log('Cancel button pressed in SearchingRideSheet, opening modal...');
            setShowCancelModal(true);
          }}
        >
          <CustomText style={rideStyles?.cancelButtonText}>Cancel</CustomText>
        </TouchableOpacity>
      </View>

      {showCancelModal && (
        <CancelRideModal
          visible={showCancelModal}
          onClose={() => {
            console.log('Modal closed in SearchingRideSheet');
            setShowCancelModal(false);
          }}
          onConfirm={(reason) => {
            console.log('Cancellation confirmed in SearchingRideSheet with reason:', reason);
            setCancelLoading(true);
            emit("cancelRide", { rideId: item?._id, reason });
            setShowCancelModal(false);
            setCancelLoading(false);
          }}
          loading={cancelLoading}
        />
      )}

    </View>
  );
};

export default SearchingRideSheet;
