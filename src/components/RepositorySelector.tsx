import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import Spinner from 'ink-spinner';
import { GitHubAPI } from '../services/github-api.js';
import { Config, Repository } from '../types/index.js';
import { formatErrorDisplay } from '../utils/error-messages.js';
import { InteractionHistory } from '../services/interaction-history.js';
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
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchTimer, setSearchTimer] = useState<NodeJS.Timeout | null>(null);
  const showSuggestions = searchQuery.trim().length > 0 && repositories.length > 0 && !searching;

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
      setSelectedIndex(0);
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
      setSelectedIndex(0);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to search repositories'));
      setRepositories([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSearchSubmit = () => {
    if (showSuggestions && repositories[selectedIndex]) {
      const selected = repositories[selectedIndex];
      InteractionHistory.record('selection', 'Repository', selected.name);
      onRepositorySelected(selected);
    }
  };

  // Handle keyboard navigation
  useInput((input, key) => {
    if (key.upArrow && showSuggestions) {
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : repositories.length - 1));
    } else if (key.downArrow && showSuggestions) {
      setSelectedIndex((prev) => (prev < repositories.length - 1 ? prev + 1 : 0));
    } else if (key.escape) {
      onCancel();
    } else if (key.tab && showSuggestions && repositories[selectedIndex]) {
      // Tab to complete the selected repository name
      setSearchQuery(repositories[selectedIndex].name);
      setRepositories([]);
    }
  });

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

  // Repository suggestions list component
  const renderSuggestions = () => {
    if (!showSuggestions) return null;

    return (
      <Box flexDirection="column" marginTop={1}>
        {repositories.map((repo, index) => (
          <Box key={repo.id}>
            <Text
              color={index === selectedIndex ? 'blue' : undefined}
              backgroundColor={index === selectedIndex ? 'white' : undefined}
            >
              {index === selectedIndex ? '▶ ' : '  '}
              {repo.name}
              {repo.isFork && <Text color="yellow"> [fork]</Text>}
              {repo.description && (
                <Text dimColor> - {repo.description.substring(0, 50)}
                  {repo.description.length > 50 ? '...' : ''}
                </Text>
              )}
            </Text>
          </Box>
        ))}
        <Box marginTop={1}>
          <Text dimColor>↑↓ Navigate • Enter: Select • Tab: Complete • Esc: Cancel</Text>
        </Box>
      </Box>
    );
  };

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
      {renderSuggestions()}
      {!showSuggestions && (
        <Box marginTop={1}>
          <Text dimColor>Type to search • Ctrl+C to cancel</Text>
        </Box>
      )}
      <TokenRefreshHint />
    </Box>
  );
};