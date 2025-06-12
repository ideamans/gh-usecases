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
      setError(new Error('個人アカウントにはチーム機能がありません'));
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
      setError(err instanceof Error ? err : new Error('チームの読み込みに失敗しました'));
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
      setError(new Error('少なくとも1つのチームを選択してください'));
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
      setError(err instanceof Error ? err : new Error('プロジェクトをチームに追加できませんでした'));
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box>
        <Text color="blue">
          <Spinner type="dots" />
        </Text>
        <Text> チームを読み込み中...</Text>
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
          <Text dimColor>Ctrl+Cで終了</Text>
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
        <Text> プロジェクトをチームに追加中...</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold>プロジェクトを追加するチームを選択してください:</Text>
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
        <Text dimColor>スペース: 選択/選択解除</Text>
        <Text dimColor>Enter: 選択を確定</Text>
        <Text dimColor>Escape: キャンセル</Text>
      </Box>
    </Box>
  );
};