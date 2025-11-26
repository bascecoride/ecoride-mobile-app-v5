import { View, Text, Platform, TouchableOpacity, StyleSheet } from "react-native";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { homeStyles } from "@/styles/homeStyles";
import { StatusBar } from "expo-status-bar";
import LocationBar from "@/components/customer/LocationBar";
import { screenHeight } from "@/utils/Constants";
import DraggableMap from "@/components/customer/DraggableMap";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import SheetContent from "@/components/customer/SheetContent";
import { getMyRides } from "@/service/rideService";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/utils/Constants";
import { useWS } from "@/service/WSProvider";
import CustomText from "@/components/shared/CustomText";
import { chatNotificationService } from "@/service/chatNotificationService";
// Note: disapprovalService is now handled directly in WSProvider for reliability

const androidHeights = [
  screenHeight * 0.12,
  screenHeight * 0.42,
  screenHeight * 0.8,
];
const iosHeights = [screenHeight * 0.2, screenHeight * 0.5, screenHeight * 0.8];

const CustomerHome = () => {
  const bottomSheetRef = useRef(null);
  const snapPoints = useMemo(
    () => (Platform.OS === "ios" ? iosHeights : androidHeights),
    []
  );

  const [mapHeight, setMapHeight] = useState(snapPoints[0]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { on, off, emit, disconnect } = useWS();

  const handleSheetChanges = useCallback((index: number) => {
    let height = screenHeight * 0.8;
    if (index == 1) {
      height = screenHeight * 0.5;
    }
    setMapHeight(height);
  }, []);

  useEffect(() => {
    getMyRides();
    
    // Note: Account disapproval is now handled directly in WSProvider for reliability
    // No need to initialize disapprovalService here
    
    // Subscribe to chat notification service for real-time updates
    const unsubscribe = chatNotificationService.subscribe((count) => {
      console.log(`🏠 Customer Home: Unread count updated to ${count}`);
      setUnreadCount(count);
    });

    // Initial fetch of unread count
    chatNotificationService.refreshUnreadCount();

    // Listen for new messages via socket (real-time)
    const handleNewMessage = (message: any) => {
      console.log(`🔔 Customer Home: New message received in chat ${message.chatId}`);
      // Only increment if message is not from current user
      if (message.sender?.userId?._id !== message.sender?.userId) {
        chatNotificationService.incrementUnreadCount();
      }
    };

    // Listen for unread count updates from server
    const handleUnreadCountUpdate = (data: any) => {
      console.log(`🔔 Customer Home: Unread count update from server:`, data);
      if (data.unreadCount !== undefined) {
        chatNotificationService.setUnreadCount(data.unreadCount);
      }
    };

    // Listen for messages marked as read
    const handleMessagesRead = (data: any) => {
      console.log(`✅ Customer Home: Messages marked as read in chat ${data.chatId}`);
      chatNotificationService.refreshUnreadCount();
    };

    on("newMessage", handleNewMessage);
    on("unreadCountUpdate", handleUnreadCountUpdate);
    on("messagesRead", handleMessagesRead);

    // Refresh unread count every 60 seconds as backup (reduced from 30s)
    const interval = setInterval(() => {
      chatNotificationService.refreshUnreadCount();
    }, 60000);

    return () => {
      unsubscribe();
      off("newMessage");
      off("unreadCountUpdate");
      off("messagesRead");
      clearInterval(interval);
    };
  }, [on, off]);

  return (
    <View style={homeStyles.container}>
      <StatusBar style="light" backgroundColor="orange" translucent={false} />
      <LocationBar />

      <DraggableMap height={mapHeight} />

      <BottomSheet
        ref={bottomSheetRef}
        index={1}
        handleIndicatorStyle={{
          backgroundColor: "#ccc",
        }}
        enableOverDrag={false}
        enableDynamicSizing={false}
        style={{ zIndex: 4 }}
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
      >
        <BottomSheetScrollView
          contentContainerStyle={homeStyles.scrollContainer}
        >
          <SheetContent />
        </BottomSheetScrollView>
      </BottomSheet>

      {/* Floating Chat Button */}
      <TouchableOpacity
        style={styles.floatingChatButton}
        onPress={() => router.push("/customer/chatlist")}
        activeOpacity={0.8}
      >
        <Ionicons name="chatbubbles" size={28} color="#fff" />
        {unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <CustomText fontSize={10} style={styles.unreadText}>
              {unreadCount > 99 ? "99+" : unreadCount}
            </CustomText>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  floatingChatButton: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 420 : 30,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFC107",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    zIndex: 10,
  },
  unreadBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#FF3B30",
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: "#fff",
  },
  unreadText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 10,
  },
});

export default CustomerHome;
