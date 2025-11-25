import {
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StyleSheet,
  Image,
  Text,
} from "react-native";
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import React, { useState } from "react";
import { authStyles } from "@/styles/authStyles";
import { commonStyles } from "@/styles/commonStyles";
import { MaterialIcons } from '@expo/vector-icons';
import CustomText from "@/components/shared/CustomText";
import { useWS } from "@/service/WSProvider";
import CustomButton from "@/components/shared/CustomButton";
import { login, register } from "@/service/authService";
import { BASE_URL } from "@/service/config";
import { Link, router } from "expo-router";
import RejectionReasonModal from "@/components/shared/RejectionReasonModal";
import TermsModal from "@/components/shared/TermsModal";
import PenaltyModal from "@/components/shared/PenaltyModal";

export default function Auth() {
  const { updateAccessToken } = useWS();
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState(1); // 1: Email, 2: Code, 3: New Password
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [sex, setSex] = useState("");
  const [userRole, setUserRole] = useState("");
  const [photo, setPhoto] = useState<any>(null);
  const [schoolIdDocument, setSchoolIdDocument] = useState<any>(null);
  const [staffFacultyIdDocument, setStaffFacultyIdDocument] = useState<any>(null);
  const [cor, setCor] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionDeadline, setRejectionDeadline] = useState<string | null>(null);
  const [rejectionStatus, setRejectionStatus] = useState<'pending' | 'disapproved'>('disapproved');
  const [showPenaltyModal, setShowPenaltyModal] = useState(false);
  const [penaltyComment, setPenaltyComment] = useState("");
  const [penaltyLiftDate, setPenaltyLiftDate] = useState<string | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Please enter both email and password");
      return;
    }
    
    setLoading(true);
    try {
      const result = await login({ 
        role: "customer", 
        email, 
        password 
      }, updateAccessToken);
      
      // Check if user has active penalty (disapproved with penalty)
      if (!result.success && result.penaltyInfo) {
        // Show both disapproval reason and penalty comment
        const fullMessage = `Disapproval Reason: ${result.penaltyInfo.disapprovalReason}\n\nPenalty: ${result.penaltyInfo.penaltyComment}`;
        setPenaltyComment(fullMessage);
        setPenaltyLiftDate(result.penaltyInfo.liftDate);
        setShowPenaltyModal(true);
        return;
      }
      
      // Check if login was rejected (disapproved without penalty or pending)
      if (!result.success && result.rejectionInfo) {
        setRejectionReason(result.rejectionInfo.reason);
        setRejectionDeadline(result.rejectionInfo.deadline);
        setRejectionStatus((result.rejectionInfo.status as 'pending' | 'disapproved') || 'disapproved');
        setShowRejectionModal(true);
      }
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Document picker functions
  const pickImage = async (setImageFunction: (image: any) => void) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions to upload images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImageFunction(result.assets[0]);
    }
  };

  const pickDocument = async (setDocumentFunction: (doc: any) => void) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        setDocumentFunction(result.assets[0]);
      }
    } catch (error) {
      console.error('Document picker error:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const validateDocuments = () => {
    if (!userRole) {
      Alert.alert('Error', 'Please select your role (Student, Faculty, or Staff)');
      return false;
    }

    if (!photo) {
      Alert.alert('Error', 'Please upload your photo');
      return false;
    }

    if (userRole === 'Student') {
      if (!schoolIdDocument) {
        Alert.alert('Error', 'Please upload your School ID');
        return false;
      }
      if (!cor) {
        Alert.alert('Error', 'Please upload your COR (Certificate of Registration)');
        return false;
      }
    } else if (userRole === 'Faculty' || userRole === 'Staff') {
      if (!staffFacultyIdDocument) {
        Alert.alert('Error', 'Please upload your Staff/Faculty ID');
        return false;
      }
    }

    return true;
  };

  const uploadDocuments = async () => {
    try {
      console.log('Starting document upload process...');
      const formData = new FormData();
      formData.append('userRole', userRole);
      formData.append('role', 'customer');

      // Add photo
      if (photo) {
        console.log('Adding photo to upload:', photo.fileName || 'photo.jpg');
        formData.append('photo', {
          uri: photo.uri,
          type: photo.mimeType || 'image/jpeg',
          name: photo.fileName || 'photo.jpg',
        } as any);
      }

      // Add documents based on role
      if (userRole === 'Student') {
        if (schoolIdDocument) {
          console.log('Adding school ID document to upload');
          formData.append('schoolIdDocument', {
            uri: schoolIdDocument.uri,
            type: schoolIdDocument.mimeType || 'image/jpeg',
            name: schoolIdDocument.name || 'school_id.jpg',
          } as any);
        }
        if (cor) {
          console.log('Adding COR document to upload');
          formData.append('cor', {
            uri: cor.uri,
            type: cor.mimeType || 'image/jpeg',
            name: cor.name || 'cor.jpg',
          } as any);
        }
      } else if (userRole === 'Faculty' || userRole === 'Staff') {
        if (staffFacultyIdDocument) {
          console.log('Adding staff/faculty ID document to upload');
          formData.append('staffFacultyIdDocument', {
            uri: staffFacultyIdDocument.uri,
            type: staffFacultyIdDocument.mimeType || 'image/jpeg',
            name: staffFacultyIdDocument.name || 'staff_id.jpg',
          } as any);
        }
      }

      console.log('Sending document upload request to server...');
      const response = await fetch(`${BASE_URL}/api/auth/upload-documents`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
        },
        body: formData,
      });

      console.log('Document upload response status:', response.status);
      
      // Handle non-JSON responses
      let result;
      try {
        result = await response.json();
      } catch (jsonError) {
        console.error('Error parsing response as JSON:', jsonError);
        throw new Error('Server response was not valid JSON. Check server logs.');
      }
      
      console.log('Document upload response:', result);
      
      if (response.ok) {
        console.log('Document upload successful:', result.documents);
        return result.documents;
      } else {
        console.error('Document upload failed with server error:', result);
        throw new Error(result.message || 'Failed to upload documents');
      }
    } catch (error) {
      console.error('Document upload error:', error);
      
      // Provide more helpful error message
      if (error instanceof TypeError && error.message.includes('Network request failed')) {
        Alert.alert(
          'Network Error', 
          'Could not connect to the server. Please check your internet connection and try again.'
        );
        throw new Error('Network connection error. Please check your internet connection.');
      }
      
      throw error;
    }
  };

  const handleRegister = async () => {
    if (!email || !password) {
      Alert.alert("Please enter both email and password");
      return;
    }

    if (password !== registerConfirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      Alert.alert(
        'Invalid Password',
        'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character ($@!+)'
      );
      return;
    }

    if (!validateDocuments()) {
      return;
    }

    if (!agreedToTerms) {
      Alert.alert('Terms Required', 'You must agree to the Terms and Conditions to register');
      return;
    }
    
    setLoading(true);
    try {
      // First upload documents
      const documentUrls = await uploadDocuments();

      // Then register user with document URLs
      await register({
        role: "customer",
        email,
        password,
        firstName,
        middleName,
        lastName,
        phone: contactNumber,
        schoolId,
        sex,
        userRole,
        photo: documentUrls.photo,
        schoolIdDocument: documentUrls.schoolIdDocument,
        staffFacultyIdDocument: documentUrls.staffFacultyIdDocument,
        cor: documentUrls.cor,
        agreedToTerms: true
      }, updateAccessToken);
    } catch (error: any) {
      console.error("Registration error:", error);
      Alert.alert('Registration Error', error.message || 'Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Password validation function
  const validatePassword = (password: string) => {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[$@!+]/.test(password);
    
    return {
      isValid: minLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar,
      minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumber,
      hasSpecialChar
    };
  };

  // Send verification code to email
  const handleSendCode = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      console.log('Sending forgot password request to:', `${BASE_URL}/api/auth/forgot-password`);
      const response = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          role: 'customer'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          'Success',
          'Verification code sent to your email address. Please check your inbox.',
          [{ text: 'OK', onPress: () => setForgotPasswordStep(2) }]
        );
      } else {
        Alert.alert('Error', data.message || 'Failed to send verification code');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      Alert.alert('Error', 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  // Verify code before proceeding to reset password step
  const handleVerifyCode = async () => {
    if (!verificationCode) {
      Alert.alert('Error', 'Please enter the verification code');
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('Verifying code with server:', `${BASE_URL}/api/auth/verify-code`);
      const response = await fetch(`${BASE_URL}/api/auth/verify-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          role: 'customer',
          verificationCode
        }),
      });
      
      if (response.ok) {
        // If the code is valid, proceed to step 3
        setForgotPasswordStep(3);
      } else {
        const data = await response.json();
        Alert.alert('Error', data.message || 'Invalid verification code');
      }
    } catch (error: any) {
      console.error('Verification code error:', error);
      Alert.alert('Error', `Failed to verify code: ${error.toString()}`);
    } finally {
      setLoading(false);
    }
  };

  // Reset password with verification code
  const handleResetPassword = async () => {
    if (!verificationCode) {
      Alert.alert('Error', 'Please enter the verification code');
      return;
    }

    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      Alert.alert(
        'Invalid Password',
        'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      );
      return;
    }

    setLoading(true);

    try {
      console.log('Sending reset password request to:', `${BASE_URL}/api/auth/reset-password`);
      const response = await fetch(`${BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          role: 'customer',
          verificationCode,
          newPassword,
          confirmPassword
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          'Success',
          'Password reset successful! You can now login with your new password.',
          [{ 
            text: 'OK', 
            onPress: () => {
              setIsForgotPassword(false);
              setForgotPasswordStep(1);
              setVerificationCode('');
              setNewPassword('');
              setConfirmPassword('');
            }
          }]
        );
      } else {
        Alert.alert('Error', data.message || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      Alert.alert('Error', 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const renderLoginForm = () => (
    <>
      <CustomText fontFamily="Medium" variant="h6">
        WELCOME PASSENGER!
      </CustomText>

      <CustomText
        variant="h7"
        fontFamily="Regular"
        style={commonStyles.lightText}
      >
        Enter your account details to continue
      </CustomText>

      <View style={styles.inputContainer}>
        <CustomText fontFamily="Medium">Email</CustomText>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputContainer}>
        <CustomText fontFamily="Medium">Password</CustomText>
        <View style={styles.passwordContainer}>
          <TextInput
            style={[styles.input, styles.passwordInput]}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowPassword(!showPassword)}
          >
            <MaterialIcons
              name={showPassword ? "visibility" : "visibility-off"}
              size={20}
              color="#666"
            />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.forgotPasswordContainer}
        onPress={() => setIsForgotPassword(true)}
      >
        <CustomText
          fontFamily="Medium"
          variant="h8"
          style={styles.forgotPasswordLink}
        >
          Forgot Password?
        </CustomText>
      </TouchableOpacity>
    </>
  );

  const renderRegisterForm = () => (
    <>
      <CustomText fontFamily="Medium" variant="h6">
        WELCOME PASSENGER!
      </CustomText>

      <CustomText
        variant="h7"
        fontFamily="Regular"
        style={commonStyles.lightText}
      >
        Enter your information to register
      </CustomText>

      <View style={styles.inputContainer}>
        <CustomText fontFamily="Medium">First Name</CustomText>
        <TextInput
          style={styles.input}
          value={firstName}
          onChangeText={setFirstName}
        />
      </View>

      <View style={styles.inputContainer}>
        <CustomText fontFamily="Medium">Middle Name</CustomText>
        <TextInput
          style={styles.input}
          value={middleName}
          onChangeText={setMiddleName}
        />
      </View>

      <View style={styles.inputContainer}>
        <CustomText fontFamily="Medium">Last Name</CustomText>
        <TextInput
          style={styles.input}
          value={lastName}
          onChangeText={setLastName}
        />
      </View>

      <View style={styles.inputContainer}>
        <CustomText fontFamily="Medium">Contact Number</CustomText>
        <TextInput
          style={styles.input}
          value={contactNumber}
          onChangeText={setContactNumber}
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.inputContainer}>
        <CustomText fontFamily="Medium">School ID #</CustomText>
        <TextInput
          style={styles.input}
          value={schoolId}
          onChangeText={setSchoolId}
        />
      </View>

      <View style={styles.inputContainer}>
        <CustomText fontFamily="Medium">Sex</CustomText>
        <View style={styles.radioContainer}>
          <TouchableOpacity 
            style={[styles.radioButton, sex === "male" && styles.radioButtonSelected]} 
            onPress={() => setSex("male")}
          >
            <View style={[styles.radioCircle, sex === "male" && styles.radioCircleSelected]} />
            <CustomText fontFamily="Regular">Male</CustomText>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.radioButton, sex === "female" && styles.radioButtonSelected]} 
            onPress={() => setSex("female")}
          >
            <View style={[styles.radioCircle, sex === "female" && styles.radioCircleSelected]} />
            <CustomText fontFamily="Regular">Female</CustomText>
          </TouchableOpacity>
        </View>
      </View>

      {/* Role Selection */}
      <View style={styles.inputContainer}>
        <CustomText fontFamily="Medium">Role</CustomText>
        <View style={styles.radioContainer}>
          <TouchableOpacity 
            style={[styles.radioButton, userRole === "Student" && styles.radioButtonSelected]} 
            onPress={() => setUserRole("Student")}
          >
            <View style={[styles.radioCircle, userRole === "Student" && styles.radioCircleSelected]} />
            <CustomText fontFamily="Regular">Student</CustomText>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.radioButton, userRole === "Faculty" && styles.radioButtonSelected]} 
            onPress={() => setUserRole("Faculty")}
          >
            <View style={[styles.radioCircle, userRole === "Faculty" && styles.radioCircleSelected]} />
            <CustomText fontFamily="Regular">Faculty</CustomText>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.radioButton, userRole === "Staff" && styles.radioButtonSelected]} 
            onPress={() => setUserRole("Staff")}
          >
            <View style={[styles.radioCircle, userRole === "Staff" && styles.radioCircleSelected]} />
            <CustomText fontFamily="Regular">Staff</CustomText>
          </TouchableOpacity>
        </View>
      </View>

      {/* Document Upload Section */}
      {userRole && (
        <View style={styles.documentSection}>
          <CustomText fontFamily="Medium" variant="h7" style={styles.sectionTitle}>
            Document Verification
          </CustomText>
          
          {/* Photo Upload */}
          <View style={styles.inputContainer}>
            <CustomText fontFamily="Medium">Photo of Yourself *</CustomText>
            <TouchableOpacity 
              style={styles.documentButton}
              onPress={() => pickImage(setPhoto)}
            >
              <MaterialIcons name="photo-camera" size={20} color="#666" />
              <CustomText fontFamily="Regular" style={styles.documentButtonText}>
                {photo ? photo.fileName || 'Photo Selected' : 'Upload Photo'}
              </CustomText>
            </TouchableOpacity>
          </View>

          {/* Student Documents */}
          {userRole === 'Student' && (
            <>
              <View style={styles.inputContainer}>
                <CustomText fontFamily="Medium">School ID *</CustomText>
                <TouchableOpacity 
                  style={styles.documentButton}
                  onPress={() => pickDocument(setSchoolIdDocument)}
                >
                  <MaterialIcons name="badge" size={20} color="#666" />
                  <CustomText fontFamily="Regular" style={styles.documentButtonText}>
                    {schoolIdDocument ? schoolIdDocument.name || 'School ID Selected' : 'Upload School ID'}
                  </CustomText>
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <CustomText fontFamily="Medium">COR (Certificate of Registration) *</CustomText>
                <TouchableOpacity 
                  style={styles.documentButton}
                  onPress={() => pickDocument(setCor)}
                >
                  <MaterialIcons name="description" size={20} color="#666" />
                  <CustomText fontFamily="Regular" style={styles.documentButtonText}>
                    {cor ? cor.name || 'COR Selected' : 'Upload COR'}
                  </CustomText>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Faculty/Staff Documents */}
          {(userRole === 'Faculty' || userRole === 'Staff') && (
            <View style={styles.inputContainer}>
              <CustomText fontFamily="Medium">{userRole} ID *</CustomText>
              <TouchableOpacity 
                style={styles.documentButton}
                onPress={() => pickDocument(setStaffFacultyIdDocument)}
              >
                <MaterialIcons name="badge" size={20} color="#666" />
                <CustomText fontFamily="Regular" style={styles.documentButtonText}>
                  {staffFacultyIdDocument ? staffFacultyIdDocument.name || `${userRole} ID Selected` : `Upload ${userRole} ID`}
                </CustomText>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      <View style={styles.inputContainer}>
        <CustomText fontFamily="Medium">Email</CustomText>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputContainer}>
        <CustomText fontFamily="Medium">Password</CustomText>
        <View style={styles.passwordContainer}>
          <TextInput
            style={[styles.input, styles.passwordInput]}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowPassword(!showPassword)}
          >
            <MaterialIcons
              name={showPassword ? "visibility" : "visibility-off"}
              size={20}
              color="grey"
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputContainer}>
        <CustomText fontFamily="Medium">Confirm Password</CustomText>
        <View style={styles.passwordContainer}>
          <TextInput
            style={[styles.input, styles.passwordInput]}
            value={registerConfirmPassword}
            onChangeText={setRegisterConfirmPassword}
            secureTextEntry={!showRegisterConfirmPassword}
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowRegisterConfirmPassword(!showRegisterConfirmPassword)}
          >
            <MaterialIcons
              name={showRegisterConfirmPassword ? "visibility" : "visibility-off"}
              size={20}
              color="grey"
            />
          </TouchableOpacity>
        </View>
      </View>

      {password.length > 0 && (
        <View style={styles.passwordRequirements}>
          <CustomText fontFamily="Medium" variant="h8" style={styles.requirementsTitle}>
            Password Requirements:
          </CustomText>
          <View style={styles.requirementItem}>
            <MaterialIcons
              name={validatePassword(password).minLength ? "check-circle" : "cancel"}
              size={16}
              color={validatePassword(password).minLength ? "green" : "red"}
            />
            <CustomText
              fontFamily="Regular"
              variant="h8"
              style={[styles.requirementText, { color: validatePassword(password).minLength ? "green" : "red" }]}
            >
              At least 8 characters
            </CustomText>
          </View>
          <View style={styles.requirementItem}>
            <MaterialIcons
              name={validatePassword(password).hasUpperCase ? "check-circle" : "cancel"}
              size={16}
              color={validatePassword(password).hasUpperCase ? "green" : "red"}
            />
            <CustomText
              fontFamily="Regular"
              variant="h8"
              style={[styles.requirementText, { color: validatePassword(password).hasUpperCase ? "green" : "red" }]}
            >
              One uppercase letter
            </CustomText>
          </View>
          <View style={styles.requirementItem}>
            <MaterialIcons
              name={validatePassword(password).hasLowerCase ? "check-circle" : "cancel"}
              size={16}
              color={validatePassword(password).hasLowerCase ? "green" : "red"}
            />
            <CustomText
              fontFamily="Regular"
              variant="h8"
              style={[styles.requirementText, { color: validatePassword(password).hasLowerCase ? "green" : "red" }]}
            >
              One lowercase letter
            </CustomText>
          </View>
          <View style={styles.requirementItem}>
            <MaterialIcons
              name={validatePassword(password).hasNumber ? "check-circle" : "cancel"}
              size={16}
              color={validatePassword(password).hasNumber ? "green" : "red"}
            />
            <CustomText
              fontFamily="Regular"
              variant="h8"
              style={[styles.requirementText, { color: validatePassword(password).hasNumber ? "green" : "red" }]}
            >
              One number
            </CustomText>
          </View>
          <View style={styles.requirementItem}>
            <MaterialIcons
              name={validatePassword(password).hasSpecialChar ? "check-circle" : "cancel"}
              size={16}
              color={validatePassword(password).hasSpecialChar ? "green" : "red"}
            />
            <CustomText
              fontFamily="Regular"
              variant="h8"
              style={[styles.requirementText, { color: validatePassword(password).hasSpecialChar ? "green" : "red" }]}
            >
              One special character ($@!+)
            </CustomText>
          </View>
        </View>
      )}

      <View style={styles.loginLinkContainer}>
        <CustomText fontFamily="Regular" variant="h7" style={styles.linkPromptText}>
          Already have an account?{" "}
        </CustomText>
        <TouchableOpacity 
          onPress={() => setIsLogin(true)}
          activeOpacity={0.7}
        >
          <CustomText
            fontFamily="SemiBold"
            variant="h7"
            style={styles.loginLinkText}
          >
            Login here
          </CustomText>
        </TouchableOpacity>
      </View>
    </>
  );

  // Forgot Password Step 1: Email Input
  const renderForgotPasswordStep1 = () => (
    <>
      <CustomText fontFamily="Medium" variant="h6">
        Forgot Password?
      </CustomText>

      <CustomText
        variant="h7"
        fontFamily="Regular"
        style={commonStyles.lightText}
      >
        Enter your email address to receive a verification code
      </CustomText>

      <View style={styles.inputContainer}>
        <CustomText fontFamily="Medium">Email</CustomText>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="Enter your email address"
        />
      </View>

      <View style={styles.registerLinkContainer}>
        <CustomText fontFamily="Regular" variant="h8">
          Remember your password?{" "}
        </CustomText>
        <TouchableOpacity onPress={() => setIsForgotPassword(false)}>
          <CustomText
            fontFamily="Medium"
            variant="h8"
            style={styles.loginLinkText}
          >
            Back to Login
          </CustomText>
        </TouchableOpacity>
      </View>
    </>
  );

  // Forgot Password Step 2: Verification Code Input
  const renderForgotPasswordStep2 = () => (
    <>
      <CustomText fontFamily="Medium" variant="h6">
        Enter Verification Code
      </CustomText>

      <CustomText
        variant="h7"
        fontFamily="Regular"
        style={commonStyles.lightText}
      >
        We've sent a 6-digit code to {email}
      </CustomText>

      <View style={styles.inputContainer}>
        <CustomText fontFamily="Medium">Verification Code</CustomText>
        <TextInput
          style={styles.input}
          value={verificationCode}
          onChangeText={setVerificationCode}
          keyboardType="numeric"
          maxLength={6}
          placeholder="Enter 6-digit code"
        />
      </View>

      <View style={styles.registerLinkContainer}>
        <CustomText fontFamily="Regular" variant="h8">
          Didn't receive the code?{" "}
        </CustomText>
        <TouchableOpacity onPress={handleSendCode}>
          <CustomText
            fontFamily="Medium"
            variant="h8"
            style={styles.loginLinkText}
          >
            Resend Code
          </CustomText>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.forgotPasswordContainer}
        onPress={() => {
          setForgotPasswordStep(1);
          setVerificationCode('');
        }}
      >
        <CustomText
          fontFamily="Medium"
          variant="h8"
          style={styles.forgotPasswordLink}
        >
          Change Email Address
        </CustomText>
      </TouchableOpacity>
    </>
  );

  // Forgot Password Step 3: New Password Input
  const renderForgotPasswordStep3 = () => {
    const passwordValidation = validatePassword(newPassword);
    
    return (
      <>
        <CustomText fontFamily="Medium" variant="h6">
          Set New Password
        </CustomText>

        <CustomText
          variant="h7"
          fontFamily="Regular"
          style={commonStyles.lightText}
        >
          Create a strong password for your account
        </CustomText>

        <View style={styles.inputContainer}>
          <CustomText fontFamily="Medium">New Password</CustomText>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showNewPassword}
              placeholder="Enter new password"
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowNewPassword(!showNewPassword)}
            >
              <MaterialIcons
                name={showNewPassword ? "visibility" : "visibility-off"}
                size={20}
                color="grey"
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <CustomText fontFamily="Medium">Confirm Password</CustomText>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              placeholder="Confirm new password"
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <MaterialIcons
                name={showConfirmPassword ? "visibility" : "visibility-off"}
                size={20}
                color="grey"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Password Requirements */}
        {newPassword.length > 0 && (
          <View style={styles.passwordRequirements}>
            <CustomText fontFamily="Medium" variant="h8" style={styles.requirementsTitle}>
              Password Requirements:
            </CustomText>
            <View style={styles.requirementItem}>
              <MaterialIcons
                name={passwordValidation.minLength ? "check-circle" : "cancel"}
                size={16}
                color={passwordValidation.minLength ? "green" : "red"}
              />
              <CustomText
                fontFamily="Regular"
                variant="h8"
                style={[styles.requirementText, { color: passwordValidation.minLength ? "green" : "red" }]}
              >
                At least 8 characters
              </CustomText>
            </View>
            <View style={styles.requirementItem}>
              <MaterialIcons
                name={passwordValidation.hasUpperCase ? "check-circle" : "cancel"}
                size={16}
                color={passwordValidation.hasUpperCase ? "green" : "red"}
              />
              <CustomText
                fontFamily="Regular"
                variant="h8"
                style={[styles.requirementText, { color: passwordValidation.hasUpperCase ? "green" : "red" }]}
              >
                One uppercase letter
              </CustomText>
            </View>
            <View style={styles.requirementItem}>
              <MaterialIcons
                name={passwordValidation.hasLowerCase ? "check-circle" : "cancel"}
                size={16}
                color={passwordValidation.hasLowerCase ? "green" : "red"}
              />
              <CustomText
                fontFamily="Regular"
                variant="h8"
                style={[styles.requirementText, { color: passwordValidation.hasLowerCase ? "green" : "red" }]}
              >
                One lowercase letter
              </CustomText>
            </View>
            <View style={styles.requirementItem}>
              <MaterialIcons
                name={passwordValidation.hasNumber ? "check-circle" : "cancel"}
                size={16}
                color={passwordValidation.hasNumber ? "green" : "red"}
              />
              <CustomText
                fontFamily="Regular"
                variant="h8"
                style={[styles.requirementText, { color: passwordValidation.hasNumber ? "green" : "red" }]}
              >
                One number
              </CustomText>
            </View>
            <View style={styles.requirementItem}>
              <MaterialIcons
                name={passwordValidation.hasSpecialChar ? "check-circle" : "cancel"}
                size={16}
                color={passwordValidation.hasSpecialChar ? "green" : "red"}
              />
              <CustomText
                fontFamily="Regular"
                variant="h8"
                style={[styles.requirementText, { color: passwordValidation.hasSpecialChar ? "green" : "red" }]}
              >
                One special character ($@!+)
              </CustomText>
            </View>
          </View>
        )}

        <TouchableOpacity 
          style={styles.forgotPasswordContainer}
          onPress={() => {
            setForgotPasswordStep(2);
            setNewPassword('');
            setConfirmPassword('');
          }}
        >
          <CustomText
            fontFamily="Medium"
            variant="h8"
            style={styles.forgotPasswordLink}
          >
            Back to Verification
          </CustomText>
        </TouchableOpacity>
      </>
    );
  };

  return (
    <SafeAreaView style={[authStyles.container, { paddingBottom: 0 }]}>
      <ScrollView 
        contentContainerStyle={[
          styles.scrollContainer, 
          { paddingBottom: isLogin ? 20 : 100 } // Add extra padding at the bottom for registration form
        ]}
      >
        <View style={commonStyles.flexRowBetween}>
          <TouchableOpacity onPress={() => router.replace("/role")}>
            <Image
              source={require("@/assets/images/ecoride_logo1.png")}
              style={authStyles.logo}
            />
          </TouchableOpacity>
          {/* Help Button 
          <TouchableOpacity style={authStyles.flexRowGap}>
            <MaterialIcons name="help" size={18} color="grey" />
            <CustomText fontFamily="Medium" variant="h7">
              Help
            </CustomText>
          </TouchableOpacity> */}
        </View>

        {isForgotPassword ? (
          forgotPasswordStep === 1 ? renderForgotPasswordStep1() :
          forgotPasswordStep === 2 ? renderForgotPasswordStep2() :
          renderForgotPasswordStep3()
        ) : (
          isLogin ? renderLoginForm() : renderRegisterForm()
        )}
        
        {/* Footer with adjusted alignment */}
        <View style={[
          { 
            marginTop: 20,
            marginBottom: 20,
            paddingHorizontal: 15,
            width: '90%',
            alignItems: 'flex-start'
          }
        ]}>
          {/* By continuing, you agree to the terms and privacy policy of Ecoride App 
          <CustomText
            variant="h8"
            fontFamily="Regular"
            style={[
              commonStyles.lightText,
              { textAlign: "left", marginBottom: 15 },
            ]}
          >
            By continuing, you agree to the terms and privacy policy of Ecoride App
          </CustomText> */}
          {/* 
          {!isForgotPassword && !isLogin && (
            <View style={styles.registerLinkContainer}>
              <CustomText fontFamily="Regular" variant="h7" style={styles.linkPromptText}>
                Already have an account?{" "}
              </CustomText>
              <TouchableOpacity 
                onPress={() => setIsLogin(true)}
                activeOpacity={0.7}
              >
                <CustomText
                  fontFamily="SemiBold"
                  variant="h7"
                  style={styles.loginLinkText}
                >
                  Login here
                </CustomText>
              </TouchableOpacity>
            </View>
          )}
          */}

          {/* Terms and Conditions Checkbox - Only show during registration */}
          {!isForgotPassword && !isLogin && (
            <View style={styles.termsContainer}>
              <TouchableOpacity 
                style={styles.checkboxContainer}
                onPress={() => setAgreedToTerms(!agreedToTerms)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
                  {agreedToTerms && (
                    <MaterialIcons name="check" size={16} color="#fff" />
                  )}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <Text style={styles.termsText}>
                    I agree to the{" "}
                  </Text>
                  <TouchableOpacity 
                    onPress={() => setShowTermsModal(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.termsLink}>
                      Terms and Conditions
                    </Text>
                  </TouchableOpacity>
                  <Text style={styles.termsText}>
                    {" "}of EcoRide-BASC
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          <CustomButton
            title={
              isForgotPassword ? (
                forgotPasswordStep === 1 ? "Send Code" :
                forgotPasswordStep === 2 ? "Verify Code" :
                "Reset Password"
              ) : (
                isLogin ? "Login" : "Register"
              )
            }
            onPress={
              isForgotPassword ? (
                forgotPasswordStep === 1 ? handleSendCode :
                forgotPasswordStep === 2 ? handleVerifyCode :
                handleResetPassword
              ) : (
                isLogin ? handleLogin : handleRegister
              )
            }
            loading={loading}
            disabled={loading}
          />

          {!isForgotPassword && isLogin && (
            <View style={styles.registerPromptContainer}>
              <CustomText fontFamily="Regular" variant="h7" style={styles.linkPromptText}>
                Don't have an account?{" "}
              </CustomText>
              <TouchableOpacity 
                onPress={() => setIsLogin(false)}
                activeOpacity={0.7}
              >
                <CustomText
                  fontFamily="SemiBold"
                  variant="h7"
                  style={styles.registerLinkText}
                >
                  Register here
                </CustomText>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Rejection Reason Modal */}
      <RejectionReasonModal
        visible={showRejectionModal}
        reason={rejectionReason}
        deadline={rejectionDeadline}
        status={rejectionStatus}
        onClose={() => setShowRejectionModal(false)}
      />
      
      {/* Penalty Modal */}
      <PenaltyModal
        visible={showPenaltyModal}
        comment={penaltyComment}
        liftDate={penaltyLiftDate}
        onClose={() => setShowPenaltyModal(false)}
      />

      {/* Terms and Conditions Modal */}
      <TermsModal
        visible={showTermsModal}
        onClose={() => setShowTermsModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  inputContainer: {
    marginTop: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 5,
    padding: 10,
    marginTop: 5,
    fontSize: 16,
  },
  registerLinkContainer: {
    flexDirection: 'row',
    marginTop: 15,
    marginBottom: 15,
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  registerPromptContainer: {
    flexDirection: 'row',
    marginTop: 20,
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  loginLinkContainer: {
    flexDirection: 'row',
    marginTop: 15,
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  linkPromptText: {
    color: '#666',
    textAlign: 'center',
  },
  registerLinkText: {
    color: '#4CAF50',
    textDecorationLine: 'underline',
  },
  loginLinkText: {
    color: '#4CAF50',
    textDecorationLine: 'underline',
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
    borderColor: '#4CAF50',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: {
    backgroundColor: '#4CAF50',
  },
  forgotPasswordContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  forgotPasswordLink: {
    color: '#4CAF50',
    textDecorationLine: 'underline',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  passwordInput: {
    flex: 1,
    paddingRight: 40,
  },
  eyeIcon: {
    position: 'absolute',
    right: 10,
    padding: 5,
  },
  passwordRequirements: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
  },
  requirementsTitle: {
    marginBottom: 8,
    color: '#333',
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  requirementText: {
    marginLeft: 8,
    fontSize: 12,
  },
  documentSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  sectionTitle: {
    marginBottom: 15,
    color: '#495057',
    fontWeight: '600',
  },
  documentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginTop: 5,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 6,
    borderStyle: 'dashed',
  },
  documentButtonText: {
    marginLeft: 10,
    color: '#6c757d',
    fontSize: 14,
  },
  termsContainer: {
    marginTop: 15,
    marginBottom: 15,
    width: '100%',
    alignItems: 'center',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginLeft: 25,
    marginBottom: 15,
  },
  checkboxChecked: {
    backgroundColor: '#4CAF50',
  },
  termsLink: {
    color: '#4CAF50',
    textDecorationLine: 'underline',
    fontSize: 13,
  },
  termsText: {
    color: '#666',
    fontSize: 13,
  },
});
