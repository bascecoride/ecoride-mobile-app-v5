import React, { FC, useState, useEffect } from 'react';
import { View, Modal, TouchableOpacity, StyleSheet, Image, ScrollView, Linking, Alert, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5, AntDesign } from '@expo/vector-icons';
import { RFValue } from 'react-native-responsive-fontsize';
import CustomText from '../shared/CustomText';
import { Colors } from '@/utils/Constants';
import RiderRatingCard from './RiderRatingCard';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface DriverDetailsModalProps {
  visible: boolean;
  driverDetails: any;
  onClose: () => void;
}

const DriverDetailsModal: FC<DriverDetailsModalProps> = ({
  visible,
  driverDetails,
  onClose,
}) => {
  const [showRatings, setShowRatings] = useState(false);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [imageLoading, setImageLoading] = useState(true);
  const [fullImageLoading, setFullImageLoading] = useState(true);
  
  // Set initial loading state when driverDetails changes
  useEffect(() => {
    if (driverDetails?.photo) {
      setImageLoading(true);
    } else {
      setImageLoading(false);
    }
  }, [driverDetails?.photo]);
  
  // Reset loading state when modal becomes visible
  useEffect(() => {
    if (visible && driverDetails?.photo) {
      setImageLoading(true);
    }
  }, [visible, driverDetails?.photo]);

  if (!driverDetails) return null;
  
  const openImageViewer = (imageUrl: string) => {
    if (imageUrl) {
      setSelectedImage(imageUrl);
      setImageViewerVisible(true);
    }
  };

  const closeImageViewer = () => {
    setImageViewerVisible(false);
    setSelectedImage("");
  };

  const getVehicleImage = (type: string) => {
    switch (type) {
      case 'Single Motorcycle':
        return require('@/assets/icons/SingleMotorcycle-NoBG.png');
      case 'Tricycle':
        return require('@/assets/icons/Tricycle-NoBG.png');
      case 'Cab':
        return require('@/assets/icons/Car-NoBG.png');
      default:
        return require('@/assets/icons/SingleMotorcycle-NoBG.png');
    }
  };
  
  const getVehicleDisplayName = (type: string) => {
    return type === 'Cab' ? 'Four Wheel' : type;
  };

  // Mask license ID - show only last 3 characters, rest as asterisks
  const maskLicenseId = (licenseId: string) => {
    if (!licenseId || licenseId.length <= 3) {
      return licenseId; // Return as-is if too short to mask
    }
    const visiblePart = licenseId.slice(-3); // Last 3 characters
    const maskedPart = '*'.repeat(licenseId.length - 3); // Asterisks for the rest
    return maskedPart + visiblePart;
  };

  const handleCallDriver = async () => {
    const phoneNumber = driverDetails.phone;
    if (phoneNumber) {
      const phoneUrl = `tel:${phoneNumber}`;
      try {
        const supported = await Linking.canOpenURL(phoneUrl);
        if (supported) {
          await Linking.openURL(phoneUrl);
        } else {
          Alert.alert('Error', 'Phone calls are not supported on this device');
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to make phone call');
      }
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header with close button */}
          <View style={styles.header}>
            <CustomText fontFamily="Bold" fontSize={20} style={styles.headerTitle}>
              Driver Details
            </CustomText>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={RFValue(24)} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollContent}>
            {/* Driver Profile Section */}
            <View style={styles.profileSection}>
              <View style={styles.driverImageContainer}>
                {driverDetails.photo ? (
                  <TouchableOpacity onPress={() => openImageViewer(driverDetails.photo)}>
                    <View style={styles.imageWrapper}>
                      <Image
                        source={{ uri: driverDetails.photo }}
                        style={styles.driverImage}
                        onLoadStart={() => setImageLoading(true)}
                        onLoad={() => setImageLoading(false)}
                        onError={() => {
                          console.log('Error loading profile image');
                          setImageLoading(false);
                        }}
                      />
                      {imageLoading && (
                        <View style={styles.loaderContainer}>
                          <ActivityIndicator size="small" color={Colors.primary} />
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.driverImagePlaceholder}>
                    <Ionicons name="person" size={RFValue(40)} color="#FFFFFF" />
                  </View>
                )}
                <View style={styles.onlineIndicator} />
              </View>
              
              <View style={styles.driverBasicInfo}>
                <CustomText fontFamily="Bold" fontSize={18} style={styles.driverName}>
                  {driverDetails.firstName} {driverDetails.lastName}
                </CustomText>
                
                {driverDetails.averageRating && (
                  <View style={styles.ratingContainer}>
                    <AntDesign name="star" size={RFValue(16)} color="#FFD700" />
                    <CustomText fontFamily="Medium" fontSize={14} style={styles.ratingText}>
                      {parseFloat(driverDetails.averageRating).toFixed(1)}
                    </CustomText>
                    {driverDetails.totalRatings > 0 && (
                      <CustomText fontSize={12} style={styles.experienceText}>
                        • {driverDetails.totalRatings} {driverDetails.totalRatings === 1 ? 'review' : 'reviews'}
                      </CustomText>
                    )}
                  </View>
                )}

                <View style={styles.statusBadge}>
                  <CustomText fontFamily="Medium" fontSize={12} style={styles.statusText}>
                    Available
                  </CustomText>
                </View>
              </View>
            </View>

            {/* Vehicle Information */}
            {driverDetails.vehicleType && (
              <View style={styles.vehicleSection}>
                <View style={styles.sectionHeader}>
                  <FontAwesome5 name="car" size={RFValue(16)} color={Colors.primary} />
                  <CustomText fontFamily="SemiBold" fontSize={16} style={styles.sectionTitle}>
                    Vehicle Information
                  </CustomText>
                </View>
                
                <View style={styles.vehicleCard}>
                  <Image
                    source={getVehicleImage(driverDetails.vehicleType)}
                    style={styles.vehicleImage}
                  />
                  <View style={styles.vehicleDetails}>
                    <CustomText fontFamily="SemiBold" fontSize={16} style={styles.vehicleType}>
                      {getVehicleDisplayName(driverDetails.vehicleType)}
                    </CustomText>
                    {driverDetails.plateNumber && (
                      <View style={styles.plateNumberContainer}>
                        <CustomText fontFamily="Bold" fontSize={14} style={styles.plateNumber}>
                          {driverDetails.plateNumber}
                        </CustomText>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            )}

            {/* Contact Information */}
            <View style={styles.contactSection}>
              <View style={styles.sectionHeader}>
                <FontAwesome5 name="address-card" size={RFValue(16)} color={Colors.primary} />
                <CustomText fontFamily="SemiBold" fontSize={16} style={styles.sectionTitle}>
                  Contact
                </CustomText>
              </View>
              
              <View style={styles.contactCard}>
                <View style={[styles.contactItem, { marginBottom: 0 }]}>
                  <FontAwesome5 name="phone-alt" size={RFValue(14)} color={Colors.primary} />
                  <View style={styles.contactInfo}>
                    <CustomText fontSize={12} style={styles.contactLabel}>Phone Number</CustomText>
                    <CustomText fontFamily="Medium" fontSize={14} style={styles.contactValue}>
                      {driverDetails.phone}
                    </CustomText>
                  </View>
                </View>
              </View>
            </View>

            {/* Other Information */}
            {driverDetails.licenseId && (
              <View style={styles.contactSection}>
                <View style={styles.sectionHeader}>
                  <FontAwesome5 name="info-circle" size={RFValue(16)} color={Colors.primary} />
                  <CustomText fontFamily="SemiBold" fontSize={16} style={styles.sectionTitle}>
                    Other Information
                  </CustomText>
                </View>
                
                <View style={styles.contactCard}>
                  <View style={[styles.contactItem, { marginBottom: 0 }]}>
                    <FontAwesome5 name="id-card" size={RFValue(14)} color={Colors.primary} />
                    <View style={styles.contactInfo}>
                      <CustomText fontSize={12} style={styles.contactLabel}>License ID</CustomText>
                      <CustomText fontFamily="Medium" fontSize={14} style={styles.contactValue}>
                        {maskLicenseId(driverDetails.licenseId)}
                      </CustomText>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* Ratings Section */}
            <View style={styles.ratingsSection}>
              <TouchableOpacity 
                style={styles.ratingsToggle}
                onPress={() => setShowRatings(!showRatings)}
              >
                <View style={styles.ratingsToggleContent}>
                  <MaterialIcons name="star-rate" size={RFValue(18)} color={Colors.primary} />
                  <CustomText fontFamily="SemiBold" fontSize={16} style={styles.ratingsToggleText}>
                    Driver Reviews & Ratings
                  </CustomText>
                </View>
                <Ionicons 
                  name={showRatings ? "chevron-up" : "chevron-down"} 
                  size={RFValue(18)} 
                  color={Colors.primary} 
                />
              </TouchableOpacity>

              {showRatings && driverDetails._id && (
                <View style={styles.ratingsContent}>
                  <RiderRatingCard 
                    riderId={driverDetails._id} 
                    riderName={`${driverDetails.firstName} ${driverDetails.lastName}`}
                  />
                </View>
              )}
            </View>
          </ScrollView>

          {/* Action Buttons 
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.callButton} onPress={handleCallDriver}>
              <Ionicons name="call" size={RFValue(18)} color="#fff" />
              <CustomText fontFamily="SemiBold" fontSize={16} style={styles.callButtonText}>
                Call Driver
              </CustomText>
            </TouchableOpacity>
          </View> */}
        </View>
      </View>

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
            <View style={styles.fullImageContainer}>
              <Image 
                source={{ uri: selectedImage }} 
                style={styles.fullScreenImage}
                resizeMode="contain"
                onLoadStart={() => setFullImageLoading(true)}
                onLoad={() => setFullImageLoading(false)}
                onError={() => setFullImageLoading(false)}
              />
              {fullImageLoading && (
                <View style={styles.fullImageLoaderContainer}>
                  <ActivityIndicator size="large" color="#FFFFFF" />
                </View>
              )}
            </View>
          )}
          
          <TouchableOpacity 
            style={styles.imageViewerBackground}
            onPress={closeImageViewer}
            activeOpacity={1}
          />
        </View>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    color: Colors.text,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  driverImageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  imageWrapper: {
    position: 'relative',
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
  },
  loaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(240, 240, 240, 0.7)',
  },
  driverImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E0E0E0',
  },
  driverImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#9E9E9E',
    justifyContent: "center",
    alignItems: "center",
  },
  fullImageContainer: {
    position: 'relative',
    width: screenWidth,
    height: screenHeight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImageLoaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#fff',
  },
  driverBasicInfo: {
    flex: 1,
  },
  driverName: {
    color: Colors.text,
    marginBottom: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingText: {
    color: Colors.text,
    marginLeft: 4,
  },
  experienceText: {
    color: '#666',
    marginLeft: 8,
  },
  statusBadge: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#4CAF50',
  },
  vehicleSection: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: Colors.text,
    marginLeft: 8,
  },
  vehicleCard: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  vehicleImage: {
    width: 60,
    height: 60,
    marginRight: 16,
    resizeMode: 'contain',
  },
  vehicleDetails: {
    flex: 1,
  },
  vehicleType: {
    color: Colors.text,
    marginBottom: 4,
  },
  vehicleModel: {
    color: '#666',
    marginBottom: 2,
  },
  vehicleColor: {
    color: '#666',
    marginBottom: 8,
  },
  plateNumberContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  plateNumber: {
    color: Colors.text,
    letterSpacing: 1,
  },
  contactSection: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  contactCard: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  contactInfo: {
    marginLeft: 12,
    flex: 1,
  },
  contactLabel: {
    color: '#666',
    marginBottom: 2,
  },
  contactValue: {
    color: Colors.text,
  },
  ratingsSection: {
    paddingVertical: 20,
  },
  ratingsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
  },
  ratingsToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingsToggleText: {
    color: Colors.primary,
    marginLeft: 8,
  },
  ratingsContent: {
    marginTop: 12,
  },
  actionButtons: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  callButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  callButtonText: {
    color: '#fff',
    marginLeft: 8,
  },
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
    backgroundColor: 'transparent',
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

export default DriverDetailsModal;
