import { View, Text, Image, TouchableOpacity } from "react-native";
import React, { FC, memo, useEffect, useRef, useState } from "react";
import { useIsFocused } from "@react-navigation/native";
import MapView, { Marker, Region } from "react-native-maps";
import { useUserStore } from "@/store/userStore";
import { useWS } from "@/service/WSProvider";
import { customMapStyle, initialRegion } from "@/utils/CustomMap";
import { reverseGeocode, vehicleIcons } from "@/utils/mapUtils";
import { PIN_LOCATIONS } from "@/utils/LocationConfig";
import haversine from "haversine-distance";
import { mapStyles } from "@/styles/mapStyles";
import { FontAwesome6, MaterialCommunityIcons } from "@expo/vector-icons";
import { RFValue } from "react-native-responsive-fontsize";
import * as Location from "expo-location";
import DriverDetailsModal from "./DriverDetailsModal";

const DraggableMap: FC<{ height: number }> = ({ height }) => {
  const isFocused = useIsFocused();
  const [markers, setMarkers] = useState<any>([]);
  const mapRef = useRef<MapView>(null);
  const { setLocation, location, outOfRange, setOutOfRange } = useUserStore();
  const { emit, on, off } = useWS();
  const MAX_DISTANCE_THRESHOLD = 10000;
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [driverModalVisible, setDriverModalVisible] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState<any>(null);
  const fallbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    (async () => {
      if (isFocused) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          try {
            const location = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = location.coords;
            mapRef.current?.fitToCoordinates([{ latitude, longitude }], {
              edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
              animated: true,
            });
            const newRegion = {
              latitude,
              longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            };
            handleRegionChangeComplete(newRegion);
          } catch (error) {
            console.error("Error getting current location:", error);
            // Fallback to default location (Manila, Philippines) for testing
            const fallbackRegion = {
              latitude: 14.5995,
              longitude: 120.9842,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            };
            console.log("Using fallback location due to permission denial:", fallbackRegion);
            handleRegionChangeComplete(fallbackRegion);
          }
        } else {
          // Fallback to default location if permission denied
          const fallbackRegion = {
            latitude: 14.5995,
            longitude: 120.9842,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          };
          console.log("Using fallback location due to permission denial:", fallbackRegion);
          handleRegionChangeComplete(fallbackRegion);
        }
      }
    })();
  }, [mapRef, isFocused]);

  useEffect(() => {
    if (isFocused && location?.latitude && location?.longitude) {
      // Clear existing markers first
      setMarkers([]);
      
      // Request riders immediately
      emit("requestRiders", {
        latitude: location.latitude,
        longitude: location.longitude,
      });

      // Set up real-time rider updates
      on("ridersData", (riders: any) => {
        console.log("Received riders:", riders);
        if (Array.isArray(riders)) {
          const processedMarkers = riders.map((rider: any, index: number) => ({
            id: rider._id || index,
            latitude: rider.coords?.latitude || rider.latitude,
            longitude: rider.coords?.longitude || rider.longitude,
            vehicleType: rider.vehicleType || "Tricycle",
            type: rider.vehicleType || rider.type || "auto",
            rotation: rider.coords?.heading || rider.heading || 0,
            visible: true,
            driverInfo: rider.driverInfo || rider,
          }));
          setMarkers(processedMarkers);
        }
      });

      // Listen for real-time rider location updates
      on("riderLocationUpdate", (riderUpdate: any) => {
        console.log("Rider location update:", riderUpdate);
        setMarkers((prevMarkers: any[]) => 
          prevMarkers.map((marker) => 
            marker.id === riderUpdate._id 
              ? { ...marker, ...riderUpdate, latitude: riderUpdate.coords?.latitude || riderUpdate.latitude, longitude: riderUpdate.coords?.longitude || riderUpdate.longitude }
              : marker
          )
        );
      });

      // Listen for rider status changes (online/offline)
      on("riderStatusUpdate", (statusUpdate: any) => {
        console.log("Rider status update:", statusUpdate);
        if (statusUpdate.status === 'offline') {
          setMarkers((prevMarkers: any[]) => 
            prevMarkers.filter((marker) => marker.id !== statusUpdate._id)
          );
        } else {
          setMarkers((prevMarkers: any[]) => {
            const existingIndex = prevMarkers.findIndex(m => m.id === statusUpdate._id);
            if (existingIndex >= 0) {
              const updated = [...prevMarkers];
              updated[existingIndex] = { ...updated[existingIndex], ...statusUpdate };
              return updated;
            } else {
              return [...prevMarkers, {
                id: statusUpdate._id,
                latitude: statusUpdate.coords?.latitude || statusUpdate.latitude,
                longitude: statusUpdate.coords?.longitude || statusUpdate.longitude,
                vehicleType: statusUpdate.vehicleType || "Tricycle",
                type: statusUpdate.vehicleType || statusUpdate.type || "auto",
                rotation: statusUpdate.coords?.heading || statusUpdate.heading || 0,
                visible: true,
                driverInfo: statusUpdate.driverInfo || statusUpdate,
              }];
            }
          });
        }
      });

      // Periodic refresh to ensure we have latest rider data
      const refreshInterval = setInterval(() => {
        emit("requestRiders", {
          latitude: location.latitude,
          longitude: location.longitude,
        });
      }, 15000); // Refresh every 15 seconds

      return () => {
        off("ridersData");
        off("riderLocationUpdate");
        off("riderStatusUpdate");
        clearInterval(refreshInterval);
      };
    }
  }, [location, isFocused, emit, on, off]);

  const handleRegionChangeComplete = async (newRegion: any) => {
    try {
      const address = await reverseGeocode(
        newRegion?.latitude,
        newRegion?.longitude
      );
      setLocation({
        latitude: newRegion?.latitude,
        longitude: newRegion?.longitude,
        address: address || "Address not found",
      });

      const distance = haversine(
        { latitude: initialRegion.latitude, longitude: initialRegion.longitude },
        { latitude: newRegion?.latitude, longitude: newRegion?.longitude }
      );

      setOutOfRange(distance > MAX_DISTANCE_THRESHOLD);
    } catch (error) {
      console.error("Error in handleRegionChangeComplete:", error);
    }
  };

  const handleGpsButtonPress = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;
        
        mapRef.current?.animateToRegion({
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 1000);
        
        // Clear any existing fallback timeout
        if (fallbackTimeoutRef.current) {
          clearTimeout(fallbackTimeoutRef.current);
        }
        
        // Request updated rider data for new location
        emit("requestRiders", {
          latitude,
          longitude,
        });
        
        // Set fallback timeout
        fallbackTimeoutRef.current = setTimeout(() => {
          setSelectedDriver(null);
        }, 5000);
      }
    } catch (error) {
      console.error("Error getting GPS location:", error);
      setDriverModalVisible(true);
    }
  };

  const handleDriverPress = (driver: any) => {
    off("rideAccepted");
    
    on("rideAccepted", (data: any) => {
      if (fallbackTimeoutRef.current) {
        clearTimeout(fallbackTimeoutRef.current);
      }
      setSelectedDriver(null);
    });
    
    if (fallbackTimeoutRef.current) {
      clearTimeout(fallbackTimeoutRef.current);
    }
    
    setSelectedDriver(driver);
    setDriverModalVisible(true);
    
    off("rideAccepted");
  };

  const handleModalClose = () => {
    setDriverModalVisible(false);
    setSelectedDriver(null);
    
    off("rideAccepted");
    
    if (fallbackTimeoutRef.current) {
      clearTimeout(fallbackTimeoutRef.current);
      fallbackTimeoutRef.current = null;
    }
  };

  const handlePinLocationSelect = (pinLocation: any) => {
    console.log('Pin location selected:', pinLocation);
    setSelectedDestination(pinLocation);
  };

  return (
    <View style={{ height: height, width: "100%" }}>
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={initialRegion}
        showsMyLocationButton={false}
        showsCompass={false}
        showsIndoors={false}
        customMapStyle={customMapStyle}
        showsUserLocation={true}
        onRegionChangeComplete={handleRegionChangeComplete}
      >
        {/* Rider/Driver markers */}
        {markers.map((marker: any, index: number) => {
          const iconSource = vehicleIcons[marker.vehicleType] || vehicleIcons["Tricycle"];
          
          return (
            <Marker
              key={marker.id || index}
              coordinate={{
                latitude: marker.latitude,
                longitude: marker.longitude,
              }}
              anchor={{ x: 0.5, y: 0.5 }}
              onPress={() => handleDriverPress(marker)}
            >
              <View style={{
                transform: [{ rotate: `${marker.rotation}deg` }],
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Image
                  source={iconSource}
                  style={{
                    width: 35,
                    height: 35,
                    resizeMode: 'contain',
                  }}
                />
                {/* Status indicator */}
                <View style={{
                  position: 'absolute',
                  bottom: -2,
                  right: -2,
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: '#00FF00',
                  borderWidth: 2,
                  borderColor: 'white',
                }} />
              </View>
            </Marker>
          );
        })}

        {/* Pin location markers */}
        {PIN_LOCATIONS.map((pinLocation) => (
          <Marker
            key={pinLocation.id}
            coordinate={{
              latitude: pinLocation.latitude,
              longitude: pinLocation.longitude,
            }}
            title={pinLocation.name}
            description={pinLocation.description}
            onPress={() => handlePinLocationSelect(pinLocation)}
            pinColor={
              pinLocation.category === 'San Miguel' ? '#FF6B35' :
              pinLocation.category === 'San Ildefonso' ? '#007AFF' :
              '#34C759'
            }
          />
        ))}
      </MapView>

      {/* GPS Button */}
      <TouchableOpacity style={mapStyles.gpsButton} onPress={handleGpsButtonPress}>
        <MaterialCommunityIcons
          name="crosshairs-gps"
          size={RFValue(16)}
          color="#3C75BE"
        />
      </TouchableOpacity>

      {/* Driver Details Modal */}
      <DriverDetailsModal
        visible={driverModalVisible}
        driver={selectedDriver}
        onClose={handleModalClose}
      />
    </View>
  );
};

export default memo(DraggableMap);
