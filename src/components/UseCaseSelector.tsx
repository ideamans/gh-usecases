import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import SelectInput from 'ink-select-input';
import { UseCase } from '../types/index.js';
import { InteractionHistory } from '../services/interaction-history.js';
import { geminiService } from '../services/gemini.js';

interface UseCaseSelectorProps {
  onUseCaseSelected: (useCase: UseCase) => void;
}

const useCaseItems = [
  {
    label: 'Create a new repository',
    value: 'create' as UseCase,
  },
  {
    label: 'Add existing repository to teams',
    value: 'add-to-teams' as UseCase,
  },
  {
    label: 'Create repository and add to teams',
    value: 'create-and-add' as UseCase,
  },
  {
    label: 'Change GitHub Account',
    value: 'change-account' as UseCase,
  },
  {
    label: 'Configure Gemini API Key',
    value: 'configure-gemini' as UseCase,
  },
];

export const UseCaseSelector: React.FC<UseCaseSelectorProps> = ({ onUseCaseSelected }) => {
  const [isGeminiAvailable, setIsGeminiAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    const checkGemini = async () => {
      const available = await geminiService.isAvailable();
      setIsGeminiAvailable(available);
    };
    checkGemini();
  }, []);

  const handleSelect = (item: { value: UseCase }) => {
    const label = useCaseItems.find(i => i.value === item.value)?.label || item.value;
    InteractionHistory.record('selection', 'Use Case', label);
    onUseCaseSelected(item.value);
  };

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold>What would you like to do?</Text>
      </Box>
      
      {isGeminiAvailable === false && (
        <Box marginBottom={1}>
          <Text color="yellow">⚠️  Gemini API is not configured. AI suggestions will be unavailable.</Text>
          <Text dimColor>   Select "Configure Gemini API Key" to enable AI features.</Text>
        </Box>
      )}
      
      <SelectInput items={useCaseItems} onSelect={handleSelect} />
    </Box>
  );
};