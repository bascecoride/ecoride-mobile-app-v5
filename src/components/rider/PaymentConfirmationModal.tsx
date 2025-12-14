import React from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomText from '@/components/shared/CustomText';

interface PaymentConfirmationModalProps {
  visible: boolean;
  onConfirm: () => void;
  fare: number;
  paymentMethod: string | null;
  isPWDRide?: boolean;
  originalFare?: number;
  discountAmount?: number;
  pwdDiscountPercentage?: number;
  isWaitingForPayment?: boolean; // New prop to show loading state
}

const PaymentConfirmationModal: React.FC<PaymentConfirmationModalProps> = ({
  visible,
  onConfirm,
  fare,
  paymentMethod,
  isPWDRide = false,
  originalFare,
  discountAmount,
  pwdDiscountPercentage,
  isWaitingForPayment = false,
}) => {
  const getPaymentMethodDisplay = () => {
    switch (paymentMethod) {
      case 'CASH':
        return 'Cash';
      case 'GCASH':
        return 'GCash';
      default:
        return 'Pending...';
    }
  };

  // Render payment icon based on method - using actual image assets
  const renderPaymentIcon = () => {
    if (isWaitingForPayment || !paymentMethod) {
      return <ActivityIndicator size="small" color="#4CAF50" />;
    }
    
    switch (paymentMethod) {
      case 'CASH':
        return (
          <Image
            source={require('@/assets/icons/rupee.png')}
            style={{ width: 28, height: 28 }}
            resizeMode="contain"
          />
        );
      case 'GCASH':
        return (
          <Image
            source={require('@/assets/images/gcash-logo.png')}
            style={{ width: 32, height: 32 }}
            resizeMode="contain"
          />
        );
      default:
        return <Ionicons name="help-circle-outline" size={24} color="#999" />;
    }
  };

  // If waiting for payment, show loading state
  if (isWaitingForPayment) {
    return (
      <Modal
        visible={visible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.overlay}>
          <View style={styles.modalContainer}>
            {/* Loading Icon */}
            <View style={styles.iconContainer}>
              <View style={[styles.successCircle, { backgroundColor: '#FF9800' }]}>
                <ActivityIndicator size="large" color="white" />
              </View>
            </View>

            {/* Title */}
            <CustomText fontFamily="Bold" fontSize={22} style={styles.title}>
              Waiting for Payment... ⏳
            </CustomText>

            {/* Subtitle */}
            <CustomText fontSize={14} style={styles.subtitle}>
              The passenger is selecting their payment method
            </CustomText>

            {/* Fare Display */}
            <View style={styles.paymentCard}>
              <View style={styles.amountSection}>
                <CustomText fontSize={12} style={styles.amountLabel}>
                  Ride Fare
                </CustomText>
                <CustomText fontFamily="Bold" fontSize={32} style={styles.amount}>
                  ₱{fare.toFixed(2)}
                </CustomText>
              </View>
            </View>

            {/* Loading Message */}
            <View style={styles.messageContainer}>
              <ActivityIndicator size="small" color="#FF9800" style={{ marginRight: 10 }} />
              <CustomText fontSize={12} style={styles.messageText}>
                Please wait while the passenger confirms their payment method. This screen will update automatically.
              </CustomText>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => {}}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Success Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.successCircle}>
              <Ionicons name="checkmark-circle" size={60} color="white" />
            </View>
          </View>

          {/* Title */}
          <CustomText fontFamily="Bold" fontSize={22} style={styles.title}>
            Payment Received! 💰
          </CustomText>

          {/* Subtitle */}
          <CustomText fontSize={14} style={styles.subtitle}>
            The passenger has confirmed payment for this ride
          </CustomText>

          {/* Payment Details Card */}
          <View style={styles.paymentCard}>
            {/* Payment Method */}
            <View style={styles.paymentRow}>
              <View style={styles.paymentIconContainer}>
                {renderPaymentIcon()}
              </View>
              <View style={styles.paymentInfo}>
                <CustomText fontSize={12} style={styles.paymentLabel}>
                  Payment Method
                </CustomText>
                <CustomText fontFamily="SemiBold" fontSize={16} style={styles.paymentValue}>
                  {getPaymentMethodDisplay()}
                </CustomText>
              </View>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Amount */}
            <View style={styles.amountSection}>
              {isPWDRide && originalFare && discountAmount ? (
                <>
                  {/* Original Fare */}
                  <View style={styles.fareRow}>
                    <CustomText fontSize={12} style={styles.fareLabel}>
                      Original Fare
                    </CustomText>
                    <CustomText fontSize={14} style={styles.originalFare}>
                      ₱{originalFare.toFixed(2)}
                    </CustomText>
                  </View>
                  
                  {/* PWD Discount */}
                  <View style={styles.fareRow}>
                    <View style={styles.pwdBadge}>
                      <Ionicons name="accessibility" size={14} color="#2196F3" />
                      <CustomText fontSize={11} style={styles.pwdText}>
                        PWD Discount ({pwdDiscountPercentage}%)
                      </CustomText>
                    </View>
                    <CustomText fontSize={14} style={styles.discountAmount}>
                      -₱{discountAmount.toFixed(2)}
                    </CustomText>
                  </View>
                  
                  {/* Final Amount */}
                  <View style={[styles.fareRow, styles.finalFareRow]}>
                    <CustomText fontFamily="SemiBold" fontSize={14} style={styles.finalLabel}>
                      Amount Paid
                    </CustomText>
                    <CustomText fontFamily="Bold" fontSize={28} style={styles.amount}>
                      ₱{fare.toFixed(2)}
                    </CustomText>
                  </View>
                </>
              ) : (
                <>
                  <CustomText fontSize={12} style={styles.amountLabel}>
                    Amount Paid
                  </CustomText>
                  <CustomText fontFamily="Bold" fontSize={32} style={styles.amount}>
                    ₱{fare.toFixed(2)}
                  </CustomText>
                </>
              )}
            </View>
          </View>

          {/* Message */}
          <View style={styles.messageContainer}>
            <Ionicons name="information-circle" size={20} color="#666" />
            <CustomText fontSize={12} style={styles.messageText}>
              Click the button below to mark this ride as fully completed and return to the home screen.
            </CustomText>
          </View>

          {/* Complete Button */}
          <TouchableOpacity
            style={styles.completeButton}
            onPress={onConfirm}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark-done" size={22} color="white" />
            <CustomText fontFamily="Bold" fontSize={16} style={styles.buttonText}>
              COMPLETE RIDE
            </CustomText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  iconContainer: {
    marginBottom: 15,
  },
  successCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  paymentCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 15,
    padding: 20,
    width: '100%',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentLabel: {
    color: '#888',
    marginBottom: 2,
  },
  paymentValue: {
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 15,
  },
  amountSection: {
    alignItems: 'center',
  },
  amountLabel: {
    color: '#888',
    marginBottom: 5,
  },
  amount: {
    color: '#4CAF50',
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 8,
  },
  fareLabel: {
    color: '#888',
  },
  originalFare: {
    color: '#888',
    textDecorationLine: 'line-through',
  },
  pwdBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pwdText: {
    color: '#2196F3',
    marginLeft: 4,
  },
  discountAmount: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  finalFareRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  finalLabel: {
    color: '#333',
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF8E1',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    width: '100%',
  },
  messageText: {
    color: '#666',
    marginLeft: 10,
    flex: 1,
    lineHeight: 18,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 12,
    width: '100%',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  buttonText: {
    color: 'white',
    marginLeft: 10,
  },
});

export default PaymentConfirmationModal;
