/**
 * Background User Metrics Tracker
 * Automatically tracks user activities and sends to Google Sheets
 * Ensures no duplicates - only increments usage counts
 */

class UserMetricsTracker {
  constructor() {
    this.SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwH8Y_mq4gvvRu2IX4eVzMkvsCrNntfxEp4WS5pnPMwir6bQH7CqhOYK5NyffyTYD_9/exec";
    this.pendingUpdates = new Map();
    this.debounceTimeout = null;
  }

  /**
   * Track a user activity
   * @param {object} user - User object from useUser() hook
   * @param {string} activityType - Type of activity ('skinScan', 'dailyTracker', 'progressUpdate', 'aiChat', 'feedback')
   * @param {object} options - Additional options like date
   */
  async trackActivity(user, activityType, options = {}) {
    if (!user?.primaryEmail) {
      console.warn('[MetricsTracker] No user email found, skipping tracking');
      return;
    }

    const userId = user.id || user.primaryEmail;
    const key = `${userId}-${activityType}`;

    // Accumulate pending updates to avoid spam
    if (this.pendingUpdates.has(key)) {
      this.pendingUpdates.set(key, this.pendingUpdates.get(key) + 1);
    } else {
      this.pendingUpdates.set(key, 1);
    }

    // Store user info for the batch
    this.pendingUpdates.set(`${userId}-userInfo`, {
      id: userId,
      name: user.displayName || user.primaryEmail?.split('@')[0] || "Unknown User",
      email: user.primaryEmail,
      lastActivity: new Date().toISOString().split('T')[0]
    });

    console.log('[MetricsTracker] Tracked activity:', activityType, 'for user:', user.primaryEmail);

    // Debounced send to avoid too many requests
    this.debouncedSend();
  }

  /**
   * Debounced send to batch updates
   */
  debouncedSend() {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }

    this.debounceTimeout = setTimeout(() => {
      this.sendPendingUpdates();
    }, 2000); // Wait 2 seconds for more updates
  }

  /**
   * Send accumulated updates to Google Sheets
   */
  async sendPendingUpdates() {
    if (this.pendingUpdates.size === 0) return;

    try {
      // Group updates by user
      const userUpdates = new Map();
      
      for (const [key, value] of this.pendingUpdates.entries()) {
        if (key.endsWith('-userInfo')) {
          const userId = key.replace('-userInfo', '');
          if (!userUpdates.has(userId)) {
            userUpdates.set(userId, { userInfo: value, activities: {} });
          }
          userUpdates.get(userId).userInfo = value;
        } else {
          // Split on the LAST dash to handle user IDs with dashes
          const lastDashIndex = key.lastIndexOf('-');
          const userId = key.substring(0, lastDashIndex);
          const activityType = key.substring(lastDashIndex + 1);
          
          if (!userUpdates.has(userId)) {
            userUpdates.set(userId, { userInfo: null, activities: {} });
          }
          userUpdates.get(userId).activities[activityType] = value;
        }
      }

      console.log('[MetricsTracker] Grouped updates:', userUpdates);

      // Send each user's updates
      for (const [userId, data] of userUpdates.entries()) {
        if (data.userInfo) {
          await this.sendUserUpdate(data.userInfo, data.activities);
        }
      }

      // Clear pending updates
      this.pendingUpdates.clear();
    } catch (error) {
      console.error('Failed to send metrics:', error);
    }
  }

  /**
   * Send individual user update
   */
  async sendUserUpdate(userInfo, activities) {
    const formData = new FormData();
    
    // User identity - Email is the RowKey for upsert
    const email = userInfo.email;
    formData.append("RowKey", email);
    formData.append("Email", email);
    formData.append("User ID", userInfo.id);
    formData.append("Name", userInfo.name);
    formData.append("Last Activity", userInfo.lastActivity);

    // Activity increments (only send if there's activity)
    if (activities.skinScan) {
      formData.append("SkinScan Count", activities.skinScan.toString());
    }
    if (activities.dailyTracker) {
      formData.append("Daily Tracker Entries", activities.dailyTracker.toString());
    }
    if (activities.progressUpdate) {
      formData.append("Progress Updates", activities.progressUpdate.toString());
    }
    if (activities.aiChat) {
      formData.append("AI Chat Count", activities.aiChat.toString());
    }
    if (activities.feedback) {
      formData.append("Feedback Count", activities.feedback.toString());
      formData.append("Last Feedback Date", userInfo.lastActivity);
    }

    console.log('[MetricsTracker] Sending update for:', email, activities);

    try {
      await fetch(this.SCRIPT_URL, {
        method: "POST",
        body: formData,
        mode: "no-cors"
      });
      console.log('[MetricsTracker] Successfully sent metrics');
    } catch (error) {
      console.error('[MetricsTracker] Failed to send user update:', error);
    }
  }

  /**
   * Convenience methods for different activities
   */
  trackSkinScan(user) {
    return this.trackActivity(user, 'skinScan');
  }

  trackDailyEntry(user) {
    return this.trackActivity(user, 'dailyTracker');
  }

  trackProgressUpdate(user) {
    return this.trackActivity(user, 'progressUpdate');
  }

  trackAIChat(user) {
    return this.trackActivity(user, 'aiChat');
  }

  trackFeedback(user) {
    return this.trackActivity(user, 'feedback');
  }
}

// Create singleton instance
const metricsTracker = new UserMetricsTracker();

export default metricsTracker;