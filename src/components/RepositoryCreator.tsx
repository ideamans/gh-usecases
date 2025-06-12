import React, { useState } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';
import Spinner from 'ink-spinner';
import { GitHubAPI } from '../services/github-api.js';
import { Config, Repository } from '../types/index.js';
import { formatErrorDisplay } from '../utils/error-messages.js';
import { InteractionHistory } from '../services/interaction-history.js';

interface RepositoryCreatorProps {
  account: Config['selectedAccount'];
  onRepositoryCreated: (repository: Repository) => void;
}

type Step = 'name' | 'description' | 'visibility' | 'creating';

const visibilityItems = [
  { label: 'Private', value: 'PRIVATE' as const },
  { label: 'Public', value: 'PUBLIC' as const },
];

export const RepositoryCreator: React.FC<RepositoryCreatorProps> = ({ account, onRepositoryCreated }) => {
  const [step, setStep] = useState<Step>('name');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<Error | null>(null);

  const handleNameSubmit = () => {
    if (!name.trim()) {
      setError(new Error('Repository name is required'));
      return;
    }
    InteractionHistory.record('input', 'Repository Name', name.trim());
    setError(null);
    setStep('description');
  };

  const handleDescriptionSubmit = () => {
    InteractionHistory.record('input', 'Description', description.trim() || '(empty)');
    setStep('visibility');
  };

  const handleVisibilitySelect = async (item: { value: 'PRIVATE' | 'PUBLIC' }) => {
    InteractionHistory.record('selection', 'Visibility', item.value === 'PRIVATE' ? 'Private' : 'Public');
    setStep('creating');
    await createRepository(item.value);
  };

  const createRepository = async (selectedVisibility: 'PRIVATE' | 'PUBLIC') => {
    try {
      const repository = await GitHubAPI.createRepository({
        name,
        description: description || undefined,
        visibility: selectedVisibility,
        owner: account.type === 'organization' ? account.login : undefined,
      });

      onRepositoryCreated(repository);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create repository'));
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
          <Text dimColor>Press any key to continue...</Text>
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
        <Text> Creating repository...</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      {step === 'name' && (
        <>
          <Box marginBottom={1}>
            <Text bold>Enter repository name:</Text>
          </Box>
          <TextInput
            value={name}
            onChange={setName}
            onSubmit={handleNameSubmit}
            placeholder="e.g. my-repository"
          />
          <Box marginTop={1}>
            <Text dimColor>Press Enter to continue, Ctrl+C to cancel</Text>
          </Box>
        </>
      )}

      {step === 'description' && (
        <>
          <Box marginBottom={1}>
            <Text bold>Enter repository description (optional):</Text>
          </Box>
          <TextInput
            value={description}
            onChange={setDescription}
            onSubmit={handleDescriptionSubmit}
            placeholder="Repository description..."
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