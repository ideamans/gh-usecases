import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';
import Spinner from 'ink-spinner';
import { GitHubAPI } from '../services/github-api.js';
import { Config, Project } from '../types/index.js';
import { formatErrorDisplay } from '../utils/error-messages.js';
import { InteractionHistory } from '../services/interaction-history.js';

interface ProjectSelectorProps {
  account: Config['selectedAccount'];
  onProjectSelected: (project: Project) => void;
  onCancel: () => void;
}

export const ProjectSelector: React.FC<ProjectSelectorProps> = ({ account, onProjectSelected, onCancel }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [searchTimer, setSearchTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (searchTimer) {
      clearTimeout(searchTimer);
    }

    if (searchQuery.trim()) {
      const timer = setTimeout(() => {
        searchProjects();
      }, 500);
      setSearchTimer(timer);
    } else {
      setProjects([]);
      setShowResults(false);
    }

    return () => {
      if (searchTimer) {
        clearTimeout(searchTimer);
      }
    };
  }, [searchQuery]);

  const searchProjects = async () => {
    setSearching(true);
    setError(null);
    
    // Record search query
    if (searchQuery.trim()) {
      InteractionHistory.record('input', 'Project Search', searchQuery.trim());
    }
    
    try {
      const results = await GitHubAPI.searchProjects(searchQuery, account.login, 20);
      setProjects(results);
      setShowResults(true);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to search projects'));
      setProjects([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSearchSubmit = () => {
    if (projects.length === 1) {
      InteractionHistory.record('selection', 'Project', projects[0].title);
      onProjectSelected(projects[0]);
    } else if (projects.length > 1) {
      setShowResults(true);
    }
  };

  const handleProjectSelect = (item: { value: Project }) => {
    InteractionHistory.record('selection', 'Project', item.value.title);
    onProjectSelected(item.value);
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

  if (showResults && projects.length > 0 && searchQuery.trim()) {
    const projectItems = projects.map(project => ({
      label: `${project.name}${project.description ? ` - ${project.description}` : ''}`,
      value: project,
    }));

    return (
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text bold>Select a project:</Text>
        </Box>
        <SelectInput items={projectItems} onSelect={handleProjectSelect} />
        <Box marginTop={1}>
          <Text dimColor>Press Esc to return to search</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold>Search for project:</Text>
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
      {searchQuery && !searching && projects.length === 0 && (
        <Box marginTop={1}>
          <Text dimColor>No projects found</Text>
        </Box>
      )}
      <Box marginTop={1}>
        <Text dimColor>Press Ctrl+C to cancel</Text>
      </Box>
    </Box>
  );
};