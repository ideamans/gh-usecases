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
import { geminiService } from '../services/gemini.js';

interface RepositoryCreatorProps {
  account: Config['selectedAccount'];
  onRepositoryCreated: (repository: Repository) => void;
}

type Step = 'ai-loading' | 'name' | 'description' | 'visibility' | 'creating';

const visibilityItems = [
  { label: 'Private', value: 'PRIVATE' as const },
  { label: 'Public', value: 'PUBLIC' as const },
];

export const RepositoryCreator: React.FC<RepositoryCreatorProps> = ({ account, onRepositoryCreated }) => {
  const [step, setStep] = useState<Step>('ai-loading');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<Error | null>(null);
  const [lastAttemptedVisibility, setLastAttemptedVisibility] = useState<'PRIVATE' | 'PUBLIC' | null>(null);
  const [aiSuggested, setAiSuggested] = useState(false);
  
  useEffect(() => {
    const getAISuggestions = async () => {
      const available = await geminiService.isAvailable();
      if (available) {
        try {
          const suggestion = await geminiService.suggestRepositoryDetails();
          if (suggestion) {
            setName(suggestion.name);
            if (suggestion.description) {
              setDescription(suggestion.description);
            }
            setAiSuggested(true);
            InteractionHistory.record('action', 'AI Suggestion Applied', 
              `Name: ${suggestion.name}${suggestion.description ? `, Description: ${suggestion.description}` : ''}`);
          }
        } catch (err) {
          console.error('AI suggestion error:', err);
        }
      }
      setStep('name');
    };
    getAISuggestions();
  }, []);
  
  const { isRefreshing } = useTokenRefresh(() => {
    // Retry creation after token refresh if there was a permission error
    if (error && lastAttemptedVisibility && 
        (error.message.includes('permission') || error.message.includes('403'))) {
      setError(null);
      createRepository(lastAttemptedVisibility);
    }
  });


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
    setLastAttemptedVisibility(item.value);
    setStep('creating');
    await createRepository(item.value);
  };

  const createRepository = async (selectedVisibility: 'PRIVATE' | 'PUBLIC') => {
    try {
      console.log('Creating repository with:', { name, description, visibility: selectedVisibility, owner: account.type === 'organization' ? account.login : undefined });
      
      const repository = await GitHubAPI.createRepository({
        name,
        description: description || undefined,
        visibility: selectedVisibility,
        owner: account.type === 'organization' ? account.login : undefined,
      });

      console.log('Repository created successfully:', repository);
      onRepositoryCreated(repository);
    } catch (err) {
      console.error('Repository creation error:', err);
      const error = err instanceof Error ? err : new Error('Failed to create repository');
      setError(error);
      
      // For permission errors, stay on visibility step to allow retry
      if (error.message.includes('permission') || error.message.includes('403')) {
        setStep('visibility');
      } else {
        setStep('name');
      }
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
        {(error.message.includes('permission') || error.message.includes('403')) && (
          <Box marginTop={1} flexDirection="column">
            <Text color="yellow">To fix permission issues:</Text>
            <Text>1. Run: <Text color="cyan">gh auth refresh -s repo,admin:org</Text></Text>
            <Text>2. Then press <Text color="green">Shift+Tab</Text> to refresh the token and retry</Text>
          </Box>
        )}
        <Box marginTop={1}>
          <Text dimColor>Press any key to continue...</Text>
        </Box>
        <TokenRefreshHint />
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

  if (step === 'ai-loading') {
    return (
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text bold>Preparing repository creation...</Text>
        </Box>
        <Box>
          <Text color="blue">
            <Spinner type="dots" />
          </Text>
          <Text> Getting AI suggestions based on current directory...</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      {step === 'name' && (
        <>
          <Box marginBottom={1}>
            <Text bold>Enter repository name:</Text>
            {aiSuggested && name && (
              <Text color="green"> (AI suggested: {name})</Text>
            )}
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
          <TokenRefreshHint />
        </>
      )}

      {step === 'description' && (
        <>
          <Box marginBottom={1}>
            <Text bold>Enter repository description (optional):</Text>
            {aiSuggested && description && (
              <Text color="green"> (AI suggested)</Text>
            )}
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
          <TokenRefreshHint />
        </>
      )}

      {step === 'visibility' && (
        <>
          <Box marginBottom={1}>
            <Text bold>Select project visibility:</Text>
          </Box>
          <SelectInput items={visibilityItems} onSelect={handleVisibilitySelect} />
          <TokenRefreshHint />
        </>
      )}
    </Box>
  );
};