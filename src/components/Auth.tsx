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
        <Text color="red" bold>認証エラー</Text>
        <Text color="red">エラー内容: {error}</Text>
        <Box marginTop={1}>
          <Text color="yellow">考えられる原因:</Text>
        </Box>
        {isTokenError && (
          <Box marginLeft={2}>
            <Text>• GitHub CLIにログインしていません</Text>
            <Text>• 認証トークンの有効期限が切れています</Text>
          </Box>
        )}
        {isConfigError && (
          <Box marginLeft={2}>
            <Text>• GitHub CLIの設定ファイルが見つかりません</Text>
            <Text>• 設定ファイルの読み取り権限がありません</Text>
          </Box>
        )}
        <Box marginTop={1}>
          <Text color="green">解決方法:</Text>
        </Box>
        <Box marginLeft={2}>
          <Text>1. 以下のコマンドでGitHub CLIにログインしてください:</Text>
          <Text>   <Text color="cyan" bold>gh auth login</Text></Text>
          <Text>2. ログイン後、再度このコマンドを実行してください</Text>
        </Box>
        {isConfigError && (
          <Box marginTop={1} marginLeft={2}>
            <Text color="dim">設定ファイルの場所: ~/.config/gh/hosts.yml</Text>
          </Box>
        )}
      </Box>
    );
  }

  if (!authState?.isAuthenticated) {
    return (
      <Box flexDirection="column" marginY={1}>
        <Text color="yellow" bold>GitHub認証が必要です</Text>
        <Box marginTop={1}>
          <Text>このツールを使用するには、GitHub CLIでの認証が必要です。</Text>
        </Box>
        <Box marginTop={1}>
          <Text color="green">セットアップ手順:</Text>
        </Box>
        <Box marginLeft={2}>
          <Text>1. 以下のコマンドを実行してGitHubにログインしてください:</Text>
          <Text>   <Text color="cyan" bold>gh auth login</Text></Text>
          <Text>2. プロンプトに従って認証方法を選択してください</Text>
          <Text>   • GitHub.com を選択</Text>
          <Text>   • HTTPS を推奨</Text>
          <Text>   • ブラウザで認証 または トークンを貼り付け</Text>
          <Text>3. 認証完了後、再度このコマンドを実行してください</Text>
        </Box>
        <Box marginTop={1}>
          <Text color="dim">詳細: https://cli.github.com/manual/gh_auth_login</Text>
        </Box>
      </Box>
    );
  }

  return <>{children}</>;
};