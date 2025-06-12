import React, { useEffect } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import { Repository, Config } from '../types/index.js';

interface RepositoryInstructionsProps {
  repository: Repository;
  account: Config['selectedAccount'];
  onContinue?: () => void;
  showContinuePrompt?: boolean;
}

export const RepositoryInstructions: React.FC<RepositoryInstructionsProps> = ({ 
  repository, 
  account,
  onContinue,
  showContinuePrompt = false
}) => {
  const { exit } = useApp();
  
  useInput((input, key) => {
    if (showContinuePrompt && onContinue && key.return) {
      onContinue();
    } else if (!showContinuePrompt && key.return) {
      // For create-only, exit on Enter
      exit();
    }
  });

  const repoUrl = `https://github.com/${repository.owner.login}/${repository.name}`;
  const gitRemoteUrl = `git@github.com:${repository.owner.login}/${repository.name}.git`;

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text color="green">✅ Repository "{repository.name}" created successfully!</Text>
      </Box>

      <Box marginBottom={1} flexDirection="column">
        <Text bold>Repository URL:</Text>
        <Text color="cyan">{repoUrl}</Text>
      </Box>

      <Box marginBottom={1} flexDirection="column">
        <Text bold>To push your code to this repository:</Text>
        <Box marginLeft={2} flexDirection="column">
          <Text dimColor># If this is a new project:</Text>
          <Text color="yellow">git init</Text>
          <Text color="yellow">git add .</Text>
          <Text color="yellow">git commit -m "Initial commit"</Text>
          <Text color="yellow">git branch -M main</Text>
          <Text color="yellow">git remote add origin {gitRemoteUrl}</Text>
          <Text color="yellow">git push -u origin main</Text>
        </Box>
      </Box>

      <Box marginBottom={1} flexDirection="column">
        <Box marginLeft={2} flexDirection="column">
          <Text dimColor># If you already have a git repository:</Text>
          <Text color="yellow">git remote add origin {gitRemoteUrl}</Text>
          <Text color="yellow">git branch -M main</Text>
          <Text color="yellow">git push -u origin main</Text>
        </Box>
      </Box>

      {showContinuePrompt ? (
        <Box marginTop={1}>
          <Text color="blue">Press Enter to continue to team selection...</Text>
        </Box>
      ) : (
        <Box marginTop={1}>
          <Text dimColor>Press Enter to exit</Text>
        </Box>
      )}
    </Box>
  );
};