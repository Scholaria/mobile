import * as SecureStore from 'expo-secure-store';

const LAST_VISIT_KEY = 'following_last_visit';

export const FollowingTracker = {
  /**
   * Get the timestamp of the last visit to the following screen
   */
  async getLastVisitTime(): Promise<Date | null> {
    try {
      const timestamp = await SecureStore.getItemAsync(LAST_VISIT_KEY);
      return timestamp ? new Date(parseInt(timestamp)) : null;
    } catch (error) {
      console.error('Error getting last visit time:', error);
      return null;
    }
  },

  /**
   * Set the current time as the last visit time
   */
  async setLastVisitTime(): Promise<void> {
    try {
      const timestamp = Date.now().toString();
      await SecureStore.setItemAsync(LAST_VISIT_KEY, timestamp);
    } catch (error) {
      console.error('Error setting last visit time:', error);
    }
  },

  /**
   * Check if a paper is new (published after the last visit)
   */
  async isPaperNew(paperPublishedDate: string): Promise<boolean> {
    try {
      const lastVisit = await this.getLastVisitTime();
      if (!lastVisit) {
        // If no last visit recorded, consider all papers as not new
        return false;
      }

      const paperDate = new Date(paperPublishedDate);
      return paperDate > lastVisit;
    } catch (error) {
      console.error('Error checking if paper is new:', error);
      return false;
    }
  },

  /**
   * Get papers that are new (published after the last visit)
   */
  async getNewPapers(papers: any[]): Promise<string[]> {
    try {
      const lastVisit = await this.getLastVisitTime();
      if (!lastVisit) {
        return [];
      }

      const newPaperIds: string[] = [];
      
      for (const paper of papers) {
        if (paper.published) {
          const paperDate = new Date(paper.published);
          if (paperDate > lastVisit) {
            newPaperIds.push(paper.paper_id);
          }
        }
      }

      return newPaperIds;
    } catch (error) {
      console.error('Error getting new papers:', error);
      return [];
    }
  }
}; 