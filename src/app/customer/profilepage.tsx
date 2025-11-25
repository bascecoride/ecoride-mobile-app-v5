import React, { useEffect, useState } from "react";
import { View, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Image, Modal, Dimensions } from "react-native";
import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { RFValue } from "react-native-responsive-fontsize";
import { Colors } from "@/utils/Constants";
import CustomText from "@/components/shared/CustomText";
import CustomInput from "@/components/shared/CustomInput";
import { getUserProfile, updateUserProfile } from "@/service/authService";
import { useUserStore } from "@/store/userStore";

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ProfileData {
  firstName: string;
  middleName: string;
  lastName: string;
  phone: string;
  email: string;
  schoolId: string;
  licenseId: string;
  sex: string;
  role: string;
  userRole: string;
  vehicleType: string;
  status: string;
  disapprovalReason: string;
  penaltyComment: string;
  penaltyLiftDate: string;
  photo: string;
  schoolIdDocument: string;
  staffFacultyIdDocument: string;
  cor: string;
  driverLicense: string;
}

const CustomerProfilePage = () => {
  const { user } = useUserStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: "",
    middleName: "",
    lastName: "",
    phone: "",
    email: "",
    schoolId: "",
    licenseId: "",
    sex: "",
    role: "",
    userRole: "",
    vehicleType: "",
    status: "",
    disapprovalReason: "",
    penaltyComment: "",
    penaltyLiftDate: "",
    photo: "",
    schoolIdDocument: "",
    staffFacultyIdDocument: "",
    cor: "",
    driverLicense: "",
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);
      const userData = await getUserProfile();
      console.log("Profile data received:", userData);
      setProfileData({
        firstName: userData.firstName || "",
        middleName: userData.middleName || "",
        lastName: userData.lastName || "",
        phone: userData.phone || "",
        email: userData.email || "",
        schoolId: userData.schoolId || "",
        licenseId: userData.licenseId || "",
        sex: userData.sex || "",
        role: userData.role || "",
        userRole: userData.userRole || "",
        vehicleType: userData.vehicleType || "",
        status: userData.status || "",
        disapprovalReason: userData.disapprovalReason || "",
        penaltyComment: userData.penaltyComment || "",
        penaltyLiftDate: userData.penaltyLiftDate ? new Date(userData.penaltyLiftDate).toLocaleDateString() : "",
        photo: userData.photo || "",
        schoolIdDocument: userData.schoolIdDocument || "",
        staffFacultyIdDocument: userData.staffFacultyIdDocument || "",
        cor: userData.cor || "",
        driverLicense: userData.driverLicense || "",
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setIsLoading(true);
      await updateUserProfile(profileData);
      setIsEditing(false);
      Alert.alert("Success", "Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return '#4CAF50';
      case 'disapproved':
        return '#F44336';
      case 'pending':
        return '#FF9800';
      default:
        return '#9E9E9E';
    }
  };

  const openImageViewer = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setImageViewerVisible(true);
  };

  const closeImageViewer = () => {
    setImageViewerVisible(false);
    setSelectedImage("");
  };

  const renderDocumentItem = (title: string, imageUrl: string) => {
    if (!imageUrl) return null;
    
    return (
      <TouchableOpacity 
        style={styles.documentItem}
        onPress={() => openImageViewer(imageUrl)}
      >
        <View style={styles.documentImageContainer}>
          <Image source={{ uri: imageUrl }} style={styles.documentImage} />
          <View style={styles.documentOverlay}>
            <Ionicons name="eye" size={RFValue(16)} color="#FFFFFF" />
          </View>
        </View>
        <CustomText fontFamily="Medium" fontSize={12} style={styles.documentTitle}>
          {title}
        </CustomText>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={RFValue(24)} color="black" />
        </TouchableOpacity>
        <CustomText fontFamily="Bold" fontSize={18} style={styles.headerTitle}>
          My Profile
        </CustomText>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ScrollView style={styles.content}>
          {/* Profile Photo Section */}
          <View style={styles.profileImageContainer}>
            {profileData.photo ? (
              <TouchableOpacity onPress={() => openImageViewer(profileData.photo)}>
                <Image source={{ uri: profileData.photo }} style={styles.profileImage} />
              </TouchableOpacity>
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Ionicons name="person" size={RFValue(50)} color="#FFFFFF" />
              </View>
            )}
          </View>

          {/* Account Status Section */}
          {profileData.status && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="shield-checkmark" size={RFValue(20)} color={Colors.primary} />
                <CustomText fontFamily="Bold" fontSize={16} style={styles.sectionTitle}>
                  Account Status
                </CustomText>
              </View>
              <View style={styles.sectionContent}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(profileData.status) }]}>
                  <CustomText fontFamily="Medium" fontSize={12} style={styles.statusText}>
                    {profileData.status.toUpperCase()}
                  </CustomText>
                </View>
                {profileData.status?.toLowerCase() === 'disapproved' && profileData.disapprovalReason && (
                  <View style={styles.infoItem}>
                    <CustomText fontFamily="Medium" fontSize={12} style={styles.infoLabel}>
                      Reason:
                    </CustomText>
                    <CustomText fontFamily="Regular" fontSize={12} style={styles.infoValue}>
                      {profileData.disapprovalReason}
                    </CustomText>
                  </View>
                )}
                {profileData.penaltyComment && (
                  <View style={styles.infoItem}>
                    <CustomText fontFamily="Medium" fontSize={12} style={styles.infoLabel}>
                      Penalty:
                    </CustomText>
                    <CustomText fontFamily="Regular" fontSize={12} style={styles.infoValue}>
                      {profileData.penaltyComment}
                    </CustomText>
                  </View>
                )}
                {profileData.penaltyLiftDate && (
                  <View style={styles.infoItem}>
                    <CustomText fontFamily="Medium" fontSize={12} style={styles.infoLabel}>
                      Penalty Lift Date:
                    </CustomText>
                    <CustomText fontFamily="Regular" fontSize={12} style={styles.infoValue}>
                      {profileData.penaltyLiftDate}
                    </CustomText>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Personal Information Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person-circle" size={RFValue(20)} color={Colors.primary} />
              <CustomText fontFamily="Bold" fontSize={16} style={styles.sectionTitle}>
                Personal Information
              </CustomText>
            </View>
            <View style={styles.sectionContent}>
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
            </View>
          </View>

          {/* Contact Information Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="call" size={RFValue(20)} color={Colors.primary} />
              <CustomText fontFamily="Bold" fontSize={16} style={styles.sectionTitle}>
                Contact Information
              </CustomText>
            </View>
            <View style={styles.sectionContent}>
              <CustomInput
                label="Contact Number"
                value={profileData.phone}
                onChangeText={(text: string) => handleInputChange("phone", text)}
                editable={isEditing}
                keyboardType="phone-pad"
                style={isEditing ? styles.inputEditable : styles.inputDisabled}
              />

              <CustomInput
                label="Email"
                value={profileData.email}
                onChangeText={(text: string) => handleInputChange("email", text)}
                editable={isEditing}
                keyboardType="email-address"
                style={isEditing ? styles.inputEditable : styles.inputDisabled}
              />
            </View>
          </View>

          {/* Academic Information Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="school" size={RFValue(20)} color={Colors.primary} />
              <CustomText fontFamily="Bold" fontSize={16} style={styles.sectionTitle}>
                Academic Information
              </CustomText>
            </View>
            <View style={styles.sectionContent}>
              <CustomInput
                label="School ID #"
                value={profileData.schoolId}
                onChangeText={(text: string) => handleInputChange("schoolId", text)}
                editable={false}
                style={styles.inputDisabled}
              />

              {profileData.role && (
                <View style={styles.infoItem}>
                  <CustomText fontFamily="Medium" fontSize={12} style={styles.infoLabel}>
                    Role:
                  </CustomText>
                  <CustomText fontFamily="Regular" fontSize={12} style={styles.infoValue}>
                    {profileData.role}
                  </CustomText>
                </View>
              )}

              {profileData.userRole && (
                <View style={styles.infoItem}>
                  <CustomText fontFamily="Medium" fontSize={12} style={styles.infoLabel}>
                    User Type:
                  </CustomText>
                  <CustomText fontFamily="Regular" fontSize={12} style={styles.infoValue}>
                    {profileData.userRole}
                  </CustomText>
                </View>
              )}
            </View>
          </View>

          {/* Vehicle Information Section (for riders) */}
          {profileData.userRole === 'rider' && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="car" size={RFValue(20)} color={Colors.primary} />
                <CustomText fontFamily="Bold" fontSize={16} style={styles.sectionTitle}>
                  Vehicle Information
                </CustomText>
              </View>
              <View style={styles.sectionContent}>
                {profileData.vehicleType && (
                  <View style={styles.infoItem}>
                    <CustomText fontFamily="Medium" fontSize={12} style={styles.infoLabel}>
                      Vehicle Type:
                    </CustomText>
                    <CustomText fontFamily="Regular" fontSize={12} style={styles.infoValue}>
                      {profileData.vehicleType}
                    </CustomText>
                  </View>
                )}

                {profileData.licenseId && (
                  <View style={styles.infoItem}>
                    <CustomText fontFamily="Medium" fontSize={12} style={styles.infoLabel}>
                      License ID:
                    </CustomText>
                    <CustomText fontFamily="Regular" fontSize={12} style={styles.infoValue}>
                      {profileData.licenseId}
                    </CustomText>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Uploaded Documents Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text" size={RFValue(20)} color={Colors.primary} />
              <CustomText fontFamily="Bold" fontSize={16} style={styles.sectionTitle}>
                Uploaded Documents
              </CustomText>
            </View>
            <View style={styles.sectionContent}>
              <View style={styles.documentsGrid}>
                {renderDocumentItem("School ID", profileData.schoolIdDocument)}
                {renderDocumentItem("Driver's License", profileData.driverLicense)}
                {renderDocumentItem("Staff/Faculty ID", profileData.staffFacultyIdDocument)}
                {renderDocumentItem("Certificate of Registration", profileData.cor)}
              </View>
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
                  onPress={() => setIsEditing(false)}
                >
                  <CustomText fontFamily="Medium" fontSize={14} style={styles.buttonText}>
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
                  Edit Profile
                </CustomText>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      )}

      {/* Full-Screen Image Viewer Modal */}
      <Modal
        visible={imageViewerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeImageViewer}
      >
        <View style={styles.imageViewerContainer}>
          <TouchableOpacity 
            style={styles.imageViewerCloseButton}
            onPress={closeImageViewer}
          >
            <Ionicons name="close" size={RFValue(30)} color="#FFFFFF" />
          </TouchableOpacity>
          
          {selectedImage && (
            <Image 
              source={{ uri: selectedImage }} 
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
          )}
          
          <TouchableOpacity 
            style={styles.imageViewerBackground}
            onPress={closeImageViewer}
            activeOpacity={1}
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 10,
    backgroundColor: "#FFFFFF",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    marginRight: 40,
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
    marginBottom: 20,
  },
  profileImage: {
    width: RFValue(100),
    height: RFValue(100),
    borderRadius: RFValue(50),
    resizeMode: 'cover',
  },
  profileImagePlaceholder: {
    width: RFValue(100),
    height: RFValue(100),
    borderRadius: RFValue(50),
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  formContainer: {
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginTop: 5,
  },
  inputDisabled: {
    backgroundColor: "#F5F5F5",
    borderColor: "#E0E0E0",
  },
  inputEditable: {
    backgroundColor: "#FFFFFF",
    borderColor: Colors.primary,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  button: {
    flex: 1,
    height: 40,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 5,
  },
  editButton: {
    backgroundColor: Colors.primary,
  },
  saveButton: {
    backgroundColor: Colors.primary,
  },
  cancelButton: {
    backgroundColor: "#E0E0E0",
  },
  buttonText: {
    color: "#000000",
  },
  radioContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  radioButtonSelected: {
    opacity: 1,
  },
  radioCircle: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: {
    backgroundColor: Colors.primary,
  },
  // New styles for enhanced UI
  section: {
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    marginLeft: 8,
    color: '#333',
  },
  sectionContent: {
    paddingLeft: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  statusText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoLabel: {
    color: '#666',
    flex: 1,
  },
  infoValue: {
    color: '#333',
    flex: 2,
    textAlign: 'right',
  },
  documentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  documentItem: {
    width: '48%',
    marginBottom: 16,
    alignItems: 'center',
  },
  documentImageContainer: {
    position: 'relative',
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
  },
  documentImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  documentOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  documentTitle: {
    textAlign: 'center',
    color: '#666',
  },
  // Image Viewer Modal Styles
  imageViewerContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1000,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: screenWidth,
    height: screenHeight,
    zIndex: 999,
  },
  imageViewerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 998,
  },
});

export default CustomerProfilePage;
