import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { mmkvStorage } from "./storage";

interface AuthStoreProps {
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  role: string | null;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setRole: (role: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStoreProps>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      role: null,
      setTokens: (accessToken, refreshToken) => 
        set({ 
          token: accessToken, 
          refreshToken, 
          isAuthenticated: true 
        }),
      setRole: (role) => set({ role }),
      logout: () => set({ 
        token: null, 
        refreshToken: null, 
        isAuthenticated: false, 
        role: null 
      }),
    }),
    {
      name: "auth-store",
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
