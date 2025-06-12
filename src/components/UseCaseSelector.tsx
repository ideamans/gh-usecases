import React from 'react';
import { Box, Text } from 'ink';
import SelectInput from 'ink-select-input';
import { UseCase } from '../types/index.js';

interface UseCaseSelectorProps {
  onUseCaseSelected: (useCase: UseCase) => void;
}

const useCaseItems = [
  {
    label: 'Create a new project',
    value: 'create' as UseCase,
  },
  {
    label: 'Add existing project to teams',
    value: 'add-to-teams' as UseCase,
  },
  {
    label: 'Create project and add to teams',
    value: 'create-and-add' as UseCase,
  },
];

export const UseCaseSelector: React.FC<UseCaseSelectorProps> = ({ onUseCaseSelected }) => {
  const handleSelect = (item: { value: UseCase }) => {
    onUseCaseSelected(item.value);
  };

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold>What would you like to do?</Text>
      </Box>
      <SelectInput items={useCaseItems} onSelect={handleSelect} />
    </Box>
  );
};