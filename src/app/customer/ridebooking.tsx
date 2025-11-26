import { View, Text, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator } from "react-native";
import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useRoute } from "@react-navigation/native";
import { useUserStore } from "@/store/userStore";
import { rideStyles } from "@/styles/rideStyles";
import { StatusBar } from "expo-status-bar";
import { calculateFare, getEstimatedTravelTime, calculateArrivalTime } from "@/utils/mapUtils";
import RoutesMap from "@/components/customer/RoutesMap";
import CustomText from "@/components/shared/CustomText";
import { router } from "expo-router";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { RFValue } from "react-native-responsive-fontsize";
import { commonStyles } from "@/styles/commonStyles";
import CustomButton from "@/components/shared/CustomButton";
import { createRide, VehicleType, VEHICLE_PASSENGER_LIMITS } from "@/service/rideService";
import { getFareRatesMap } from "@/service/fareRateService";
import BookingOptionsModal from "@/components/customer/BookingOptionsModal";

interface TravelTimeData {
  durationInSeconds: number;
  durationText: string;
  arrivalTime: string;
}

const RideBooking = () => {
  const route = useRoute() as any;
  const item = route?.params as any;
  const { location } = useUserStore() as any;
  const [selectedOption, setSelectedOption] = useState<VehicleType>("Single Motorcycle");
  const [loading, setLoading] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [passengerCount, setPassengerCount] = useState(1);
  const [dropLandmark, setDropLandmark] = useState("");
  const [pickupLandmark, setPickupLandmark] = useState("");
  const [travelTimes, setTravelTimes] = useState<Record<string, TravelTimeData>>({});
  const [loadingTravelTimes, setLoadingTravelTimes] = useState(true);
  const [fareRates, setFareRates] = useState<Record<string, { minimumRate: number; perKmRate: number }> | null>(null);

  // Fetch dynamic fare rates from server
  useEffect(() => {
    const fetchFareRates = async () => {
      try {
        const rates = await getFareRatesMap();
        setFareRates(rates);
        console.log('✅ Fare rates loaded:', rates);
      } catch (error) {
        console.error('❌ Error loading fare rates:', error);
        // Will use default rates from calculateFare
      }
    };

    fetchFareRates();
  }, []);

  const farePrices = useMemo(
    () => calculateFare(parseFloat(item?.distanceInKm), fareRates || undefined),
    [item?.distanceInKm, fareRates]
  );

  // Fetch travel times for all vehicle types
  useEffect(() => {
    const fetchTravelTimes = async () => {
      if (!item?.drop_latitude || !item?.drop_longitude || !location?.latitude || !location?.longitude) {
        setLoadingTravelTimes(false);
        return;
      }

      setLoadingTravelTimes(true);
      const vehicleTypes: Array<'Single Motorcycle' | 'Tricycle' | 'Cab'> = ['Single Motorcycle', 'Tricycle', 'Cab'];
      const times: Record<string, TravelTimeData> = {};

      try {
        // Fetch travel times for all vehicle types in parallel
        const results = await Promise.all(
          vehicleTypes.map(vehicleType =>
            getEstimatedTravelTime(
              parseFloat(location.latitude),
              parseFloat(location.longitude),
              parseFloat(item.drop_latitude),
              parseFloat(item.drop_longitude),
              vehicleType
            )
          )
        );

        vehicleTypes.forEach((vehicleType, index) => {
          const result = results[index];
          times[vehicleType] = {
            durationInSeconds: result.durationInSeconds,
            durationText: result.durationText,
            arrivalTime: calculateArrivalTime(result.durationInSeconds),
          };
        });

        setTravelTimes(times);
      } catch (error) {
        console.error('Error fetching travel times:', error);
      } finally {
        setLoadingTravelTimes(false);
      }
    };

    fetchTravelTimes();
  }, [item?.drop_latitude, item?.drop_longitude, location?.latitude, location?.longitude]);

  const rideOptions = useMemo(() => {
    // Determine which vehicle is fastest
    let fastestVehicle = 'Single Motorcycle';
    let minDuration = travelTimes['Single Motorcycle']?.durationInSeconds || Infinity;
    
    if (travelTimes['Tricycle']?.durationInSeconds < minDuration) {
      fastestVehicle = 'Tricycle';
      minDuration = travelTimes['Tricycle'].durationInSeconds;
    }
    if (travelTimes['Cab']?.durationInSeconds < minDuration) {
      fastestVehicle = 'Cab';
    }

    return [
      {
        type: "Single Motorcycle",
        seats: 1,
        time: travelTimes['Single Motorcycle']?.durationText || 'Calculating...',
        dropTime: travelTimes['Single Motorcycle']?.arrivalTime || '--',
        price: farePrices?.["Single Motorcycle"],
        isFastest: fastestVehicle === 'Single Motorcycle',
        icon: require("@/assets/icons/SingleMotorcycle-NoBG.png"),
      },
      {
        type: "Tricycle",
        seats: 3,
        time: travelTimes['Tricycle']?.durationText || 'Calculating...',
        dropTime: travelTimes['Tricycle']?.arrivalTime || '--',
        price: farePrices["Tricycle"],
        isFastest: fastestVehicle === 'Tricycle',
        icon: require("@/assets/icons/Tricycle-NoBG.png"),
      },
      {
        type: "Cab",
        seats: 4,
        time: travelTimes['Cab']?.durationText || 'Calculating...',
        dropTime: travelTimes['Cab']?.arrivalTime || '--',
        price: farePrices["Cab"],
        isFastest: fastestVehicle === 'Cab',
        icon: require("@/assets/icons/Car-NoBG.png"),
      },
    ];
  }, [farePrices, travelTimes]);

  const handleOptionSelect = useCallback((type: VehicleType) => {
    setSelectedOption(type);
    // Reset passenger count if it exceeds max for new vehicle type
    const maxPassengers = VEHICLE_PASSENGER_LIMITS[type] || 1;
    if (passengerCount > maxPassengers) {
      setPassengerCount(maxPassengers);
    }
  }, [passengerCount]);

  const handleBookRidePress = () => {
    // Show the booking options modal before creating the ride
    setShowBookingModal(true);
  };

  const handleBookingConfirm = async (passengers: number, dropLandmarkValue: string, pickupLandmarkValue: string) => {
    setPassengerCount(passengers);
    setDropLandmark(dropLandmarkValue);
    setPickupLandmark(pickupLandmarkValue);
    setShowBookingModal(false);
    
    // Proceed with ride booking
    await handleRideBooking(passengers, dropLandmarkValue, pickupLandmarkValue);
  };

  const handleRideBooking = async (passengers: number = passengerCount, dropLandmarkValue: string = dropLandmark, pickupLandmarkValue: string = pickupLandmark) => {
    setLoading(true);

    try {
      // Validate required data before sending
      if (!item?.drop_latitude || !item?.drop_longitude || !item?.drop_address) {
        Alert.alert("Error", "Drop location information is missing");
        setLoading(false);
        return;
      }

      if (!location?.latitude || !location?.longitude || !location?.address) {
        Alert.alert("Error", "Pickup location information is missing");
        setLoading(false);
        return;
      }

      // Ensure coordinates are valid numbers
      const dropLat = Number(item.drop_latitude);
      const dropLng = Number(item.drop_longitude);
      const pickupLat = Number(location.latitude);
      const pickupLng = Number(location.longitude);

      if (isNaN(dropLat) || isNaN(dropLng) || isNaN(pickupLat) || isNaN(pickupLng)) {
        Alert.alert("Error", "Invalid location coordinates");
        setLoading(false);
        return;
      }

      console.log("Creating ride with payload:", {
        vehicle: selectedOption,
        passengerCount: passengers,
        drop: {
          latitude: dropLat,
          longitude: dropLng,
          address: item.drop_address,
          landmark: dropLandmarkValue || undefined,
        },
        pickup: {
          latitude: pickupLat,
          longitude: pickupLng,
          address: location.address,
          landmark: pickupLandmarkValue || undefined,
        },
      });

      await createRide({
        vehicle: selectedOption,
        passengerCount: passengers,
        drop: {
          latitude: dropLat,
          longitude: dropLng,
          address: item.drop_address,
          landmark: dropLandmarkValue || undefined,
        },
        pickup: {
          latitude: pickupLat,
          longitude: pickupLng,
          address: location.address,
          landmark: pickupLandmarkValue || undefined,
        },
      });
    } catch (error) {
      console.error("Error in handleRideBooking:", error);
      Alert.alert("Error", "Failed to create ride. Please try again.");
    }

    setLoading(false);
  };

  return (
    <View style={rideStyles.container}>
      <StatusBar style="light" backgroundColor="orange" translucent={false} />

      {item?.drop_latitude && location?.latitude && (
        <RoutesMap
          drop={{
            latitude: parseFloat(item?.drop_latitude),
            longitude: parseFloat(item?.drop_longitude),
          }}
          pickup={{
            latitude: parseFloat(location?.latitude),
            longitude: parseFloat(location?.longitude),
          }}
        />
      )}

      <View style={rideStyles.rideSelectionContainer}>
        {/* Header Section */}
        

        {loadingTravelTimes ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
            <ActivityIndicator size="large" color="#FFD700" />
            <CustomText fontSize={12} style={{ marginTop: 12, opacity: 0.7 }}>
              Calculating travel times...
            </CustomText>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={rideStyles?.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            {rideOptions?.map((ride, index) => (
              <RideOption
                key={index}
                ride={ride}
                selected={selectedOption}
                onSelect={handleOptionSelect}
              />
            ))}
          </ScrollView>
        )}
      </View>

      <TouchableOpacity
        style={rideStyles.backButton}
        onPress={() => router.back()}
      >
        <MaterialIcons
          name="arrow-back-ios"
          size={RFValue(14)}
          style={{ left: 4 }}
          color="black"
        />
      </TouchableOpacity>

      <View style={rideStyles.bookingContainer}>
        <View style={commonStyles.flexRowBetween}>
          <View
            style={[
              rideStyles.couponContainer,
              { borderRightWidth: 0, borderRightColor: "#ccc" },
            ]}
          >
            <Image
              source={require("@/assets/icons/rupee.png")}
              style={rideStyles?.icon}
            />
            <View>
              <CustomText fontFamily="Medium" fontSize={12}>
                Cash
              </CustomText>
              <CustomText
                fontFamily="Medium"
                fontSize={10}
                style={{ opacity: 0.7 }}
              >
                Far: {item?.distanceInKm} KM
              </CustomText>
            </View>
            {/*<Ionicons name="chevron-forward" size={RFValue(14)} color="#777" />*/}
          </View>
            {/*
          <View style={rideStyles.couponContainer}>
            <Image
              source={require("@/assets/icons/coupon.png")}
              style={rideStyles.icon}
            />
            <View>
              <CustomText fontFamily="Medium" fontSize={12}>
                DHANOO
              </CustomText>
              <CustomText
                style={{ opacity: 0.7 }}
                fontFamily="Medium"
                fontSize={10}
              >
                Coupon Applied
              </CustomText>
            </View>
            <Ionicons name="chevron-forward" size={RFValue(14)} color="#777" />
          </View> */}
        </View>

        <CustomButton
          title="Book Ride"
          disabled={loading}
          loading={loading}
          onPress={handleBookRidePress}
        />

        {/* Booking Options Modal */}
        <BookingOptionsModal
          visible={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          onConfirm={handleBookingConfirm}
          vehicleType={selectedOption}
          dropAddress={item?.drop_address || ""}
          pickupAddress={location?.address || ""}
        />
      </View>
    </View>
  );
};

const RideOption = memo(({ ride, selected, onSelect }: any) => (
  <TouchableOpacity
    onPress={() => onSelect(ride?.type)}
    style={[
      rideStyles.rideOption,
      { borderColor: selected === ride.type ? "#FFD700" : "#E0E0E0" },
      selected === ride.type && rideStyles.rideOptionSelected,
    ]}
    activeOpacity={0.7}
  >
    <View style={commonStyles.flexRowBetween}>
      <Image source={ride?.icon} style={rideStyles?.rideIcon} />

      <View style={rideStyles?.rideDetails}>
        <CustomText fontFamily="Medium" fontSize={12}>
          {ride?.type}{" "}
          {ride?.isFastest && (
            <Text style={rideStyles.fastestLabel}>FASTEST</Text>
          )}
        </CustomText>
        <CustomText fontSize={10}>
          {ride?.seats} seats • {ride?.time} away • Drop {ride?.dropTime}
        </CustomText>
      </View>

      <View style={rideStyles?.priceContainer}>
        <CustomText 
          fontFamily="Medium" 
          fontSize={16}
          style={{ color: selected === ride.type ? 'green' : '#000' }}
        >
          ₱{ride?.price?.toFixed(2)}
        </CustomText>
      </View>
    </View>
  </TouchableOpacity>
));

export default memo(RideBooking);
