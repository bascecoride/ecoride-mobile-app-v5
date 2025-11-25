import React, { useEffect, useState } from 'react';
import { Modal, View, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import CustomText from './CustomText';
import { BASE_URL } from '@/service/config';
import axios from 'axios';

interface TermsModalProps {
  visible: boolean;
  onClose: () => void;
}

const TermsModal: React.FC<TermsModalProps> = ({ visible, onClose }) => {
  const [termsContent, setTermsContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      fetchTerms();
    }
  }, [visible]);

  const fetchTerms = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BASE_URL}/api/terms/active`);
      setTermsContent(response.data.content);
    } catch (error) {
      console.error('Error fetching terms:', error);
      // Use default terms if fetch fails
      setTermsContent(getDefaultTerms());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultTerms = () => {
    return `ECORIDE-BASC TERMS AND CONDITIONS
Last Updated: October 2025

Welcome to EcoRide-BASC, a ride-sharing system developed to promote an eco-friendly and convenient transportation experience within Bulacan Agricultural State College (BASC). By creating an account and using the EcoRide-BASC application (the "Service"), you agree to comply with and be bound by these Terms and Conditions.

1. ACCOUNT REGISTRATION AND APPROVAL
1.1 Registration Through the App Only - All users must register exclusively through the official EcoRide-BASC mobile application. No other method of registration is allowed.
1.2 Account Approval Before Use - After registration, users must wait for the administrator's review and approval. Only approved and verified accounts can access and use EcoRide-BASC features such as booking rides, offering rides, viewing notifications, or managing profiles.
1.3 Verification Requirements - Drivers are required to upload a valid school ID and driver's license for verification. - Passengers must upload valid school credentials to confirm that they are official BASC students or faculty members. - Any submission of fake or tampered documents will lead to immediate disapproval or permanent account suspension.
1.4 Account Security - Users are responsible for maintaining the security of their account information. EcoRide-BASC will not be held liable for any misuse caused by user negligence.

2. USER ROLES AND RESPONSIBILITIES
2.1 Drivers - Must ensure their vehicle is in safe, clean, and roadworthy condition. - Must be sure that the passenger paid them correspondedly.
2.2 Passengers - Must verify their payment after a ride by selecting "PAID" or "UNPAID." - Are expected to respect drivers and follow ride rules. - Can only use the system for campus-related transportation or going home.
2.3 Administrators - Are responsible for reviewing, verifying, and approving user registrations. - Have the authority to manage accounts, issue disapprovals, and ensure safe operation of the platform.

3. SYSTEM USAGE POLICY
3.1 Acceptable Use - EcoRide-BASC is intended only for transportation within BASC premises or traveling home from the campus. Any other use beyond these purposes is strictly prohibited.
3.2 Payment Confirmation - After each ride, both the passenger and driver must confirm the payment status. A ride is only marked as completed when both confirmations match.
3.3 Prohibited Activities Users are prohibited from: - Sharing or selling accounts. - Submitting false information or impersonating others. - Using the system for commercial or non-campus-related transport. - Attempting to hack, alter, or exploit the platform in any way.

4. ACCOUNT VIOLATIONS AND PENALTIES
4.1 Penalty Enforcement – Disapproval Only - If a user violates the Terms and Conditions, their account will be disapproved by the administrator. Disapproval serves as the sole form of penalty in the system.
4.2 Ticket Submission for Appeal - If your account has been disapproved and you wish to appeal or clarify the reason, you must go to the designated EcoRide-BASC related office to submit a support ticket for review and resolution. Online appeals are not accepted.

5. DATA PRIVACY AND SECURITY - EcoRide-BASC values your privacy and complies with the Data Privacy Act of 2012. All information collected during registration and verification will be securely stored and used solely for system operations and user authentication.

6. MODIFICATION OF TERMS - EcoRide-BASC reserves the right to modify or update these Terms and Conditions at any time. Continued use of the app after revisions means you agree to the updated terms.

7. CONTACT INFORMATION - For assistance, verification inquiries, or ticket concerns, please visit the designated EcoRide-BASC related office.`;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <CustomText fontFamily="Bold" fontSize={18} style={styles.title}>
              Terms and Conditions
            </CustomText>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4CAF50" />
              <CustomText fontFamily="Regular" style={styles.loadingText}>
                Loading terms...
              </CustomText>
            </View>
          ) : (
            <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={true}>
              <CustomText fontFamily="Regular" fontSize={14} style={styles.content}>
                {termsContent}
              </CustomText>
            </ScrollView>
          )}

          <View style={styles.footer}>
            <TouchableOpacity style={styles.acceptButton} onPress={onClose}>
              <CustomText fontFamily="SemiBold" fontSize={16} style={styles.acceptButtonText}>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
  },
  contentContainer: {
    padding: 16,
    
    maxHeight: 1000,
  },
  content: {
    color: '#333',
    lineHeight: 22,
    paddingBottom: 20,
  },
  footer: {
    padding: 14,
    borderTopWidth: 0.5,
    borderTopColor: '#e0e0e0',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#fff',
  },
});

export default TermsModal;
