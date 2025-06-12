import React, { useState } from 'react';
import { Box, Text, useApp } from 'ink';
import { Auth } from './Auth.js';
import { AccountSelector } from './AccountSelector.js';
import { UseCaseSelector } from './UseCaseSelector.js';
import { RepositoryCreator } from './RepositoryCreator.js';
import { RepositorySelector } from './RepositorySelector.js';
import { TeamSelector } from './TeamSelector.js';
import { GeminiConfigurator } from './GeminiConfigurator.js';
import { RepositoryInstructions } from './RepositoryInstructions.js';
import { AppState, AuthState, Config, Repository, Team, UseCase } from '../types/index.js';

export const App: React.FC = () => {
  const { exit } = useApp();
  const [appState, setAppState] = useState<AppState>({
    authState: null,
    selectedAccount: null,
    currentUseCase: null,
    createdRepository: null,
  });
  const [showInstructions, setShowInstructions] = useState(false);

  const handleAuthComplete = (authState: AuthState) => {
    setAppState(prev => ({ ...prev, authState }));
  };

  const handleAccountSelected = (account: Config['selectedAccount']) => {
    setAppState(prev => ({ ...prev, selectedAccount: account }));
  };

  const handleUseCaseSelected = (useCase: UseCase) => {
    setAppState(prev => ({ ...prev, currentUseCase: useCase }));
  };

  const handleRepositoryCreated = (repository: Repository) => {
    setAppState(prev => ({ ...prev, createdRepository: repository }));
    setShowInstructions(true);
  };

  const handleRepositorySelected = (repository: Repository) => {
    setAppState(prev => ({ ...prev, createdRepository: repository }));
  };

  const handleTeamsSelected = (teams: Team[]) => {
    const teamNames = teams.map(t => t.name).join(', ');
    exit();
    console.log(`\n✅ Repository "${appState.createdRepository?.name}" added to teams: ${teamNames}`);
  };

  const handleCancel = () => {
    exit();
  };

  const renderCurrentStep = () => {
    if (!appState.authState) {
      return <Auth onAuthComplete={handleAuthComplete} />;
    }

    if (!appState.selectedAccount) {
      return <AccountSelector onAccountSelected={handleAccountSelected} />;
    }

    if (!appState.currentUseCase) {
      return <UseCaseSelector onUseCaseSelected={handleUseCaseSelected} />;
    }

    if (appState.currentUseCase === 'configure-gemini') {
      return (
        <GeminiConfigurator
          onConfigured={() => {
            setAppState(prev => ({ ...prev, currentUseCase: null }));
          }}
        />
      );
    }

    if (appState.currentUseCase === 'change-account') {
      return (
        <AccountSelector 
          onAccountSelected={(account) => {
            handleAccountSelected(account);
            setAppState(prev => ({ ...prev, currentUseCase: null }));
          }}
        />
      );
    }

    if ((appState.currentUseCase === 'create' && !showInstructions) || 
        (appState.currentUseCase === 'create-and-add' && !appState.createdRepository && !showInstructions)) {
      return (
        <RepositoryCreator
          account={appState.selectedAccount}
          onRepositoryCreated={handleRepositoryCreated}
        />
      );
    }

    if (showInstructions && appState.createdRepository) {
      if (appState.currentUseCase === 'create') {
        // For create-only, show instructions and exit
        return (
          <RepositoryInstructions
            repository={appState.createdRepository}
            account={appState.selectedAccount}
            showContinuePrompt={false}
          />
        );
      } else if (appState.currentUseCase === 'create-and-add') {
        // For create-and-add, show instructions with continue prompt
        return (
          <RepositoryInstructions
            repository={appState.createdRepository}
            account={appState.selectedAccount}
            showContinuePrompt={true}
            onContinue={() => setShowInstructions(false)}
          />
        );
      }
    }

    if (appState.currentUseCase === 'add-to-teams' && !appState.createdRepository) {
      return (
        <RepositorySelector
          account={appState.selectedAccount}
          onRepositorySelected={handleRepositorySelected}
          onCancel={handleCancel}
        />
      );
    }

    if ((appState.currentUseCase === 'add-to-teams' || appState.currentUseCase === 'create-and-add') 
        && appState.createdRepository
        && !showInstructions
        && appState.selectedAccount.type === 'organization') {
      return (
        <TeamSelector
          account={appState.selectedAccount}
          repository={appState.createdRepository}
          onTeamsSelected={handleTeamsSelected}
          onCancel={handleCancel}
        />
      );
    }

    if (appState.selectedAccount.type === 'personal' && 
        (appState.currentUseCase === 'add-to-teams' || 
         (appState.currentUseCase === 'create-and-add' && appState.createdRepository && !showInstructions))) {
      return (
        <Box flexDirection="column">
          <Text color="yellow">⚠️  Personal accounts cannot have teams.</Text>
          <Text dimColor>Team features are only available for organization accounts.</Text>
        </Box>
      );
    }

    return null;
  };

  return (
    <Box flexDirection="column" paddingY={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">GitHub Use Cases CLI</Text>
      </Box>
      
      {appState.selectedAccount && (
        <Box marginBottom={1}>
          <Text dimColor>
            Account: {appState.selectedAccount.type === 'personal' ? 'Personal' : 'Organization'} ({appState.selectedAccount.login})
          </Text>
        </Box>
      )}

      {renderCurrentStep()}
    </Box>
  );
};