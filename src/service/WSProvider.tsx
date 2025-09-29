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
    socket.current?.emit(event, data);
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
