import { View, Text, Image, TouchableOpacity } from "react-native";
import React, { FC } from "react";
import { useWS } from "@/service/WSProvider";
import { rideStyles } from "@/styles/rideStyles";
import { commonStyles } from "@/styles/commonStyles";
import CustomText from "../shared/CustomText";
import { vehicleIcons } from "@/utils/mapUtils";
import { MaterialCommunityIcons } from "@expo/vector-icons";
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
  status: string;
}

const LiveTrackingSheet: FC<{ item: RideItem }> = ({ item }) => {
  const { emit } = useWS();
  
  console.log('LiveTrackingSheet rendered with item:', item);
  console.log('Item status:', item?.status);
  console.log('Item OTP:', item?.otp);

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
          paddingVertical: 10,
          borderRadius: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 3.84,
          elevation: 3,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <MaterialCommunityIcons name="account-circle" size={18} color="white" style={{ marginRight: 6 }} />
            <CustomText fontFamily="Bold" fontSize={11} style={{ color: 'white' }}>
              Your Rider
            </CustomText>
          </View>
          <CustomText fontFamily="SemiBold" fontSize={15} style={{ color: 'white' }}>
            {item.rider.firstName} {item.rider.lastName}
          </CustomText>
          {item.rider.vehicleType && (
            <CustomText fontSize={10} style={{ color: 'rgba(255,255,255,0.9)', marginTop: 2 }}>
              🏍️ {item.rider.vehicleType}
            </CustomText>
          )}
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
              ₱ {item.fare?.toFixed(2)}
            </CustomText>
          </View>

          <CustomText fontSize={10}>Payment via cash</CustomText>
        </View>
      </View>

      <View style={rideStyles.bottomButtonContainer}>
        <TouchableOpacity
          style={rideStyles.cancelButton}
          onPress={() => {
            emit("cancelRide", item?._id);
          }}
        >
          <CustomText style={rideStyles.cancelButtonText}>Cancel</CustomText>
        </TouchableOpacity>

        <TouchableOpacity
          style={rideStyles.backButton2}
          onPress={() => {
            if (item?.status === "COMPLETED") {
              resetAndNavigate("/customer/home");
              return;
            }
          }}
        >
          <CustomText style={rideStyles.backButtonText}>Back</CustomText>
        </TouchableOpacity>
      </View>
      
    </View>
  );
};

export default LiveTrackingSheet;
