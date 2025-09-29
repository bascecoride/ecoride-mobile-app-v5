import { View, Text, Image, TouchableOpacity, Animated } from "react-native";
import React, { FC, memo, useEffect, useRef, useState, useMemo } from "react";
import { useIsFocused } from "@react-navigation/native";
import MapView, { Marker, Region } from "react-native-maps";
import { useUserStore } from "@/store/userStore";
import { useWS } from "@/service/WSProvider";
import { customMapStyle, indiaIntialRegion } from "@/utils/CustomMap";
import { reverseGeocode } from "@/utils/mapUtils";
import haversine from "haversine-distance";
import { mapStyles } from "@/styles/mapStyles";
import { FontAwesome6, MaterialCommunityIcons } from "@expo/vector-icons";
import { RFValue } from "react-native-responsive-fontsize";
import DriverDetailsModal from "./DriverDetailsModal";
import ActiveRidersModal from "./ActiveRidersModal";
import * as Location from "expo-location";

const DraggableMap: FC<{ height: number }> = ({ height }) => {
  const isFocused = useIsFocused();
  const [nearbyRiders, setNearbyRiders] = useState<any>([]);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [driverDetailsVisible, setDriverDetailsVisible] = useState(false);
  const [activeRidersVisible, setActiveRidersVisible] = useState(false);
  const mapRef = useRef<MapView>(null);
  const { setLocation, location, outOfRange, setOutOfRange } = useUserStore();
  const { emit, on, off } = useWS();
  const MAX_DISTANCE_THRESHOLD = 50000000; // 50,000km for testing (was 10km)
  
  // Animation for arrow rotation
  const arrowRotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      if (isFocused) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          try {
            const currentLocation = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.High,
            });

            const newLocation = {
              latitude: currentLocation.coords.latitude,
              longitude: currentLocation.coords.longitude,
              address: "", // Add empty address to satisfy CustomLocation type
            };

            setLocation(newLocation);

            // Subscribe to zone for nearby riders
            console.log("🗺️ Subscribing to zone for nearby riders", newLocation);
            emit("subscribeToZone", {
              latitude: newLocation.latitude,
              longitude: newLocation.longitude,
            });
          } catch (error) {
            console.error("Error getting location:", error);
          }
        }
      }
    })();
  }, [isFocused, emit, setLocation]);

  useEffect(() => {
    let riderUpdateInterval: NodeJS.Timeout;
    
    if (location?.latitude && location?.longitude) {
      // Initial subscription
      emit("subscribeToZone", {
        latitude: location.latitude,
        longitude: location.longitude,
      });

      // Set up enhanced rider listener with immediate updates
      on("nearbyriders", (riders: any[]) => {
        console.log("📍 Received nearby riders:", riders.length);
        
        // Process each rider to ensure all required fields are present
        const updatedRiders = riders.map((rider) => {
          // Ensure all required fields have default values
          const processedRider = {
            id: rider.riderId || rider.id || `rider-${Math.random().toString(36).substr(2, 9)}`,
            latitude: rider.coords?.latitude || rider.latitude || 0,
            longitude: rider.coords?.longitude || rider.longitude || 0,
            vehicleType: rider.vehicleType || "Tricycle",
            rotation: rider.coords?.heading || rider.rotation || 0,
            distance: rider.distance || 0,
            name: rider.name || `${rider.firstName || ''} ${rider.lastName || ''}`.trim() || `Rider ${rider.riderId?.substring(0, 6) || ''}`,
            firstName: rider.firstName || "",
            lastName: rider.lastName || "",
            photo: rider.photo || null,
            averageRating: parseFloat(rider.averageRating) || 0,
            totalRatings: parseInt(rider.totalRatings) || 0,
          };
          
          // Log any potential issues with the rider data
          if (!rider.riderId && !rider.id) {
            console.warn("⚠️ Rider missing ID:", rider);
          }
          if (!rider.coords?.latitude || !rider.coords?.longitude) {
            console.warn("⚠️ Rider missing coordinates:", rider);
          }
          
          return processedRider;
        });
        
        console.log("📍 Processed riders for state:", updatedRiders);
        
        // Only update state if we have valid riders
        if (updatedRiders.length > 0) {
          setNearbyRiders(updatedRiders);
          
          // If modal is open, force a re-render to ensure riders are shown
          if (activeRidersVisible) {
            setActiveRidersVisible(false);
            setTimeout(() => setActiveRidersVisible(true), 100);
          }
        } else {
          console.log("⚠️ No valid riders to display");
          setNearbyRiders([]);
        }
      });

      // Set up frequent updates to reduce lag when riders toggle status
      riderUpdateInterval = setInterval(() => {
        if (location?.latitude && location?.longitude) {
          emit("subscribeToZone", {
            latitude: location.latitude,
            longitude: location.longitude,
          });
        }
      }, 2000); // Request updates every 2 seconds for faster response
    }

    return () => {
      off("nearbyriders");
      if (riderUpdateInterval) {
        clearInterval(riderUpdateInterval);
      }
    };
  }, [location, emit, on, off, isFocused]);

  // Handle driver details request
  const handleDriverPress = async (riderId: string) => {
    console.log("🚗 Requesting driver details for:", riderId);
    
    // Request driver details from server
    emit("getDriverDetails", { riderId });
    
    // Listen for driver details response
    on("driverDetailsResponse", (driverDetails: any) => {
      console.log("📋 Received driver details:", driverDetails);
      setSelectedDriver(driverDetails);
      setDriverDetailsVisible(true);
      off("driverDetailsResponse"); // Remove listener after receiving response
    });
    
    // Handle error response
    on("error", (error: any) => {
      console.error("❌ Error fetching driver details:", error);
      off("error");
    });
  };
  
  // Get vehicle marker image based on vehicle type
  const getVehicleMarkerImage = (vehicleType: string) => {
    switch (vehicleType) {
      case "Single Motorcycle":
        return require("@/assets/icons/bike_marker.png");
      case "Tricycle":
        return require("@/assets/icons/auto_marker.png");
      case "Cab":
        return require("@/assets/icons/cab_marker.png");
      default:
        return require("@/assets/icons/bike_marker.png");
    }
  };
  
  // Calculate nearest rider and arrow direction
  const nearestRider = useMemo(() => {
    if (!location?.latitude || !location?.longitude || nearbyRiders.length === 0) {
      return null;
    }
    
    let nearest = nearbyRiders[0];
    let minDistance = haversine(
      { latitude: location.latitude, longitude: location.longitude },
      { latitude: nearest.latitude, longitude: nearest.longitude }
    );
    
    nearbyRiders.forEach((rider: any) => {
      const distance = haversine(
        { latitude: location.latitude, longitude: location.longitude },
        { latitude: rider.latitude, longitude: rider.longitude }
      );
      if (distance < minDistance) {
        minDistance = distance;
        nearest = rider;
      }
    });
    
    return { ...nearest, distance: minDistance };
  }, [nearbyRiders, location]);
  
  // Calculate arrow angle pointing to nearest rider
  const arrowAngle = useMemo(() => {
    if (!nearestRider || !location?.latitude || !location?.longitude) {
      return 0;
    }
    
    const lat1 = location.latitude * (Math.PI / 180);
    const lat2 = nearestRider.latitude * (Math.PI / 180);
    const deltaLng = (nearestRider.longitude - location.longitude) * (Math.PI / 180);
    
    const y = Math.sin(deltaLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);
    
    let bearing = Math.atan2(y, x) * (180 / Math.PI);
    bearing = (bearing + 360) % 360;
    
    return bearing;
  }, [nearestRider, location]);
  
  // Animate arrow rotation
  useEffect(() => {
    if (nearestRider) {
      Animated.timing(arrowRotation, {
        toValue: arrowAngle,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [arrowAngle, nearestRider]);
  
  // Handle viewing rider on map
  const handleViewRiderOnMap = (rider: any) => {
    setActiveRidersVisible(false);
    
    // Animate to rider location
    const region = {
      latitude: rider.latitude,
      longitude: rider.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
    
    mapRef.current?.animateToRegion(region, 1000);
    
    // Show rider details after animation
    setTimeout(() => {
      handleDriverPress(rider.id);
    }, 1200);
  };
  
  // Format distance for display
  const formatDistance = (distance: number) => {
    if (distance < 1000) {
      return `${Math.round(distance)}m`;
    } else {
      return `${(distance / 1000).toFixed(1)}km`;
    }
  };

  const handleRegionChangeComplete = async (newRegion: Region) => {
    const address = await reverseGeocode(
      newRegion.latitude,
      newRegion.longitude
    );
    setLocation({
      latitude: newRegion.latitude,
      longitude: newRegion.longitude,
      address: address,
    });

    const userLocation = {
      latitude: location?.latitude,
      longitude: location?.longitude,
    } as any;
    if (userLocation) {
      const newLocation = {
        latitude: newRegion.latitude,
        longitude: newRegion.longitude,
      };
      const distance = haversine(userLocation, newLocation);
      setOutOfRange(distance > MAX_DISTANCE_THRESHOLD);
    }
  };

  const handleGpsButtonPress = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      mapRef.current?.fitToCoordinates([{ latitude, longitude }], {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
      const address = await reverseGeocode(latitude, longitude);
      setLocation({ latitude, longitude, address });
    } catch (error) {
      console.error("Error getting location:", error);
    }
  };

  return (
    <View style={{ height: height, width: "100%" }}>
      <MapView
        ref={mapRef}
        maxZoomLevel={16}
        minZoomLevel={12}
        pitchEnabled={false}
        onRegionChangeComplete={handleRegionChangeComplete}
        style={{ flex: 1 }}
        initialRegion={indiaIntialRegion}
        showsMyLocationButton={false}
        showsCompass={false}
        showsIndoors={false}
        showsIndoorLevelPicker={false}
        showsTraffic={false}
        showsScale={false}
        showsBuildings={false}
        showsPointsOfInterest={false}
        customMapStyle={customMapStyle}
        showsUserLocation={true}
      >
        {nearbyRiders
          ?.filter(
            (rider: any) =>
              rider?.latitude && rider.longitude
          )
          .map((rider: any, index: number) => (
            <Marker
              key={`rider-${rider.id}-${index}`}
              zIndex={index + 1}
              flat
              anchor={{ x: 0.5, y: 0.5 }}
              coordinate={{
                latitude: rider.latitude,
                longitude: rider.longitude,
              }}
              onPress={() => handleDriverPress(rider.id)}
            >
              <View
                style={{ transform: [{ rotate: `${rider.rotation}deg` }] }}
              >
                <Image
                  source={getVehicleMarkerImage(rider.vehicleType)}
                  style={{ height: 40, width: 40, resizeMode: "contain" }}
                />
              </View>
            </Marker>
          ))}
      </MapView>

      <View style={mapStyles.centerMarkerContainer}>
        <Image
          source={require("@/assets/icons/marker.png")}
          style={mapStyles.marker}
        />
      </View>
      <TouchableOpacity
        style={mapStyles.gpsButton}
        onPress={handleGpsButtonPress}
      >
        <MaterialCommunityIcons
          name="crosshairs-gps"
          size={RFValue(16)}
          color="#3C75BE"
        />
      </TouchableOpacity>
      
      {/* Active Riders Button */}
      <TouchableOpacity
        style={[mapStyles.gpsButton, { bottom: 80, backgroundColor: '#4CAF50' }]}
        onPress={() => setActiveRidersVisible(true)}
      >
        <View style={{ position: 'relative' }}>
          <MaterialCommunityIcons
            name="account-group"
            size={RFValue(16)}
            color="white"
          />
          {nearbyRiders.length > 0 && (
            <View style={{
              position: 'absolute',
              top: -8,
              right: -8,
              backgroundColor: '#FF4444',
              borderRadius: 10,
              minWidth: 20,
              height: 20,
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 2,
              borderColor: 'white',
            }}>
              <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>
                {nearbyRiders.length}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
      
      {/* Dynamic Arrow pointing to nearest rider */}
      {nearestRider && (
        <View style={{
          position: 'absolute',
          top: 60,
          left: 20,
          alignItems: 'center',
        }}>
          <Animated.View
            style={{
              transform: [{
                rotate: arrowRotation.interpolate({
                  inputRange: [0, 360],
                  outputRange: ['0deg', '360deg'],
                })
              }]
            }}
          >
            <MaterialCommunityIcons
              name="navigation"
              size={RFValue(24)}
              color="#FF6B35"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 5,
              }}
            />
          </Animated.View>
          <View style={{
            backgroundColor: 'rgba(255, 107, 53, 0.9)',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 12,
            marginTop: 4,
          }}>
            <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>
              {formatDistance(nearestRider.distance)}
            </Text>
          </View>
        </View>
      )}

      {outOfRange && (
        <View style={mapStyles.outOfRange}>
          <FontAwesome6 name="road-circle-exclamation" size={24} color="red" />
        </View>
      )}
      
      {/* Driver Details Modal */}
      <DriverDetailsModal
        visible={driverDetailsVisible}
        driverDetails={selectedDriver}
        onClose={() => {
          setDriverDetailsVisible(false);
          setSelectedDriver(null);
        }}
      />
      
      {/* Active Riders Modal */}
      <ActiveRidersModal
        visible={activeRidersVisible}
        riders={nearbyRiders}
        onClose={() => setActiveRidersVisible(false)}
        onRiderPress={(rider) => {
          setActiveRidersVisible(false);
          handleDriverPress(rider.id);
        }}
        onViewOnMap={handleViewRiderOnMap}
      />
    </View>
  );
};

export default memo(DraggableMap);
