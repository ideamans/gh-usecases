import React, { useState } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';
import Spinner from 'ink-spinner';
import { GitHubAPI } from '../services/github-api.js';
import { Config, Project } from '../types/index.js';
import { formatErrorDisplay } from '../utils/error-messages.js';

interface ProjectCreatorProps {
  account: Config['selectedAccount'];
  onProjectCreated: (project: Project) => void;
}

type Step = 'name' | 'description' | 'visibility' | 'creating';

const visibilityItems = [
  { label: 'プライベート（非公開）', value: 'PRIVATE' as const },
  { label: 'パブリック（公開）', value: 'PUBLIC' as const },
];

export const ProjectCreator: React.FC<ProjectCreatorProps> = ({ account, onProjectCreated }) => {
  const [step, setStep] = useState<Step>('name');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<Error | null>(null);

  const handleNameSubmit = () => {
    if (!name.trim()) {
      setError(new Error('プロジェクト名は必須です'));
      return;
    }
    setError(null);
    setStep('description');
  };

  const handleDescriptionSubmit = () => {
    setStep('visibility');
  };

  const handleVisibilitySelect = async (item: { value: 'PRIVATE' | 'PUBLIC' }) => {
    setStep('creating');
    await createProject(item.value);
  };

  const createProject = async (selectedVisibility: 'PRIVATE' | 'PUBLIC') => {
    try {
      const ownerId = await GitHubAPI.getOwnerId(
        account.login,
        account.type === 'personal' ? 'user' : 'organization'
      );

      const project = await GitHubAPI.createProject({
        ownerId,
        title: name,
        description: description || undefined,
        visibility: selectedVisibility,
      });

      onProjectCreated(project);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('プロジェクトの作成に失敗しました'));
      setStep('name');
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
          <Text dimColor>任意のキーを押して続行...</Text>
        </Box>
      </Box>
    );
  }

  if (step === 'creating') {
    return (
      <Box>
        <Text color="blue">
          <Spinner type="dots" />
        </Text>
        <Text> プロジェクトを作成中...</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      {step === 'name' && (
        <>
          <Box marginBottom={1}>
            <Text bold>プロジェクト名を入力してください:</Text>
          </Box>
          <TextInput
            value={name}
            onChange={setName}
            onSubmit={handleNameSubmit}
            placeholder="例: My Project"
          />
          <Box marginTop={1}>
            <Text dimColor>Enterで次へ、Ctrl+Cでキャンセル</Text>
          </Box>
        </>
      )}

      {step === 'description' && (
        <>
          <Box marginBottom={1}>
            <Text bold>プロジェクトの説明を入力してください（任意）:</Text>
          </Box>
          <TextInput
            value={description}
            onChange={setDescription}
            onSubmit={handleDescriptionSubmit}
            placeholder="プロジェクトの説明..."
          />
          <Box marginTop={1}>
            <Text dimColor>Enterで次へ</Text>
          </Box>
        </>
      )}

      {step === 'visibility' && (
        <>
          <Box marginBottom={1}>
            <Text bold>プロジェクトの公開設定を選択してください:</Text>
          </Box>
          <SelectInput items={visibilityItems} onSelect={handleVisibilitySelect} />
        </>
      )}
    </Box>
  );
};