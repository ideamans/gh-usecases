import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import SelectInput from 'ink-select-input';
import Spinner from 'ink-spinner';
import { GitHubAPI } from '../services/github-api.js';
import { ConfigService } from '../services/config.js';
import { Config } from '../types/index.js';

interface AccountSelectorProps {
  onAccountSelected: (account: Config['selectedAccount']) => void;
}

export const AccountSelector: React.FC<AccountSelectorProps> = ({ onAccountSelected }) => {
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<Array<{ label: string; value: Config['selectedAccount']; key: string }>>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const savedAccount = await ConfigService.getSelectedAccount();
      if (savedAccount) {
        onAccountSelected(savedAccount);
        return;
      }

      const user = await GitHubAPI.getCurrentUser();
      
      const accountOptions = [
        {
          label: `Personal (${user.login})`,
          value: { type: 'personal' as const, login: user.login },
          key: `personal-${user.login}`
        },
        ...user.organizations.map(org => ({
          label: `Organization (${org})`,
          value: { type: 'organization' as const, login: org },
          key: `org-${org}`
        }))
      ];

      setAccounts(accountOptions);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load accounts';
      console.error('Account loading error:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (item: { value: Config['selectedAccount'] }) => {
    try {
      await ConfigService.setSelectedAccount(item.value);
      onAccountSelected(item.value);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save selection';
      console.error('Account selection save error:', errorMessage);
      setError(errorMessage);
    }
  };

  if (loading) {
    return (
      <Box>
        <Text color="blue">
          <Spinner type="dots" />
        </Text>
        <Text> Loading accounts...</Text>
      </Box>
    );
  }

  if (error) {
    const isNetworkError = error.toLowerCase().includes('network') || error.toLowerCase().includes('fetch');
    const isPermissionError = error.toLowerCase().includes('permission') || error.toLowerCase().includes('scope');
    
    return (
      <Box flexDirection="column" marginY={1}>
        <Text color="red" bold>Account Loading Error</Text>
        <Text color="red">Error: {error}</Text>
        <Box marginTop={1}>
          <Text color="yellow">Possible causes:</Text>
        </Box>
        {isNetworkError && (
          <Box marginLeft={2}>
            <Text>• Network connection issues</Text>
            <Text>• Cannot connect to GitHub API</Text>
          </Box>
        )}
        {isPermissionError && (
          <Box marginLeft={2}>
            <Text>• Insufficient permissions</Text>
            <Text>• No access to organization information</Text>
          </Box>
        )}
        {!isNetworkError && !isPermissionError && (
          <Box marginLeft={2}>
            <Text>• GitHub account configuration issues</Text>
            <Text>• API rate limit may have been reached</Text>
          </Box>
        )}
        <Box marginTop={1}>
          <Text color="green">How to fix:</Text>
        </Box>
        <Box marginLeft={2}>
          <Text>1. Check your internet connection</Text>
          <Text>2. Verify authentication status with the following command:</Text>
          <Text>   <Text color="cyan" bold>gh auth status</Text></Text>
          {isPermissionError && (
            <>
              <Text>3. Re-login with required permissions:</Text>
              <Text>   <Text color="cyan" bold>gh auth login --scopes read:org</Text></Text>
            </>
          )}
          <Text>{isPermissionError ? '4' : '3'}. If the problem persists, please wait a while and try again</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold>Select an account to use:</Text>
      </Box>
      <SelectInput items={accounts} onSelect={handleSelect} />
    </Box>
  );
};