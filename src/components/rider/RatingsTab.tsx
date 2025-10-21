import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { Colors } from '@/utils/Constants';
import CustomText from '@/components/shared/CustomText';
import { getMyRatings } from '@/service/rideService';
import { Ionicons } from '@expo/vector-icons';
import { RFValue } from 'react-native-responsive-fontsize';
import { formatDate } from '@/utils/Helpers';

interface RatingItemProps {
  rating: {
    _id: string;
    rating: number;
    comment?: string;
    createdAt: string;
    displayName?: string;
    isAnonymous?: boolean;
    ride: {
      vehicle: string;
      pickup: {
        address: string;
      };
      drop: {
        address: string;
      };
      distance: number;
      fare: number;
      createdAt: string;
    };
  };
}

const RatingItem: React.FC<RatingItemProps> = ({ rating }) => {
  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons 
          key={i} 
          name={i <= rating.rating ? 'star' : 'star-outline'} 
          size={RFValue(16)} 
          color={i <= rating.rating ? Colors.primary : '#CCCCCC'} 
          style={styles.star}
        />
      );
    }
    return stars;
  };

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

  const formattedDate = formatDate(new Date(rating.createdAt));
  // Use displayName for anonymity - never show real customer name
  const displayName = rating.displayName || 'Anonymous Passenger';

  // Add null checks for ride property and its nested properties
  const rideVehicle = rating.ride?.vehicle ? getVehicleName(rating.ride.vehicle) : 'Unknown';
  const rideDistance = rating.ride?.distance !== undefined && rating.ride.distance !== null ? rating.ride.distance : 0;
  const rideFare = rating.ride?.fare !== undefined && rating.ride.fare !== null ? rating.ride.fare : 0;

  return (
    <View style={styles.ratingItem}>
      <View style={styles.ratingHeader}>
        <View style={styles.customerInfo}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={RFValue(16)} color="#FFFFFF" />
          </View>
          <View style={styles.nameContainer}>
            <CustomText fontFamily="Medium" fontSize={14} numberOfLines={1}>
              {displayName}
            </CustomText>
          </View>
        </View>
        <View style={styles.dateContainer}>
          <CustomText fontFamily="Regular" fontSize={11} style={styles.dateText} numberOfLines={1}>
            {formattedDate}
          </CustomText>
        </View>
      </View>

      <View style={styles.ratingStars}>
        {renderStars()}
      </View>

      {rating.comment && (
        <View style={styles.commentContainer}>
          <CustomText fontFamily="Regular" fontSize={14} style={styles.commentText}>
            "{rating.comment}"
          </CustomText>
        </View>
      )}

      {/* Ride details section temporarily commented out due to data inconsistency issues.
         Will be implemented properly in the future.
      */}
      {/*
      {rating.ride && (
        <View style={styles.rideDetails}>
          <CustomText fontFamily="Regular" fontSize={12} style={styles.rideInfoText}>
            {rideVehicle} • {rideDistance > 0 ? `${rideDistance.toFixed(1)} km` : 'Unknown'} • {rideFare > 0 ? `₱${rideFare.toFixed(2)}` : 'Unknown'}
          </CustomText>
        </View>
      )}
      */}
    </View>
  );
};

const RatingsTab: React.FC = () => {
  const [ratings, setRatings] = useState<any[]>([]);
  const [averageRating, setAverageRating] = useState<string>('0.0');
  const [totalRatings, setTotalRatings] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchRatings = async () => {
    try {
      setLoading(true);
      const data = await getMyRatings();
      setRatings(data.ratings || []);
      setAverageRating(data.averageRating || '0.0');
      setTotalRatings(data.count || 0);
    } catch (error) {
      console.error('Error fetching ratings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRatings();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRatings();
  };

  const renderRatingDistribution = () => {
    // Count ratings for each star level
    const ratingCounts = [0, 0, 0, 0, 0]; // 5 stars, 4 stars, 3 stars, 2 stars, 1 star
    
    ratings.forEach(rating => {
      if (rating.rating >= 1 && rating.rating <= 5) {
        ratingCounts[5 - rating.rating]++;
      }
    });
    
    return (
      <View style={styles.ratingDistribution}>
        {[5, 4, 3, 2, 1].map((star, index) => (
          <View key={star} style={styles.distributionRow}>
            <View style={styles.starLabel}>
              <CustomText fontFamily="Regular" fontSize={12}>{star}</CustomText>
              <Ionicons name="star" size={RFValue(12)} color={Colors.primary} style={styles.distributionStar} />
            </View>
            
            <View style={styles.progressBarContainer}>
              <View 
                style={[
                  styles.progressBar, 
                  { 
                    width: totalRatings > 0 
                      ? `${(ratingCounts[index] / totalRatings) * 100}%` 
                      : '0%' 
                  }
                ]} 
              />
            </View>
            
            <CustomText fontFamily="Regular" fontSize={12} style={styles.countText}>
              {ratingCounts[index]}
            </CustomText>
          </View>
        ))}
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.summaryContainer}>
        <View style={styles.averageRatingContainer}>
          <CustomText fontFamily="Bold" fontSize={36} style={styles.averageRatingText}>
            {averageRating}
          </CustomText>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map(star => (
              <Ionicons 
                key={star} 
                name={star <= parseFloat(averageRating) ? 'star' : 'star-outline'} 
                size={RFValue(16)} 
                color={star <= parseFloat(averageRating) ? Colors.primary : '#CCCCCC'} 
                style={styles.summaryStar}
              />
            ))}
          </View>
          <CustomText fontFamily="Regular" fontSize={14} style={styles.totalRatingsText}>
            {totalRatings} {totalRatings === 1 ? 'rating' : 'ratings'}
          </CustomText>
        </View>
        
        {renderRatingDistribution()}
      </View>

      <CustomText fontFamily="Medium" fontSize={16} style={styles.sectionTitle}>
        Passenger Reviews
      </CustomText>

      {ratings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <CustomText fontFamily="Medium" fontSize={14} style={styles.emptyText}>
            No ratings yet
          </CustomText>
        </View>
      ) : (
        <FlatList
          data={ratings}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <RatingItem rating={item} />}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  averageRatingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#EEEEEE',
    paddingRight: 16,
  },
  averageRatingText: {
    color: Colors.primary,
  },
  starsRow: {
    flexDirection: 'row',
    marginVertical: 5,
  },
  summaryStar: {
    marginHorizontal: 2,
  },
  totalRatingsText: {
    color: '#757575',
  },
  ratingDistribution: {
    flex: 2,
    paddingLeft: 16,
    justifyContent: 'center',
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  starLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 30,
  },
  distributionStar: {
    marginLeft: 2,
  },
  progressBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#EEEEEE',
    borderRadius: 4,
    marginHorizontal: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  countText: {
    width: 20,
    textAlign: 'right',
    color: '#757575',
  },
  sectionTitle: {
    padding: 16,
    paddingBottom: 8,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#757575',
    textAlign: 'center',
  },
  ratingItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  ratingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  nameContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  dateContainer: {
    flexShrink: 0,
    minWidth: 80,
    alignItems: 'flex-end',
  },
  avatarContainer: {
    width: RFValue(30),
    height: RFValue(30),
    borderRadius: RFValue(15),
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  dateText: {
    color: '#757575',
    textAlign: 'right',
  },
  ratingStars: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  star: {
    marginRight: 3,
  },
  commentContainer: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  commentText: {
    fontStyle: 'italic',
    color: '#555555',
  },
  rideDetails: {
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingTop: 10,
  },
  rideInfoText: {
    color: '#757575',
  },
});

export default RatingsTab;
