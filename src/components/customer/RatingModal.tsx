import React, { useState, useEffect } from 'react';
import { 
  View, 
  Modal, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RFValue } from 'react-native-responsive-fontsize';
import { Colors } from '@/utils/Constants';
import CustomText from '@/components/shared/CustomText';
import { submitRating, checkRideRating } from '@/service/rideService';

interface RatingModalProps {
  visible: boolean;
  onClose: () => void;
  rideId: string;
  riderName?: string;
}

const RatingModal: React.FC<RatingModalProps> = ({ 
  visible, 
  onClose, 
  rideId,
  riderName = 'Driver'
}) => {
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>(''); // ✅ NICKNAME STATE
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [existingRating, setExistingRating] = useState<any>(null);
  const [alreadyRated, setAlreadyRated] = useState<boolean>(false);

  useEffect(() => {
    if (visible && rideId) {
      checkExistingRating();
    }
  }, [visible, rideId]);

  const checkExistingRating = async () => {
    setLoading(true);
    const result = await checkRideRating(rideId);
    if (result.rated && result.rating) {
      setRating(result.rating.rating);
      setComment(result.rating.comment || '');
      setDisplayName(result.rating.displayName || ''); // ✅ LOAD EXISTING NICKNAME
      setExistingRating(result.rating);
      setAlreadyRated(true);
    } else {
      setRating(0);
      setComment('');
      setDisplayName(''); // ✅ RESET NICKNAME
      setExistingRating(null);
      setAlreadyRated(false);
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      return;
    }

    setSubmitting(true);
    // ✅ SEND NICKNAME TO SERVER
    const result = await submitRating(rideId, rating, comment, displayName);
    setSubmitting(false);
    
    if (result.success) {
      onClose();
    }
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity 
          key={i} 
          onPress={() => setRating(i)}
          style={styles.starContainer}
        >
          <Ionicons 
            name={i <= rating ? 'star' : 'star-outline'} 
            size={RFValue(32)} 
            color={i <= rating ? Colors.primary : '#CCCCCC'} 
          />
        </TouchableOpacity>
      );
    }
    return stars;
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={RFValue(24)} color="#000000" />
          </TouchableOpacity>
          
          {loading ? (
            <ActivityIndicator size="large" color={Colors.primary} />
          ) : (
            <>
              <CustomText fontFamily="Bold" fontSize={18} style={styles.title}>
                {alreadyRated ? 'Your Rating' : 'Rate Your Ride'}
              </CustomText>
              
              <CustomText fontFamily="Regular" fontSize={14} style={styles.subtitle}>
                {alreadyRated 
                  ? `You rated your ride with ${riderName}`
                  : `How was your ride with ${riderName}?`
                }
              </CustomText>
              
              <View style={styles.starsContainer}>
                {alreadyRated ? (
                  // Read-only stars for already rated rides
                  Array.from({ length: 5 }).map((_, i) => (
                    <View key={i} style={styles.starContainer}>
                      <Ionicons 
                        name={i < rating ? 'star' : 'star-outline'} 
                        size={RFValue(32)} 
                        color={i < rating ? Colors.primary : '#CCCCCC'} 
                      />
                    </View>
                  ))
                ) : (
                  // Interactive stars for unrated rides
                  renderStars()
                )}
              </View>
              
              {/* ✅ NICKNAME INPUT FIELD */}
              <View style={styles.nicknameContainer}>
                <CustomText fontFamily="Medium" fontSize={14} style={styles.nicknameLabel}>
                  {alreadyRated ? 'Your nickname' : 'Nickname/Alias (Optional)'}
                </CustomText>
                <CustomText fontFamily="Regular" fontSize={11} style={styles.helperText}>
                  🔒 Your real identity stays anonymous
                </CustomText>
                {alreadyRated ? (
                  <View style={styles.readOnlyNickname}>
                    <CustomText fontFamily="Regular" fontSize={14} style={styles.nicknameText}>
                      {displayName || 'Anonymous Passenger'}
                    </CustomText>
                  </View>
                ) : (
                  <>
                    <TextInput
                      style={styles.nicknameInput}
                      placeholder="e.g., Happy Rider, John D."
                      placeholderTextColor="#999999"
                      value={displayName}
                      onChangeText={setDisplayName}
                      maxLength={50}
                    />
                    <CustomText fontFamily="Regular" fontSize={10} style={styles.characterCount}>
                      {displayName.length}/50 characters
                    </CustomText>
                  </>
                )}
              </View>

              <View style={styles.commentContainer}>
                <CustomText fontFamily="Medium" fontSize={14} style={styles.commentLabel}>
                  {alreadyRated ? 'Your comment' : 'Leave a comment (optional)'}
                </CustomText>
                {alreadyRated ? (
                  <View style={styles.readOnlyComment}>
                    <CustomText fontFamily="Regular" fontSize={14} style={styles.commentText}>
                      {comment || 'No comment provided'}
                    </CustomText>
                  </View>
                ) : (
                  <TextInput
                    style={styles.commentInput}
                    placeholder="Share your experience..."
                    placeholderTextColor="#999999"
                    multiline={true}
                    numberOfLines={3}
                    value={comment}
                    onChangeText={setComment}
                  />
                )}
              </View>
              
              {!alreadyRated && (
                <TouchableOpacity 
                  style={[
                    styles.submitButton,
                    rating === 0 && styles.disabledButton
                  ]}
                  onPress={handleSubmit}
                  disabled={rating === 0 || submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <CustomText fontFamily="Bold" fontSize={16} style={styles.submitButtonText}>
                      Submit Rating
                    </CustomText>
                  )}
                </TouchableOpacity>
              )}
              
              {alreadyRated && (
                <CustomText fontFamily="Medium" fontSize={14} style={styles.alreadyRatedText}>
                  You've already rated this ride. Ratings cannot be edited after submission.
                </CustomText>
              )}
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
  },
  title: {
    marginTop: 10,
    marginBottom: 5,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    color: '#757575',
    marginBottom: 20,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  starContainer: {
    padding: 5,
  },
  commentContainer: {
    width: '100%',
    marginBottom: 20,
  },
  commentLabel: {
    marginBottom: 5,
    color: '#555555',
  },
  commentInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 10,
    textAlignVertical: 'top',
    minHeight: 80,
    fontFamily: 'Regular',
    fontSize: RFValue(14),
  },
  submitButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  submitButtonText: {
    color: '#FFFFFF',
  },
  readOnlyComment: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    width: '100%',
    minHeight: 80,
    justifyContent: 'flex-start',
  },
  commentText: {
    color: '#555555',
  },
  alreadyRatedText: {
    color: '#757575',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 5,
  },
  // ✅ NICKNAME STYLES
  nicknameContainer: {
    width: '100%',
    marginBottom: 15,
  },
  nicknameLabel: {
    marginBottom: 3,
    color: '#555555',
  },
  helperText: {
    color: '#757575',
    marginBottom: 8,
    fontSize: RFValue(11),
  },
  nicknameInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 10,
    fontFamily: 'Regular',
    fontSize: RFValue(14),
    backgroundColor: '#FFFFFF',
  },
  readOnlyNickname: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    width: '100%',
  },
  nicknameText: {
    color: '#555555',
  },
  characterCount: {
    textAlign: 'right',
    color: '#999999',
    marginTop: 4,
    fontSize: RFValue(10),
  },
});

export default RatingModal;
