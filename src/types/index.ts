export interface Config {
  selectedAccount: {
    type: 'personal' | 'organization';
    login: string;
  };
}

export interface Repository {
  id: string;
  name: string;
  description?: string;
  visibility: 'PRIVATE' | 'PUBLIC';
  owner: {
    login: string;
  };
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

export interface CreateRepositoryInput {
  name: string;
  description?: string;
  visibility: 'PRIVATE' | 'PUBLIC';
  owner?: string; // For organization repos
}

export type UseCase = 'create' | 'add-to-teams' | 'create-and-add';

export interface AppState {
  authState: AuthState | null;
  selectedAccount: Config['selectedAccount'] | null;
  currentUseCase: UseCase | null;
  createdRepository: Repository | null;
}