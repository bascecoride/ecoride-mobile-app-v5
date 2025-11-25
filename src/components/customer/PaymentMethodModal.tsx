import React, { FC, useState } from "react";
import {
  View,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import CustomText from "../shared/CustomText";
import { Ionicons } from "@expo/vector-icons";
import { updatePaymentMethod } from "@/service/rideService";

const { width } = Dimensions.get("window");

interface PaymentMethodModalProps {
  visible: boolean;
  rideId: string;
  fare: number;
  onPaymentSelected: (method: "CASH" | "GCASH") => void;
  onClose?: () => void;
}

const PaymentMethodModal: FC<PaymentMethodModalProps> = ({
  visible,
  rideId,
  fare,
  onPaymentSelected,
  onClose,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<"CASH" | "GCASH" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectPayment = async (method: "CASH" | "GCASH") => {
    setSelectedMethod(method);
    setIsSubmitting(true);

    try {
      const result = await updatePaymentMethod(rideId, method);
      if (result.success) {
        onPaymentSelected(method);
      }
    } catch (error) {
      console.error("Error updating payment method:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.successIconContainer}>
              <Ionicons name="checkmark-circle" size={60} color="#4CAF50" />
            </View>
            <CustomText fontFamily="Bold" fontSize={20} style={styles.title}>
              Ride Completed! 🎉
            </CustomText>
            <CustomText fontSize={14} style={styles.subtitle}>
              How would you like to pay?
            </CustomText>
          </View>

          {/* Fare Display */}
          <View style={styles.fareContainer}>
            <CustomText fontSize={14} style={styles.fareLabel}>
              Total Fare
            </CustomText>
            <CustomText fontFamily="Bold" fontSize={32} style={styles.fareAmount}>
              ₱ {fare?.toFixed(2) || "0.00"}
            </CustomText>
          </View>

          {/* Payment Options */}
          <View style={styles.paymentOptions}>
            <CustomText fontFamily="SemiBold" fontSize={14} style={styles.sectionTitle}>
              Select Payment Method
            </CustomText>

            {/* Cash Option */}
            <TouchableOpacity
              style={[
                styles.paymentOption,
                selectedMethod === "CASH" && styles.selectedOption,
              ]}
              onPress={() => handleSelectPayment("CASH")}
              disabled={isSubmitting}
            >
              <View style={styles.paymentIconContainer}>
                <Image
                  source={require("@/assets/icons/rupee.png")}
                  style={styles.paymentIcon}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.paymentInfo}>
                <CustomText fontFamily="SemiBold" fontSize={16}>
                  Cash
                </CustomText>
                <CustomText fontSize={12} style={styles.paymentDescription}>
                  Pay directly to the rider
                </CustomText>
              </View>
              {selectedMethod === "CASH" && isSubmitting ? (
                <ActivityIndicator size="small" color="#4CAF50" />
              ) : (
                <View
                  style={[
                    styles.radioButton,
                    selectedMethod === "CASH" && styles.radioButtonSelected,
                  ]}
                >
                  {selectedMethod === "CASH" && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
              )}
            </TouchableOpacity>

            {/* GCash Option */}
            <TouchableOpacity
              style={[
                styles.paymentOption,
                selectedMethod === "GCASH" && styles.selectedOption,
              ]}
              onPress={() => handleSelectPayment("GCASH")}
              disabled={isSubmitting}
            >
              <View style={[styles.paymentIconContainer, styles.gcashIconContainer]}>
                <Image
                  source={require("@/assets/images/gcash-logo.png")}
                  style={styles.gcashIcon}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.paymentInfo}>
                <CustomText fontFamily="SemiBold" fontSize={16}>
                  GCash
                </CustomText>
                <CustomText fontSize={12} style={styles.paymentDescription}>
                  Pay via GCash to the rider
                </CustomText>
              </View>
              {selectedMethod === "GCASH" && isSubmitting ? (
                <ActivityIndicator size="small" color="#007DFE" />
              ) : (
                <View
                  style={[
                    styles.radioButton,
                    selectedMethod === "GCASH" && styles.radioButtonSelectedGcash,
                  ]}
                >
                  {selectedMethod === "GCASH" && (
                    <View style={[styles.radioButtonInner, styles.radioButtonInnerGcash]} />
                  )}
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Info Note */}
          <View style={styles.infoNote}>
            <Ionicons name="information-circle-outline" size={20} color="#666" />
            <CustomText fontSize={11} style={styles.infoText}>
              Payment will be handled directly between you and the rider. This selection is for record-keeping purposes.
            </CustomText>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 20,
    width: width - 40,
    maxWidth: 400,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  successIconContainer: {
    marginBottom: 12,
  },
  title: {
    color: "#333",
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    color: "#666",
    textAlign: "center",
  },
  fareContainer: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  fareLabel: {
    color: "#666",
    marginBottom: 4,
  },
  fareAmount: {
    color: "#4CAF50",
  },
  paymentOptions: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: "#333",
    marginBottom: 12,
  },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedOption: {
    borderColor: "#4CAF50",
    backgroundColor: "#f0fff4",
  },
  paymentIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  gcashIconContainer: {
    backgroundColor: "#ffffffff",
  },
  paymentIcon: {
    width: 30,
    height: 30,
  },
  gcashIcon: {
    width: 35,
    height: 35,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentDescription: {
    color: "#666",
    marginTop: 2,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
  },
  radioButtonSelected: {
    borderColor: "#4CAF50",
  },
  radioButtonSelectedGcash: {
    borderColor: "#007DFE",
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#4CAF50",
  },
  radioButtonInnerGcash: {
    backgroundColor: "#007DFE",
  },
  infoNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#fff3cd",
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#ffc107",
  },
  infoText: {
    color: "#666",
    flex: 1,
    marginLeft: 8,
    lineHeight: 16,
  },
});

export default PaymentMethodModal;
