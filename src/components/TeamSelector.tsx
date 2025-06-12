import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import Spinner from 'ink-spinner';
import { GitHubAPI } from '../services/github-api.js';
import { ConfigService } from '../services/config.js';
import { Config, Team, Project } from '../types/index.js';
import { formatErrorDisplay } from '../utils/error-messages.js';

interface TeamSelectorProps {
  account: Config['selectedAccount'];
  project: Project;
  onTeamsSelected: (teams: Team[]) => void;
  onCancel: () => void;
}

interface TeamItemProps {
  team: Team;
  isSelected: boolean;
  isFocused: boolean;
}

const TeamItem: React.FC<TeamItemProps> = ({ team, isSelected, isFocused }) => {
  return (
    <Box>
      <Text color={isFocused ? 'blue' : undefined}>
        {isSelected ? '[✓] ' : '[ ] '}
        {team.name}
      </Text>
    </Box>
  );
};

export const TeamSelector: React.FC<TeamSelectorProps> = ({ account, project, onTeamsSelected, onCancel }) => {
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamIds, setSelectedTeamIds] = useState<Set<string>>(new Set());
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
      const teamList = await GitHubAPI.listTeams(account.login);
      setTeams(teamList);
      
      const defaultTeams = await ConfigService.getDefaultTeams(account.login);
      const defaultSet = new Set(
        teamList
          .filter(team => defaultTeams.includes(team.slug))
          .map(team => team.id)
      );
      setSelectedTeamIds(defaultSet);
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
          } else {
            newSet.add(team.id);
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
      
      await GitHubAPI.addProjectToTeams(
        project.id,
        Array.from(selectedTeamIds)
      );

      const selectedSlugs = selectedTeams.map(team => team.slug);
      await ConfigService.setDefaultTeams(account.login, selectedSlugs);

      onTeamsSelected(selectedTeams);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Could not add project to teams'));
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box>
        <Text color="blue">
          <Spinner type="dots" />
        </Text>
        <Text> Loading teams...</Text>
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
        </Box>
      )}

      <Box flexDirection="column">
        {teams.map((team, index) => (
          <TeamItem
            key={team.id}
            team={team}
            isSelected={selectedTeamIds.has(team.id)}
            isFocused={index === focusedIndex}
          />
        ))}
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text dimColor>Space: Select/Deselect</Text>
        <Text dimColor>Enter: Confirm selection</Text>
        <Text dimColor>Escape: Cancel</Text>
      </Box>
    </Box>
  );
};