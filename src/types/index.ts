export interface Config {
  selectedAccount: {
    type: 'personal' | 'organization';
    login: string;
  };
  defaultTeams?: {
    [org: string]: string[];
  };
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  visibility: 'PRIVATE' | 'PUBLIC';
}

export interface Team {
  id: string;
  name: string;
  slug: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  token?: string;
  permissions: string[];
}

export interface CreateProjectInput {
  ownerId: string;
  title: string;
  description?: string;
  visibility: 'PRIVATE' | 'PUBLIC';
}

export type UseCase = 'create' | 'add-to-teams' | 'create-and-add';

export interface AppState {
  authState: AuthState | null;
  selectedAccount: Config['selectedAccount'] | null;
  currentUseCase: UseCase | null;
  createdProject: Project | null;
}