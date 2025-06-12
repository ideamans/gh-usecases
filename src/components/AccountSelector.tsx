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
      const errorMessage = err instanceof Error ? err.message : 'Failed to load accounts';
      console.error('アカウント読み込みエラー:', errorMessage);
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
      console.error('アカウント選択保存エラー:', errorMessage);
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
        <Text color="red" bold>アカウント読み込みエラー</Text>
        <Text color="red">エラー内容: {error}</Text>
        <Box marginTop={1}>
          <Text color="yellow">考えられる原因:</Text>
        </Box>
        {isNetworkError && (
          <Box marginLeft={2}>
            <Text>• ネットワーク接続に問題があります</Text>
            <Text>• GitHub APIに接続できません</Text>
          </Box>
        )}
        {isPermissionError && (
          <Box marginLeft={2}>
            <Text>• 必要な権限が不足しています</Text>
            <Text>• 組織情報へのアクセス権限がありません</Text>
          </Box>
        )}
        {!isNetworkError && !isPermissionError && (
          <Box marginLeft={2}>
            <Text>• GitHubアカウントの設定に問題があります</Text>
            <Text>• APIレート制限に達している可能性があります</Text>
          </Box>
        )}
        <Box marginTop={1}>
          <Text color="green">解決方法:</Text>
        </Box>
        <Box marginLeft={2}>
          <Text>1. インターネット接続を確認してください</Text>
          <Text>2. 以下のコマンドで認証状態を確認してください:</Text>
          <Text>   <Text color="cyan" bold>gh auth status</Text></Text>
          {isPermissionError && (
            <>
              <Text>3. 必要な権限でログインし直してください:</Text>
              <Text>   <Text color="cyan" bold>gh auth login --scopes read:org</Text></Text>
            </>
          )}
          <Text>{isPermissionError ? '4' : '3'}. 問題が続く場合は、しばらく待ってから再度お試しください</Text>
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