import React, { useState, useEffect, memo } from "react";
import {
  View,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RFValue } from "react-native-responsive-fontsize";
import CustomText from "../shared/CustomText";
import { VEHICLE_PASSENGER_LIMITS, VehicleType } from "@/service/rideService";

interface BookingOptionsModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (passengerCount: number, dropLandmark: string, pickupLandmark: string) => void;
  vehicleType: VehicleType;
  dropAddress: string;
  pickupAddress: string;
}

const BookingOptionsModal: React.FC<BookingOptionsModalProps> = ({
  visible,
  onClose,
  onConfirm,
  vehicleType,
  dropAddress,
  pickupAddress,
}) => {
  const maxPassengers = VEHICLE_PASSENGER_LIMITS[vehicleType] || 1;
  const [passengerCount, setPassengerCount] = useState(1);
  const [dropLandmark, setDropLandmark] = useState("");
  const [pickupLandmark, setPickupLandmark] = useState("");

  // Reset values when modal opens or vehicle type changes
  useEffect(() => {
    if (visible) {
      // Reset passenger count if it exceeds max for new vehicle type
      if (passengerCount > maxPassengers) {
        setPassengerCount(maxPassengers);
      }
    }
  }, [visible, maxPassengers]);

  const handleIncrement = () => {
    if (passengerCount < maxPassengers) {
      setPassengerCount(passengerCount + 1);
    }
  };

  const handleDecrement = () => {
    if (passengerCount > 1) {
      setPassengerCount(passengerCount - 1);
    }
  };

  const handleConfirm = () => {
    onConfirm(passengerCount, dropLandmark.trim(), pickupLandmark.trim());
  };

  const getVehicleIcon = () => {
    switch (vehicleType) {
      case "Single Motorcycle":
        return "bicycle";
      case "Tricycle":
        return "car-sport";
      case "Cab":
        return "car";
      default:
        return "car";
    }
  };

  const getVehicleDescription = () => {
    switch (vehicleType) {
      case "Single Motorcycle":
        return "1 Driver + 1 Passenger maximum";
      case "Tricycle":
        return "1 Driver + up to 3 Passengers";
      case "Cab":
        return "1 Driver + up to 4 Passengers";
      default:
        return "";
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleContainer}>
              <Ionicons name="options" size={RFValue(20)} color="#FFD700" />
              <CustomText fontFamily="SemiBold" fontSize={16} style={styles.headerTitle}>
                Booking Details
              </CustomText>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={RFValue(22)} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Vehicle Info */}
            <View style={styles.vehicleInfoContainer}>
              <View style={styles.vehicleIconContainer}>
                <Ionicons name={getVehicleIcon()} size={RFValue(24)} color="#FFD700" />
              </View>
              <View style={styles.vehicleTextContainer}>
                <CustomText fontFamily="Medium" fontSize={14}>
                  {vehicleType}
                </CustomText>
                <CustomText fontSize={11} style={styles.vehicleDescription}>
                  {getVehicleDescription()}
                </CustomText>
              </View>
            </View>

            {/* Passenger Count Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="people" size={RFValue(18)} color="#4CAF50" />
                <CustomText fontFamily="Medium" fontSize={14} style={styles.sectionTitle}>
                  Number of Passengers
                </CustomText>
              </View>
              <CustomText fontSize={11} style={styles.sectionSubtitle}>
                How many people will join this ride?
              </CustomText>

              <View style={styles.counterContainer}>
                <TouchableOpacity
                  onPress={handleDecrement}
                  style={[
                    styles.counterButton,
                    passengerCount <= 1 && styles.counterButtonDisabled,
                  ]}
                  disabled={passengerCount <= 1}
                >
                  <Ionicons
                    name="remove"
                    size={RFValue(20)}
                    color={passengerCount <= 1 ? "#ccc" : "#fff"}
                  />
                </TouchableOpacity>

                <View style={styles.counterValueContainer}>
                  <CustomText fontFamily="Bold" fontSize={28} style={styles.counterValue}>
                    {passengerCount}
                  </CustomText>
                  <CustomText fontSize={10} style={styles.counterLabel}>
                    {passengerCount === 1 ? "Passenger" : "Passengers"}
                  </CustomText>
                </View>

                <TouchableOpacity
                  onPress={handleIncrement}
                  style={[
                    styles.counterButton,
                    passengerCount >= maxPassengers && styles.counterButtonDisabled,
                  ]}
                  disabled={passengerCount >= maxPassengers}
                >
                  <Ionicons
                    name="add"
                    size={RFValue(20)}
                    color={passengerCount >= maxPassengers ? "#ccc" : "#fff"}
                  />
                </TouchableOpacity>
              </View>

              {/* Passenger indicators */}
              <View style={styles.passengerIndicators}>
                {Array.from({ length: maxPassengers }).map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.passengerDot,
                      index < passengerCount && styles.passengerDotActive,
                    ]}
                  >
                    <Ionicons
                      name="person"
                      size={RFValue(12)}
                      color={index < passengerCount ? "#fff" : "#ccc"}
                    />
                  </View>
                ))}
              </View>
            </View>

            {/* Pickup Landmark Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="location" size={RFValue(18)} color="#4CAF50" />
                <CustomText fontFamily="Medium" fontSize={14} style={styles.sectionTitle}>
                  Pick-up Landmark
                </CustomText>
                <View style={styles.optionalBadge}>
                  <CustomText fontSize={9} style={styles.optionalText}>
                    Optional
                  </CustomText>
                </View>
              </View>
              <CustomText fontSize={11} style={styles.sectionSubtitle}>
                Help the driver find your pickup location
              </CustomText>

              {/* Pickup address preview */}
              <View style={[styles.addressPreview, { borderLeftWidth: 3, borderLeftColor: '#4CAF50' }]}>
                <Ionicons name="navigate" size={RFValue(14)} color="#4CAF50" />
                <CustomText fontSize={10} style={styles.addressText} numberOfLines={2}>
                  {pickupAddress}
                </CustomText>
              </View>

              <TextInput
                style={[styles.landmarkInput, { borderColor: '#4CAF50', borderWidth: 1 }]}
                placeholder="e.g., Near the red gate, beside 7-Eleven, waiting at the corner..."
                placeholderTextColor="#999"
                value={pickupLandmark}
                onChangeText={setPickupLandmark}
                multiline
                numberOfLines={3}
                maxLength={200}
                textAlignVertical="top"
              />
              <View style={styles.charCountContainer}>
                <CustomText fontSize={10} style={styles.charCount}>
                  {pickupLandmark.length}/200 characters
                </CustomText>
              </View>

              {/* Pickup Landmark suggestions */}
              <View style={styles.suggestionsContainer}>
                <CustomText fontSize={10} style={styles.suggestionsTitle}>
                  Quick suggestions:
                </CustomText>
                <View style={styles.suggestionTags}>
                  {["Near the gate", "Beside store", "Waiting at corner", "In front of building"].map(
                    (suggestion, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[styles.suggestionTag, { borderColor: '#4CAF50' }]}
                        onPress={() => setPickupLandmark(suggestion)}
                      >
                        <CustomText fontSize={10} style={[styles.suggestionText, { color: '#4CAF50' }]}>
                          {suggestion}
                        </CustomText>
                      </TouchableOpacity>
                    )
                  )}
                </View>
              </View>
            </View>

            {/* Drop-off Landmark Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="location" size={RFValue(18)} color="#FF6B6B" />
                <CustomText fontFamily="Medium" fontSize={14} style={styles.sectionTitle}>
                  Drop-off Landmark
                </CustomText>
                <View style={styles.optionalBadge}>
                  <CustomText fontSize={9} style={styles.optionalText}>
                    Optional
                  </CustomText>
                </View>
              </View>
              <CustomText fontSize={11} style={styles.sectionSubtitle}>
                Help the driver find your destination
              </CustomText>

              {/* Drop address preview */}
              <View style={[styles.addressPreview, { borderLeftWidth: 3, borderLeftColor: '#FF6B6B' }]}>
                <Ionicons name="navigate" size={RFValue(14)} color="#FF6B6B" />
                <CustomText fontSize={10} style={styles.addressText} numberOfLines={2}>
                  {dropAddress}
                </CustomText>
              </View>

              <TextInput
                style={[styles.landmarkInput, { borderColor: '#FF6B6B', borderWidth: 1 }]}
                placeholder="e.g., Near the red gate, beside 7-Eleven, in front of the church..."
                placeholderTextColor="#999"
                value={dropLandmark}
                onChangeText={setDropLandmark}
                multiline
                numberOfLines={3}
                maxLength={200}
                textAlignVertical="top"
              />
              <View style={styles.charCountContainer}>
                <CustomText fontSize={10} style={styles.charCount}>
                  {dropLandmark.length}/200 characters
                </CustomText>
              </View>

              {/* Drop-off Landmark suggestions */}
              <View style={styles.suggestionsContainer}>
                <CustomText fontSize={10} style={styles.suggestionsTitle}>
                  Quick suggestions:
                </CustomText>
                <View style={styles.suggestionTags}>
                  {["Near the gate", "Beside store", "In front of building", "Corner lot"].map(
                    (suggestion, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[styles.suggestionTag, { borderColor: '#FF6B6B' }]}
                        onPress={() => setDropLandmark(suggestion)}
                      >
                        <CustomText fontSize={10} style={[styles.suggestionText, { color: '#FF6B6B' }]}>
                          {suggestion}
                        </CustomText>
                      </TouchableOpacity>
                    )
                  )}
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Confirm Button */}
          <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
            <Ionicons name="checkmark-circle" size={RFValue(20)} color="#fff" />
            <CustomText fontFamily="SemiBold" fontSize={14} style={styles.confirmButtonText}>
              Confirm & Book Ride
            </CustomText>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    maxHeight: "85%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    color: "#333",
  },
  closeButton: {
    padding: 4,
  },
  vehicleInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF9E6",
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#FFD700",
  },
  vehicleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
  vehicleTextContainer: {
    flex: 1,
  },
  vehicleDescription: {
    color: "#666",
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  sectionTitle: {
    marginLeft: 8,
    color: "#333",
  },
  sectionSubtitle: {
    color: "#888",
    marginBottom: 12,
    marginLeft: 26,
  },
  optionalBadge: {
    backgroundColor: "#E8E8E8",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  optionalText: {
    color: "#666",
  },
  counterContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
    marginVertical: 16,
  },
  counterButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  counterButtonDisabled: {
    backgroundColor: "#E0E0E0",
  },
  counterValueContainer: {
    alignItems: "center",
    minWidth: 80,
  },
  counterValue: {
    color: "#333",
  },
  counterLabel: {
    color: "#888",
    marginTop: -4,
  },
  passengerIndicators: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
  },
  passengerDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  passengerDotActive: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
  },
  addressPreview: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  addressText: {
    flex: 1,
    color: "#666",
  },
  landmarkInput: {
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    padding: 14,
    fontSize: RFValue(12),
    minHeight: 80,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    color: "#333",
  },
  charCountContainer: {
    alignItems: "flex-end",
    marginTop: 4,
  },
  charCount: {
    color: "#999",
  },
  suggestionsContainer: {
    marginTop: 12,
  },
  suggestionsTitle: {
    color: "#888",
    marginBottom: 8,
  },
  suggestionTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  suggestionTag: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  suggestionText: {
    color: "#666",
  },
  confirmButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFD700",
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  confirmButtonText: {
    color: "#333",
  },
});

export default memo(BookingOptionsModal);
