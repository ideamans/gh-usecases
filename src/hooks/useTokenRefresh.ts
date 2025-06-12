import { useEffect, useState } from 'react';
import { useInput } from 'ink';
import { AuthService } from '../services/auth.js';

export const useTokenRefresh = (onRefresh?: () => void) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  useInput((input, key) => {
    // Shift+Tab for token refresh
    if (key.shift && key.tab) {
      refreshToken();
    }
  });

  const refreshToken = async () => {
    setIsRefreshing(true);
    try {
      // Clear any cached token
      const newToken = await AuthService.getToken();
      if (newToken) {
        setLastRefresh(new Date());
        console.log('\n✅ Authentication token refreshed successfully');
        if (onRefresh) {
          onRefresh();
        }
      } else {
        console.error('\n❌ Failed to refresh token. Please run: gh auth login');
      }
    } catch (error) {
      console.error('\n❌ Error refreshing token:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return { isRefreshing, lastRefresh, refreshToken };
};