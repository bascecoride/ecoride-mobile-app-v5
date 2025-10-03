import {
  View,
  Text,
  Alert,
  SafeAreaView,
  TouchableOpacity,
  Image,
} from "react-native";
import React, { useEffect, useState } from "react";
import { useWS } from "@/service/WSProvider";
import { useRiderStore } from "@/store/riderStore";
import { useIsFocused } from "@react-navigation/native";
import * as Location from "expo-location";
import { riderStyles } from "@/styles/riderStyles";
import { commonStyles } from "@/styles/commonStyles";
import { AntDesign, FontAwesome, MaterialIcons, Ionicons } from "@expo/vector-icons";
import { logout } from "@/service/authService";
import CustomText from "../shared/CustomText";
import { RFValue } from "react-native-responsive-fontsize";
import { Colors } from "@/utils/Constants";
import { router } from "expo-router";
import ProfileModal from "./ProfileModal";

const RiderHeader = () => {
  const { disconnect, emit } = useWS();
  const { setOnDuty, onDuty, setLocation, user } = useRiderStore();
  const isFocused = useIsFocused();
  const [profileModalVisible, setProfileModalVisible] = useState(false);

  const toggleOnDuty = async () => {
    if (onDuty) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location permission is required to go on duty."
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude, heading } = location.coords;
      setLocation({
        latitude: latitude,
        longitude: longitude,
        address: "Somewhere",
        heading: heading as number,
      });
      emit("goOnDuty", {
        latitude: location?.coords?.latitude,
        longitude: location?.coords?.longitude,
        heading: heading,
      });
    } else {
      emit("goOffDuty");
    }
  };

  useEffect(() => {
    if (isFocused) {
      toggleOnDuty();
    }
  }, [isFocused, onDuty]);

  return (
    <>
      <View style={riderStyles.headerContainer}>
        <SafeAreaView />
        
        {/* Welcome Message 
        <View style={{ paddingHorizontal: 15, paddingBottom: 8 }}>
          <CustomText fontFamily="SemiBold" fontSize={16} style={{ color: Colors.text }}>
            Welcome Driver{user?.firstName ? `, ${user.firstName}` : ''}!
          </CustomText>
        </View> */}

        <View style={commonStyles.flexRowBetween}>
          <FontAwesome
            onPress={() => logout(disconnect)}
            name="power-off"
            size={24}
            color={Colors.text}
          />

          <TouchableOpacity
            style={riderStyles.toggleContainer}
            onPress={() => setOnDuty(!onDuty)}
          >
            <CustomText
              fontFamily="SemiBold"
              fontSize={12}
              style={{ color: "#888" }}
            >
              {onDuty ? "ON-DUTY" : "OFF-DUTY"}
            </CustomText>

            <Image
              source={
                onDuty
                  ? require("@/assets/icons/switch_on.png")
                  : require("@/assets/icons/switch_off.png")
              }
              style={riderStyles.icon}
            />
          </TouchableOpacity>

          <View style={commonStyles.flexRow}>
            <TouchableOpacity 
              style={riderStyles.profileIconButton}
              onPress={() => router.push("/rider/ridehistory" as any)}
              accessibilityLabel="Ride History"
            >
              <Ionicons name="time" size={RFValue(22)} color="black" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={riderStyles.profileIconButton}
              onPress={() => router.push("/rider/profilepage" as any)}
              accessibilityLabel="My Profile"
            >
              <Ionicons name="person" size={RFValue(22)} color="black" />
            </TouchableOpacity>
            {/*
            <TouchableOpacity 
              style={riderStyles.profileIconButton}
              onPress={() => setProfileModalVisible(true)}
            >
              <View style={riderStyles.profileIconContainer}>
                <Ionicons name="settings-outline" size={RFValue(24)} color="black" /> 
              </View>
            </TouchableOpacity> */}
            {/* <MaterialIcons name="notifications" size={24} color="black" /> */}
          </View>
        </View>
      </View>
      
      <ProfileModal 
        visible={profileModalVisible} 
        onClose={() => setProfileModalVisible(false)} 
      />
      
    {/*
      <View style={riderStyles?.earningContainer}>
        <CustomText fontSize={13} style={{ color: "#fff" }} fontFamily="Medium">
          Today's Earnings
        </CustomText>

        <View style={commonStyles?.flexRowGap}>
          <CustomText
            fontSize={14}
            style={{ color: "#fff" }}
            fontFamily="Medium"
          >
            ₱ 50031.22
          </CustomText>
          <MaterialIcons name="arrow-drop-down" size={24} color="#fff" />
        </View>
      </View> */}
    </>
  );
};

export default RiderHeader;
