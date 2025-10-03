import React, { FC, useState, useEffect } from 'react';
import { 
  View, 
  Modal, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  ScrollView, 
  RefreshControl,
  Dimensions,
  ActivityIndicator,
  Text,
  Alert 
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { RFValue } from 'react-native-responsive-fontsize';
import CustomText from '../shared/CustomText';
import { Colors } from '@/utils/Constants';

const { width: screenWidth } = Dimensions.get('window');

interface ActiveRidersModalProps {
  visible: boolean;
  riders: any[];
  onClose: () => void;
  onRiderPress: (rider: any) => void;
  onViewOnMap: (rider: any) => void;
  onRefreshRiders?: () => void;
}

const ActiveRidersModal: FC<ActiveRidersModalProps> = ({
  visible,
  riders,
  onClose,
  onRiderPress,
  onViewOnMap,
  onRefreshRiders,
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const [processedRiders, setProcessedRiders] = useState<any[]>([]);
  

  // Process and validate riders data
  useEffect(() => {
    if (visible && riders) {
      console.log('🚗 ActiveRidersModal - Processing riders...');
      console.log('🚗 Riders array length:', riders?.length || 0);
      
      let ridersToProcess = riders || [];
      
      // Only use real rider data - no test data fallback
      if (ridersToProcess && ridersToProcess.length > 0) {
        console.log('✅ Using real rider data:', ridersToProcess.length, 'riders');
      } else {
        console.log('ℹ️ No active riders available');
        ridersToProcess = [];
      }
      
      // Process riders to ensure all required fields
      const validRiders = ridersToProcess
        .filter((rider: any) => {
          // Basic validation
          const hasId = rider?.id || rider?.riderId;
          const hasCoords = rider?.latitude && rider?.longitude;
          
          if (!hasId) {
            console.warn('⚠️ Rider missing ID:', rider);
            return false;
          }
          if (!hasCoords) {
            console.warn('⚠️ Rider missing coordinates:', rider);
            return false;
          }
          
          return true;
        })
        .map((rider: any, index: number) => {
          // Ensure all required fields with fallbacks
          const processedRider = {
            id: rider.id || rider.riderId || `rider-${index}`,
            latitude: parseFloat(rider.latitude) || 0,
            longitude: parseFloat(rider.longitude) || 0,
            name: rider.name || 
                  (rider.firstName && rider.lastName ? `${rider.firstName} ${rider.lastName}` : '') ||
                  `Rider ${(rider.id || rider.riderId || '').substring(0, 6)}` ||
                  `Driver ${index + 1}`,
            firstName: rider.firstName || '',
            lastName: rider.lastName || '',
            vehicleType: rider.vehicleType || 'Tricycle',
            photo: rider.photo || null,
            averageRating: parseFloat(rider.averageRating) || 0,
            totalRatings: parseInt(rider.totalRatings) || 0,
            distance: parseFloat(rider.distance) || 0,
            rotation: rider.rotation || 0,
          };
          
          console.log(`✅ Processed rider ${index + 1}:`, processedRider.name, processedRider.id);
          return processedRider;
        });
      
      console.log(`📋 Final processed riders: ${validRiders.length} valid riders`);
      setProcessedRiders(validRiders);
    } else {
      setProcessedRiders([]);
    }
  }, [visible, riders]);

  const onRefresh = async () => {
    setRefreshing(true);
    console.log('🔄 Manual refresh triggered by user pull-to-refresh...');
    
    // Call parent's refresh function if provided
    if (onRefreshRiders) {
      onRefreshRiders();
    }
    
    // Simulate refresh delay for user feedback
    setTimeout(() => {
      setRefreshing(false);
      console.log('✅ Manual refresh completed');
    }, 800);
  };

  const handleRiderPress = (rider: any) => {
    console.log('👆 Rider pressed:', rider.name, rider.id);
    Alert.alert(
      'Rider Selected',
      `You selected ${rider.name}. View details?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'View Details', onPress: () => onRiderPress(rider) },
        { text: 'View on Map', onPress: () => onViewOnMap(rider) }
      ]
    );
  };

  const handleViewOnMap = (rider: any) => {
    console.log('🗺️ View on map pressed:', rider.name, rider.id);
    onViewOnMap(rider);
  };

  const getVehicleIcon = (vehicleType: string) => {
    switch (vehicleType) {
      case 'Single Motorcycle':
        return 'motorbike';
      case 'Tricycle':
        return 'rickshaw';
      case 'Cab':
        return 'car';
      default:
        return 'motorbike';
    }
  };
  
  const getVehicleDisplayName = (vehicleType: string) => {
    return vehicleType === 'Cab' ? 'Four Wheel' : vehicleType;
  };

  const getVehicleColor = (vehicleType: string) => {
    switch (vehicleType) {
      case 'Single Motorcycle':
        return '#FF6B35';
      case 'Tricycle':
        return '#4CAF50';
      case 'Cab':
        return '#2196F3';
      default:
        return '#FF6B35';
    }
  };

  const formatDistance = (distance: number) => {
    if (distance < 1000) {
      return `${Math.round(distance)}m`;
    } else {
      return `${(distance / 1000).toFixed(1)}km`;
    }
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.liveIndicator}>
                <View style={styles.pulsingDot} />
              </View>
              <CustomText fontFamily="Bold" fontSize={18} style={styles.headerTitle}>
                Active Riders
              </CustomText>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={RFValue(20)} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {/* Stats Bar */}
          <View style={styles.statsBar}>
            <View style={styles.statItem}>
              <FontAwesome5 name="users" size={RFValue(14)} color={Colors.primary} />
              <CustomText fontFamily="Medium" fontSize={12} style={styles.statText}>
                {processedRiders?.length || 0} Online
              </CustomText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="map-marker-radius" size={RFValue(14)} color="#4CAF50" />
              <CustomText fontFamily="Medium" fontSize={12} style={styles.statText}>
                Live Tracking
              </CustomText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="database-refresh" size={RFValue(14)} color="#FF9800" />
              <CustomText fontFamily="Medium" fontSize={12} style={styles.statText}>
                Real-time
              </CustomText>
            </View>
          </View>

          {/* Riders List */}
          <ScrollView 
            style={styles.ridersList}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[Colors.primary]}
                tintColor={Colors.primary}
              />
            }
          >
            {processedRiders.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons 
                  name="account-search" 
                  size={RFValue(50)} 
                  color="#E0E0E0" 
                />
                <CustomText fontFamily="Medium" fontSize={18} style={styles.emptyText}>
                  No Active Riders Found
                </CustomText>
                <CustomText fontSize={14} style={styles.emptySubText}>
                  No riders are currently online in your area.
                </CustomText>
                <CustomText fontSize={12} style={[styles.emptySubText, { marginTop: 8, fontStyle: 'italic' }]}>
                  We'll notify you when riders become available
                </CustomText>
                <CustomText fontSize={11} style={[styles.emptySubText, { marginTop: 4, color: '#FF9800' }]}>
                  💡 Make sure riders are on duty in the rider app
                </CustomText>
                <TouchableOpacity 
                  style={styles.retryButton}
                  onPress={onRefresh}
                >
                  <Ionicons name="refresh" size={RFValue(16)} color="#fff" />
                  <CustomText style={styles.retryButtonText}>
                    Refresh Connection
                  </CustomText>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {/* Debug Info 
                <View style={styles.debugInfo}>
                  <Text style={styles.debugText}>
                    📊 Showing {processedRiders.length} active riders {(!riders || riders.length === 0) ? '(Test Mode)' : '(Real Data)'}
                  </Text>
                  <Text style={[styles.debugText, { fontSize: 10, marginTop: 4 }]}>
                    Socket: {riders?.length || 0} | Processed: {processedRiders.length} | Mode: {(!riders || riders.length === 0) ? 'Test' : 'Live'}
                  </Text>
                </View> */}
                
                {processedRiders.map((rider, index) => {
                  console.log(`🚗 Rendering rider ${index + 1}:`, rider.name, rider.id);
                  return (
                <TouchableOpacity 
                  key={`rider-${rider.id}-${index}`} 
                  style={styles.riderCard}
                  onPress={() => handleRiderPress(rider)}
                  activeOpacity={0.8}
                >
                  {/* Profile Image */}
                  <View style={styles.profileImageContainer}>
                    {rider.photo ? (
                      <Image 
                        source={{ uri: rider.photo }} 
                        style={styles.profileImage}
                      />
                    ) : (
                      <View style={styles.defaultProfileContainer}>
                        <Ionicons name="person" size={RFValue(24)} color="#666" />
                      </View>
                    )}
                    {/* Vehicle Badge */}
                    <View style={[styles.vehicleBadge, { backgroundColor: getVehicleColor(rider.vehicleType) }]}>
                      <MaterialCommunityIcons 
                        name={getVehicleIcon(rider.vehicleType)} 
                        size={RFValue(12)} 
                        color="white" 
                      />
                    </View>
                  </View>

                  {/* Rider Details */}
                  <View style={styles.riderDetails}>
                    <View style={styles.riderNameRow}>
                      <Text style={styles.riderName}>
                        {rider.name}
                      </Text>
                      <View style={styles.onlineStatus}>
                        <View style={styles.onlineDot} />
                        <Text style={styles.onlineText}>Online</Text>
                      </View>
                    </View>
                    
                    {/* Rating and Distance Row */}
                    <View style={styles.ratingRow}>
                      <View style={styles.ratingContainer}>
                        <Ionicons 
                          name="star" 
                          size={RFValue(14)} 
                          color="#FFD700" 
                        />
                        <Text style={styles.ratingText}>
                          {rider.averageRating > 0 ? rider.averageRating.toFixed(1) : 'New'}
                        </Text>
                        {rider.totalRatings > 0 && (
                          <Text style={styles.ratingCount}>
                            ({rider.totalRatings})
                          </Text>
                        )}
                      </View>
                      
                      <View style={styles.distanceInfo}>
                        <MaterialCommunityIcons 
                          name="map-marker-distance" 
                          size={RFValue(14)} 
                          color="#666" 
                        />
                        <Text style={styles.distanceText}>
                          {formatDistance(rider.distance || 0)}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.vehicleRow}>
                      <View style={styles.vehicleInfo}>
                        <MaterialCommunityIcons 
                          name={getVehicleIcon(rider.vehicleType)} 
                          size={RFValue(14)} 
                          color="#666" 
                        />
                        <Text style={styles.vehicleText}>
                          {getVehicleDisplayName(rider.vehicleType)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.actionButtons}>
                    <TouchableOpacity 
                      style={styles.viewMapButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleViewOnMap(rider);
                      }}
                    >
                      <MaterialCommunityIcons 
                        name="map-search" 
                        size={RFValue(18)} 
                        color={Colors.primary} 
                      />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
                  );
                })}
              </>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <CustomText fontSize={11} style={styles.footerText}>
              {processedRiders.length > 0 
                ? "Tap a rider to view details • Tap 🔍 to locate on map"
                : "Pull down to refresh • Check if riders are online"
              }
            </CustomText>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    width: '100%',
    maxHeight: '85%',
    minHeight: '60%',
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    overflow: 'hidden', // This ensures all child elements respect the border radius
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveIndicator: {
    marginRight: 12,
    position: 'relative',
  },
  pulsingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  headerTitle: {
    color: Colors.text,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#F8F9FA',
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    color: '#666',
    marginLeft: 6,
  },
  statDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 16,
  },
  ridersList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    minHeight: 200,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyText: {
    color: '#666',
    marginTop: 12,
    textAlign: 'center',
  },
  emptySubText: {
    color: '#9E9E9E',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 12,
  },
  retryButtonText: {
    color: '#fff',
    marginLeft: 6,
    fontSize: 12,
    fontFamily: 'Medium',
  },
  viewOnMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginLeft: 'auto',
  },
  viewOnMapText: {
    color: '#fff',
    fontSize: 10,
    marginLeft: 4,
    fontFamily: 'Medium',
  },
  riderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    borderWidth: 2,
    borderColor: Colors.primary + '20',
    minHeight: 80,
  },
  profileImageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0F0F0',
  },
  defaultProfileContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  riderInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  riderDetails: {
    flex: 1,
  },
  riderNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  riderName: {
    color: Colors.text,
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  onlineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
    marginRight: 4,
  },
  onlineText: {
    color: '#4CAF50',
    fontSize: 10,
    fontWeight: '500',
  },
  riderMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    color: '#333',
    marginLeft: 4,
    fontWeight: '500',
    fontSize: 12,
  },
  ratingCount: {
    color: '#666',
    marginLeft: 2,
    fontSize: 10,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  vehicleText: {
    color: '#666',
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '400',
  },
  distanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceText: {
    color: '#666',
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '500',
  },
  actionButtons: {
    marginLeft: 12,
  },
  viewMapButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F8FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary + '20',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: '#F8F9FA',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  footerText: {
    color: '#666',
    textAlign: 'center',
  },
  debugInfo: {
    backgroundColor: '#E3F2FD',
    padding: 8,
    marginBottom: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  debugText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '500',
  },
});

export default ActiveRidersModal;
