import React, { useState } from 'react';
import { Box, Text, useApp } from 'ink';
import { Auth } from './Auth.js';
import { AccountSelector } from './AccountSelector.js';
import { UseCaseSelector } from './UseCaseSelector.js';
import { ProjectCreator } from './ProjectCreator.js';
import { ProjectSelector } from './ProjectSelector.js';
import { TeamSelector } from './TeamSelector.js';
import { AppState, AuthState, Config, Project, Team, UseCase } from '../types/index.js';

export const App: React.FC = () => {
  const { exit } = useApp();
  const [appState, setAppState] = useState<AppState>({
    authState: null,
    selectedAccount: null,
    currentUseCase: null,
    createdProject: null,
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

  const handleProjectCreated = (project: Project) => {
    setAppState(prev => ({ ...prev, createdProject: project }));
    
    if (appState.currentUseCase === 'create') {
      exit();
      console.log(`\n✅ Project "${project.name}" created successfully!`);
    }
  };

  const handleProjectSelected = (project: Project) => {
    setAppState(prev => ({ ...prev, createdProject: project }));
  };

  const handleTeamsSelected = (teams: Team[]) => {
    const teamNames = teams.map(t => t.name).join(', ');
    exit();
    console.log(`\n✅ Project "${appState.createdProject?.name}" added to teams: ${teamNames}`);
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
        (appState.currentUseCase === 'create-and-add' && !appState.createdProject)) {
      return (
        <ProjectCreator
          account={appState.selectedAccount}
          onProjectCreated={handleProjectCreated}
          onCancel={handleCancel}
        />
      );
    }

    if (appState.currentUseCase === 'add-to-teams' && !appState.createdProject) {
      return (
        <ProjectSelector
          account={appState.selectedAccount}
          onProjectSelected={handleProjectSelected}
          onCancel={handleCancel}
        />
      );
    }

    if ((appState.currentUseCase === 'add-to-teams' || appState.currentUseCase === 'create-and-add') 
        && appState.createdProject
        && appState.selectedAccount.type === 'organization') {
      return (
        <TeamSelector
          account={appState.selectedAccount}
          project={appState.createdProject}
          onTeamsSelected={handleTeamsSelected}
          onCancel={handleCancel}
        />
      );
    }

    if (appState.selectedAccount.type === 'personal' && 
        (appState.currentUseCase === 'add-to-teams' || 
         (appState.currentUseCase === 'create-and-add' && appState.createdProject))) {
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