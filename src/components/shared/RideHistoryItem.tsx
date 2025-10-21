import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RFValue } from 'react-native-responsive-fontsize';
import { Colors } from '@/utils/Constants';
import CustomText from './CustomText';
import { formatDate } from '@/utils/Helpers';
import RatingModal from '@/components/customer/RatingModal';
import { checkRideRating, getRiderRatings } from '@/service/rideService';

interface RideHistoryItemProps {
  ride: {
    _id: string;
    vehicle: string;
    distance: number;
    fare: number;
    pickup: {
      address: string;
      latitude: number;
      longitude: number;
    };
    drop: {
      address: string;
      latitude: number;
      longitude: number;
    };
    status: string;
    customer: {
      firstName: string;
      lastName: string;
      phone: string;
      _id?: string;
    };
    rider: {
      firstName: string;
      lastName: string;
      phone: string;
      vehicleType?: string;
      _id?: string;
    } | null;
    createdAt: string;
    otp?: string;
  };
  onPress?: () => void;
  isRider?: boolean;
}

const getVehicleIcon = (vehicle: string) => {
  const icons = {
    'Single Motorcycle': require('@/assets/icons/SingleMotorcycle-NoBG.png'),
    'Tricycle': require('@/assets/icons/Tricycle-NoBG.png'),
    'Cab': require('@/assets/icons/Car-NoBG.png'),
  };
  return icons[vehicle as keyof typeof icons] || require('@/assets/icons/SingleMotorcycle-NoBG.png');
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'COMPLETED':
      return '#4CAF50'; // Green color for success
    case 'SEARCHING_FOR_RIDER':
      return '#FFC107'; // Amber color for warning
    case 'START':
    case 'ARRIVED':
      return Colors.primary;
    default:
      return Colors.text;
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'COMPLETED':
      return 'Completed';
    case 'SEARCHING_FOR_RIDER':
      return 'Searching';
    case 'START':
      return 'Started';
    case 'ARRIVED':
      return 'Arrived';
    default:
      return status;
  }
};

const RideHistoryItem: React.FC<RideHistoryItemProps> = ({ ride, onPress, isRider = false }) => {
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [riderRating, setRiderRating] = useState<any>(null);
  
  const formattedDate = formatDate(new Date(ride.createdAt));
  const vehicleIcon = getVehicleIcon(ride.vehicle);
  const statusColor = getStatusColor(ride.status);
  const statusText = getStatusText(ride.status);
  
  // Debug logging (can be removed in production)
  // console.log('RideHistoryItem - Vehicle:', ride.vehicle, 'Icon:', vehicleIcon);
  
  // Check if the ride has already been rated and get rider rating
  useEffect(() => {
    if (!isRider && ride.status === 'COMPLETED' && ride._id) {
      checkIfRideRated();
      if (ride.rider?._id) {
        fetchRiderRating();
      }
    }
  }, [ride._id, isRider, ride.status]);

  const checkIfRideRated = async () => {
    try {
      setLoading(true);
      const result = await checkRideRating(ride._id);
      setHasRated(result.rated);
    } catch (error) {
      console.error('Error checking if ride is rated:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRiderRating = async () => {
    try {
      if (ride.rider?._id) {
        const ratingData = await getRiderRatings(ride.rider._id);
        // Ensure we have valid rating data before setting it
        if (ratingData && typeof ratingData.averageRating === 'number' && !isNaN(ratingData.averageRating)) {
          setRiderRating(ratingData);
        } else {
          console.log('Invalid rating data received:', ratingData);
          setRiderRating(null);
        }
      }
    } catch (error) {
      console.error('Error fetching rider rating:', error);
      setRiderRating(null);
    }
  };
  
  // Format vehicle name for display
  const getVehicleName = (vehicle: string) => {
    switch (vehicle) {
      case 'Single Motorcycle':
        return 'Single Motorcycle';
      case 'Tricycle':
        return 'Tricycle';
      case 'Cab':
        return 'Four Wheel';
      default:
        return vehicle;
    }
  };

  const handleRateRide = (e: any) => {
    e.stopPropagation();
    setRatingModalVisible(true);
  };

  // Determine if we should show the rate button
  const shouldShowRateButton = !isRider && ride.status === 'COMPLETED' && ride.rider && !hasRated;

  // Get rider full name with smart fallbacks
  const getRiderName = () => {
    if (!ride.rider) return 'No rider assigned';
    console.log('🏍️ Rider data:', JSON.stringify(ride.rider, null, 2));
    
    // Try multiple field combinations
    const firstName = (ride.rider.firstName || '').trim();
    const lastName = (ride.rider.lastName || '').trim();
    const fullName = `${firstName} ${lastName}`.trim();
    
    // Check for alternative name fields
    const name = (ride.rider as any).name || '';
    const username = (ride.rider as any).username || '';
    const displayName = (ride.rider as any).displayName || '';
    
    // Fallback to email or phone if name is not available
    const email = (ride.rider as any).email || '';
    const phone = ride.rider.phone || '';
    
    console.log('🏍️ Rider name parts:', { firstName, lastName, fullName, name, username, displayName, email, phone });
    
    // Smart name resolution with better fallbacks
    if (fullName && fullName !== 'Customer' && fullName !== 'Rider') {
      return fullName;
    }
    
    if (name && name.trim()) return name.trim();
    if (displayName && displayName.trim()) return displayName.trim();
    if (username && username.trim()) return username.trim();
    
    if (email && email.includes('@')) {
      const emailPart = email.split('@')[0];
      // Convert email username to readable name
      const readableName = emailPart
        .split(/[._-]/)
        .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ');
      return readableName || emailPart;
    }
    
    if (phone && phone.length >= 4) {
      return `Rider ${phone.slice(-4)}`;
    }
    
    return `Rider ${ride.rider._id?.slice(-4) || 'Unknown'}`;
  };

  // Get customer full name with smart fallbacks
  const getCustomerName = () => {
    console.log('👤 Customer data:', JSON.stringify(ride.customer, null, 2));
    
    // Try multiple field combinations
    const firstName = (ride.customer.firstName || '').trim();
    const lastName = (ride.customer.lastName || '').trim();
    const fullName = `${firstName} ${lastName}`.trim();
    
    // Check for alternative name fields
    const name = (ride.customer as any).name || '';
    const username = (ride.customer as any).username || '';
    const displayName = (ride.customer as any).displayName || '';
    
    // Fallback to email or phone if name is not available
    const email = (ride.customer as any).email || '';
    const phone = ride.customer.phone || '';
    
    console.log('👤 Customer name parts:', { 
      firstName, lastName, fullName, name, username, displayName, email, phone 
    });
    
    // Smart name resolution with better fallbacks
    if (fullName && fullName !== 'Customer' && fullName !== 'Rider') {
      return fullName;
    }
    
    if (name && name.trim()) return name.trim();
    if (displayName && displayName.trim()) return displayName.trim();
    if (username && username.trim()) return username.trim();
    
    if (email && email.includes('@')) {
      const emailPart = email.split('@')[0];
      // Convert email username to readable name
      const readableName = emailPart
        .split(/[._-]/)
        .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ');
      return readableName || emailPart;
    }
    
    if (phone && phone.length >= 4) {
      return `Customer ${phone.slice(-4)}`;
    }
    
    return `Customer ${ride.customer._id?.slice(-4) || 'Unknown'}`;
  };

  // Handle card press to expand/collapse
  const handleCardPress = () => {
    setExpanded(!expanded);
  };

  // Format date and time separately
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const dateStr = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    return { dateStr, timeStr };
  };

  const { dateStr, timeStr } = formatDateTime(ride.createdAt);

  return (
    <>
      <TouchableOpacity style={[styles.container, expanded && styles.expandedContainer]} onPress={handleCardPress}>
        <View style={styles.mainContent}>
          <View style={styles.headerSection}>
            <View style={styles.iconContainer}>
              <Image source={vehicleIcon} style={styles.vehicleIcon} />
            </View>
            
            <View style={styles.headerInfo}>
              <View style={styles.headerRow}>
                <CustomText fontFamily="Medium" fontSize={16} style={styles.vehicleText}>
                  {getVehicleName(ride.vehicle)}
                </CustomText>
                <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                  <CustomText fontFamily="Medium" fontSize={12} style={styles.statusText}>
                    {statusText}
                  </CustomText>
                </View>
              </View>
              
              <View style={styles.dateTimeRow}>
                <CustomText fontFamily="Regular" fontSize={12} style={styles.dateText}>
                  {dateStr} • {timeStr}
                </CustomText>
              </View>
            </View>
            
            <View style={styles.expandIcon}>
              <Ionicons 
                name={expanded ? "chevron-up" : "chevron-down"} 
                size={RFValue(20)} 
                color={Colors.text} 
              />
            </View>
          </View>
          
          <View style={styles.locationContainer}>
            <View style={styles.locationRow}>
              <View style={styles.dotStart} />
              <CustomText fontFamily="Regular" fontSize={12} numberOfLines={expanded ? 0 : 1} style={styles.locationText}>
                {ride.pickup.address}
              </CustomText>
            </View>
            
            <View style={styles.locationDivider} />
            
            <View style={styles.locationRow}>
              <View style={styles.dotEnd} />
              <CustomText fontFamily="Regular" fontSize={12} numberOfLines={expanded ? 0 : 1} style={styles.locationText}>
                {ride.drop.address}
              </CustomText>
            </View>
          </View>
          
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Ionicons name="location" size={RFValue(14)} color={Colors.primary} />
              <CustomText fontFamily="Regular" fontSize={12} style={styles.summaryText}>
                {ride.distance.toFixed(1)} km
              </CustomText>
            </View>
            
            <View style={styles.summaryItem}>
              <Ionicons name="cash" size={RFValue(14)} color="#4CAF50" />
              <CustomText fontFamily="Medium" fontSize={14} style={styles.fareText}>
                ₱{ride.fare.toFixed(2)}
              </CustomText>
            </View>
          </View>
          
          {/* Expanded Details */}
          {expanded && (
            <View style={styles.expandedContent}>
              <View style={styles.divider} />
              
              {/* Driver/Passenger Info */}
              <View style={styles.personSection}>
                <View style={styles.personHeader}>
                  <Ionicons 
                    name={isRider ? "person" : "car"} 
                    size={RFValue(16)} 
                    color={Colors.primary} 
                  />
                  <CustomText fontFamily="Medium" fontSize={14} style={styles.personTitle}>
                    {isRider ? 'Passenger' : 'Driver'}
                  </CustomText>
                </View>
                
                <View style={styles.personDetails}>
                  <CustomText fontFamily="Medium" fontSize={14} style={styles.personName}>
                    {isRider ? getCustomerName() : getRiderName()}
                  </CustomText>
                  
                  {!isRider && ride.rider?.vehicleType && (
                    <CustomText fontFamily="Regular" fontSize={12} style={styles.vehicleTypeText}>
                      Vehicle: {ride.rider.vehicleType}
                    </CustomText>
                  )}
                  
                  {!isRider && riderRating && typeof riderRating.averageRating === 'number' && riderRating.averageRating > 0 && (
                    <View style={styles.ratingContainer}>
                      <View style={styles.starsContainer}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Ionicons
                            key={star}
                            name={star <= Math.round(riderRating.averageRating) ? "star" : "star-outline"}
                            size={RFValue(12)}
                            color="#FFD700"
                          />
                        ))}
                      </View>
                      <CustomText fontFamily="Regular" fontSize={12} style={styles.ratingText}>
                        {riderRating.averageRating.toFixed(1)} ({riderRating.count || 0} reviews)
                      </CustomText>
                    </View>
                  )}
                </View>
              </View>
              
              {/* Trip Details */}
              <View style={styles.tripDetailsSection}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="information-circle" size={RFValue(16)} color={Colors.primary} />
                  <CustomText fontFamily="Medium" fontSize={14} style={styles.sectionTitle}>
                    Trip Details
                  </CustomText>
                </View>
                
                <View style={styles.detailsGrid}>
                  <View style={styles.detailItem}>
                    <CustomText fontFamily="Regular" fontSize={12} style={styles.detailLabel}>
                      Distance
                    </CustomText>
                    <CustomText fontFamily="Medium" fontSize={14} style={styles.detailValue}>
                      {ride.distance.toFixed(1)} km
                    </CustomText>
                  </View>
                  
                  <View style={styles.detailItem}>
                    <CustomText fontFamily="Regular" fontSize={12} style={styles.detailLabel}>
                      Fare
                    </CustomText>
                    <CustomText fontFamily="Medium" fontSize={14} style={styles.detailValue}>
                      ₱{ride.fare.toFixed(2)}
                    </CustomText>
                  </View>
                  
                  {ride.otp && (
                    <View style={styles.detailItem}>
                      <CustomText fontFamily="Regular" fontSize={12} style={styles.detailLabel}>
                        OTP
                      </CustomText>
                      <CustomText fontFamily="Medium" fontSize={14} style={styles.otpValue}>
                        {ride.otp}
                      </CustomText>
                    </View>
                  )}
                </View>
              </View>
              
              {/* Action Buttons */}
              {!isRider && ride.rider && (
                <View style={styles.actionSection}>
                  {shouldShowRateButton && (
                    <TouchableOpacity 
                      style={styles.rateButton}
                      onPress={handleRateRide}
                    >
                      <Ionicons name="star" size={RFValue(16)} color="#FFFFFF" />
                      <CustomText fontFamily="Medium" fontSize={14} style={styles.rateButtonText}>
                        Rate Driver
                      </CustomText>
                    </TouchableOpacity>
                  )}
                  
                  {hasRated && (
                    <View style={styles.ratedBadge}>
                      <Ionicons name="checkmark-circle" size={RFValue(16)} color="#FFFFFF" />
                      <CustomText fontFamily="Medium" fontSize={14} style={styles.ratedText}>
                        Rated
                      </CustomText>
                    </View>
                  )}
                </View>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
      
      {/* Only show rating modal for customers (not riders) and only if the ride hasn't been rated yet */}
      {!isRider && ride.rider && !hasRated && (
        <RatingModal 
          visible={ratingModalVisible} 
          onClose={() => {
            setRatingModalVisible(false);
            // Check if the ride has been rated after closing the modal
            checkIfRideRated();
          }} 
          rideId={ride._id}
          riderName={getRiderName()}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  expandedContainer: {
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  mainContent: {
    flex: 1,
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    width: RFValue(48),
    height: RFValue(48),
    borderRadius: RFValue(24),
    backgroundColor: Colors.secondary_light,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  vehicleIcon: {
    width: RFValue(28),
    height: RFValue(28),
    resizeMode: 'contain' as 'contain',
  },
  headerInfo: {
    flex: 1,
    marginRight: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  vehicleText: {
    color: Colors.text,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: RFValue(10),
  },
  dateTimeRow: {
    marginTop: 2,
  },
  dateText: {
    color: '#757575',
  },
  expandIcon: {
    padding: 4,
  },
  locationContainer: {
    marginBottom: 12,
    paddingLeft: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  dotStart: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginRight: 12,
  },
  dotEnd: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 12,
  },
  locationDivider: {
    width: 2,
    height: 12,
    backgroundColor: '#E0E0E0',
    marginLeft: 4,
    marginVertical: 2,
  },
  locationText: {
    flex: 1,
    color: Colors.text,
    lineHeight: 18,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryText: {
    color: '#757575',
    marginLeft: 6,
  },
  fareText: {
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 6,
  },
  expandedContent: {
    marginTop: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#E8E8E8',
    marginBottom: 16,
  },
  personSection: {
    marginBottom: 16,
  },
  personHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  personTitle: {
    color: Colors.text,
    marginLeft: 8,
  },
  personDetails: {
    paddingLeft: 24,
  },
  personName: {
    color: Colors.text,
    marginBottom: 4,
  },
  vehicleTypeText: {
    color: '#757575',
    marginBottom: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: 8,
  },
  ratingText: {
    color: '#757575',
  },
  tripDetailsSection: {
    marginBottom: 16,
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
  detailsGrid: {
    paddingLeft: 24,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    color: '#757575',
    flex: 1,
  },
  detailValue: {
    color: Colors.text,
    fontWeight: '500',
  },
  otpValue: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: RFValue(16),
  },
  actionSection: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  rateButtonText: {
    color: '#FFFFFF',
    marginLeft: 8,
  },
  ratedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  ratedText: {
    color: '#FFFFFF',
    marginLeft: 8,
  },
  // Legacy styles for backward compatibility
  contentContainer: {
    flex: 1,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailsContainer: {
    flexDirection: 'row',
  },
  personInfo: {
    marginTop: 4,
    color: '#757575',
  },
  riderInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  rateButtonIcon: {
    marginLeft: 2,
  },
  ratedIcon: {
    marginRight: 4,
  },
});

export default RideHistoryItem;
