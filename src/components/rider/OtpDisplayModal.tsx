import React, { FC } from "react";
import { View, Text, Modal, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import CustomText from "../shared/CustomText";
import { Colors } from "@/utils/Constants";

interface OtpDisplayModalProps {
  visible: boolean;
  onClose: () => void;
  otp: string;
  rideId: string;
}

const OtpDisplayModal: FC<OtpDisplayModalProps> = ({
  visible,
  onClose,
  otp,
  rideId,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <CustomText fontSize={18} fontFamily="SemiBold">
              Ride Accepted! 🎉
            </CustomText>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <CustomText fontSize={14} style={styles.description}>
              Share this OTP with the customer when you arrive at pickup location:
            </CustomText>

            <View style={styles.otpContainer}>
              <CustomText fontSize={32} fontFamily="Bold" style={styles.otpText}>
                {otp}
              </CustomText>
            </View>

            <View style={styles.rideInfo}>
              <CustomText fontSize={12} style={styles.rideIdLabel}>
                Ride ID:
              </CustomText>
              <CustomText fontSize={14} fontFamily="SemiBold">
                #RID{rideId?.slice(0, 8).toUpperCase()}
              </CustomText>
            </View>

            <CustomText fontSize={12} style={styles.instructions}>
              • Navigate to pickup location
              • Call the customer when you arrive
              • Share the OTP to confirm pickup
            </CustomText>
          </View>

          <TouchableOpacity style={styles.continueButton} onPress={onClose}>
            <CustomText fontSize={16} fontFamily="SemiBold" style={styles.continueText}>
              Continue to Live Ride
            </CustomText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    maxWidth: 350,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    alignItems: "center",
    marginBottom: 20,
  },
  description: {
    textAlign: "center",
    color: "#666",
    marginBottom: 20,
    lineHeight: 20,
  },
  otpContainer: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  otpText: {
    color: "white",
    letterSpacing: 4,
  },
  rideInfo: {
    alignItems: "center",
    marginBottom: 16,
  },
  rideIdLabel: {
    color: "#666",
    marginBottom: 4,
  },
  instructions: {
    color: "#666",
    textAlign: "left",
    lineHeight: 18,
  },
  continueButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  continueText: {
    color: "white",
  },
});

export default OtpDisplayModal;
