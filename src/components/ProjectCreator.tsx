import React, { useState } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';
import Spinner from 'ink-spinner';
import { GitHubAPI } from '../services/github-api.js';
import { Config, Project } from '../types/index.js';

interface ProjectCreatorProps {
  account: Config['selectedAccount'];
  onProjectCreated: (project: Project) => void;
  onCancel: () => void;
}

type Step = 'name' | 'description' | 'visibility' | 'creating';

const visibilityItems = [
  { label: 'Private', value: 'PRIVATE' as const },
  { label: 'Public', value: 'PUBLIC' as const },
];

export const ProjectCreator: React.FC<ProjectCreatorProps> = ({ account, onProjectCreated, onCancel }) => {
  const [step, setStep] = useState<Step>('name');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'PRIVATE' | 'PUBLIC'>('PRIVATE');
  const [error, setError] = useState<string | null>(null);

  const handleNameSubmit = () => {
    if (!name.trim()) {
      setError('Project name is required');
      return;
    }
    setError(null);
    setStep('description');
  };

  const handleDescriptionSubmit = () => {
    setStep('visibility');
  };

  const handleVisibilitySelect = async (item: { value: 'PRIVATE' | 'PUBLIC' }) => {
    setVisibility(item.value);
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
      setError(err instanceof Error ? err.message : 'Failed to create project');
      setStep('name');
    }
  };

  if (error) {
    return (
      <Box flexDirection="column">
        <Text color="red">Error: {error}</Text>
        <Text>Press any key to continue...</Text>
      </Box>
    );
  }

  if (step === 'creating') {
    return (
      <Box>
        <Text color="blue">
          <Spinner type="dots" />
        </Text>
        <Text> Creating project...</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      {step === 'name' && (
        <>
          <Box marginBottom={1}>
            <Text bold>Enter project name:</Text>
          </Box>
          <TextInput
            value={name}
            onChange={setName}
            onSubmit={handleNameSubmit}
            placeholder="My Project"
          />
          <Box marginTop={1}>
            <Text dimColor>Press Enter to continue or Ctrl+C to cancel</Text>
          </Box>
        </>
      )}

      {step === 'description' && (
        <>
          <Box marginBottom={1}>
            <Text bold>Enter project description (optional):</Text>
          </Box>
          <TextInput
            value={description}
            onChange={setDescription}
            onSubmit={handleDescriptionSubmit}
            placeholder="Project description..."
          />
          <Box marginTop={1}>
            <Text dimColor>Press Enter to continue</Text>
          </Box>
        </>
      )}

      {step === 'visibility' && (
        <>
          <Box marginBottom={1}>
            <Text bold>Select project visibility:</Text>
          </Box>
          <SelectInput items={visibilityItems} onSelect={handleVisibilitySelect} />
        </>
      )}
    </Box>
  );
};