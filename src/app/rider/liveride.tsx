import { View, Text, Alert, Modal, ActivityIndicator } from "react-native";
import React, { useEffect, useState } from "react";
import { useRiderStore } from "@/store/riderStore";
import { useWS } from "@/service/WSProvider";
import { useRoute } from "@react-navigation/native";
import * as Location from "expo-location";
import { resetAndNavigate } from "@/utils/Helpers";
import { StatusBar } from "expo-status-bar";
import { rideStyles } from "@/styles/rideStyles";
import RiderLiveTracking from "@/components/rider/RiderLiveTracking";
import { updateRideStatus, cancelRideOffer } from "@/service/rideService";
import RiderActionButton from "@/components/rider/RiderActionButton";
import OtpInputModal from "@/components/rider/OtpInputModal";
import CustomText from "@/components/shared/CustomText";
import { TouchableOpacity } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import CancelRideModal from "@/components/rider/CancelRideModal";
import PaymentConfirmationModal from "@/components/rider/PaymentConfirmationModal";
import { commonStyles } from "@/styles/commonStyles";
import { router } from "expo-router";
import { getOrCreateChat } from "@/service/chatService";

const LiveRide = () => {
  const [isOtpModalVisible, setOtpModalVisible] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [showCompletionCountdown, setShowCompletionCountdown] = useState(false);
  const [completionCountdown, setCompletionCountdown] = useState(4);
  const [showPaymentConfirmation, setShowPaymentConfirmation] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [showPassengerInfo, setShowPassengerInfo] = useState(false);
  const { setLocation, location, setOnDuty } = useRiderStore();
  const { emit, on, off } = useWS();
  const [rideData, setRideData] = useState<any>(null);
  const [currentLocation, setCurrentLocation] = useState(location);
  const route = useRoute() as any;
  const params = route?.params || {};
  const id = params.id;

  // Countdown effect for ride completion
  useEffect(() => {
    if (showCompletionCountdown && completionCountdown > 0) {
      const timer = setTimeout(() => {
        console.log('⏱️ Completion countdown:', completionCountdown - 1);
        setCompletionCountdown(completionCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (completionCountdown === 0 && showCompletionCountdown) {
      console.log('🏠 Ride completed, navigating to home...');
      resetAndNavigate("/rider/home");
    }
  }, [completionCountdown, showCompletionCountdown]);

  const handleCancelRide = async (reason: string) => {
    setCancelLoading(true);
    try {
      // Call API with reason
      const success = await cancelRideOffer(id, reason);
      if (success) {
        Alert.alert("Ride Cancelled", "The ride has been cancelled successfully.");
        resetAndNavigate("/rider/home");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to cancel ride. Please try again.");
    } finally {
      setCancelLoading(false);
      setShowCancelModal(false);
    }
  };

  // Setup chat and listen for new messages when customer is assigned
  useEffect(() => {
    if (rideData?.customer?._id && (rideData?.status === "START" || rideData?.status === "ARRIVED")) {
      // Get or create chat to get the chat ID
      const setupChat = async () => {
        try {
          const chat = await getOrCreateChat(rideData.customer._id, "customer");
          setCurrentChatId(chat._id);
          
          // Join the chat room for real-time updates
          emit("joinChat", { chatId: chat._id });
          
          // Set initial unread count
          const myUnread = chat.unreadCount?.rider || 0;
          setUnreadCount(myUnread);
          console.log(`💬 Rider chat setup complete. Unread: ${myUnread}`);
        } catch (error) {
          console.error("Error setting up chat:", error);
        }
      };
      
      setupChat();
      
      // Listen for new messages
      const handleNewMessage = (message: any) => {
        console.log(`📩 Rider received new message:`, message);
        // Only increment if message is from customer (not from us)
        if (message.sender?.role === "customer" || message.sender?.userId?.role === "customer") {
          setUnreadCount(prev => prev + 1);
          console.log(`🔴 Rider unread count incremented`);
        }
      };
      
      // Listen for unread count updates from server
      const handleUnreadCountUpdate = (data: any) => {
        console.log(`📊 Rider unread count update:`, data);
        if (data.unreadCount !== undefined) {
          setUnreadCount(data.unreadCount);
        }
      };
      
      on("newMessage", handleNewMessage);
      on("unreadCountUpdate", handleUnreadCountUpdate);
      
      return () => {
        off("newMessage");
        off("unreadCountUpdate");
        if (currentChatId) {
          emit("leaveChat", { chatId: currentChatId });
        }
      };
    }
  }, [rideData?.customer?._id, rideData?.status]);

  // Handle chat with passenger
  const handleChatWithPassenger = async () => {
    if (!rideData?.customer?._id) {
      Alert.alert("Chat Unavailable", "No passenger information available.");
      return;
    }

    // Reset unread count when opening chat
    setUnreadCount(0);
    
    setChatLoading(true);
    try {
      console.log(`💬 Opening chat with passenger: ${rideData.customer._id}`);
      const chat = await getOrCreateChat(rideData.customer._id, "customer");
      
      router.push({
        pathname: "/rider/chatroom",
        params: {
          chatId: chat._id,
          otherUserId: rideData.customer._id,
          otherUserName: `${rideData.customer.firstName || ''} ${rideData.customer.lastName || ''}`.trim() || 'Passenger',
          otherUserPhoto: rideData.customer.photo || "",
          otherUserRole: "customer",
        },
      });
    } catch (error) {
      console.error("Error opening chat:", error);
      Alert.alert("Error", "Failed to open chat. Please try again.");
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    let locationSubscription: any;

    const startLocationUpdates = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          console.log("🚀 Starting live location tracking for rider...");
          
          locationSubscription = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.High,
              timeInterval: 3000, // Update every 3 seconds for smoother tracking
              distanceInterval: 10, // Update every 10 meters for more precise tracking
            },
            (locationData) => {
              const { latitude, longitude, heading, speed } = locationData.coords;
              
              const newLocation = {
                latitude: latitude,
                longitude: longitude,
                address: "Live Location",
                heading: heading as number,
                speed: speed || 0,
                timestamp: Date.now(),
              };

              // Update both store and local state
              setLocation(newLocation);
              setCurrentLocation(newLocation);
              setOnDuty(true);

              // Emit location updates to server
              emit("goOnDuty", {
                latitude: latitude,
                longitude: longitude,
                heading: heading as number,
              });

              emit("updateLocation", {
                latitude,
                longitude,
                heading,
                speed,
                rideId: id,
              });

              console.log(
                `🏍️ Live location: Lat ${latitude.toFixed(6)}, Lon ${longitude.toFixed(6)}, Heading: ${heading?.toFixed(0)}°, Speed: ${speed?.toFixed(1)} m/s`
              );
            }
          );
        } else {
          console.log("❌ Location permission denied");
          Alert.alert("Permission Required", "Location permission is required for live tracking");
        }
      } catch (error) {
        console.error("❌ Error starting location tracking:", error);
      }
    };

    startLocationUpdates();

    return () => {
      if (locationSubscription) {
        console.log("🛑 Stopping live location tracking");
        locationSubscription.remove();
      }
    };
  }, [id]);

  useEffect(() => {
    if (id) {
      emit("subscribeRide", id);

      on("rideData", (data) => {
        setRideData(data);
      });

      on("rideCanceled", (data) => {
        console.log("Ride canceled:", data);
        // CRITICAL: Only show alert if this is OUR ride
        const cancelledRideId = data?.ride?._id || data?.rideId;
        if (cancelledRideId === id) {
          resetAndNavigate("/rider/home");
          Alert.alert("Ride Canceled", data?.message || "The ride has been canceled");
        } else {
          console.log(`Ignoring cancellation for different ride: ${cancelledRideId} (our ride: ${id})`);
        }
      });

      on("passengerCancelledRide", (data) => {
        console.log("Passenger cancelled ride:", data);
        // CRITICAL: Only show alert if this is OUR ride
        if (data?.rideId === id) {
          Alert.alert(
            "Passenger Cancelled Ride",
            `${data.passengerName} has cancelled the ride. You will be redirected to the home screen.`,
            [
              {
                text: "OK",
                onPress: () => {
                  resetAndNavigate("/rider/home");
                }
              }
            ]
          );
        } else {
          console.log(`Ignoring passenger cancellation for different ride: ${data?.rideId} (our ride: ${id})`);
        }
      });

      on("rideUpdate", (data) => {
        setRideData(data);
      });

      on("error", (error) => {
        console.log("Ride error:", error);
        resetAndNavigate("/rider/home");
        Alert.alert("Oh Dang! There was an error");
      });
    }

    return () => {
      off("rideData");
      off("rideCanceled");
      off("passengerCancelledRide");
      off("rideUpdate");
      off("error");
    };
  }, [id, emit, on, off]);

  return (
    <View style={rideStyles.container}>
      <StatusBar style="light" backgroundColor="orange" translucent={false} />

      {rideData && rideData?.drop?.latitude && rideData?.drop?.longitude && rideData?.pickup?.latitude && rideData?.pickup?.longitude && (
        <View style={{ flex: 1 }}>
          <RiderLiveTracking
            status={rideData?.status}
            drop={{
              latitude: parseFloat(String(rideData.drop.latitude)) || 0,
              longitude: parseFloat(String(rideData.drop.longitude)) || 0,
            }}
            pickup={{
              latitude: parseFloat(String(rideData.pickup.latitude)) || 0,
              longitude: parseFloat(String(rideData.pickup.longitude)) || 0,
            }}
            rider={{
              latitude: currentLocation?.latitude || location?.latitude || 0,
              longitude: currentLocation?.longitude || location?.longitude || 0,
              heading: currentLocation?.heading || location?.heading || 0,
            }}
            vehicleType={rideData?.vehicle}
          />

          {/* Passenger Info Toggle Button & Expandable Card */}
          {(rideData?.status === "START" || rideData?.status === "ARRIVED") && rideData?.customer && (
            <View style={{ position: 'absolute', top: 60, left: 16, zIndex: 1000 }}>
              {/* Collapsed State - Info Button */}
              {!showPassengerInfo ? (
                <TouchableOpacity
                  onPress={() => setShowPassengerInfo(true)}
                  activeOpacity={0.8}
                  style={{
                    backgroundColor: '#4CAF50',
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingLeft: 4,
                    paddingRight: 14,
                    paddingVertical: 4,
                    borderRadius: 25,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: 0.25,
                    shadowRadius: 4,
                    elevation: 6,
                  }}
                >
                  {/* Profile Circle */}
                  <View style={{
                    width: 42,
                    height: 42,
                    borderRadius: 21,
                    backgroundColor: 'rgba(255,255,255,0.25)',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 10,
                  }}>
                    <Ionicons name="person" size={20} color="white" />
                  </View>
                  {/* Name & Tap hint */}
                  <View>
                    <CustomText fontFamily="SemiBold" fontSize={12} style={{ color: 'white' }}>
                      {rideData.customer.firstName}
                    </CustomText>
                    <CustomText fontSize={9} style={{ color: 'rgba(255,255,255,0.8)' }}>
                      Tap for details
                    </CustomText>
                  </View>
                  {/* Passenger count badge */}
                  {rideData?.passengerCount && rideData.passengerCount > 0 && (
                    <View style={{
                      backgroundColor: '#FF9800',
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginLeft: 10,
                      borderWidth: 2,
                      borderColor: 'white',
                    }}>
                      <CustomText fontSize={10} fontFamily="Bold" style={{ color: 'white' }}>
                        {rideData.passengerCount}
                      </CustomText>
                    </View>
                  )}
                </TouchableOpacity>
              ) : (
                /* Expanded State - Full Info Card */
                <View style={{
                  backgroundColor: 'white',
                  borderRadius: 16,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 8,
                  width: 240,
                  overflow: 'hidden',
                }}>
                  {/* Header with close button */}
                  <View style={{
                    backgroundColor: '#4CAF50',
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <View style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: 'rgba(255,255,255,0.25)',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: 10,
                      }}>
                        <Ionicons name="person" size={18} color="white" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <CustomText fontFamily="SemiBold" fontSize={13} style={{ color: 'white' }}>
                          {rideData.customer.firstName} {rideData.customer.lastName}
                        </CustomText>
                        <CustomText fontSize={10} style={{ color: 'rgba(255,255,255,0.85)' }}>
                          Passenger Details
                        </CustomText>
                      </View>
                    </View>
                    {/* Close button */}
                    <TouchableOpacity
                      onPress={() => setShowPassengerInfo(false)}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        backgroundColor: 'rgba(255,255,255,0.25)',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Ionicons name="close" size={18} color="white" />
                    </TouchableOpacity>
                  </View>
                  
                  {/* Content */}
                  <View style={{ padding: 14 }}>
                    {/* Passenger Count */}
                    {rideData?.passengerCount && rideData.passengerCount > 0 && (
                      <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginBottom: 12,
                        backgroundColor: '#E8F5E9',
                        padding: 10,
                        borderRadius: 10,
                      }}>
                        <View style={{
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          backgroundColor: '#4CAF50',
                          justifyContent: 'center',
                          alignItems: 'center',
                          marginRight: 10,
                        }}>
                          <Ionicons name="people" size={16} color="white" />
                        </View>
                        <View>
                          <CustomText fontSize={10} style={{ color: '#666' }}>
                            PASSENGERS
                          </CustomText>
                          <CustomText fontFamily="Bold" fontSize={14} style={{ color: '#4CAF50' }}>
                            {rideData.passengerCount} {rideData.passengerCount === 1 ? 'Person' : 'People'}
                          </CustomText>
                        </View>
                      </View>
                    )}
                    
                    {/* Phone */}
                    {rideData.customer.phone && (
                      <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginBottom: (rideData?.pickup?.landmark || rideData?.drop?.landmark) ? 12 : 0,
                        backgroundColor: '#F5F5F5',
                        padding: 10,
                        borderRadius: 10,
                      }}>
                        <View style={{
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          backgroundColor: '#2196F3',
                          justifyContent: 'center',
                          alignItems: 'center',
                          marginRight: 10,
                        }}>
                          <Ionicons name="call" size={16} color="white" />
                        </View>
                        <View>
                          <CustomText fontSize={10} style={{ color: '#666' }}>
                            PHONE NUMBER
                          </CustomText>
                          <CustomText fontFamily="SemiBold" fontSize={13} style={{ color: '#333' }}>
                            {rideData.customer.phone}
                          </CustomText>
                        </View>
                      </View>
                    )}
                    
                    {/* Pickup Landmark - Only if exists */}
                    {rideData?.pickup?.landmark && (
                      <View style={{
                        backgroundColor: '#E8F5E9',
                        padding: 10,
                        borderRadius: 10,
                        borderLeftWidth: 4,
                        borderLeftColor: '#4CAF50',
                        marginBottom: rideData?.drop?.landmark ? 12 : 0,
                      }}>
                        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                          <View style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            backgroundColor: '#4CAF50',
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginRight: 10,
                          }}>
                            <Ionicons name="navigate" size={16} color="white" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <CustomText fontSize={10} style={{ color: '#666' }}>
                              PICK-UP LANDMARK
                            </CustomText>
                            <CustomText fontFamily="Medium" fontSize={12} style={{ color: '#333', marginTop: 2 }}>
                              {rideData.pickup.landmark}
                            </CustomText>
                          </View>
                        </View>
                      </View>
                    )}
                    
                    {/* Drop-off Landmark - Only if exists */}
                    {rideData?.drop?.landmark && (
                      <View style={{
                        backgroundColor: '#FFF8E1',
                        padding: 10,
                        borderRadius: 10,
                        borderLeftWidth: 4,
                        borderLeftColor: '#FFC107',
                      }}>
                        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                          <View style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            backgroundColor: '#FF9800',
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginRight: 10,
                          }}>
                            <Ionicons name="location" size={16} color="white" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <CustomText fontSize={10} style={{ color: '#666' }}>
                              DROP-OFF LANDMARK
                            </CustomText>
                            <CustomText fontFamily="Medium" fontSize={12} style={{ color: '#333', marginTop: 2 }}>
                              {rideData.drop.landmark}
                            </CustomText>
                          </View>
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Cancel Button Overlay - Repositioned to top-right */}
          <View style={{
            position: 'absolute',
            top: 60,
            right: 20,
            zIndex: 1000,
          }}>
            <TouchableOpacity
              style={{
                backgroundColor: '#ff4444',
                padding: 14,
                borderRadius: 30,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.3,
                shadowRadius: 4.65,
                elevation: 8,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2,
                borderColor: 'white',
              }}
              onPress={() => setShowCancelModal(true)}
            >
              <Ionicons name="close" size={22} color="white" />
            </TouchableOpacity>
          </View>

          {/* Chat Button Overlay - Below cancel button */}
          {(rideData?.status === "START" || rideData?.status === "ARRIVED") && rideData?.customer?._id && (
            <View style={{
              position: 'absolute',
              top: 130,
              right: 20,
              zIndex: 1000,
            }}>
              <TouchableOpacity
                style={{
                  backgroundColor: '#2196F3',
                  padding: 14,
                  borderRadius: 30,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4.65,
                  elevation: 8,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: 'white',
                }}
                onPress={handleChatWithPassenger}
                activeOpacity={0.8}
                disabled={chatLoading}
              >
                {chatLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="chatbubble-ellipses" size={24} color="#fff" />
                )}
                {/* Red Badge for Unread Messages */}
                {unreadCount > 0 && (
                  <View style={{
                    position: 'absolute',
                    top: -5,
                    right: -5,
                    backgroundColor: '#ff3b30',
                    minWidth: 20,
                    height: 20,
                    borderRadius: 10,
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingHorizontal: 4,
                    borderWidth: 2,
                    borderColor: 'white',
                  }}>
                    <CustomText fontSize={10} style={{ color: 'white', fontWeight: 'bold' }}>
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </CustomText>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Loading state when rideData exists but coordinates are missing */}
      {rideData && (!rideData?.drop?.latitude || !rideData?.drop?.longitude || !rideData?.pickup?.latitude || !rideData?.pickup?.longitude) && (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
          <ActivityIndicator size="large" color="orange" />
          <CustomText fontSize={14} style={{ marginTop: 10, color: '#666' }}>Loading ride details...</CustomText>
        </View>
      )}

      {/* Loading state when no rideData at all */}
      {!rideData && (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
          <ActivityIndicator size="large" color="orange" />
          <CustomText fontSize={14} style={{ marginTop: 10, color: '#666' }}>Fetching ride information...</CustomText>
        </View>
      )}

      <RiderActionButton
        ride={rideData}
        riderLocation={
          currentLocation?.latitude && currentLocation?.longitude
            ? { latitude: currentLocation.latitude, longitude: currentLocation.longitude }
            : location?.latitude && location?.longitude
            ? { latitude: location.latitude, longitude: location.longitude }
            : undefined
        }
        title={
          rideData?.status === "START"
            ? "SLIDE TO ARRIVE"
            : rideData?.status === "ARRIVED"
            ? "SLIDE TO COMPLETE"
            : "SUCCESS"
        }
        onPress={async () => {
          if (rideData?.status === "START") {
            setOtpModalVisible(true);
            return;
          }
          // Show payment confirmation modal before completing
          setShowPaymentConfirmation(true);
        }}
        color="#228B22"
      />

      {isOtpModalVisible && (
        <OtpInputModal
          visible={isOtpModalVisible}
          onClose={() => setOtpModalVisible(false)}
          title="Enter OTP Below"
          onConfirm={async (otp) => {
            if (otp === rideData?.otp) {
              const isSuccess = await updateRideStatus(
                rideData?._id,
                "ARRIVED"
              );
              if (isSuccess) {
                setOtpModalVisible(false);
              } else {
                Alert.alert("Technical Error");
              }
            } else {
              Alert.alert("Wrong OTP");
            }
          }}
        />
      )}

      <CancelRideModal
        visible={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancelRide}
        loading={cancelLoading}
      />

      {/* Ride Completion Countdown Modal */}
      <Modal
        visible={showCompletionCountdown}
        transparent={true}
        animationType="fade"
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20
        }}>
          <View style={{
            backgroundColor: 'white',
            borderRadius: 15,
            padding: 25,
            width: '90%',
            maxWidth: 400,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5
          }}>
            {/* Success Icon */}
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <View style={{
                backgroundColor: '#4CAF50',
                borderRadius: 50,
                width: 80,
                height: 80,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 15
              }}>
                <Ionicons name="checkmark-circle" size={60} color="white" />
              </View>
              <CustomText fontFamily="Bold" fontSize={20} style={{ color: '#4CAF50', textAlign: 'center' }}>
                Congratulations! 🎉
              </CustomText>
              <CustomText fontSize={14} style={{ color: '#666', marginTop: 5, textAlign: 'center' }}>
                Ride Completed Successfully
              </CustomText>
            </View>

            {/* Countdown Message */}
            <View style={{
              backgroundColor: '#e3f2fd',
              padding: 15,
              borderRadius: 10,
              borderLeftWidth: 4,
              borderLeftColor: '#2196F3',
              marginBottom: 20
            }}>
              <CustomText fontFamily="SemiBold" fontSize={12} style={{ color: '#1976D2', textAlign: 'center' }}>
                Redirecting you back to the home screen in {completionCountdown} second{completionCountdown !== 1 ? 's' : ''}
              </CustomText>
              <CustomText fontSize={10} style={{ color: '#666', marginTop: 5, textAlign: 'center' }}>
                Please wait...
              </CustomText>
            </View>

            {/* Go Now Button */}
            <TouchableOpacity
              style={{
                backgroundColor: '#2196F3',
                padding: 15,
                borderRadius: 10,
                alignItems: 'center'
              }}
              onPress={() => {
                setShowCompletionCountdown(false);
                resetAndNavigate("/rider/home");
              }}
            >
              <CustomText style={{ color: 'white', fontWeight: 'bold' }}>
                Go to Home Now
              </CustomText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Payment Confirmation Modal */}
      <PaymentConfirmationModal
        visible={showPaymentConfirmation}
        onConfirm={async () => {
          setShowPaymentConfirmation(false);
          const isSuccess = await updateRideStatus(rideData?._id, "COMPLETED");
          if (isSuccess) {
            setShowCompletionCountdown(true);
          } else {
            Alert.alert("There was an error completing the ride");
          }
        }}
        fare={rideData?.fare || 0}
        paymentMethod={rideData?.paymentMethod || "CASH"}
        isPWDRide={rideData?.isPWDRide || false}
        originalFare={rideData?.originalFare}
        discountAmount={rideData?.discountAmount}
        pwdDiscountPercentage={rideData?.pwdDiscountPercentage}
      />
    </View>
  );
};

export default LiveRide;
