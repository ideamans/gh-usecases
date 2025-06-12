import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import Spinner from 'ink-spinner';
import { GitHubAPI } from '../services/github-api.js';
import { ConfigService } from '../services/config.js';
import { Config, Team, Repository } from '../types/index.js';
import { formatErrorDisplay } from '../utils/error-messages.js';
import { InteractionHistory } from '../services/interaction-history.js';
import { useTokenRefresh } from '../hooks/useTokenRefresh.js';
import { TokenRefreshHint } from './TokenRefreshHint.js';
import { geminiService, TeamWithRepositories } from '../services/gemini.js';

interface TeamSelectorProps {
  account: Config['selectedAccount'];
  repository: Repository;
  onTeamsSelected: (teams: Team[]) => void;
  onCancel: () => void;
}

interface TeamItemProps {
  team: TeamWithRepositories;
  isSelected: boolean;
  isFocused: boolean;
  isAISuggested: boolean;
}

const TeamItem: React.FC<TeamItemProps> = ({ team, isSelected, isFocused, isAISuggested }) => {
  return (
    <Box>
      <Text color={isFocused ? 'blue' : undefined}>
        {isSelected ? '[✓] ' : '[ ] '}
        {team.name}
        {isAISuggested && <Text color="green"> (AI suggested)</Text>}
      </Text>
    </Box>
  );
};

export const TeamSelector: React.FC<TeamSelectorProps> = ({ account, repository, onTeamsSelected, onCancel }) => {
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<TeamWithRepositories[]>([]);
  const [selectedTeamIds, setSelectedTeamIds] = useState<Set<string>>(new Set());
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [permissionError, setPermissionError] = useState<Error | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  
  const { isRefreshing } = useTokenRefresh(() => {
    // Clear permission error and retry on token refresh
    if (permissionError) {
      setPermissionError(null);
      setError(null);
      if (selectedTeamIds.size > 0) {
        handleSubmit();
      }
    }
  });

  useEffect(() => {
    if (account.type === 'organization') {
      loadTeams();
    } else {
      setError(new Error('Personal accounts do not have team features'));
      setLoading(false);
    }
  }, [account]);

  const loadTeams = async () => {
    try {
      const teamList = await GitHubAPI.listTeamsWithRepositories(account.login);
      setTeams(teamList);
      
      // Get AI suggestions if available
      if (await geminiService.isAvailable()) {
        setLoadingAI(true);
        try {
          const suggestions = await geminiService.suggestTeams(repository.name, teamList);
          if (suggestions && suggestions.length > 0) {
            setAiSuggestions(suggestions);
            // Auto-select AI suggested teams
            const suggestedTeamIds = teamList
              .filter(team => suggestions.includes(team.slug))
              .map(team => team.id);
            setSelectedTeamIds(new Set(suggestedTeamIds));
            InteractionHistory.record('action', 'AI Team Suggestions Applied', suggestions.join(', '));
          }
        } catch (err) {
          console.error('AI team suggestion error:', err);
        } finally {
          setLoadingAI(false);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load teams'));
    } finally {
      setLoading(false);
    }
  };

  useInput((input: string, key: any) => {
    if (submitting) return;

    if (key.upArrow) {
      setFocusedIndex(prev => (prev > 0 ? prev - 1 : teams.length - 1));
    } else if (key.downArrow) {
      setFocusedIndex(prev => (prev < teams.length - 1 ? prev + 1 : 0));
    } else if (input === ' ') {
      const team = teams[focusedIndex];
      if (team) {
        setSelectedTeamIds(prev => {
          const newSet = new Set(prev);
          if (newSet.has(team.id)) {
            newSet.delete(team.id);
            InteractionHistory.record('action', 'Deselected Team', team.name);
          } else {
            newSet.add(team.id);
            InteractionHistory.record('action', 'Selected Team', team.name);
          }
          return newSet;
        });
      }
    } else if (key.return) {
      handleSubmit();
    } else if (key.escape) {
      onCancel();
    }
  });

  const handleSubmit = async () => {
    if (selectedTeamIds.size === 0) {
      setError(new Error('Please select at least one team'));
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const selectedTeams = teams.filter(team => selectedTeamIds.has(team.id));
      
      // Record the final team selection
      InteractionHistory.record('selection', 'Final Team Selection', selectedTeams.map(t => t.name).join(', '));
      
      await GitHubAPI.addRepositoryToTeams(
        repository.id,
        Array.from(selectedTeamIds)
      );

      onTeamsSelected(selectedTeams);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Could not add repository to teams');
      setError(error);
      
      // Check if it's a permission error
      if (error.message.includes('permission') || error.message.includes('403') || error.message.includes('access')) {
        setPermissionError(error);
      }
      
      setSubmitting(false);
    }
  };

  if (loading || loadingAI) {
    return (
      <Box>
        <Text color="blue">
          <Spinner type="dots" />
        </Text>
        <Text> {loading ? 'Loading teams...' : 'Getting AI suggestions...'}</Text>
      </Box>
    );
  }

  if (error && !teams.length) {
    const errorLines = formatErrorDisplay(error);
    return (
      <Box flexDirection="column">
        {errorLines.map((line, index) => (
          <Text key={index} color={line.startsWith('❌') ? 'red' : undefined}>
            {line}
          </Text>
        ))}
        <Box marginTop={1}>
          <Text dimColor>Press Ctrl+C to exit</Text>
        </Box>
      </Box>
    );
  }

  if (submitting) {
    return (
      <Box>
        <Text color="blue">
          <Spinner type="dots" />
        </Text>
        <Text> Adding project to teams...</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold>Select teams to add the project to:</Text>
      </Box>
      
      {error && (
        <Box marginBottom={1} flexDirection="column">
          {formatErrorDisplay(error).map((line, index) => (
            <Text key={index} color={line.startsWith('❌') ? 'red' : undefined}>
              {line}
            </Text>
          ))}
          {permissionError && (
            <Box marginTop={1} flexDirection="column">
              <Text color="yellow">To fix permission issues:</Text>
              <Text>1. Run: <Text color="cyan">gh auth refresh -s repo,admin:org,write:org</Text></Text>
              <Text>2. Then press <Text color="green">Shift+Tab</Text> to refresh the token and retry</Text>
            </Box>
          )}
        </Box>
      )}

      <Box flexDirection="column">
        {teams.map((team, index) => (
          <TeamItem
            key={team.id}
            team={team}
            isSelected={selectedTeamIds.has(team.id)}
            isFocused={index === focusedIndex}
            isAISuggested={aiSuggestions.includes(team.slug)}
          />
        ))}
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text dimColor>Space: Select/Deselect</Text>
        <Text dimColor>Enter: Confirm selection</Text>
        <Text dimColor>Escape: Cancel</Text>
      </Box>
      
      <TokenRefreshHint />
    </Box>
  );
};