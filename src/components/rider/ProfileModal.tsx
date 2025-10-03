import React, { useEffect, useState } from "react";
import { 
  View, 
  Modal, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  ScrollView,
  Dimensions,
  Alert
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RFValue } from "react-native-responsive-fontsize";
import { Colors } from "@/utils/Constants";
import CustomText from "@/components/shared/CustomText";
import CustomInput from "@/components/shared/CustomInput";
import { getUserProfile, updateUserProfile } from "@/service/authService";
import { useRiderStore } from "@/store/riderStore";

interface ProfileData {
  firstName: string;
  middleName: string;
  lastName: string;
  phone: string;
  email: string;
  licenseId: string;
  sex: string;
  vehicleType: string;
}

interface ProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ visible, onClose }) => {
  const { user } = useRiderStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: "",
    middleName: "",
    lastName: "",
    phone: "",
    email: "",
    licenseId: "",
    sex: "",
    vehicleType: "",
  });

  useEffect(() => {
    if (visible) {
      fetchUserProfile();
    }
  }, [visible]);

  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);
      const userData = await getUserProfile();
      console.log("ProfileModal - Fetched user data:", userData); // Debug log
      setProfileData({
        firstName: userData.firstName || "",
        middleName: userData.middleName || "",
        lastName: userData.lastName || "",
        phone: userData.phone || "",
        email: userData.email || "",
        licenseId: userData.licenseId || "",
        sex: userData.sex || "",
        vehicleType: userData.vehicleType || "",
      });
      
      // Update the rider store with the latest user data
      useRiderStore.getState().setUser({
        ...useRiderStore.getState().user,
        licenseId: userData.licenseId || "",
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      if (profileData.licenseId && profileData.licenseId.length < 4) {
        Alert.alert("Invalid License ID", "License ID must be at least 4 characters");
        return;
      }
      
      setIsLoading(true);
      await updateUserProfile(profileData);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    if (field === "licenseId" && value) {
      const formattedValue = value.trim().toUpperCase();
      setProfileData((prev) => ({
        ...prev,
        [field]: formattedValue,
      }));
    } else {
      setProfileData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleClose = () => {
    setIsEditing(false);
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <CustomText fontFamily="Bold" fontSize={18} style={styles.headerTitle}>
              My Profile
            </CustomText>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
            >
              <Ionicons name="close" size={RFValue(24)} color="black" />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : (
            <ScrollView style={styles.content}>
              <View style={styles.profileImageContainer}>
                <View style={styles.profileImage}>
                  <Ionicons name="person" size={RFValue(50)} color="#FFFFFF" />
                </View>
              </View>

              <View style={styles.formContainer}>
                <CustomInput
                  label="First Name"
                  value={profileData.firstName}
                  onChangeText={(text: string) => handleInputChange("firstName", text)}
                  editable={isEditing}
                  style={isEditing ? styles.inputEditable : styles.inputDisabled}
                />

                <CustomInput
                  label="Middle Name"
                  value={profileData.middleName}
                  onChangeText={(text: string) => handleInputChange("middleName", text)}
                  editable={isEditing}
                  style={isEditing ? styles.inputEditable : styles.inputDisabled}
                />

                <CustomInput
                  label="Last Name"
                  value={profileData.lastName}
                  onChangeText={(text: string) => handleInputChange("lastName", text)}
                  editable={isEditing}
                  style={isEditing ? styles.inputEditable : styles.inputDisabled}
                />

                <CustomInput
                  label="Contact Number"
                  value={profileData.phone}
                  onChangeText={(text: string) => handleInputChange("phone", text)}
                  editable={isEditing}
                  keyboardType="phone-pad"
                  style={isEditing ? styles.inputEditable : styles.inputDisabled}
                />

                <CustomInput
                  label="License ID #"
                  value={profileData.licenseId}
                  onChangeText={(text: string) => handleInputChange("licenseId", text)}
                  editable={false}
                  style={styles.inputDisabled}
                />

                <CustomInput
                  label="Email"
                  value={profileData.email}
                  onChangeText={(text: string) => handleInputChange("email", text)}
                  editable={isEditing}
                  keyboardType="email-address"
                  style={isEditing ? styles.inputEditable : styles.inputDisabled}
                />

                <View style={styles.inputContainer}>
                  <CustomText fontFamily="Medium">Sex</CustomText>
                  {isEditing ? (
                    <View style={styles.radioContainer}>
                      <TouchableOpacity 
                        style={[styles.radioButton, profileData.sex === "male" && styles.radioButtonSelected]} 
                        onPress={() => handleInputChange("sex", "male")}
                      >
                        <View style={[styles.radioCircle, profileData.sex === "male" && styles.radioCircleSelected]} />
                        <CustomText fontFamily="Regular">Male</CustomText>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.radioButton, profileData.sex === "female" && styles.radioButtonSelected]} 
                        onPress={() => handleInputChange("sex", "female")}
                      >
                        <View style={[styles.radioCircle, profileData.sex === "female" && styles.radioCircleSelected]} />
                        <CustomText fontFamily="Regular">Female</CustomText>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={[styles.input, styles.inputDisabled, { justifyContent: 'center' }]}>
                      <CustomText fontFamily="Regular">{profileData.sex || 'Not specified'}</CustomText>
                    </View>
                  )}
                </View>

                <View style={styles.inputContainer}>
                  <CustomText fontFamily="Medium">Vehicle Type</CustomText>
                  {isEditing ? (
                    <View style={styles.vehicleTypeContainer}>
                      <TouchableOpacity 
                        style={[styles.vehicleButton, profileData.vehicleType === "Single Motorcycle" && styles.vehicleButtonSelected]} 
                        onPress={() => handleInputChange("vehicleType", "Single Motorcycle")}
                      >
                        <CustomText fontFamily="Regular" style={[styles.vehicleButtonText, profileData.vehicleType === "Single Motorcycle" && styles.vehicleButtonTextSelected]}>🏍️ Motorcycle</CustomText>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.vehicleButton, profileData.vehicleType === "Tricycle" && styles.vehicleButtonSelected]} 
                        onPress={() => handleInputChange("vehicleType", "Tricycle")}
                      >
                        <CustomText fontFamily="Regular" style={[styles.vehicleButtonText, profileData.vehicleType === "Tricycle" && styles.vehicleButtonTextSelected]}>🛺 Tricycle</CustomText>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.vehicleButton, profileData.vehicleType === "Cab" && styles.vehicleButtonSelected]} 
                        onPress={() => handleInputChange("vehicleType", "Cab")}
                      >
                        <CustomText fontFamily="Regular" style={[styles.vehicleButtonText, profileData.vehicleType === "Cab" && styles.vehicleButtonTextSelected]}>🚗 Four Wheel</CustomText>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={[styles.input, styles.inputDisabled, { justifyContent: 'center' }]}>
                      <CustomText fontFamily="Regular">{profileData.vehicleType || 'Not specified'}</CustomText>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.buttonContainer}>
                {isEditing ? (
                  <>
                    <TouchableOpacity
                      style={[styles.button, styles.saveButton]}
                      onPress={handleUpdateProfile}
                    >
                      <CustomText fontFamily="Medium" fontSize={14} style={styles.buttonText}>
                        Save
                      </CustomText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.button, styles.cancelButton]}
                      onPress={() => {
                        setIsEditing(false);
                        fetchUserProfile(); // Reset to original data
                      }}
                    >
                      <CustomText fontFamily="Medium" fontSize={14} style={styles.cancelButtonText}>
                        Cancel
                      </CustomText>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity
                    style={[styles.button, styles.editButton]}
                    onPress={() => setIsEditing(true)}
                  >
                    <CustomText fontFamily="Medium" fontSize={14} style={styles.buttonText}>
                      Edit
                    </CustomText>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.9,
    height: height * 0.8,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    padding: 4,
  },
  headerTitle: {
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  profileImageContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  formContainer: {
    marginBottom: 20,
  },
  inputEditable: {
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  inputDisabled: {
    backgroundColor: "#F5F5F5",
    opacity: 0.8,
  },
  inputContainer: {
    marginVertical: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 5,
    padding: 10,
    marginTop: 5,
    fontSize: 16,
  },
  radioContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioButtonSelected: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.primary,
    marginRight: 10,
  },
  radioCircleSelected: {
    backgroundColor: Colors.primary,
  },
  buttonContainer: {
    marginVertical: 20,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  editButton: {
    backgroundColor: Colors.primary,
  },
  saveButton: {
    backgroundColor: Colors.primary,
  },
  cancelButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CCCCCC",
  },
  buttonText: {
    color: "#FFFFFF",
  },
  cancelButtonText: {
    color: "#666666",
  },
  vehicleTypeContainer: {
    flexDirection: 'column',
    gap: 10,
    marginVertical: 10,
  },
  vehicleButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  vehicleButtonSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  vehicleButtonText: {
    color: '#666',
    fontSize: 14,
  },
  vehicleButtonTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default ProfileModal;
