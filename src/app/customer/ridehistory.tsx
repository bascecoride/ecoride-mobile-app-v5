import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { RFValue } from "react-native-responsive-fontsize";
import { Colors } from "@/utils/Constants";
import CustomText from "@/components/shared/CustomText";
import RideHistory from "@/components/customer/RideHistory";

const CustomerRideHistory = () => {
  const [historyFilter, setHistoryFilter] = useState<string>("COMPLETED");

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={RFValue(24)} color="black" />
        </TouchableOpacity>
        <CustomText fontFamily="Bold" fontSize={18} style={styles.headerTitle}>
          Ride History
        </CustomText>
      </View>

      <View style={styles.historyContainer}>
        <View style={styles.headerCard}>
          <View style={styles.headerContent}>
            <View style={styles.iconWrapper}>
              <Ionicons name="time" size={RFValue(24)} color={Colors.primary} />
            </View>
            <View style={styles.headerTextContainer}>
              <CustomText fontSize={12} style={styles.headerSubtitle}>
                Track all your completed trips and experiences
              </CustomText>
            </View>
          </View>
        </View>
        <RideHistory activeTab={historyFilter} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    marginRight: 40,
    color: Colors.text,
  },
  historyContainer: {
    flex: 1,
    paddingTop: 8,
  },
  headerCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconWrapper: {
    width: RFValue(48),
    height: RFValue(48),
    borderRadius: RFValue(24),
    backgroundColor: Colors.secondary_light,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerSubtitle: {
    color: "#757575",
    marginTop: 4,
    lineHeight: 18,
  },
  // Legacy styles for backward compatibility
  historyFilterContainer: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: "#F5F5F5",
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  activeFilterButton: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterButtonText: {
    color: "#757575",
  },
  activeFilterButtonText: {
    color: "#000000",
  },
  infoContainer: {
    padding: 16,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    margin: 10,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  infoText: {
    color: "#333",
    marginBottom: 4,
  },
  infoSubText: {
    color: "#666",
  },
});

export default CustomerRideHistory;
