import { GitHubAPI as GitHubAPIRefactored } from './github-api-refactored.js';
import { createGraphQLClient } from './graphql-client-factory.js';
import { AuthService } from './auth.js';
import { Repository, Team, CreateRepositoryInput } from '../types/index.js';

// Singleton instance for backward compatibility
let githubAPIInstance: GitHubAPIRefactored | null = null;

function getGitHubAPI(): GitHubAPIRefactored {
  if (!githubAPIInstance) {
    githubAPIInstance = new GitHubAPIRefactored(
      createGraphQLClient,
      AuthService
    );
  }
  return githubAPIInstance;
}

export class GitHubAPI {
  static async getCurrentUser(): Promise<{ login: string; organizations: string[] }> {
    return getGitHubAPI().getCurrentUser();
  }

  static async searchRepositories(
    query: string,
    owner: string,
    first: number = 10
  ): Promise<Repository[]> {
    return getGitHubAPI().searchRepositories(query, owner, first);
  }

  static async createRepository(input: CreateRepositoryInput): Promise<Repository> {
    return getGitHubAPI().createRepository(input);
  }

  static async getOwnerId(login: string, type: 'user' | 'organization'): Promise<string> {
    return getGitHubAPI().getOwnerId(login, type);
  }

  static async listTeams(org: string): Promise<Team[]> {
    return getGitHubAPI().listTeams(org);
  }

  static async listTeamsWithRepositories(org: string): Promise<Array<Team & { repositories: Array<{ name: string; description?: string }> }>> {
    return getGitHubAPI().listTeamsWithRepositories(org);
  }

  static async addRepositoryToTeams(repositoryId: string, teamIds: string[]): Promise<void> {
    return getGitHubAPI().addRepositoryToTeams(repositoryId, teamIds);
  }
}