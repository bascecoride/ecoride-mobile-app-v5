import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import React, { useEffect, useState } from "react";
import { useUserStore } from "@/store/userStore";
import { StatusBar } from "expo-status-bar";
import { homeStyles } from "@/styles/homeStyles";
import { commonStyles } from "@/styles/commonStyles";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/utils/Constants";
import CustomText from "@/components/shared/CustomText";
import { uiStyles } from "@/styles/uiStyles";
import LocationInput from "@/components/customer/LocationInput";
import {
  calculateDistance,
  getLatLong,
  getPlacesSuggestions,
  reverseGeocode,
} from "@/utils/mapUtils";
import { PIN_LOCATIONS } from "@/utils/LocationConfig";
import { locationStyles } from "@/styles/locationStyles";
import LocationItem from "@/components/customer/LocationItem";
import MapPickerModal from "@/components/customer/MapPickerModal";
import * as Location from "expo-location";

export default function LocationSelection() {
  const { location, setLocation } = useUserStore();

  const [pickup, setPickup] = useState("");
  const [pickupCoords, setPickupCoords] = useState<any>(null);
  const [dropCoords, setDropCoords] = useState<any>(null);
  const [drop, setDrop] = useState("");
  const [locations, setLocations] = useState([]);
  const [focusedInput, setFocusedInput] = useState("drop");
  const [modalTitle, setModalTitle] = useState("drop");
  const [isMapModalVisible, setMapModalVisible] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const fetchLocation = async (query: string) => {
    if (query?.length > 4) {
      const data = await getPlacesSuggestions(query);
      setLocations(data);
    }
  };

  const addLocation = async (id: string) => {
    const data = await getLatLong(id);
    if (data) {
      if (focusedInput === "drop") {
        setDrop(data?.address);
        setDropCoords(data);
      } else {
        setLocation(data);
        setPickupCoords(data);
        setPickup(data?.address);
      }
    }
  };

  const getCategoryColor = (category: string) => {
    const categoryColors = {
      'San Miguel': '#FF6B35',
      'San Ildefonso': '#007AFF', 
      'San Rafael': '#34C759'
    };
    return categoryColors[category as keyof typeof categoryColors] || '#FF6B35';
  };

  const handlePinLocationSelect = (pinLocation: any) => {
    const locationData = {
      latitude: pinLocation.latitude,
      longitude: pinLocation.longitude,
      address: pinLocation.address
    };

    if (focusedInput === "drop") {
      setDrop(pinLocation.address);
      setDropCoords(locationData);
    } else {
      setLocation(locationData);
      setPickupCoords(locationData);
      setPickup(pinLocation.address);
    }
  };

  const handleGetCurrentLocation = async () => {
    try {
      setIsGettingLocation(true);
      
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location permission is required to get your current location. Please enable it in your device settings."
        );
        setIsGettingLocation(false);
        return;
      }

      // Check if location services are enabled
      const isLocationEnabled = await Location.hasServicesEnabledAsync();
      if (!isLocationEnabled) {
        Alert.alert(
          "Location Services Disabled",
          "Please enable location services in your device settings to use this feature."
        );
        setIsGettingLocation(false);
        return;
      }

      // Get current position
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = currentLocation.coords;

      // Reverse geocode to get address
      const address = await reverseGeocode(latitude, longitude);

      const locationData = {
        latitude,
        longitude,
        address: address || "Current Location",
      };

      // Set as pickup location
      setLocation(locationData);
      setPickupCoords(locationData);
      setPickup(address || "Current Location");

      console.log("✅ Current location set:", locationData);
      
    } catch (error) {
      console.log("Error getting current location:", error);
      Alert.alert(
        "Error",
        "Failed to get your current location. Please try again or select from map."
      );
    } finally {
      setIsGettingLocation(false);
    }
  };

  const renderLocations = ({ item }: any) => {
    return (
      <LocationItem item={item} onPress={() => addLocation(item?.place_id)} />
    );
  };

  const checkDistance = async () => {
    if (!pickupCoords || !dropCoords) return;

    const { latitude: lat1, longitude: lon1 } = pickupCoords;
    const { latitude: lat2, longitude: lon2 } = dropCoords;

    if (lat1 === lat2 && lon1 === lon2) {
      alert(
        "Pickup and drop locations cannot be same. Please select different locations."
      );
      return;
    }

    const distance = calculateDistance(lat1, lon1, lat2, lon2);

    // TODO: Adjust minimum distance requirement later if needed
    // const minDistance = 0.5; // Minimum distance in km (e.g., 500 meters)
    const maxDistance = 50; // Maximum distance in km (e.g., 50 km)

    // Commented out minimum distance validation - no minimum requirement for now
    // if (distance < minDistance) {
    //   alert(
    //     "The selected locations are too close. Please choose locations that are further apart."
    //   );
    // } else 
    if (distance > maxDistance) {
      alert(
        "The selected locations are too far apart. Please select a closer drop location."
      );
    } else {
      setLocations([]);
      router.navigate({
        pathname: "/customer/ridebooking",
        params: {
          distanceInKm: distance.toFixed(2),
          drop_latitude: dropCoords?.latitude,
          drop_longitude: dropCoords?.longitude,
          drop_address: drop,
        },
      });

      console.log(`Distance is valid : ${distance.toFixed(2)} km`);
    }
  };

  useEffect(() => {
    if (dropCoords && pickupCoords) {
      checkDistance();
    } else {
      setLocations([]);
      setMapModalVisible(false);
    }
  }, [dropCoords, pickupCoords]);

  useEffect(() => {
    if (location) {
      setPickupCoords(location);
      setPickup(location?.address);
    }
  }, [location]);

  return (
    <View style={homeStyles.container}>
      <StatusBar style="light" backgroundColor="orange" translucent={false} />
      <SafeAreaView />
      <TouchableOpacity
        style={commonStyles.flexRow}
        onPress={() => router.back()}
      >
        <Ionicons name="chevron-back" size={24} color={Colors.iosColor} />
        <CustomText fontFamily="Regular" style={{ color: Colors.iosColor }}>
          Back
        </CustomText>
      </TouchableOpacity>

      <View style={uiStyles.locationInputs}>
        <LocationInput
          placeholder="Search Pickup Location"
          type="pickup"
          value={pickup}
          onChangeText={(text) => {
            setPickup(text);
            fetchLocation(text);
          }}
          onFocus={() => setFocusedInput("pickup")}
          onGetCurrentLocation={handleGetCurrentLocation}
          isGettingLocation={isGettingLocation}
        />

        <LocationInput
          placeholder="Search Drop Location"
          type="drop"
          value={drop}
          onChangeText={(text) => {
            setDrop(text);
            fetchLocation(text);
          }}
          onFocus={() => setFocusedInput("drop")}
        />

        <CustomText
          fontFamily="Medium"
          fontSize={10}
          style={uiStyles.suggestionText}
        >
          {focusedInput} suggestions
        </CustomText>
      </View>

      <FlatList
        data={locations}
        renderItem={renderLocations}
        keyExtractor={(item: any) => item?.place_id}
        initialNumToRender={5}
        windowSize={5}
        ListFooterComponent={
          <View>
            <TouchableOpacity
              style={[commonStyles.flexRow, locationStyles.container]}
              onPress={() => {
                setModalTitle(focusedInput);
                setMapModalVisible(true);
              }}
            >
              <Image
                source={require("@/assets/icons/map_pin.png")}
                style={uiStyles.mapPinIcon}
              />
              <CustomText fontFamily="Medium" fontSize={12}>
                Select from Map
              </CustomText>
            </TouchableOpacity>
            
            {/* Most Picked Locations Section */}
            <View style={{ marginTop: 20, paddingHorizontal: 16 }}>
              <CustomText
                fontFamily="Medium"
                fontSize={14}
                style={{ color: Colors.text, marginBottom: 12 }}
              >
                Most Picked Locations
              </CustomText>
              
              {PIN_LOCATIONS.map((pinLocation) => (
                <TouchableOpacity
                  key={pinLocation.id}
                  style={[
                    commonStyles.flexRow,
                    {
                      backgroundColor: '#f8f9fa',
                      padding: 12,
                      marginBottom: 8,
                      borderRadius: 8,
                      borderLeftWidth: 3,
                      borderLeftColor: getCategoryColor(pinLocation.category),
                    }
                  ]}
                  onPress={() => handlePinLocationSelect(pinLocation)}
                >
                  <View style={{ flex: 1 }}>
                    <CustomText fontFamily="Medium" fontSize={13} style={{ color: Colors.text }}>
                      {pinLocation.name}
                    </CustomText>
                    <CustomText 
                      fontFamily="Regular" 
                      fontSize={11} 
                      style={{ color: '#666', marginTop: 2 }}
                    >
                      {pinLocation.category} • {pinLocation.description}
                    </CustomText>
                  </View>
                  <View style={{
                    backgroundColor: getCategoryColor(pinLocation.category),
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 12,
                    alignSelf: 'center'
                  }}>
                    <CustomText fontFamily="Medium" fontSize={10} style={{ color: 'white' }}>
                      {pinLocation.category}
                    </CustomText>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        }
      />

      {isMapModalVisible && (
        <MapPickerModal
          selectedLocation={{
            latitude:
              focusedInput === "drop"
                ? dropCoords?.latitude
                : pickupCoords?.latitude,
            longitude:
              focusedInput === "drop"
                ? dropCoords?.longitude
                : pickupCoords?.longitude,
            address: focusedInput === "drop" ? drop : pickup,
          }}
          title={modalTitle}
          visible={isMapModalVisible}
          onClose={() => setMapModalVisible(false)}
          onSelectLocation={(data) => {
            if (data) {
              if (modalTitle === "drop") {
                setDropCoords(data);
                setDrop(data?.address);
              } else {
                setLocation(data);
                setPickupCoords(data);
                setPickup(data?.address);
              }
            }
          }}
        />
      )}
    </View>
  );
};

