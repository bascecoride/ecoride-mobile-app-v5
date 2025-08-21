import React, { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, FlatList } from "react-native";
import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { RFValue } from "react-native-responsive-fontsize";
import { Colors } from "@/utils/Constants";
import CustomText from "@/components/shared/CustomText";
import RideHistoryItem from "@/components/shared/RideHistoryItem";
import { getRideHistory } from "@/service/rideService";

interface Ride {
  _id: string;
  vehicle: string;
  distance: number;
  fare: number;
  pickup: {
    address: string;
  };
  drop: {
    address: string;
  };
  status: string;
  customer: {
    name: string;
    phone: string;
  };
  rider: {
    name: string;
    phone: string;
  } | null;
  createdAt: string;
}

const RiderRideHistory = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [rides, setRides] = useState<Ride[]>([]);
  const [filteredRides, setFilteredRides] = useState<Ride[]>([]);
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    fetchRideHistory();
  }, []);

  useEffect(() => {
    if (rides.length > 0) {
      filterRides(activeFilter);
    }
  }, [rides, activeFilter]);

  const fetchRideHistory = async () => {
    try {
      setIsLoading(true);
      const response = await getRideHistory();
      setRides(response);
      setFilteredRides(response);
    } catch (error) {
      console.error("Error fetching ride history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterRides = (filter: string) => {
    setActiveFilter(filter);
    if (filter === "all") {
      setFilteredRides(rides);
    } else if (filter === "completed") {
      setFilteredRides(rides.filter((ride) => ride.status === "completed"));
    } else if (filter === "searching") {
      setFilteredRides(rides.filter((ride) => ride.status === "searching"));
    } else if (filter === "active") {
      setFilteredRides(
        rides.filter(
          (ride) =>
            ride.status === "accepted" ||
            ride.status === "arrived" ||
            ride.status === "started"
        )
      );
    }
  };

  const renderFilterButton = (label: string, filter: string) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        activeFilter === filter && styles.activeFilterButton,
      ]}
      onPress={() => filterRides(filter)}
    >
      <CustomText
        fontFamily="Medium"
        fontSize={12}
        style={[
          styles.filterButtonText,
          activeFilter === filter && styles.activeFilterButtonText,
        ]}
      >
        {label}
      </CustomText>
    </TouchableOpacity>
  );

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

      <View style={styles.filterContainer}>
        {renderFilterButton("All", "all")}
        {renderFilterButton("Completed", "completed")}
        {renderFilterButton("Searching", "searching")}
        {renderFilterButton("Active", "active")}
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : filteredRides.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="car-outline" size={RFValue(50)} color="#CCCCCC" />
          <CustomText
            fontFamily="Medium"
            fontSize={16}
            style={styles.emptyText}
          >
            No rides found
          </CustomText>
        </View>
      ) : (
        <FlatList
          data={filteredRides}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <RideHistoryItem ride={item} isRider={true} />}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 10,
    backgroundColor: "#FFFFFF",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    marginRight: 40,
  },
  filterContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
  },
  activeFilterButton: {
    backgroundColor: Colors.primary,
  },
  filterButtonText: {
    color: "#888888",
  },
  activeFilterButtonText: {
    color: "#000000",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    color: "#888888",
    marginTop: 10,
  },
  listContent: {
    padding: 16,
  },
});

export default RiderRideHistory;
