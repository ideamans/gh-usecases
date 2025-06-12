import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import { AuthService } from '../services/auth.js';
import { AuthState } from '../types/index.js';

interface AuthProps {
  onAuthComplete: (authState: AuthState) => void;
  children?: React.ReactNode;
}

export const Auth: React.FC<AuthProps> = ({ onAuthComplete, children }) => {
  const [checking, setChecking] = useState(true);
  const [authState, setAuthState] = useState<AuthState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const state = await AuthService.checkAuthStatus();
      setAuthState(state);
      
      if (state.isAuthenticated) {
        const token = await AuthService.getToken();
        onAuthComplete({ ...state, token });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication check failed');
    } finally {
      setChecking(false);
    }
  };

  if (checking) {
    return (
      <Box>
        <Text color="blue">
          <Spinner type="dots" />
        </Text>
        <Text> Checking authentication status...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box flexDirection="column">
        <Text color="red">Error: {error}</Text>
        <Text>Please try running the command again.</Text>
      </Box>
    );
  }

  if (!authState?.isAuthenticated) {
    return (
      <Box flexDirection="column">
        <Text color="yellow">You are not logged in to GitHub CLI.</Text>
        <Text>Please run: <Text color="cyan">gh auth login</Text></Text>
        <Text>Then run this command again.</Text>
      </Box>
    );
  }

  return <>{children}</>;
};