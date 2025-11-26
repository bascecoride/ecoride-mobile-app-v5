/**
 * Disapproval Notification Service
 * 
 * Memory-efficient service that listens for account disapproval events
 * and triggers alerts with automatic logout.
 * 
 * Uses observer pattern with minimal memory footprint.
 */

import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

type DisapprovalCallback = (reason: string) => void;

interface SocketService {
  on: (event: string, callback: (data: any) => void) => void;
  off: (event: string) => void;
  disconnect?: () => void;
  emit?: (event: string, data?: any) => void;
}

class DisapprovalService {
  private listeners: Set<DisapprovalCallback> = new Set();
  private isInitialized: boolean = false;
  private socketService: SocketService | null = null;

  /**
   * Initialize the disapproval listener with socket service
   */
  initialize(socketService: SocketService) {
    // Allow re-initialization to refresh socket listeners
    if (this.isInitialized && this.socketService === socketService) {
      console.log('⚠️ DisapprovalService already initialized with same socket');
      return;
    }

    // Clean up previous listeners if re-initializing
    if (this.isInitialized && this.socketService) {
      console.log('🔄 Re-initializing DisapprovalService with new socket...');
      this.socketService.off('accountDisapproved');
    }

    console.log('🔔 Initializing DisapprovalService...');
    this.socketService = socketService;

    // Listen for account disapproval events from server
    socketService.on('accountDisapproved', (data: { reason: string; timestamp: string }) => {
      console.log('🚨 Account disapproved event received:', data);
      console.log('🚨 Reason:', data?.reason);
      console.log('🚨 Timestamp:', data?.timestamp);
      this.handleDisapproval(data?.reason || 'Your account has been disapproved by an administrator');
    });

    this.isInitialized = true;
    console.log('✅ DisapprovalService initialized and listening for accountDisapproved events');
  }

  /**
   * Handle disapproval event - show alert and logout
   */
  private async handleDisapproval(reason: string) {
    console.log('🚨 Handling account disapproval...');
    console.log('🚨 Disapproval reason:', reason);

    // Use setTimeout to ensure alert shows properly on all platforms
    setTimeout(() => {
      Alert.alert(
        '⚠️ Account Disapproved',
        reason || 'Your account has been disapproved by an administrator. You will be logged out.',
        [
          {
            text: 'OK',
            onPress: async () => {
              console.log('User acknowledged disapproval, logging out...');
              await this.performLogout();
            },
          },
        ],
        { cancelable: false } // Prevent dismissing without clicking OK
      );
      console.log('🚨 Alert should now be visible');
    }, 100);

    // Notify all listeners
    this.listeners.forEach((callback) => {
      try {
        callback(reason);
      } catch (error) {
        console.error('Error in disapproval listener callback:', error);
      }
    });
  }

  /**
   * Perform logout - clear storage and navigate to auth
   */
  private async performLogout() {
    try {
      console.log('🔓 Logging out user due to account disapproval...');

      // Disconnect socket
      if (this.socketService && this.socketService.disconnect) {
        this.socketService.disconnect();
        console.log('🔌 Socket disconnected');
      }

      // Get user role before clearing storage
      const userRole = await AsyncStorage.getItem('userRole');

      // Clear all stored data
      await AsyncStorage.multiRemove([
        'access_token',
        'user',
        'userRole',
        'userId',
      ]);
      console.log('🗑️ User data cleared from storage');

      // Navigate to appropriate auth screen based on stored role
      if (userRole === 'rider') {
        console.log('📍 Navigating to rider auth...');
        router.replace('/rider/auth');
      } else {
        console.log('📍 Navigating to customer auth...');
        router.replace('/customer/auth');
      }

      console.log('✅ Logout complete');
    } catch (error) {
      console.error('❌ Error during logout:', error);
      // Fallback navigation
      router.replace('/customer/auth');
    }
  }

  /**
   * Subscribe to disapproval events (optional - for custom handling)
   */
  subscribe(callback: DisapprovalCallback): () => void {
    this.listeners.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Cleanup - remove all listeners
   */
  cleanup() {
    console.log('🧹 Cleaning up DisapprovalService...');
    if (this.socketService) {
      this.socketService.off('accountDisapproved');
    }
    this.listeners.clear();
    this.isInitialized = false;
  }
}

// Export singleton instance
export const disapprovalService = new DisapprovalService();
