import React from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomText from './CustomText';

interface PenaltyModalProps {
  visible: boolean;
  comment: string;
  liftDate: string | null;
  onClose: () => void;
}

const PenaltyModal: React.FC<PenaltyModalProps> = ({
  visible,
  comment,
  liftDate,
  onClose,
}) => {
  const formatLiftDate = (liftDateStr: string | null) => {
    if (!liftDateStr) return null;
    
    const liftDateObj = new Date(liftDateStr);
    const now = new Date();
    
    // Check if penalty has expired
    if (liftDateObj <= now) {
      return 'Expired - Please try logging in again';
    }
    
    // Format the date
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    
    return liftDateObj.toLocaleDateString('en-US', options);
  };

  const formattedLiftDate = formatLiftDate(liftDate);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="warning" size={50} color="#ff9800" />
            </View>
            <CustomText fontFamily="Bold" fontSize={20} style={styles.title}>
              Account Suspended
            </CustomText>
          </View>

          {/* Content */}
          <ScrollView style={styles.content}>
            <View style={styles.section}>
              <CustomText fontFamily="Medium" fontSize={14} style={styles.label}>
                Reason for Suspension:
              </CustomText>
              <View style={styles.commentBox}>
                <CustomText fontSize={14} style={styles.commentText}>
                  {comment || 'No reason provided'}
                </CustomText>
              </View>
            </View>

            {formattedLiftDate && (
              <View style={styles.section}>
                <CustomText fontFamily="Medium" fontSize={14} style={styles.label}>
                  Suspension Ends:
                </CustomText>
                <View style={styles.dateBox}>
                  <Ionicons name="calendar-outline" size={20} color="#ff9800" style={styles.dateIcon} />
                  <CustomText fontSize={13} style={styles.dateText}>
                    {formattedLiftDate}
                  </CustomText>
                </View>
                <CustomText fontSize={12} style={styles.dateInfo}>
                  Your account will be automatically restored after this date
                </CustomText>
              </View>
            )}

            <View style={styles.section}>
              <CustomText fontFamily="Medium" fontSize={14} style={styles.label}>
                What to do next:
              </CustomText>
              <View style={styles.infoBox}>
                <View style={styles.infoItem}>
                  <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                  <CustomText fontSize={13} style={styles.infoText}>
                    Review the reason for suspension
                  </CustomText>
                </View>
                <View style={styles.infoItem}>
                  <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                  <CustomText fontSize={13} style={styles.infoText}>
                    Contact support if you believe this is an error
                  </CustomText>
                </View>
                {formattedLiftDate && (
                  <View style={styles.infoItem}>
                    <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                    <CustomText fontSize={13} style={styles.infoText}>
                      Wait until the suspension period ends
                    </CustomText>
                  </View>
                )}
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <CustomText fontFamily="Medium" fontSize={16} style={styles.closeButtonText}>
                Close
              </CustomText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  header: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  iconContainer: {
    marginBottom: 12,
  },
  title: {
    color: '#333',
    textAlign: 'center',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    color: '#333',
    marginBottom: 8,
  },
  commentBox: {
    backgroundColor: '#fff8e1',
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
    padding: 12,
    borderRadius: 8,
  },
  commentText: {
    color: '#f57c00',
    lineHeight: 20,
  },
  dateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3e0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  dateIcon: {
    marginRight: 8,
  },
  dateText: {
    color: '#e65100',
    flex: 1,
  },
  dateInfo: {
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
  },
  infoBox: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  infoText: {
    color: '#555',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  closeButton: {
    backgroundColor: '#2196F3',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
  },
});

export default PenaltyModal;
