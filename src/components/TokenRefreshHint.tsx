import React from 'react';
import { Box, Text } from 'ink';

interface TokenRefreshHintProps {
  show?: boolean;
}

export const TokenRefreshHint: React.FC<TokenRefreshHintProps> = ({ show = true }) => {
  if (!show) return null;

  return (
    <Box marginTop={1}>
      <Text dimColor>Press Shift+Tab to refresh authentication token</Text>
    </Box>
  );
};