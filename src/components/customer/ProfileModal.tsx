import React, { useEffect, useState } from "react";
import { 
  View, 
  Modal, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  ScrollView,
  Dimensions,
  Image,
  Alert
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RFValue } from "react-native-responsive-fontsize";
import { Colors } from "@/utils/Constants";
import CustomText from "@/components/shared/CustomText";
import CustomInput from "@/components/shared/CustomInput";
import { getUserProfile, updateUserProfile } from "@/service/authService";
import { useUserStore } from "@/store/userStore";

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
  // Image URLs
  photo: string;
  schoolIdDocument: string;
  staffFacultyIdDocument: string;
  cor: string;
  driverLicense: string;
}

interface ProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ visible, onClose }) => {
  const { user } = useUserStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
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
    if (visible) {
      fetchUserProfile();
    }
  }, [visible]);

  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);
      const userData = await getUserProfile();
      console.log("Profile data received:", userData); // Debug log
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
    } catch (error) {
      console.error("Error updating profile:", error);
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

  const handleClose = () => {
    setIsEditing(false);
    onClose();
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return '#4CAF50';
      case 'disapproved':
        return '#F44336';
      case 'pending':
      default:
        return '#FF9800';
    }
  };

  const renderDocumentItem = (title: string, imageUrl: string, iconName: string) => {
    return (
      <View style={styles.documentItem} key={title}>
        <View style={styles.documentHeader}>
          <Ionicons name={iconName as any} size={RFValue(18)} color={Colors.primary} />
          <CustomText fontFamily="Medium" fontSize={14} style={styles.documentTitle}>
            {title}
          </CustomText>
        </View>
        {imageUrl ? (
          <TouchableOpacity 
            style={styles.documentImageContainer}
            onPress={() => Alert.alert("Document", `View ${title}`, [
              { text: "OK", style: "default" }
            ])}
          >
            <Image source={{ uri: imageUrl }} style={styles.documentImage} />
            <View style={styles.documentOverlay}>
              <Ionicons name="eye-outline" size={RFValue(20)} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.documentPlaceholder}>
            <Ionicons name="document-outline" size={RFValue(24)} color="#CCCCCC" />
            <CustomText fontFamily="Regular" fontSize={12} style={styles.documentPlaceholderText}>
              No document uploaded
            </CustomText>
          </View>
        )}
      </View>
    );
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
            <>
              <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Profile Photo Section */}
                <View style={styles.profileSection}>
                  <View style={styles.profileImageContainer}>
                    {profileData.photo ? (
                      <Image source={{ uri: profileData.photo }} style={styles.profileImage} />
                    ) : (
                      <View style={styles.profileImagePlaceholder}>
                        <Ionicons name="person" size={RFValue(50)} color="#FFFFFF" />
                      </View>
                    )}
                  </View>
                  <CustomText fontFamily="Bold" fontSize={20} style={styles.profileName}>
                    {`${profileData.firstName} ${profileData.lastName}`.trim() || 'User'}
                  </CustomText>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(profileData.status) }]}>
                    <CustomText fontFamily="Medium" fontSize={12} style={styles.statusText}>
                      {profileData.status?.toUpperCase() || 'PENDING'}
                    </CustomText>
                  </View>
                </View>

                {/* Personal Information Section */}
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="person-outline" size={RFValue(20)} color={Colors.primary} />
                    <CustomText fontFamily="Bold" fontSize={16} style={styles.sectionTitle}>
                      Personal Information
                    </CustomText>
                  </View>
                  
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
                    <CustomText fontFamily="Medium" style={styles.inputLabel}>Sex</CustomText>
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
                      <View style={[styles.input, styles.inputDisabled]}>
                        <CustomText fontFamily="Regular">{profileData.sex || 'Not specified'}</CustomText>
                      </View>
                    )}
                  </View>
                </View>

                {/* Contact Information Section */}
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="call-outline" size={RFValue(20)} color={Colors.primary} />
                    <CustomText fontFamily="Bold" fontSize={16} style={styles.sectionTitle}>
                      Contact Information
                    </CustomText>
                  </View>

                  <CustomInput
                    label="Email Address"
                    value={profileData.email}
                    onChangeText={(text: string) => handleInputChange("email", text)}
                    editable={isEditing}
                    keyboardType="email-address"
                    style={isEditing ? styles.inputEditable : styles.inputDisabled}
                  />

                  <CustomInput
                    label="Phone Number"
                    value={profileData.phone}
                    onChangeText={(text: string) => handleInputChange("phone", text)}
                    editable={isEditing}
                    keyboardType="phone-pad"
                    style={isEditing ? styles.inputEditable : styles.inputDisabled}
                  />
                </View>

                {/* Academic Information Section */}
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="school-outline" size={RFValue(20)} color={Colors.primary} />
                    <CustomText fontFamily="Bold" fontSize={16} style={styles.sectionTitle}>
                      Academic Information
                    </CustomText>
                  </View>

                  <CustomInput
                    label="School ID Number"
                    value={profileData.schoolId}
                    onChangeText={(text: string) => handleInputChange("schoolId", text)}
                    editable={isEditing}
                    style={isEditing ? styles.inputEditable : styles.inputDisabled}
                  />

                  <View style={styles.inputContainer}>
                    <CustomText fontFamily="Medium" style={styles.inputLabel}>User Role</CustomText>
                    <View style={[styles.input, styles.inputDisabled]}>
                      <CustomText fontFamily="Regular">{profileData.userRole || 'Not specified'}</CustomText>
                    </View>
                  </View>

                  <View style={styles.inputContainer}>
                    <CustomText fontFamily="Medium" style={styles.inputLabel}>Account Role</CustomText>
                    <View style={[styles.input, styles.inputDisabled]}>
                      <CustomText fontFamily="Regular">{profileData.role || 'Not specified'}</CustomText>
                    </View>
                  </View>
                </View>

                {/* Vehicle Information Section (for riders) */}
                {profileData.role === 'rider' && (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Ionicons name="car-outline" size={RFValue(20)} color={Colors.primary} />
                      <CustomText fontFamily="Bold" fontSize={16} style={styles.sectionTitle}>
                        Vehicle Information
                      </CustomText>
                    </View>

                    <CustomInput
                      label="License ID"
                      value={profileData.licenseId}
                      onChangeText={(text: string) => handleInputChange("licenseId", text)}
                      editable={isEditing}
                      style={isEditing ? styles.inputEditable : styles.inputDisabled}
                    />

                    <View style={styles.inputContainer}>
                      <CustomText fontFamily="Medium" style={styles.inputLabel}>Vehicle Type</CustomText>
                      <View style={[styles.input, styles.inputDisabled]}>
                        <CustomText fontFamily="Regular">{profileData.vehicleType || 'Not specified'}</CustomText>
                      </View>
                    </View>
                  </View>
                )}

                {/* Documents Section */}
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="document-outline" size={RFValue(20)} color={Colors.primary} />
                    <CustomText fontFamily="Bold" fontSize={16} style={styles.sectionTitle}>
                      Uploaded Documents
                    </CustomText>
                  </View>

                  {renderDocumentItem("School ID", profileData.schoolIdDocument, "school-outline")}
                  {profileData.role === 'rider' && renderDocumentItem("Driver's License", profileData.driverLicense, "car-outline")}
                  {profileData.userRole !== 'Student' && renderDocumentItem("Staff/Faculty ID", profileData.staffFacultyIdDocument, "id-card-outline")}
                  {profileData.role === 'rider' && renderDocumentItem("Certificate of Registration", profileData.cor, "document-text-outline")}
                </View>

                {/* Account Status Section - Only show when disapproved */}
                {profileData.status?.toLowerCase() === 'disapproved' && (profileData.disapprovalReason || profileData.penaltyComment) && (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Ionicons name="information-circle-outline" size={RFValue(20)} color={Colors.primary} />
                      <CustomText fontFamily="Bold" fontSize={16} style={styles.sectionTitle}>
                        Account Status
                      </CustomText>
                    </View>

                    {profileData.disapprovalReason && (
                      <View style={styles.statusContainer}>
                        <CustomText fontFamily="Medium" style={styles.statusLabel}>Disapproval Reason:</CustomText>
                        <CustomText fontFamily="Regular" style={styles.statusMessage}>
                          {profileData.disapprovalReason}
                        </CustomText>
                      </View>
                    )}

                    {profileData.penaltyComment && (
                      <View style={styles.statusContainer}>
                        <CustomText fontFamily="Medium" style={styles.statusLabel}>Penalty Comment:</CustomText>
                        <CustomText fontFamily="Regular" style={styles.statusMessage}>
                          {profileData.penaltyComment}
                        </CustomText>
                        {profileData.penaltyLiftDate && (
                          <CustomText fontFamily="Regular" style={styles.statusDate}>
                            Penalty Lift Date: {profileData.penaltyLiftDate}
                          </CustomText>
                        )}
                      </View>
                    )}
                  </View>
                )}
              </ScrollView>

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
            </>
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
    resizeMode: 'cover',
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
  inputContainer: {
    marginBottom: 15,
  },
  radioContainer: {
    flexDirection: 'row',
    marginTop: 5,
    justifyContent: 'flex-start',
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
    paddingVertical: 8,
  },
  radioButtonSelected: {
    opacity: 1,
  },
  radioCircle: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.primary,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: {
    backgroundColor: Colors.primary,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 5,
    padding: 10,
    marginTop: 5,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    marginBottom: 20,
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileName: {
    marginTop: 10,
    textAlign: 'center',
    color: '#333333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  statusText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    marginLeft: 8,
    color: '#333333',
  },
  inputLabel: {
    marginBottom: 5,
    color: '#333333',
  },
  documentItem: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  documentTitle: {
    marginLeft: 8,
    color: '#333333',
  },
  documentImageContainer: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  documentImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
  },
  documentOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  documentPlaceholder: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F3F4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  documentPlaceholderText: {
    marginTop: 4,
    color: '#666666',
    textAlign: 'center',
  },
  statusContainer: {
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  statusLabel: {
    color: '#856404',
    marginBottom: 4,
  },
  statusMessage: {
    color: '#856404',
    lineHeight: 20,
  },
  statusDate: {
    color: '#856404',
    marginTop: 4,
    fontSize: 12,
  },
});

export default ProfileModal;
