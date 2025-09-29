import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RFValue } from 'react-native-responsive-fontsize';
import { Colors } from '@/utils/Constants';
import CustomText from '@/components/shared/CustomText';
import RideHistoryItem from '@/components/shared/RideHistoryItem';
import { getRideHistory } from '@/service/rideService';
import { router } from 'expo-router';

interface RideHistoryProps {
  activeTab?: string;
}

const RideHistory: React.FC<RideHistoryProps> = ({ activeTab = 'all' }) => {
  const [rides, setRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRideHistory = async (status?: string) => {
    try {
      setLoading(true);
      // Always fetch completed rides for history
      const rideData = await getRideHistory('COMPLETED');
      setRides(rideData);
    } catch (error) {
      console.error('Error fetching ride history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRideHistory(activeTab);
  }, [activeTab]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRideHistory(activeTab);
  };

  const handleRidePress = (rideId: string) => {
    // Navigate to ride details or live tracking if ride is active
    const ride = rides.find(r => r._id === rideId);
    if (ride && ride.status !== 'COMPLETED') {
      router.navigate({
        pathname: '/customer/liveride',
        params: { id: rideId }
      });
    }
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
      {rides.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="car-outline" size={RFValue(48)} color="#E0E0E0" />
          </View>
          <CustomText fontFamily="Bold" fontSize={18} style={styles.emptyTitle}>
            No Rides Yet
          </CustomText>
          <CustomText fontSize={14} style={styles.emptyText}>
            Your completed rides will appear here.{'\n'}Start your first journey to build your history!
          </CustomText>
        </View>
      ) : (
        <FlatList
          data={rides}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <RideHistoryItem 
              ride={item} 
              onPress={() => handleRidePress(item._id)}
              isRider={false}
            />
          )}
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
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyIconContainer: {
    width: RFValue(80),
    height: RFValue(80),
    borderRadius: RFValue(40),
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyText: {
    color: '#757575',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default RideHistory;
