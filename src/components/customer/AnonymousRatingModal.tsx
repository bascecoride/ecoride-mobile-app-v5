import React, { useState } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomText from '../shared/CustomText';
import { Colors } from '@/utils/Constants';
import { createRating } from '@/service/rideService';

interface AnonymousRatingModalProps {
  visible: boolean;
  onClose: () => void;
  rideId: string;
  riderName?: string;
}

const AnonymousRatingModal: React.FC<AnonymousRatingModalProps> = ({
  visible,
  onClose,
  rideId,
  riderName,
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a star rating before submitting.');
      return;
    }

    try {
      setSubmitting(true);
      
      // Submit rating with optional display name
      await createRating({
        rideId,
        rating,
        comment: comment.trim() || undefined,
        displayName: displayName.trim() || undefined, // If empty, will default to "Anonymous Passenger"
      });

      Alert.alert(
        'Thank You!',
        'Your anonymous rating has been submitted successfully.',
        [
          {
            text: 'OK',
            onPress: () => {
              resetForm();
              onClose();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error submitting rating:', error);
      Alert.alert(
        'Error',
        error?.response?.data?.message || 'Failed to submit rating. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setRating(0);
    setComment('');
    setDisplayName('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleClose}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.modalContent}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Header */}
              <View style={styles.header}>
                <CustomText fontFamily="Bold" fontSize={18}>
                  Rate Your Ride
                </CustomText>
                <TouchableOpacity onPress={handleClose}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              {/* Rider Info */}
              {riderName && (
                <View style={styles.riderInfo}>
                  <CustomText fontSize={14} style={{ color: '#666' }}>
                    How was your ride with{' '}
                    <CustomText fontFamily="Medium">{riderName}</CustomText>?
                  </CustomText>
                </View>
              )}

              {/* Star Rating */}
              <View style={styles.ratingSection}>
                <CustomText fontFamily="SemiBold" fontSize={16} style={styles.sectionTitle}>
                  Your Rating
                </CustomText>
                <View style={styles.starsContainer}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setRating(star)}
                      style={styles.starButton}
                    >
                      <Ionicons
                        name={star <= rating ? 'star' : 'star-outline'}
                        size={40}
                        color={star <= rating ? '#ffc107' : '#ccc'}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                {rating > 0 && (
                  <CustomText fontSize={12} style={styles.ratingText}>
                    {rating === 5
                      ? 'Excellent!'
                      : rating === 4
                      ? 'Good'
                      : rating === 3
                      ? 'Average'
                      : rating === 2
                      ? 'Below Average'
                      : 'Poor'}
                  </CustomText>
                )}
              </View>

              {/* Nickname/Alias for Rater */}
              <View style={styles.section}>
                <CustomText fontFamily="SemiBold" fontSize={14} style={styles.sectionTitle}>
                  Nickname/Alias (Optional)
                </CustomText>
                <CustomText fontSize={11} style={styles.helperText}>
                  🔒 Your real identity stays anonymous. Add a nickname or alias if you'd like,
                  or leave blank to appear as "Anonymous Passenger"
                </CustomText>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Happy Rider, Satisfied Customer, John D."
                  value={displayName}
                  onChangeText={setDisplayName}
                  maxLength={50}
                  placeholderTextColor="#999"
                />
                <CustomText fontSize={10} style={styles.characterCount}>
                  {displayName.length}/50 characters
                </CustomText>
              </View>

              {/* Comment */}
              <View style={styles.section}>
                <CustomText fontFamily="SemiBold" fontSize={14} style={styles.sectionTitle}>
                  Comment (Optional)
                </CustomText>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Share your experience..."
                  value={comment}
                  onChangeText={setComment}
                  multiline
                  numberOfLines={4}
                  maxLength={500}
                  placeholderTextColor="#999"
                />
                <CustomText fontSize={10} style={styles.characterCount}>
                  {comment.length}/500 characters
                </CustomText>
              </View>

              {/* Privacy Notice */}
              <View style={styles.privacyNotice}>
                <Ionicons name="shield-checkmark" size={16} color="#4CAF50" />
                <CustomText fontSize={11} style={styles.privacyText}>
                  Your real name and contact information will never be shown to the rider.
                  Only your rating, optional nickname, and comment will be visible.
                </CustomText>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (rating === 0 || submitting) && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={rating === 0 || submitting}
              >
                <CustomText
                  fontFamily="SemiBold"
                  fontSize={16}
                  style={styles.submitButtonText}
                >
                  {submitting ? 'Submitting...' : 'Submit Anonymous Rating'}
                </CustomText>
              </TouchableOpacity>

              {/* Skip Button */}
              <TouchableOpacity style={styles.skipButton} onPress={handleClose}>
                <CustomText fontSize={14} style={styles.skipButtonText}>
                  Skip for Now
                </CustomText>
              </TouchableOpacity>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  riderInfo: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  ratingSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    marginBottom: 10,
    color: '#333',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 10,
  },
  starButton: {
    marginHorizontal: 5,
  },
  ratingText: {
    color: '#ffc107',
    marginTop: 5,
  },
  section: {
    marginBottom: 20,
  },
  helperText: {
    color: '#666',
    marginBottom: 10,
    lineHeight: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  characterCount: {
    textAlign: 'right',
    color: '#999',
    marginTop: 5,
  },
  privacyNotice: {
    flexDirection: 'row',
    backgroundColor: '#e8f5e9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  privacyText: {
    flex: 1,
    marginLeft: 8,
    color: '#2e7d32',
    lineHeight: 16,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: 'white',
  },
  skipButton: {
    padding: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#666',
  },
});

export default AnonymousRatingModal;
