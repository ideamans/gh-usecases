import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';
import Spinner from 'ink-spinner';
import { GitHubAPI } from '../services/github-api.js';
import { Config, Repository } from '../types/index.js';
import { formatErrorDisplay } from '../utils/error-messages.js';
import { InteractionHistory } from '../services/interaction-history.js';
import { useTokenRefresh } from '../hooks/useTokenRefresh.js';
import { TokenRefreshHint } from './TokenRefreshHint.js';

interface RepositorySelectorProps {
  account: Config['selectedAccount'];
  onRepositorySelected: (repository: Repository) => void;
  onCancel: () => void;
}

export const RepositorySelector: React.FC<RepositorySelectorProps> = ({ account, onRepositorySelected, onCancel }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [searchTimer, setSearchTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (searchTimer) {
      clearTimeout(searchTimer);
    }

    if (searchQuery.trim()) {
      const timer = setTimeout(() => {
        searchRepositories();
      }, 500);
      setSearchTimer(timer);
    } else {
      setRepositories([]);
      setShowResults(false);
    }

    return () => {
      if (searchTimer) {
        clearTimeout(searchTimer);
      }
    };
  }, [searchQuery]);

  const searchRepositories = async () => {
    setSearching(true);
    setError(null);
    
    // Record search query
    if (searchQuery.trim()) {
      InteractionHistory.record('input', 'Repository Search', searchQuery.trim());
    }
    
    try {
      const results = await GitHubAPI.searchRepositories(searchQuery, account.login, 20);
      // Remove duplicates based on repository ID
      const uniqueResults = results.filter((repo, index, self) => 
        index === self.findIndex(r => r.id === repo.id)
      );
      setRepositories(uniqueResults);
      setShowResults(true);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to search repositories'));
      setRepositories([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSearchSubmit = () => {
    if (repositories.length === 1) {
      InteractionHistory.record('selection', 'Repository', repositories[0].name);
      onRepositorySelected(repositories[0]);
    } else if (repositories.length > 1) {
      setShowResults(true);
    }
  };

  const handleRepositorySelect = (item: { value: Repository }) => {
    InteractionHistory.record('selection', 'Repository', item.value.name);
    onRepositorySelected(item.value);
  };
  
  // Handle selection by index to avoid object comparison issues
  const handleIndexSelect = (item: { value: number }) => {
    const repository = repositories[item.value];
    if (repository) {
      InteractionHistory.record('selection', 'Repository', repository.name);
      onRepositorySelected(repository);
    }
  };

  if (error) {
    const errorLines = formatErrorDisplay(error);
    return (
      <Box flexDirection="column">
        {errorLines.map((line, index) => (
          <Text key={index} color={line.startsWith('❌') ? 'red' : undefined}>
            {line}
          </Text>
        ))}
        <Box marginTop={1}>
          <Text dimColor>Press Ctrl+C to exit, any other key to return to search</Text>
        </Box>
      </Box>
    );
  }

  if (showResults && repositories.length > 0 && searchQuery.trim()) {
    const repositoryItems = repositories.map((repository, index) => ({
      label: `${repository.name}${repository.description ? ` - ${repository.description}` : ''}`,
      value: index, // Use index instead of object
    }));

    return (
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text bold>Select a repository:</Text>
        </Box>
        <SelectInput items={repositoryItems} onSelect={handleIndexSelect} />
        <Box marginTop={1}>
          <Text dimColor>Press Esc to return to search</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold>Search for repository:</Text>
      </Box>
      <Box>
        <TextInput
          value={searchQuery}
          onChange={setSearchQuery}
          onSubmit={handleSearchSubmit}
          placeholder="Enter search keywords..."
        />
        {searching && (
          <Box marginLeft={1}>
            <Text color="blue">
              <Spinner type="dots" />
            </Text>
          </Box>
        )}
      </Box>
      {searchQuery && !searching && repositories.length === 0 && (
        <Box marginTop={1}>
          <Text dimColor>No repositories found</Text>
        </Box>
      )}
      <Box marginTop={1}>
        <Text dimColor>Press Ctrl+C to cancel</Text>
      </Box>
      <TokenRefreshHint />
    </Box>
  );
};