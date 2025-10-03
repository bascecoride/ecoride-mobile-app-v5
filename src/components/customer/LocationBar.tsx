import { View, Text, SafeAreaView, TouchableOpacity } from "react-native";
import React from "react";
import { useWS } from "@/service/WSProvider";
import { useUserStore } from "@/store/userStore";
import { uiStyles } from "@/styles/uiStyles";
import AntDesign from "@expo/vector-icons/AntDesign";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Colors } from "@/utils/Constants";
import { RFValue } from "react-native-responsive-fontsize";
import { router } from "expo-router";
import CustomText from "../shared/CustomText";
import { logout } from "@/service/authService";

const LocationBar = () => {
  const { location, user } = useUserStore();
  const { disconnect } = useWS();

  return (
    <View style={uiStyles.absoluteTop}>
      <SafeAreaView />
      
      {/* Welcome Message 
      <View style={{ paddingHorizontal: 15, paddingTop: 5 }}>
        <CustomText fontFamily="SemiBold" fontSize={16} style={{ color: Colors.text }}>
          Welcome Passenger{user?.firstName ? `, ${user.firstName}` : ''}!
        </CustomText>
      </View> */}
      
      <View style={uiStyles.container}>
        <TouchableOpacity
          style={uiStyles.btn}
          onPress={() => logout(disconnect)}
        >
          <AntDesign name="poweroff" size={RFValue(18)} color={Colors.text} />
        </TouchableOpacity>

        <TouchableOpacity
          style={uiStyles.locationBar}
          onPress={() => router.navigate("/customer/selectlocations")}
        >
          <View style={uiStyles.dot} />

          <CustomText numberOfLines={1} style={uiStyles.locationText}>
            {location?.address || "Getting address..."}
          </CustomText>
        </TouchableOpacity>

        <View style={uiStyles.buttonGroup}>
          <TouchableOpacity
            style={uiStyles.btn}
            onPress={() => router.push("/customer/ridehistory" as any)}
            accessibilityLabel="Ride History"
          >
            <Ionicons name="time" size={RFValue(22)} color={Colors.text} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={uiStyles.btn}
            onPress={() => router.push("/customer/profilepage" as any)}
            accessibilityLabel="My Profile"
          >
            <Ionicons name="person" size={RFValue(22)} color={Colors.text} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default LocationBar;
