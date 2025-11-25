import React, { useState } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import CustomText from '../shared/CustomText';
import { Ionicons } from '@expo/vector-icons';

interface CancelRideModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  loading?: boolean;
}

const CancelRideModal: React.FC<CancelRideModalProps> = ({
  visible,
  onClose,
  onConfirm,
  loading = false,
}) => {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customReason, setCustomReason] = useState<string>('');

  const predefinedReasons = [
    'Vehicle issue',
    'Emergency',
    'Passenger not responding',
    'Wrong pickup location',
    'Unsafe situation',
    'Too far from pickup',
    'Other',
  ];

  const handleConfirm = () => {
    const finalReason = selectedReason === 'Other' ? customReason : selectedReason;
    
    if (!finalReason || finalReason.trim() === '') {
      Alert.alert('Required', 'Please select or enter a cancellation reason');
      return;
    }

    onConfirm(finalReason.trim());
    // Reset state
    setSelectedReason('');
    setCustomReason('');
  };

  const handleClose = () => {
    setSelectedReason('');
    setCustomReason('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <CustomText fontFamily="SemiBold" fontSize={18}>
              Cancel Ride
            </CustomText>
            <TouchableOpacity onPress={handleClose} disabled={loading}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <CustomText fontSize={14} style={styles.subtitle}>
              Please select a reason for cancellation:
            </CustomText>

            {predefinedReasons.map((reason) => (
              <TouchableOpacity
                key={reason}
                style={[
                  styles.reasonOption,
                  selectedReason === reason && styles.reasonOptionSelected,
                ]}
                onPress={() => setSelectedReason(reason)}
                disabled={loading}
              >
                <View style={styles.radioButton}>
                  {selectedReason === reason && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
                <CustomText
                  fontSize={14}
                  style={[
                    styles.reasonText,
                    selectedReason === reason && styles.reasonTextSelected,
                  ]}
                >
                  {reason}
                </CustomText>
              </TouchableOpacity>
            ))}

            {selectedReason === 'Other' && (
              <View style={styles.customReasonContainer}>
                <CustomText fontSize={12} style={styles.label}>
                  Please specify:
                </CustomText>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your reason..."
                  value={customReason}
                  onChangeText={setCustomReason}
                  multiline
                  numberOfLines={3}
                  maxLength={200}
                  editable={!loading}
                />
                <CustomText fontSize={10} style={styles.charCount}>
                  {customReason.length}/200
                </CustomText>
              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
              disabled={loading}
            >
              <CustomText style={styles.cancelButtonText}>
                Keep Ride
              </CustomText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.confirmButton,
                loading && styles.buttonDisabled,
              ]}
              onPress={handleConfirm}
              disabled={loading}
            >
              <CustomText style={styles.confirmButtonText}>
                {loading ? 'Cancelling...' : 'Confirm Cancel'}
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
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  content: {
    padding: 20,
    maxHeight: 400,
  },
  subtitle: {
    color: '#666',
    marginBottom: 15,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  reasonOptionSelected: {
    borderColor: '#FF6B6B',
    backgroundColor: '#FFF5F5',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ccc',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF6B6B',
  },
  reasonText: {
    color: '#333',
    flex: 1,
  },
  reasonTextSelected: {
    color: '#FF6B6B',
    fontWeight: '600',
  },
  customReasonContainer: {
    marginTop: 10,
  },
  label: {
    color: '#666',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    backgroundColor: '#f9f9f9',
  },
  charCount: {
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#FF6B6B',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});

export default CancelRideModal;
