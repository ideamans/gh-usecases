import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import SelectInput from 'ink-select-input';
const Spinner = require('ink-spinner').default;
import { GitHubAPI } from '../services/github-api.js';
import { ConfigService } from '../services/config.js';
import { Config } from '../types/index.js';

interface AccountSelectorProps {
  onAccountSelected: (account: Config['selectedAccount']) => void;
}

export const AccountSelector: React.FC<AccountSelectorProps> = ({ onAccountSelected }) => {
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<Array<{ label: string; value: Config['selectedAccount'] }>>([]);
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
          value: { type: 'personal' as const, login: user.login }
        },
        ...user.organizations.map(org => ({
          label: `Organization (${org})`,
          value: { type: 'organization' as const, login: org }
        }))
      ];

      setAccounts(accountOptions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (item: { value: Config['selectedAccount'] }) => {
    try {
      await ConfigService.setSelectedAccount(item.value);
      onAccountSelected(item.value);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save selection');
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
    return (
      <Box flexDirection="column">
        <Text color="red">Error: {error}</Text>
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