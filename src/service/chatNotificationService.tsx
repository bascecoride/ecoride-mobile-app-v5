/**
 * Chat Notification Service
 * 
 * Memory-efficient service for managing real-time chat notifications
 * Uses event listeners to update unread count without polling
 */

import { getMyChats } from "./chatService";

type UnreadCountListener = (count: number) => void;

class ChatNotificationService {
  private listeners: Set<UnreadCountListener> = new Set();
  private currentUnreadCount: number = 0;
  private userRole: string | null = null;

  /**
   * Subscribe to unread count changes
   * Returns an unsubscribe function
   */
  subscribe(listener: UnreadCountListener): () => void {
    this.listeners.add(listener);
    // Immediately notify with current count
    listener(this.currentUnreadCount);
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Update unread count and notify all listeners
   */
  setUnreadCount(count: number) {
    if (this.currentUnreadCount !== count) {
      this.currentUnreadCount = count;
      this.notifyListeners();
    }
  }

  /**
   * Increment unread count by 1
   */
  incrementUnreadCount() {
    this.currentUnreadCount += 1;
    this.notifyListeners();
  }

  /**
   * Decrement unread count (when marking as read)
   */
  decrementUnreadCount(amount: number = 1) {
    this.currentUnreadCount = Math.max(0, this.currentUnreadCount - amount);
    this.notifyListeners();
  }

  /**
   * Get current unread count
   */
  getUnreadCount(): number {
    return this.currentUnreadCount;
  }

  /**
   * Set user role for proper unread count calculation
   */
  setUserRole(role: string) {
    this.userRole = role;
  }

  /**
   * Fetch and update unread count from server
   */
  async refreshUnreadCount() {
    try {
      const { chats, userRole } = await getMyChats();
      this.userRole = userRole;
      
      const totalUnread = chats.reduce((total: number, chat: any) => {
        const count = userRole === "customer" 
          ? chat.unreadCount.customer 
          : chat.unreadCount.rider;
        return total + count;
      }, 0);
      
      this.setUnreadCount(totalUnread);
      console.log(`🔔 Unread count refreshed: ${totalUnread}`);
    } catch (error) {
      console.error("❌ Error refreshing unread count:", error);
    }
  }

  /**
   * Notify all listeners of count change
   */
  private notifyListeners() {
    console.log(`🔔 Notifying ${this.listeners.size} listeners of unread count: ${this.currentUnreadCount}`);
    this.listeners.forEach(listener => listener(this.currentUnreadCount));
  }

  /**
   * Reset service (for logout)
   */
  reset() {
    this.currentUnreadCount = 0;
    this.userRole = null;
    this.listeners.clear();
  }
}

// Export singleton instance
export const chatNotificationService = new ChatNotificationService();
