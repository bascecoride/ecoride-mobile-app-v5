import React, { useState, useEffect, useCallback } from "react";
import { chatNotificationService } from "@/service/chatNotificationService";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import CustomText from "@/components/shared/CustomText";
import { getMyChats, getOnlineUsers, getOrCreateChat, formatChatTime } from "@/service/chatService";
import { useWS } from "@/service/WSProvider";
import { Colors } from "@/utils/Constants";
import { useRiderStore } from "@/store/riderStore";
import { getUserProfile } from "@/service/authService";
import { useIsFocused } from "@react-navigation/native";

interface Chat {
  _id: string;
  participants: Array<{
    userId: {
      _id: string;
      firstName: string;
      lastName: string;
      photo?: string;
      role: string;
    };
    role: string;
  }>;
  lastMessage?: {
    _id: string;
    content: string;
    createdAt: string;
    sender: {
      userId: string;
      role: string;
    };
  };
  lastMessageTime: string;
  unreadCount: {
    customer: number;
    rider: number;
  };
}

interface OnlineUser {
  _id: string;
  firstName: string;
  lastName: string;
  photo?: string;
  role: string;
  vehicleType?: string;
}

export default function RiderChatList() {
  const [activeTab, setActiveTab] = useState<"chats" | "online">("chats");
  const [chats, setChats] = useState<Chat[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const { on, off, emit } = useWS();
  const isFocused = useIsFocused();
  
  // Get current user from RIDER store - THIS IS THE KEY TO FILTERING
  const { user: currentUser, setUser } = useRiderStore();
  const [profileLoaded, setProfileLoaded] = useState(false);

  // CRITICAL: Load user profile if not in store
  useEffect(() => {
    const loadProfile = async () => {
      if (!currentUser && !profileLoaded) {
        try {
          console.log(`🔄 RIDER CHATLIST - Loading user profile from server...`);
          const profile = await getUserProfile();
          console.log(`✅ RIDER CHATLIST - Profile loaded:`, profile);
          setUser(profile);
          setProfileLoaded(true);
        } catch (error) {
          console.error(`❌ RIDER CHATLIST - Failed to load profile:`, error);
          setProfileLoaded(true); // Prevent infinite retries
        }
      }
    };
    loadProfile();
  }, [currentUser, profileLoaded]);

  // Debug: Log current user on mount
  useEffect(() => {
    console.log(`🔍 RIDER CHATLIST - Current user from store:`, currentUser);
    console.log(`🔍 RIDER CHATLIST - Current user ID:`, currentUser?._id);
    console.log(`🔍 RIDER CHATLIST - Current user name:`, currentUser?.firstName, currentUser?.lastName);
  }, [currentUser]);

  const fetchChats = async () => {
    try {
      const { chats: fetchedChats, userRole: role } = await getMyChats();
      setChats(fetchedChats);
      
      // Set user role if not already set
      if (!userRole) {
        setUserRole(role);
      }
      
      // Calculate total unread count
      const unreadCount = fetchedChats.reduce((total: number, chat: Chat) => {
        const count = role === "customer" ? chat.unreadCount.customer : chat.unreadCount.rider;
        return total + count;
      }, 0);
      setTotalUnreadCount(unreadCount);
    } catch (error) {
      console.error("Error fetching chats:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchOnlineUsers = async () => {
    try {
      const { onlineUsers: users, currentUserRole, currentUserId: userId } = await getOnlineUsers();
      
      console.log(`🔍 Current user ID from server: ${userId}`);
      console.log(`🔍 Current user ID from store: ${currentUser?._id}`);
      console.log(`📋 Received ${users.length} online users from server`);
      
      // Store current user ID for filtering
      if (userId) {
        setCurrentUserId(userId);
      }
      
      // GUARANTEED FILTER: Use multiple sources to identify current user
      const myUserId = currentUser?._id || userId;
      
      console.log(`🎯 MY USER ID (GUARANTEED): ${myUserId}`);
      
      // Filter out current user using ALL possible ID sources
      const filteredUsers = users.filter((user: OnlineUser) => {
        const userIdStr = String(user._id);
        const myUserIdStr = String(myUserId);
        const serverUserIdStr = String(userId);
        const storeUserIdStr = String(currentUser?._id || '');
        
        // Check against ALL possible current user IDs
        const isCurrentUser = 
          userIdStr === myUserIdStr ||
          userIdStr === serverUserIdStr ||
          (storeUserIdStr && userIdStr === storeUserIdStr) ||
          (user.firstName === currentUser?.firstName && user.lastName === currentUser?.lastName);
        
        if (isCurrentUser) {
          console.log(`🚫 FILTERING OUT CURRENT USER: ${user.firstName} ${user.lastName} (${userIdStr})`);
          console.log(`   - Matched against myUserId: ${myUserIdStr}`);
          console.log(`   - Matched against serverUserId: ${serverUserIdStr}`);
          console.log(`   - Matched against storeUserId: ${storeUserIdStr}`);
        }
        
        return !isCurrentUser;
      });
      
      // Deduplicate by _id
      const uniqueUsers = filteredUsers.filter((user: OnlineUser, index: number, self: OnlineUser[]) =>
        index === self.findIndex((u: OnlineUser) => String(u._id) === String(user._id))
      );
      
      console.log(`✅ FINAL: Showing ${uniqueUsers.length} online users (YOU ARE HIDDEN)`);
      setOnlineUsers(uniqueUsers);
      if (!userRole) setUserRole(currentUserRole);
    } catch (error) {
      console.error("Error fetching online users:", error);
    }
  };

  // Fetch chats when screen is focused
  useEffect(() => {
    if (isFocused) {
      fetchChats();
      
      // Refresh unread count for home screen badge
      chatNotificationService.refreshUnreadCount();
      
      // Only fetch online users if on the online tab
      if (activeTab === "online") {
        fetchOnlineUsers();
      }
    }
  }, [isFocused, activeTab]);

  // ALWAYS listen for new messages - separate from focus logic
  useEffect(() => {
    const handleNewMessage = (message: any) => {
      console.log("💬 New message received in chat list:", message);
      console.log("💬 Message chatId:", message.chatId);
      console.log("💬 Current user role:", userRole);
      
      // Update the specific chat in the list
      setChats((prevChats) => {
        const updatedChats = prevChats.map((chat) => {
          if (chat._id === message.chatId) {
            console.log("✅ Updating chat:", chat._id);
            
            // Determine if this message is from the current user
            const isMyMessage = message.sender.role === userRole;
            console.log("💬 Is my message:", isMyMessage);
            
            // Update unread count only if message is NOT from current user
            const updatedUnreadCount = { ...chat.unreadCount };
            if (!isMyMessage) {
              if (userRole === "customer") {
                updatedUnreadCount.customer += 1;
              } else if (userRole === "rider") {
                updatedUnreadCount.rider += 1;
              }
              console.log("📈 Incremented unread count:", updatedUnreadCount);
            }
            
            return {
              ...chat,
              lastMessage: {
                _id: message._id,
                content: message.content,
                createdAt: message.createdAt,
                sender: message.sender,
              },
              lastMessageTime: message.createdAt,
              unreadCount: updatedUnreadCount,
            };
          }
          return chat;
        });
        
        // Sort chats by last message time (most recent first)
        const sortedChats = updatedChats.sort((a, b) => {
          const timeA = new Date(a.lastMessageTime).getTime();
          const timeB = new Date(b.lastMessageTime).getTime();
          return timeB - timeA;
        });
        
        console.log("✅ Chat list updated and sorted");
        return sortedChats;
      });
      
      // Update total unread count
      setTotalUnreadCount((prevCount) => {
        const isMyMessage = message.sender.role === userRole;
        if (!isMyMessage) {
          console.log("📈 Incrementing total unread count");
          return prevCount + 1;
        }
        return prevCount;
      });
    };

    // Set up listener - this stays active even when navigating away
    on("newMessage", handleNewMessage);
    console.log("🔊 Chat list: newMessage listener activated (always on)");

    return () => {
      off("newMessage");
      console.log("🔇 Chat list: newMessage listener deactivated");
    };
  }, [userRole]); // Only depends on userRole, not isFocused

  // Separate effect for online users - only when on Online tab
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (activeTab === "online") {
      // Fetch immediately when switching to online tab
      fetchOnlineUsers();
      
      // Refresh online users every 60 seconds (reduced frequency)
      interval = setInterval(fetchOnlineUsers, 60000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTab]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (activeTab === "chats") {
        await fetchChats();
      } else {
        await fetchOnlineUsers();
      }
    } finally {
      setRefreshing(false);
    }
  }, [activeTab]);

  const handleChatPress = (chat: Chat) => {
    // Find the other participant (not the current user)
    const otherParticipant = chat.participants.find(
      (p) => p.role !== userRole
    );

    if (otherParticipant) {
      router.push({
        pathname: "/rider/chatroom",
        params: {
          chatId: chat._id,
          otherUserId: otherParticipant.userId._id,
          otherUserName: `${otherParticipant.userId.firstName} ${otherParticipant.userId.lastName}`,
          otherUserPhoto: otherParticipant.userId.photo || "",
          otherUserRole: otherParticipant.role,
        },
      });
    }
  };

  const handleOnlineUserPress = (user: OnlineUser) => {
    setLoading(true);
    
    console.log(`🔵 RIDER - Creating chat with user:`, {
      userId: user._id,
      name: `${user.firstName} ${user.lastName}`,
      role: user.role
    });
    
    // Create or get chat via Socket.IO
    emit("getOrCreateChat", {
      otherUserId: user._id,
      otherUserRole: user.role,
    });

    // Listen for response
    const handleChatCreated = (data: any) => {
      console.log("✅ RIDER - Chat created via socket:", data.chat._id);
      console.log("📋 RIDER - Chat data:", data.chat);
      setLoading(false);
      
      // Add the new chat to the chats list immediately
      setChats(prevChats => {
        // Check if chat already exists
        const exists = prevChats.some(c => c._id === data.chat._id);
        if (exists) {
          return prevChats;
        }
        // Add new chat to the beginning of the list
        return [data.chat, ...prevChats];
      });
      
      // Refresh chats to ensure we have the latest data
      fetchChats();
      
      // Navigate to chat room
      router.push({
        pathname: "/rider/chatroom",
        params: {
          chatId: data.chat._id,
          otherUserId: user._id,
          otherUserName: `${user.firstName} ${user.lastName}`,
          otherUserPhoto: user.photo || "",
          otherUserRole: user.role,
        },
      });
      
      // Clean up listener
      off("chatCreated");
      off("chatError");
    };

    const handleChatError = (data: any) => {
      console.error("❌ RIDER - Error creating chat via socket:", data.message);
      setLoading(false);
      
      // Clean up listener
      off("chatCreated");
      off("chatError");
    };

    // Set up listeners
    on("chatCreated", handleChatCreated);
    on("chatError", handleChatError);
  };

  const renderChatItem = ({ item }: { item: Chat }) => {
    // Find the other participant
    const otherParticipant = item.participants.find(
      (p) => p.role !== userRole
    );

    if (!otherParticipant) return null;

    const otherUser = otherParticipant.userId;
    const unreadCount = userRole === "customer" ? item.unreadCount.customer : item.unreadCount.rider;
    const lastMessage = item.lastMessage?.content || "No messages yet";
    const isMyMessage = item.lastMessage?.sender.role === userRole;

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => handleChatPress(item)}
      >
        <View style={styles.avatarContainer}>
          {otherUser.photo ? (
            <Image source={{ uri: otherUser.photo }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={30} color="#999" />
            </View>
          )}
        </View>

        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <CustomText fontFamily="Bold" fontSize={16} style={styles.chatName}>
              {otherUser.firstName} {otherUser.lastName}
            </CustomText>
            <CustomText fontSize={12} style={styles.chatTime}>
              {formatChatTime(item.lastMessageTime)}
            </CustomText>
          </View>

          <View style={styles.messageRow}>
            <CustomText
              fontSize={14}
              style={[
                styles.lastMessage,
                unreadCount > 0 && styles.unreadMessage,
              ]}
              numberOfLines={1}
            >
              {isMyMessage && "You: "}
              {lastMessage}
            </CustomText>
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <CustomText fontSize={11} style={styles.unreadText}>
                  {unreadCount}
                </CustomText>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderOnlineUserItem = ({ item }: { item: OnlineUser }) => {
    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => handleOnlineUserPress(item)}
      >
        <View style={styles.avatarContainer}>
          {item.photo ? (
            <Image source={{ uri: item.photo }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={30} color="#999" />
            </View>
          )}
          {/* Online indicator */}
          <View style={styles.onlineIndicator} />
        </View>

        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <CustomText fontFamily="Bold" fontSize={16} style={styles.chatName}>
              {item.firstName} {item.lastName}
            </CustomText>
            <View style={styles.onlineBadge}>
              <CustomText fontSize={11} style={styles.onlineBadgeText}>
                Online
              </CustomText>
            </View>
          </View>

          <View style={styles.messageRow}>
            <CustomText fontSize={14} style={styles.lastMessage}>
              {item.role === "customer" ? "Passenger" : "Rider"} • Tap to start chat
            </CustomText>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <CustomText fontSize={14} style={styles.loadingText}>
          Loading chats...
        </CustomText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <CustomText fontFamily="Bold" fontSize={20}>
          Messages
        </CustomText>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "chats" && styles.activeTab]}
          onPress={() => setActiveTab("chats")}
        >
          <Ionicons
            name="chatbubbles"
            size={20}
            color={activeTab === "chats" ? Colors.primary : "#999"}
          />
          <View style={styles.tabLabelContainer}>
            <CustomText
              fontFamily={activeTab === "chats" ? "Bold" : "Regular"}
              fontSize={14}
              style={[styles.tabText, activeTab === "chats" && styles.activeTabText]}
            >
              Chats
            </CustomText>
            {totalUnreadCount > 0 && (
              <View style={styles.tabBadge}>
                <CustomText fontSize={10} style={styles.tabBadgeText}>
                  {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
                </CustomText>
              </View>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "online" && styles.activeTab]}
          onPress={() => setActiveTab("online")}
        >
          <Ionicons
            name="people"
            size={20}
            color={activeTab === "online" ? Colors.primary : "#999"}
          />
          <CustomText
            fontFamily={activeTab === "online" ? "Bold" : "Regular"}
            fontSize={14}
            style={[styles.tabText, activeTab === "online" && styles.activeTabText]}
          >
            Online {onlineUsers.length > 0 && `(${onlineUsers.length})`}
          </CustomText>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === "chats" && chats.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={80} color="#ccc" />
          <CustomText fontFamily="Medium" fontSize={18} style={styles.emptyTitle}>
            No conversations yet
          </CustomText>
          <CustomText fontSize={14} style={styles.emptySubtitle}>
            Switch to "Online" tab to start chatting with available users
          </CustomText>
          <CustomText fontSize={12} style={[styles.emptySubtitle, { marginTop: 10, color: '#999' }]}>
            Tip: Click on an online user and send a message to start a conversation
          </CustomText>
        </View>
      ) : activeTab === "online" && onlineUsers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={80} color="#ccc" />
          <CustomText fontFamily="Medium" fontSize={18} style={styles.emptyTitle}>
            No users online
          </CustomText>
          <CustomText fontSize={14} style={styles.emptySubtitle}>
            Check back later when more users are online
          </CustomText>
        </View>
      ) : activeTab === "chats" ? (
        <FlatList
          data={chats}
          renderItem={renderChatItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
            />
          }
        />
      ) : (
        <FlatList
          data={onlineUsers}
          renderItem={renderOnlineUserItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 50,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  listContainer: {
    paddingVertical: 8,
  },
  chatItem: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    backgroundColor: "#fff",
  },
  avatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  chatInfo: {
    flex: 1,
    justifyContent: "center",
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  chatName: {
    flex: 1,
  },
  chatTime: {
    color: "#999",
    marginLeft: 8,
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  lastMessage: {
    flex: 1,
    color: "#666",
  },
  unreadMessage: {
    color: "#000",
    fontWeight: "600",
  },
  unreadBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
    marginLeft: 8,
  },
  unreadText: {
    color: "#fff",
    fontWeight: "bold",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    marginTop: 16,
    color: "#333",
  },
  emptySubtitle: {
    marginTop: 8,
    color: "#999",
    textAlign: "center",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    color: "#999",
  },
  activeTabText: {
    color: Colors.primary,
  },
  onlineIndicator: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#4CAF50",
    borderWidth: 2,
    borderColor: "#fff",
  },
  onlineBadge: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  onlineBadgeText: {
    color: "#fff",
    fontWeight: "600",
  },
  tabLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  tabBadge: {
    backgroundColor: "#FF3B30",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  tabBadgeText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 10,
  },
});
