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

interface RejectionReasonModalProps {
  visible: boolean;
  reason: string;
  deadline: string | null;
  onClose: () => void;
}

const RejectionReasonModal: React.FC<RejectionReasonModalProps> = ({
  visible,
  reason,
  deadline,
  onClose,
}) => {
  const formatDeadline = (deadlineStr: string | null) => {
    if (!deadlineStr) return null;
    
    const deadlineDate = new Date(deadlineStr);
    const now = new Date();
    
    // Check if deadline has passed
    if (deadlineDate <= now) {
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
    
    return deadlineDate.toLocaleDateString('en-US', options);
  };

  const formattedDeadline = formatDeadline(deadline);

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
              <Ionicons name="close-circle" size={50} color="#ff6b6b" />
            </View>
            <CustomText fontFamily="Bold" fontSize={20} style={styles.title}>
              Account Disapproved
            </CustomText>
          </View>

          {/* Content */}
          <ScrollView style={styles.content}>
            <View style={styles.section}>
              <CustomText fontFamily="Medium" fontSize={14} style={styles.label}>
                Reason for Disapproval:
              </CustomText>
              <View style={styles.reasonBox}>
                <CustomText fontSize={14} style={styles.reasonText}>
                  {reason || 'No reason provided'}
                </CustomText>
              </View>
            </View>

            {formattedDeadline && (
              <View style={styles.section}>
                <CustomText fontFamily="Medium" fontSize={14} style={styles.label}>
                  Auto-Unblock Date:
                </CustomText>
                <View style={styles.deadlineBox}>
                  <Ionicons name="time-outline" size={20} color="#4CAF50" style={styles.deadlineIcon} />
                  <CustomText fontSize={13} style={styles.deadlineText}>
                    {formattedDeadline}
                  </CustomText>
                </View>
                <CustomText fontSize={12} style={styles.deadlineInfo}>
                  Your account will be automatically approved after this date
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
                    Review the reason for disapproval
                  </CustomText>
                </View>
                <View style={styles.infoItem}>
                  <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                  <CustomText fontSize={13} style={styles.infoText}>
                    Contact support if you believe this is an error
                  </CustomText>
                </View>
                {formattedDeadline && (
                  <View style={styles.infoItem}>
                    <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                    <CustomText fontSize={13} style={styles.infoText}>
                      Wait until the auto-unblock date to try again
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
  reasonBox: {
    backgroundColor: '#ffebee',
    borderLeftWidth: 4,
    borderLeftColor: '#ff6b6b',
    padding: 12,
    borderRadius: 8,
  },
  reasonText: {
    color: '#c62828',
    lineHeight: 20,
  },
  deadlineBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  deadlineIcon: {
    marginRight: 8,
  },
  deadlineText: {
    color: '#2e7d32',
    flex: 1,
  },
  deadlineInfo: {
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

export default RejectionReasonModal;
