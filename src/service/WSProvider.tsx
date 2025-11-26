import { tokenStorage } from "@/store/storage";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { io, Socket } from "socket.io-client";
import { SOCKET_URL } from "./config";
import { refresh_tokens } from "./apiInterceptors";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

interface WSService {
  initializeSocket: () => void;
  emit: (event: string, data?: any) => void;
  on: (event: string, cb: (data: any) => void) => void;
  off: (event: string) => void;
  removeListener: (listenerName: string) => void;
  updateAccessToken: () => Promise<void>;
  disconnect: () => void;
}

const WSContext = createContext<WSService | undefined>(undefined);

export const WSProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [socketAccessToken, setSocketAccessToken] = useState<string | null>(
    null
  );
  const socket = useRef<Socket>();

  // Load token on mount
  useEffect(() => {
    const loadToken = async () => {
      try {
        const token = await tokenStorage.getString("access_token");
        setSocketAccessToken(token);
      } catch (error) {
        console.error("Error loading token:", error);
      }
    };
    
    loadToken();
  }, []);

  // Initialize or reinitialize socket when token changes
  useEffect(() => {
    if (socketAccessToken) {
      if (socket.current) {
        socket.current.disconnect();
      }

      console.log(`Connecting to socket server at: ${SOCKET_URL}`);
      console.log(`Using access token: ${socketAccessToken?.substring(0, 15)}...`);
      
      socket.current = io(SOCKET_URL, {
        transports: ["websocket"],
        withCredentials: true,
        extraHeaders: {
          access_token: socketAccessToken || "",
        },
      });

      socket.current.on("connect", () => {
        console.log(`✅ Socket connected successfully with ID: ${socket.current?.id}`);
      });

      // CRITICAL: Listen for account disapproval events directly in WSProvider
      // This ensures the listener persists across socket reconnections
      socket.current.on("accountDisapproved", async (data: { reason: string; timestamp: string }) => {
        console.log('🚨🚨🚨 ACCOUNT DISAPPROVED EVENT RECEIVED 🚨🚨🚨');
        console.log('🚨 Data:', JSON.stringify(data));
        console.log('🚨 Reason:', data?.reason);
        console.log('🚨 Timestamp:', data?.timestamp);
        
        // Show alert immediately
        const reason = data?.reason || 'Your account has been disapproved by an administrator.';
        
        Alert.alert(
          '⚠️ Account Disapproved',
          reason + '\n\nYou will be logged out.',
          [
            {
              text: 'OK',
              onPress: async () => {
                console.log('🔓 User acknowledged disapproval, logging out...');
                try {
                  // Get user role before clearing storage
                  const userRole = await AsyncStorage.getItem('userRole');
                  
                  // Disconnect socket
                  if (socket.current) {
                    socket.current.disconnect();
                    console.log('🔌 Socket disconnected');
                  }
                  
                  // Clear all stored data
                  await AsyncStorage.multiRemove([
                    'access_token',
                    'user',
                    'userRole',
                    'userId',
                  ]);
                  
                  // Also clear from tokenStorage (MMKV)
                  tokenStorage.delete('access_token');
                  
                  console.log('🗑️ User data cleared from storage');
                  
                  // Navigate to appropriate auth screen
                  if (userRole === 'rider') {
                    console.log('📍 Navigating to rider auth...');
                    router.replace('/rider/auth');
                  } else {
                    console.log('📍 Navigating to customer auth...');
                    router.replace('/customer/auth');
                  }
                  
                  console.log('✅ Logout complete');
                } catch (error) {
                  console.error('❌ Error during logout:', error);
                  router.replace('/customer/auth');
                }
              },
            },
          ],
          { cancelable: false }
        );
      });
      
      socket.current.on("disconnect", (reason) => {
        console.log(`❌ Socket disconnected: ${reason}`);
      });

      socket.current.on("connect_error", async (error) => {
        console.log(`⚠️ Socket connection error: ${error.message}`);
        
        if (error.message === "Authentication error") {
          console.log("🔑 Auth connection error - attempting token refresh");
          try {
            await refresh_tokens();
            updateAccessToken();
            console.log("🔄 Token refreshed, reconnecting socket...");
          } catch (refreshError) {
            console.error("❌ Failed to refresh token:", refreshError);
          }
        }
      });
    }

    return () => {
      socket.current?.disconnect();
    };
  }, [socketAccessToken]);

  const emit = (event: string, data: any = {}) => {
    if (socket.current?.connected) {
      console.log(`📤 Socket emitting '${event}':`, data);
      socket.current.emit(event, data);
    } else {
      console.warn(`⚠️ Socket not connected, cannot emit '${event}'`);
    }
  };

  const on = (event: string, cb: (data: any) => void) => {
    socket.current?.on(event, cb);
  };

  const off = (event: string) => {
    socket.current?.off(event);
  };

  const removeListener = (listenerName: string) => {
    socket?.current?.removeListener(listenerName);
  };

  const disconnect = () => {
    if (socket.current) {
      socket.current.disconnect();
      socket.current = undefined;
    }
  };

  const updateAccessToken = async () => {
    try {
      const token = await tokenStorage.getString("access_token");
      setSocketAccessToken(token);
    } catch (error) {
      console.error("Error updating access token:", error);
    }
  };

  const socketService: WSService = {
    initializeSocket: () => {},
    emit,
    off,
    on,
    disconnect,
    removeListener,
    updateAccessToken,
  };

  return (
    <WSContext.Provider value={socketService}>{children}</WSContext.Provider>
  );
};

export const useWS = (): WSService => {
  const socketService = useContext(WSContext);
  if (!socketService) {
    throw new Error("useWS must be used within a WSProvider");
  }
  return socketService;
};
