import { GitHubAPI as GitHubAPIRefactored } from './github-api-refactored.js';
import { createGraphQLClient } from './graphql-client-factory.js';
import { AuthService } from './auth.js';
import { Project, Team, CreateProjectInput } from '../types/index.js';

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

  static async searchProjects(
    query: string,
    owner: string,
    first: number = 10
  ): Promise<Project[]> {
    return getGitHubAPI().searchProjects(query, owner, first);
  }

  static async createProject(input: CreateProjectInput): Promise<Project> {
    return getGitHubAPI().createProject(input);
  }

  static async getOwnerId(login: string, type: 'user' | 'organization'): Promise<string> {
    return getGitHubAPI().getOwnerId(login, type);
  }

  static async listTeams(org: string): Promise<Team[]> {
    return getGitHubAPI().listTeams(org);
  }

  static async addProjectToTeams(projectId: string, teamIds: string[]): Promise<void> {
    return getGitHubAPI().addProjectToTeams(projectId, teamIds);
  }
}