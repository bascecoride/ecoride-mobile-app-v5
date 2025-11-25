import { View, Text, TouchableOpacity, Image } from "react-native";
import React, { useState, useEffect } from "react";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { uiStyles } from "@/styles/uiStyles";
import { router } from "expo-router";
import { RFValue } from "react-native-responsive-fontsize";
import CustomText from "../shared/CustomText";
import { commonStyles } from "@/styles/commonStyles";
import ProfileModal from "./ProfileModal";
import { getDistanceRadius, clearDistanceRadiusCache } from "@/service/appSettingsService";

// Commented out - replaced with "Book a Ride" button (redundant vehicle selection)
// const cubes = [
//   { name: "Single", imageUri: require("@/assets/icons/SingleMotorcycle-NoBG.png") },
//   { name: "Tricycle", imageUri: require("@/assets/icons/Tricycle-NoBG.png") },
//   { name: "Four Wheel", imageUri: require("@/assets/icons/Car-NoBG.png") },
//   { name: "Coming Soon...", imageUri: require("@/assets/icons/coming_soon.png") },
//   { name: "Four Wheel Premium", imageUri: require("@/assets/icons/cab_premium.png") },
// ];

const SheetContent = () => {
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [distanceRadius, setDistanceRadius] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch distance radius from server
  const fetchDistanceRadius = async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        setIsRefreshing(true);
        clearDistanceRadiusCache(); // Clear cache to get fresh data
      }
      const data = await getDistanceRadius();
      setDistanceRadius(data.distanceRadius);
    } catch (error) {
      console.error("Error fetching distance radius:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDistanceRadius();
  }, []);

  return (
    <View style={{ flex: 1, paddingHorizontal: 4 }}>
      {/* Main Action - Book a Ride Button */}
      <TouchableOpacity
        style={{
          backgroundColor: "#00B14F",
          paddingVertical: 14,
          paddingHorizontal: 20,
          borderRadius: 14,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#00B14F",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 6,
        }}
        onPress={() => router.push({
          pathname: "/customer/selectlocations"
        })}
        activeOpacity={0.85}
      >
        <View style={{
          backgroundColor: "rgba(255,255,255,0.2)",
          padding: 8,
          borderRadius: 10,
          marginRight: 12,
        }}>
          <Ionicons name="car-sport" size={RFValue(22)} color="white" />
        </View>
        <View style={{ flex: 1 }}>
          <CustomText fontFamily="Bold" fontSize={15} style={{ color: "white" }}>
            Book a Ride
          </CustomText>
          <CustomText fontFamily="Medium" fontSize={10} style={{ color: "rgba(255,255,255,0.8)" }}>
            Find nearby drivers instantly
          </CustomText>
        </View>
        <Ionicons name="arrow-forward-circle" size={RFValue(24)} color="white" />
      </TouchableOpacity>

      {/* Service Coverage Info - Compact */}
      {distanceRadius !== null && (
        <View
          style={{
            backgroundColor: "#F8F9FA",
            paddingVertical: 10,
            paddingHorizontal: 14,
            borderRadius: 12,
            marginTop: 12,
            flexDirection: "row",
            alignItems: "center",
            borderWidth: 1,
            borderColor: "#E9ECEF",
          }}
        >
          <View style={{
            backgroundColor: "#E8F5E9",
            padding: 8,
            borderRadius: 10,
            marginRight: 10,
          }}>
            <MaterialCommunityIcons name="map-marker-radius" size={RFValue(16)} color="#00B14F" />
          </View>
          <View style={{ flex: 1 }}>
            <CustomText fontFamily="Medium" fontSize={10} style={{ color: "#6C757D" }}>
              Service Coverage
            </CustomText>
            <CustomText fontFamily="Bold" fontSize={14} style={{ color: "#212529" }}>
              {distanceRadius} km radius
            </CustomText>
          </View>
          <TouchableOpacity
            onPress={() => fetchDistanceRadius(true)}
            style={{
              padding: 8,
              borderRadius: 10,
              backgroundColor: isRefreshing ? "#E8F5E9" : "#fff",
              borderWidth: 1,
              borderColor: isRefreshing ? "#C8E6C9" : "#E9ECEF",
            }}
            disabled={isRefreshing}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="refresh" 
              size={RFValue(16)} 
              color={isRefreshing ? "#81C784" : "#00B14F"} 
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Footer Banner */}
      <View style={uiStyles.bannerContainer}>
        <Image
          source={require("@/assets/images/ecoride_footer.png")}
          style={uiStyles.banner}
        />
      </View>

      <ProfileModal 
        visible={profileModalVisible} 
        onClose={() => setProfileModalVisible(false)} 
      />
    </View>
  );
};

export default SheetContent;
