import { View, Text, SafeAreaView, TouchableOpacity, Modal, StyleSheet } from "react-native";
import React, { useState } from "react";
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
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  const handleLogout = () => {
    setLogoutModalVisible(false);
    logout(disconnect);
  };

  return (
    <View style={uiStyles.absoluteTop}>
      <SafeAreaView />
      
      <View style={uiStyles.container}>
        {/* Logout Button */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setLogoutModalVisible(true)}
          activeOpacity={0.8}
        >
          <AntDesign name="poweroff" size={RFValue(16)} color="#FF5252" />
        </TouchableOpacity>

        {/* Location Bar */}
        <TouchableOpacity
          style={styles.locationBar}
          onPress={() => router.navigate("/customer/selectlocations")}
          activeOpacity={0.9}
        >
          <View style={styles.locationDot} />
          <CustomText numberOfLines={1} style={styles.locationText}>
            {location?.address || "Getting address..."}
          </CustomText>
        </TouchableOpacity>

        {/* Right Action Buttons */}
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push("/customer/ridehistory" as any)}
            accessibilityLabel="Ride History"
            activeOpacity={0.8}
          >
            <Ionicons name="time" size={RFValue(18)} color={Colors.text} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push("/customer/profilepage" as any)}
            accessibilityLabel="My Profile"
            activeOpacity={0.8}
          >
            <Ionicons name="person" size={RFValue(18)} color={Colors.text} />
          </TouchableOpacity>
        </View>
      </View>

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
    </View>
  );
};

const styles = StyleSheet.create({
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
  locationBar: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    height: 42,
    marginHorizontal: 8,
    paddingLeft: 12,
    paddingRight: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    minWidth: 200,
  },
  locationDot: {
    width: 8,
    height: 8,
    backgroundColor: "#00B14F",
    borderRadius: 4,
    marginRight: 10,
    flexShrink: 0,
  },
  locationText: {
    flex: 1,
    fontSize: RFValue(11),
    fontFamily: "Medium",
    color: Colors.text,
  },
  buttonGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
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

export default LocationBar;
