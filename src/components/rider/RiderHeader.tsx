import {
  View,
  Text,
  Alert,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Modal,
  StyleSheet,
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
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  const handleLogout = () => {
    setLogoutModalVisible(false);
    logout(disconnect);
  };

  const toggleOnDuty = async () => {
    console.log(`🔄 toggleOnDuty called, onDuty state: ${onDuty}`);
    
    if (onDuty) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log(`📍 Location permission status: ${status}`);
      
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location permission is required to go on duty."
        );
        return;
      }

      try {
        console.log(`📍 Getting current position...`);
        
        // Try to get current position with timeout, fallback to last known
        let location = null;
        
        // First try getLastKnownPositionAsync (faster)
        try {
          location = await Location.getLastKnownPositionAsync({});
          console.log(`📍 Got last known position:`, location?.coords);
        } catch (e) {
          console.log(`⚠️ getLastKnownPositionAsync failed:`, e);
        }
        
        // If no last known position, get current with lower accuracy for speed
        if (!location) {
          console.log(`📍 No last known position, getting current position...`);
          location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced, // Use balanced for faster response
          });
          console.log(`📍 Got current position:`, location?.coords);
        }
        
        if (!location || !location.coords) {
          console.error(`❌ Could not get location`);
          Alert.alert("Location Error", "Could not get your current location. Please try again.");
          return;
        }
        
        const { latitude, longitude, heading } = location.coords;
        
        console.log(`📍 Final location: lat=${latitude}, lng=${longitude}, heading=${heading}`);
        
        setLocation({
          latitude: latitude,
          longitude: longitude,
          address: "Somewhere",
          heading: (heading as number) || 0,
        });
        
        const coords = {
          latitude: latitude,
          longitude: longitude,
          heading: heading || 0,
        };
        
        console.log(`🚗 Emitting goOnDuty with coords:`, coords);
        emit("goOnDuty", coords);
        console.log(`✅ goOnDuty emitted successfully`);
      } catch (error) {
        console.error(`❌ Error getting location:`, error);
        Alert.alert("Location Error", "Could not get your current location. Please try again.");
      }
    } else {
      console.log(`🚗 Emitting goOffDuty`);
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

        <View style={styles.headerRow}>
          {/* Logout Button */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setLogoutModalVisible(true)}
            activeOpacity={0.8}
          >
            <AntDesign name="poweroff" size={RFValue(16)} color="#FF5252" />
          </TouchableOpacity>

          {/* On/Off Duty Toggle */}
          <TouchableOpacity
            style={styles.toggleContainer}
            onPress={() => setOnDuty(!onDuty)}
            activeOpacity={0.9}
          >
            <View style={[styles.statusDot, { backgroundColor: onDuty ? "#00B14F" : "#999" }]} />
            <CustomText
              fontFamily="SemiBold"
              fontSize={11}
              style={{ color: onDuty ? "#00B14F" : "#666", flex: 1 }}
            >
              {onDuty ? "ON-DUTY" : "OFF-DUTY"}
            </CustomText>
            <Image
              source={
                onDuty
                  ? require("@/assets/icons/switch_on.png")
                  : require("@/assets/icons/switch_off.png")
              }
              style={styles.switchIcon}
            />
          </TouchableOpacity>

          {/* Right Action Buttons */}
          <View style={styles.buttonGroup}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push("/rider/ridehistory" as any)}
              accessibilityLabel="Ride History"
              activeOpacity={0.8}
            >
              <Ionicons name="time" size={RFValue(18)} color={Colors.text} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push("/rider/profilepage" as any)}
              accessibilityLabel="My Profile"
              activeOpacity={0.8}
            >
              <Ionicons name="person" size={RFValue(18)} color={Colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      <ProfileModal 
        visible={profileModalVisible} 
        onClose={() => setProfileModalVisible(false)} 
      />

      {/* Logout Confirmation Modal */}
      <Modal
        visible={logoutModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalIconContainer}>
              <AntDesign name="logout" size={32} color="#FF5252" />
            </View>
            
            <CustomText fontFamily="Bold" fontSize={18} style={styles.modalTitle}>
              Logout
            </CustomText>
            
            <CustomText fontFamily="Regular" fontSize={14} style={styles.modalMessage}>
              Are you sure you want to logout from your account?
            </CustomText>

            {/* Modal Buttons */}
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setLogoutModalVisible(false)}
                activeOpacity={0.8}
              >
                <CustomText fontFamily="SemiBold" fontSize={14} style={{ color: "#666" }}>
                  Cancel
                </CustomText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
                activeOpacity={0.8}
              >
                <CustomText fontFamily="SemiBold" fontSize={14} style={{ color: "#fff" }}>
                  Logout
                </CustomText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  actionButton: {
    backgroundColor: "#fff",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    width: 40,
    height: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  toggleContainer: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    height: 44,
    marginHorizontal: 8,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  switchIcon: {
    width: 36,
    height: 20,
    resizeMode: "contain",
  },
  buttonGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 320,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#FFEBEE",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    color: "#212529",
    marginBottom: 8,
    textAlign: "center",
  },
  modalMessage: {
    color: "#6C757D",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  modalButtonContainer: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
  },
  logoutButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#FF5252",
    alignItems: "center",
  },
});

export default RiderHeader;
