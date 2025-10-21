import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Modal,
  Dimensions,
} from "react-native";
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import CustomText from "@/components/shared/CustomText";
import {
  getChatMessages,
  markMessagesAsRead,
  formatMessageTime,
  uploadImageMessage,
} from "@/service/chatService";
import { useWS } from "@/service/WSProvider";
import { Colors } from "@/utils/Constants";
import { useRiderStore } from "@/store/riderStore";

interface Message {
  _id: string;
  chatId: string;
  sender: {
    userId: {
      _id: string;
      firstName: string;
      lastName: string;
      photo?: string;
    };
    role: string;
  };
  content: string;
  messageType: string;
  imageUrl?: string;
  createdAt: string;
  readBy: Array<{
    userId: string;
    readAt: string;
  }>;
}

export default function RiderChatRoom() {
  const params = useLocalSearchParams();
  const { chatId, otherUserId, otherUserName, otherUserPhoto, otherUserRole } = params;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { emit, on, off } = useWS();
  const { user } = useRiderStore();

  useEffect(() => {
    if (!chatId) return;

    // Join chat room
    emit("joinChat", chatId);
    console.log(`💬 Joined chat room: ${chatId}`);

    // Fetch initial messages via Socket.IO
    fetchMessages();

    // Mark messages as read via Socket.IO
    emit("markMessagesRead", { chatId });

    // Listen for messages fetched
    on("messagesFetched", (data: any) => {
      console.log(`💬 Messages fetched via socket: ${data.messages.length}`);
      setMessages(data.messages);
      setLoading(false);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    });

    // Listen for messages error
    on("messagesError", (data: any) => {
      console.error("💬 Error fetching messages via socket:", data.message);
      setMessages([]);
      setLoading(false);
    });

    // Listen for mark read success
    on("markReadSuccess", (data: any) => {
      console.log(`💬 Marked ${data.count} messages as read via socket`);
    });

    // Listen for new messages
    on("newMessage", (message: Message) => {
      console.log("💬 New message received:", message);
      if (message.chatId === chatId) {
        // Check if message already exists to prevent duplicates
        setMessages((prev) => {
          // Remove any temporary optimistic messages and replace with real message
          const withoutTemp = prev.filter((m) => !m._id.startsWith('temp_'));
          const exists = withoutTemp.some((m) => m._id === message._id);
          if (exists) {
            console.log("💬 Message already exists, skipping duplicate");
            return prev;
          }
          return [...withoutTemp, message];
        });
        // Mark as read immediately if not from current user
        const currentUserId = user?.id || user?._id;
        const senderUserId = message.sender.userId._id;
        if (currentUserId !== senderUserId) {
          emit("markMessagesRead", { chatId });
        }
        // Scroll to bottom
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    });

    // Listen for typing indicator
    on("userTyping", (data: any) => {
      if (data.userId !== user?.id) {
        setIsTyping(data.isTyping);
      }
    });

    // Listen for messages read
    on("messagesRead", (data: any) => {
      console.log("💬 Messages marked as read:", data);
      // Update message read status in UI if needed
    });

    return () => {
      emit("leaveChat", chatId);
      off("newMessage");
      off("userTyping");
      off("messagesRead");
      off("messagesFetched");
      off("messagesError");
      off("markReadSuccess");
      console.log(`💬 Left chat room: ${chatId}`);
    };
  }, [chatId]);

  const fetchMessages = () => {
    console.log(`💬 Fetching messages via socket for chat: ${chatId}`);
    emit("fetchMessages", { chatId, page: 1, limit: 50 });
  };

  const handleSendMessage = () => {
    if (!inputText.trim() || sending) return;

    setSending(true);
    const messageContent = inputText.trim();
    setInputText("");

    // Create optimistic message for immediate UI update
    const optimisticMessage: Message = {
      _id: `temp_${Date.now()}`, // Temporary ID
      chatId: chatId as string,
      sender: {
        userId: {
          _id: user?.id || user?._id || '',
          firstName: user?.firstName || '',
          lastName: user?.lastName || '',
          photo: user?.photo,
        },
        role: 'rider',
      },
      content: messageContent,
      messageType: 'text',
      createdAt: new Date().toISOString(),
      readBy: [],
    };

    // Immediately add to UI for instant feedback
    setMessages((prev) => [...prev, optimisticMessage]);
    console.log("💬 Added optimistic message to UI");

    // Scroll to bottom immediately
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    // Send via socket for real-time delivery
    emit("sendMessage", {
      chatId,
      content: messageContent,
    });

    // Stop typing indicator
    emit("typing", { chatId, isTyping: false });

    setSending(false);
  };

  const handleInputChange = (text: string) => {
    setInputText(text);

    // Send typing indicator
    emit("typing", { chatId, isTyping: text.length > 0 });

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      emit("typing", { chatId, isTyping: false });
    }, 2000);
  };

  const handlePickImage = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant photo library access to send images.');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        console.log('📸 Image selected:', imageUri);
        
        // Upload image
        setUploadingImage(true);
        try {
          await uploadImageMessage(chatId as string, imageUri);
          setUploadingImage(false);
          
          // Scroll to bottom
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        } catch (uploadError: any) {
          setUploadingImage(false);
          
          // User-friendly error messages based on error type
          let title = 'Upload Failed';
          let message = 'That image cannot be uploaded. Please try again.';
          
          if (uploadError.message === 'UPLOAD_TIMEOUT') {
            title = 'Upload Timeout';
            message = 'The image is taking too long to upload. Please check your connection or try a smaller file.';
          } else if (uploadError.message === 'FILE_TOO_LARGE') {
            title = 'File Too Large';
            message = 'That image is too large. Please ensure the file is below 5MB and try again.';
          } else if (uploadError.message === 'FILE_CORRUPTED') {
            title = 'Invalid File';
            message = 'That image appears to be corrupted or invalid. Please try a different image.';
          } else if (uploadError.message === 'NETWORK_ERROR') {
            title = 'Connection Error';
            message = 'Unable to upload image. Please check your internet connection and try again.';
          }
          
          Alert.alert(title, message, [{ text: 'OK' }]);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      setUploadingImage(false);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    // Robust user ID comparison - handle both _id and id properties from user store
    const currentUserId = user?.id || user?._id;
    const senderUserId = item.sender.userId._id;
    const isMyMessage = currentUserId === senderUserId;
    const senderName = `${item.sender.userId.firstName} ${item.sender.userId.lastName}`;
    
    console.log(`💬 Message from ${senderName}: isMyMessage=${isMyMessage}, currentUserId=${currentUserId}, senderUserId=${senderUserId}`);

    return (
      <View
        style={[
          styles.messageContainer,
          isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer,
        ]}
      >
        {!isMyMessage && (
          <View style={styles.messageAvatar}>
            {item.sender.userId.photo ? (
              <Image
                source={{ uri: item.sender.userId.photo }}
                style={styles.avatarSmall}
              />
            ) : (
              <View style={[styles.avatarSmall, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={16} color="#999" />
              </View>
            )}
          </View>
        )}

        <View
          style={[
            styles.messageBubble,
            isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble,
            item.messageType === 'image' && styles.imageBubble,
          ]}
        >
          {!isMyMessage && (
            <CustomText fontSize={11} style={styles.senderName}>
              {senderName}
            </CustomText>
          )}
          
          {item.messageType === 'image' && item.imageUrl ? (
            <TouchableOpacity 
              activeOpacity={0.9}
              onPress={() => setExpandedImage(item.imageUrl || null)}
            >
              <Image
                source={{ uri: item.imageUrl }}
                style={styles.messageImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ) : (
            <CustomText
              fontSize={15}
              style={[
                styles.messageText,
                isMyMessage ? styles.myMessageText : styles.otherMessageText,
              ]}
            >
              {item.content}
            </CustomText>
          )}
          
          <CustomText
            fontSize={11}
            style={[
              styles.messageTime,
              isMyMessage ? styles.myMessageTime : styles.otherMessageTime,
            ]}
          >
            {formatMessageTime(item.createdAt)}
          </CustomText>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <>
      {/* Image Expansion Modal */}
      <Modal
        visible={expandedImage !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setExpandedImage(null)}
      >
        <View style={styles.imageModalContainer}>
          <TouchableOpacity 
            style={styles.imageModalOverlay}
            activeOpacity={1}
            onPress={() => setExpandedImage(null)}
          >
            <View style={styles.imageModalContent}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setExpandedImage(null)}
              >
                <Ionicons name="close-circle" size={36} color="#fff" />
              </TouchableOpacity>
              
              {expandedImage && (
                <Image
                  source={{ uri: expandedImage }}
                  style={styles.expandedImage}
                  resizeMode="contain"
                />
              )}
            </View>
          </TouchableOpacity>
        </View>
      </Modal>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          {otherUserPhoto ? (
            <Image
              source={{ uri: otherUserPhoto as string }}
              style={styles.headerAvatar}
            />
          ) : (
            <View style={[styles.headerAvatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={20} color="#999" />
            </View>
          )}
          <View style={styles.headerText}>
            <CustomText fontFamily="Bold" fontSize={16}>
              {otherUserName}
            </CustomText>
            <CustomText fontSize={12} style={styles.roleText}>
              Passenger
            </CustomText>
          </View>
        </View>

        <View style={{ width: 40 }} />
      </View>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Typing Indicator */}
      {isTyping && (
        <View style={styles.typingContainer}>
          <CustomText fontSize={13} style={styles.typingText}>
            {otherUserName} is typing...
          </CustomText>
        </View>
      )}

      {/* Input Area */}
      <View style={styles.inputContainer}>
        {/* Image Picker Button - Left side like Messenger */}
        <TouchableOpacity
          style={styles.imageButton}
          onPress={handlePickImage}
          disabled={uploadingImage}
        >
          {uploadingImage ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Ionicons name="image" size={24} color={Colors.primary} />
          )}
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={inputText}
          onChangeText={handleInputChange}
          multiline
          maxLength={2000}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!inputText.trim() || sending) && styles.sendButtonDisabled,
          ]}
          onPress={handleSendMessage}
          disabled={!inputText.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="send" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  headerText: {
    flex: 1,
  },
  roleText: {
    color: "#666",
    marginTop: 2,
  },
  messagesList: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  messageContainer: {
    flexDirection: "row",
    marginBottom: 12,
    maxWidth: "80%",
  },
  myMessageContainer: {
    alignSelf: "flex-end",
    flexDirection: "row-reverse",
  },
  otherMessageContainer: {
    alignSelf: "flex-start",
  },
  messageAvatar: {
    marginRight: 8,
  },
  avatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  messageBubble: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: "100%",
  },
  myMessageBubble: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: "#fff",
    borderBottomLeftRadius: 4,
  },
  senderName: {
    color: Colors.primary,
    marginBottom: 4,
    fontWeight: "600",
  },
  messageText: {
    lineHeight: 20,
  },
  myMessageText: {
    color: "#fff",
  },
  otherMessageText: {
    color: "#000",
  },
  messageTime: {
    marginTop: 4,
  },
  myMessageTime: {
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "right",
  },
  otherMessageTime: {
    color: "#999",
  },
  typingContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#f5f5f5",
  },
  typingText: {
    color: "#666",
    fontStyle: "italic",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  imageButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  input: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 15,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#ccc",
  },
  imageBubble: {
    padding: 4,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  imageModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalOverlay: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalContent: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  expandedImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.8,
  },
});
