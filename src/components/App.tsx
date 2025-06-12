import React, { useState } from 'react';
import { Box, Text, useApp } from 'ink';
import { Auth } from './Auth.js';
import { AccountSelector } from './AccountSelector.js';
import { UseCaseSelector } from './UseCaseSelector.js';
import { RepositoryCreator } from './RepositoryCreator.js';
import { RepositorySelector } from './RepositorySelector.js';
import { TeamSelector } from './TeamSelector.js';
import { AppState, AuthState, Config, Repository, Team, UseCase } from '../types/index.js';

export const App: React.FC = () => {
  const { exit } = useApp();
  const [appState, setAppState] = useState<AppState>({
    authState: null,
    selectedAccount: null,
    currentUseCase: null,
    createdRepository: null,
  });

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
    
    if (appState.currentUseCase === 'create') {
      exit();
      console.log(`\n✅ Repository "${repository.name}" created successfully!`);
    }
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

    if (appState.currentUseCase === 'create' || 
        (appState.currentUseCase === 'create-and-add' && !appState.createdRepository)) {
      return (
        <RepositoryCreator
          account={appState.selectedAccount}
          onRepositoryCreated={handleRepositoryCreated}
        />
      );
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
         (appState.currentUseCase === 'create-and-add' && appState.createdRepository))) {
      exit();
      console.log('\n⚠️  Personal accounts cannot have teams.');
      return null;
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