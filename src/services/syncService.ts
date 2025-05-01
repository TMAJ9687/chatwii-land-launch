
/**
 * A simple service to handle message synchronization between Firestore and Realtime DB
 */

// Queue to manage sync operations and prevent duplicates
type SyncRequest = {
  user1: string;
  user2: string;
  timestamp: number;
};

class SyncService {
  private queue: SyncRequest[] = [];
  private isProcessing = false;
  private syncDelay = 800; // ms between sync operations
  
  // Add a sync request to the queue
  async queueSync(user1: string, user2: string): Promise<void> {
    if (!user1 || !user2) return;
    
    // Create sorted key for deduplication
    const sortedUsers = [user1, user2].sort();
    const key = `${sortedUsers[0]}_${sortedUsers[1]}`;
    
    // Check if this conversation is already in queue
    const existingIndex = this.queue.findIndex(
      req => (req.user1 === sortedUsers[0] && req.user2 === sortedUsers[1])
    );
    
    if (existingIndex >= 0) {
      // Update timestamp if already in queue
      this.queue[existingIndex].timestamp = Date.now();
    } else {
      // Add new sync request
      this.queue.push({
        user1: sortedUsers[0],
        user2: sortedUsers[1],
        timestamp: Date.now()
      });
      
      // Start processing if not already running
      if (!this.isProcessing) {
        this.processQueue();
      }
    }
  }
  
  // Process the queue
  private async processQueue(): Promise<void> {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      return;
    }
    
    this.isProcessing = true;
    const request = this.queue.shift()!;
    
    try {
      // Here we would call the actual sync API
      // But for now we just log to console as a placeholder
      // In a real implementation, this would call a Firebase Function/API
      console.log(`Syncing messages between ${request.user1} and ${request.user2}`);
      await this.mockSync();
    } catch (error) {
      console.error('Error syncing messages:', error);
    }
    
    // Process next item after delay
    setTimeout(() => this.processQueue(), this.syncDelay);
  }
  
  // Mock sync operation with delay
  private async mockSync(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 300));
  }
}

// Export singleton instance
export const syncService = new SyncService();
