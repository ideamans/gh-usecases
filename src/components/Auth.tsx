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
    const isTokenError = error.toLowerCase().includes('token');
    const isConfigError = error.toLowerCase().includes('config');
    
    return (
      <Box flexDirection="column" marginY={1}>
        <Text color="red" bold>Authentication Error</Text>
        <Text color="red">Error: {error}</Text>
        <Box marginTop={1}>
          <Text color="yellow">Possible causes:</Text>
        </Box>
        {isTokenError && (
          <Box marginLeft={2}>
            <Text>• Not logged in to GitHub CLI</Text>
            <Text>• Authentication token has expired</Text>
          </Box>
        )}
        {isConfigError && (
          <Box marginLeft={2}>
            <Text>• GitHub CLI configuration file not found</Text>
            <Text>• No read permissions for configuration file</Text>
          </Box>
        )}
        <Box marginTop={1}>
          <Text color="green">How to fix:</Text>
        </Box>
        <Box marginLeft={2}>
          <Text>1. Log in to GitHub CLI with the following command:</Text>
          <Text>   <Text color="cyan" bold>gh auth login</Text></Text>
          <Text>2. After logging in, run this command again</Text>
        </Box>
        {isConfigError && (
          <Box marginTop={1} marginLeft={2}>
            <Text color="dim">Configuration file location: ~/.config/gh/hosts.yml</Text>
          </Box>
        )}
      </Box>
    );
  }

  if (!authState?.isAuthenticated) {
    return (
      <Box flexDirection="column" marginY={1}>
        <Text color="yellow" bold>GitHub Authentication Required</Text>
        <Box marginTop={1}>
          <Text>You need to authenticate with GitHub CLI to use this tool.</Text>
        </Box>
        <Box marginTop={1}>
          <Text color="green">Setup instructions:</Text>
        </Box>
        <Box marginLeft={2}>
          <Text>1. Run the following command to log in to GitHub:</Text>
          <Text>   <Text color="cyan" bold>gh auth login</Text></Text>
          <Text>2. Follow the prompts to select authentication method</Text>
          <Text>   • Select GitHub.com</Text>
          <Text>   • HTTPS is recommended</Text>
          <Text>   • Authenticate via browser or paste token</Text>
          <Text>3. After authentication is complete, run this command again</Text>
        </Box>
        <Box marginTop={1}>
          <Text color="dim">More info: https://cli.github.com/manual/gh_auth_login</Text>
        </Box>
      </Box>
    );
  }

  return <>{children}</>;
};