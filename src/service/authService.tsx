import { useRiderStore } from "@/store/riderStore";
import { tokenStorage } from "@/store/storage";
import { useUserStore } from "@/store/userStore";
import { resetAndNavigate } from "@/utils/Helpers";
import axios from "axios";
import { Alert } from "react-native";
import { BASE_URL } from "./config";

// Legacy phone-based authentication
export const signin = async (
  payload: {
    role: "customer" | "rider";
    phone: string;
  },
  updateAccessToken: () => Promise<void>
) => {
  const { setUser } = useUserStore.getState();
  const { setUser: setRiderUser } = useRiderStore.getState();

  try {
    console.log("Attempting to sign in with:", payload);
    console.log("Using API URL:", `${BASE_URL}/api/auth/signin`);
    
    // Test if the server is reachable
    try {
      const testResponse = await axios.get(`${BASE_URL}/api/auth`);
      console.log("Server is reachable, auth endpoint response:", testResponse.status);
    } catch (testError: any) {
      console.log("Auth endpoint test result:", testError.response ? testError.response.status : "No response");
    }
    
    const res = await axios.post(`${BASE_URL}/api/auth/signin`, payload);
    console.log("Sign in response:", res.data);
    
    if (res.data.user.role === "customer") {
      setUser(res.data.user);
    } else {
      setRiderUser(res.data.user);
    }

    await tokenStorage.set("access_token", res.data.access_token);
    await tokenStorage.set("refresh_token", res.data.refresh_token);

    if (res.data.user.role === "customer") {
      resetAndNavigate("/customer/home");
    } else {
      resetAndNavigate("/rider/home");
    }

    await updateAccessToken();
  } catch (error: any) {
    console.log("Error details:", error);
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.log("Response data:", error.response.data);
      console.log("Response status:", error.response.status);
      console.log("Response headers:", error.response.headers);
      Alert.alert("Sign In Error", `Server error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`);
    } else if (error.request) {
      // The request was made but no response was received
      console.log("No response received from server");
      Alert.alert("Connection Error", "Could not connect to the server. Please check your internet connection and try again.");
    } else {
      // Something happened in setting up the request
      console.log("Error message:", error.message);
      Alert.alert("Sign In Error", error.message || "An unknown error occurred");
    }
    
    console.log("Error: ", error?.response?.data?.msg || "Error signin");
  }
};

// New email/password login
export const login = async (
  payload: {
    role: "customer" | "rider";
    email: string;
    password: string;
  },
  updateAccessToken: () => Promise<void>
) => {
  const { setUser } = useUserStore.getState();
  const { setUser: setRiderUser } = useRiderStore.getState();

  try {
    console.log("Attempting to login with:", payload);
    
    // Test if the server is reachable
    try {
      const testResponse = await axios.get(`${BASE_URL}/api/auth`);
      console.log("Server is reachable, auth endpoint response:", testResponse.status);
    } catch (testError: any) {
      console.log("Auth endpoint test result:", testError.response ? testError.response.status : "No response");
    }
    
    const res = await axios.post(`${BASE_URL}/api/auth/login`, payload);
    console.log("Login response:", res.data);
    
    // Check if the user is approved
    if (res.data.status === "disapproved") {
      Alert.alert(
        "Account Disapproved",
        "Your account has been disapproved. Please contact support for further assistance.",
        [{ text: "OK" }]
      );
      return { success: false };
    }
    
    if (res.data.user.role === "customer") {
      setUser(res.data.user);
    } else {
      setRiderUser(res.data.user);
    }

    await tokenStorage.set("access_token", res.data.access_token);
    await tokenStorage.set("refresh_token", res.data.refresh_token);

    if (res.data.user.role === "customer") {
      resetAndNavigate("/customer/home");
    } else {
      resetAndNavigate("/rider/home");
    }

    await updateAccessToken();
    
    return { success: true };
  } catch (error: any) {
    console.log("Error details:", error);
    
    if (error.response) {
      console.log("Response data:", error.response.data);
      console.log("Response status:", error.response.status);
      
      // Check for disapproved status with penalty
      if (error.response.data?.status === "disapproved" && error.response.data?.hasPenalty) {
        return {
          success: false,
          penaltyInfo: {
            disapprovalReason: error.response.data.disapprovalReason,
            penaltyComment: error.response.data.penaltyComment,
            liftDate: error.response.data.penaltyLiftDate,
            isPenaltyActive: error.response.data.isPenaltyActive
          }
        };
      }
      
      // Check for disapproved status without penalty
      if (error.response.data?.status === "disapproved") {
        return {
          success: false,
          rejectionInfo: {
            reason: error.response.data.disapprovalReason || error.response.data.message,
            deadline: null,
            status: 'disapproved'
          }
        };
      }
      
      // Check for pending status
      if (error.response.data?.status === "pending") {
        return {
          success: false,
          rejectionInfo: {
            reason: error.response.data.message,
            deadline: null,
            status: 'pending'
          }
        };
      }
      
      Alert.alert("Login Error", `${error.response.data?.message || 'Invalid credentials'}`);
    } else if (error.request) {
      console.log("No response received from server");
      Alert.alert("Connection Error", "Could not connect to the server. Please check your internet connection and try again.");
    } else {
      console.log("Error message:", error.message);
      Alert.alert("Login Error", error.message || "An unknown error occurred");
    }
    
    return { success: false };
  }
};

// Register new user
export const register = async (
  payload: {
    role: "customer" | "rider";
    email: string;
    password: string;
    firstName?: string;
    middleName?: string;
    lastName?: string;
    phone?: string;
    schoolId?: string;
    licenseId?: string;
    sex?: string;
    userRole?: string;
    vehicleType?: string;
    plateNumber?: string;
    photo?: string;
    schoolIdDocument?: string;
    staffFacultyIdDocument?: string;
    cor?: string;
    driverLicense?: string;
    orCr?: string;
    agreedToTerms?: boolean;
  },
  updateAccessToken: () => Promise<void>
) => {
  const { setUser } = useUserStore.getState();
  const { setUser: setRiderUser } = useRiderStore.getState();

  try {
    console.log("Attempting to register with:", payload);
    
    const res = await axios.post(`${BASE_URL}/api/auth/register`, payload);
    console.log("Register response:", res.data);
    
    if (res.data.user.role === "customer") {
      setUser(res.data.user);
    } else {
      setRiderUser(res.data.user);
    }

    await tokenStorage.set("access_token", res.data.access_token);
    await tokenStorage.set("refresh_token", res.data.refresh_token);

    // Check if the account is pending approval
    if (res.data.status === "pending") {
      Alert.alert(
        "Registration Successful",
        "Your account has been created but is pending approval. You will be redirected to the login screen.",
        [
          { 
            text: "OK", 
            onPress: async () => {
              // Clear tokens and user data
              const { clearData } = useUserStore.getState();
              const { clearRiderData } = useRiderStore.getState();
              
              await tokenStorage.clearAll();
              clearRiderData();
              clearData();
              resetAndNavigate("/role");
            }
          }
        ]
      );
      return;
    }

    if (res.data.user.role === "customer") {
      resetAndNavigate("/customer/home");
    } else {
      resetAndNavigate("/rider/home");
    }

    await updateAccessToken();
  } catch (error: any) {
    console.log("Error details:", error);
    
    if (error.response) {
      console.log("Response data:", error.response.data);
      console.log("Response status:", error.response.status);
      Alert.alert("Registration Error", `${error.response.data?.message || 'Registration failed'}`);
    } else if (error.request) {
      console.log("No response received from server");
      Alert.alert("Connection Error", "Could not connect to the server. Please check your internet connection and try again.");
    } else {
      console.log("Error message:", error.message);
      Alert.alert("Registration Error", error.message || "An unknown error occurred");
    }
  }
};

// Get user profile information
export const getUserProfile = async () => {
  try {
    const token = await tokenStorage.getString("access_token");
    const res = await axios.get(`${BASE_URL}/api/auth/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data.user;
  } catch (error: any) {
    console.log("Error fetching user profile:", error);
    if (error.response && error.response.status === 401) {
      Alert.alert("Session Expired", "Please login again to continue.");
      await tokenStorage.clearAll();
      resetAndNavigate("/role");
    } else {
      Alert.alert("Error", "Failed to fetch profile information. Please try again.");
    }
    throw error;
  }
};

// Update user profile information
export const updateUserProfile = async (profileData: {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  phone?: string;
  schoolId?: string;
  licenseId?: string;
  email?: string;
  sex?: string;
  vehicleType?: string;
  plateNumber?: string;
}) => {
  const { setUser } = useUserStore.getState();
  
  try {
    const token = await tokenStorage.getString("access_token");
    const res = await axios.put(`${BASE_URL}/api/auth/profile`, profileData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    // Update the user in the store
    setUser(res.data.user);
    
    Alert.alert("Success", "Profile updated successfully");
    return res.data.user;
  } catch (error: any) {
    console.log("Error updating user profile:", error);
    if (error.response && error.response.status === 401) {
      Alert.alert("Session Expired", "Please login again to continue.");
      await tokenStorage.clearAll();
      resetAndNavigate("/role");
    } else {
      Alert.alert(
        "Error", 
        error.response?.data?.message || "Failed to update profile information. Please try again."
      );
    }
    throw error;
  }
};

export const logout = async (disconnect?: () => void) => {
  if (disconnect) {
    disconnect();
  }
  const { clearData } = useUserStore.getState();
  const { clearRiderData } = useRiderStore.getState();

  try {
    await tokenStorage.clearAll();
    clearRiderData();
    clearData();
    resetAndNavigate("/role");
  } catch (error) {
    console.error("Logout error:", error);
    // Still try to navigate even if there was an error
    resetAndNavigate("/role");
  }
};
