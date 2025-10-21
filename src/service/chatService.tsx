import { Alert } from "react-native";
import { api } from "./apiInterceptors";

// Get or create a chat with another user
export const getOrCreateChat = async (otherUserId: string, otherUserRole: string) => {
  try {
    console.log(`💬 Getting/Creating chat with user ${otherUserId} (${otherUserRole})`);
    const res = await api.post("/chat/chat", {
      otherUserId,
      otherUserRole,
    });
    console.log(`✅ Chat retrieved/created:`, res.data.chat._id);
    return res.data.chat;
  } catch (error: any) {
    console.error("Error getting/creating chat:", error);
    Alert.alert("Error", error.response?.data?.message || "Failed to create chat");
    throw error;
  }
};

// Get all chats for current user
export const getMyChats = async () => {
  try {
    console.log(`💬 Fetching my chats...`);
    const res = await api.get("/chat/chats");
    console.log(`✅ Found ${res.data.chats.length} chats`);
    console.log(`📋 Chats data:`, JSON.stringify(res.data.chats, null, 2));
    return {
      chats: res.data.chats,
      userRole: res.data.userRole,
    };
  } catch (error: any) {
    console.error("❌ Error fetching chats:", error);
    console.error("❌ Error details:", error.response?.data || error.message);
    Alert.alert("Error", "Failed to fetch chats");
    return { chats: [], userRole: null };
  }
};

// Get all online users
export const getOnlineUsers = async () => {
  try {
    console.log(`💬 Fetching online users...`);
    const res = await api.get("/chat/online-users");
    console.log(`✅ Found ${res.data.onlineUsers.length} online users`);
    return {
      onlineUsers: res.data.onlineUsers,
      currentUserRole: res.data.currentUserRole,
      currentUserId: res.data.currentUserId,
    };
  } catch (error: any) {
    console.error("Error fetching online users:", error);
    return { onlineUsers: [], currentUserRole: null, currentUserId: null };
  }
};

// Get specific chat by ID
export const getChatById = async (chatId: string) => {
  try {
    console.log(`💬 Fetching chat ${chatId}...`);
    const res = await api.get(`/chat/chat/${chatId}`);
    console.log(`✅ Chat retrieved:`, res.data.chat._id);
    return res.data.chat;
  } catch (error: any) {
    console.error("Error fetching chat:", error);
    Alert.alert("Error", "Failed to fetch chat");
    throw error;
  }
};

// Get messages for a chat
export const getChatMessages = async (chatId: string, page: number = 1, limit: number = 50) => {
  try {
    console.log(`💬 Fetching messages for chat ${chatId}, page ${page}...`);
    const res = await api.get(`/chat/chat/${chatId}/messages`, {
      params: { page, limit },
    });
    console.log(`✅ Found ${res.data.messages.length} messages`);
    return {
      messages: res.data.messages,
      pagination: res.data.pagination,
    };
  } catch (error: any) {
    console.error("Error fetching messages:", error);
    Alert.alert("Error", "Failed to fetch messages");
    return { messages: [], pagination: null };
  }
};

// Send a message (via REST API - backup to socket)
export const sendMessage = async (chatId: string, content: string) => {
  try {
    console.log(`💬 Sending message to chat ${chatId}...`);
    const res = await api.post("/chat/message", {
      chatId,
      content,
    });
    console.log(`✅ Message sent:`, res.data.message._id);
    return res.data.message;
  } catch (error: any) {
    console.error("Error sending message:", error);
    Alert.alert("Error", "Failed to send message");
    throw error;
  }
};

// Upload image message
export const uploadImageMessage = async (chatId: string, imageUri: string) => {
  try {
    console.log(`📸 Uploading image to chat ${chatId}...`);
    
    // Create form data
    const formData = new FormData();
    formData.append('chatId', chatId);
    
    // Get file extension from URI
    const uriParts = imageUri.split('.');
    const fileType = uriParts[uriParts.length - 1];
    
    // Append image file
    formData.append('image', {
      uri: imageUri,
      type: `image/${fileType}`,
      name: `chat_image_${Date.now()}.${fileType}`,
    } as any);

    const res = await api.post("/chat/message/image", formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000, // 30 second timeout
    });
    
    console.log(`✅ Image uploaded:`, res.data.message._id);
    return res.data.message;
  } catch (error: any) {
    // Suppress all console errors - don't show technical logs
    // Just throw a user-friendly error that will be caught by the UI
    
    // Check for specific error types to provide better messages
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      // Timeout error
      throw new Error('UPLOAD_TIMEOUT');
    } else if (error.response?.status === 413 || error.message?.includes('too large')) {
      // File too large
      throw new Error('FILE_TOO_LARGE');
    } else if (error.response?.status === 400) {
      // Bad request - likely corrupted file
      throw new Error('FILE_CORRUPTED');
    } else if (!error.response) {
      // Network error
      throw new Error('NETWORK_ERROR');
    } else {
      // Generic error
      throw new Error('UPLOAD_FAILED');
    }
  }
};

// Mark messages as read
export const markMessagesAsRead = async (chatId: string) => {
  try {
    console.log(`💬 Marking messages as read in chat ${chatId}...`);
    const res = await api.post("/chat/messages/read", {
      chatId,
    });
    console.log(`✅ Marked ${res.data.count} messages as read`);
    return res.data;
  } catch (error: any) {
    console.error("Error marking messages as read:", error);
    // Don't show alert for this - it's not critical
    return null;
  }
};

// Delete a message
export const deleteMessage = async (messageId: string) => {
  try {
    console.log(`💬 Deleting message ${messageId}...`);
    const res = await api.delete(`/chat/message/${messageId}`);
    console.log(`✅ Message deleted`);
    return res.data;
  } catch (error: any) {
    console.error("Error deleting message:", error);
    Alert.alert("Error", "Failed to delete message");
    throw error;
  }
};

// Helper function to format chat time
export const formatChatTime = (date: string | Date) => {
  const messageDate = new Date(date);
  const now = new Date();
  const diffInMs = now.getTime() - messageDate.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) {
    return "Just now";
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else if (diffInDays === 1) {
    return "Yesterday";
  } else if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  } else {
    return messageDate.toLocaleDateString();
  }
};

// Helper function to format message time with date
export const formatMessageTime = (date: string | Date) => {
  const messageDate = new Date(date);
  const now = new Date();
  const isToday = messageDate.toDateString() === now.toDateString();
  
  const timeString = messageDate.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  if (isToday) {
    return timeString;
  } else {
    const dateString = messageDate.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
    });
    return `${dateString}, ${timeString}`;
  }
};
