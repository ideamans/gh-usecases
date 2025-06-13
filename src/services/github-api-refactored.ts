import { Repository, Team, CreateRepositoryInput } from '../types/index.js';
import { IGraphQLClient, IAuthTokenProvider } from '../interfaces/index.js';

export class GitHubAPI {
  constructor(
    private graphqlClientFactory: (token: string) => IGraphQLClient,
    private authTokenProvider: IAuthTokenProvider
  ) {}

  private async getGraphQLClient(): Promise<IGraphQLClient> {
    const token = await this.authTokenProvider.getToken();
    if (!token) {
      throw new Error('No GitHub authentication token found. Please check GitHub CLI authentication in ~/.config/gh/hosts.yml');
    }
    return this.graphqlClientFactory(token);
  }

  async getCurrentUser(): Promise<{ login: string; organizations: string[] }> {
    const graphqlClient = await this.getGraphQLClient();
    
    const { viewer } = await graphqlClient.request<{
      viewer: {
        login: string;
        organizations: {
          nodes: Array<{ login: string }>;
        };
      };
    }>(`
      query {
        viewer {
          login
          organizations(first: 100) {
            nodes {
              login
            }
          }
        }
      }
    `);

    return {
      login: viewer.login,
      organizations: viewer.organizations.nodes.map(org => org.login),
    };
  }

  async searchRepositories(
    query: string,
    owner: string,
    first: number = 10
  ): Promise<Repository[]> {
    const graphqlClient = await this.getGraphQLClient();
    
    // Build search query based on owner context
    // For personal accounts: search user's repos
    // For organizations: search org's repos
    // Include forks with fork:true
    // Always search in name field and sort by updated time
    const searchQuery = owner ? `owner:${owner} ${query} in:name fork:true sort:updated` : `${query} in:name fork:true sort:updated`;
    
    const { search } = await graphqlClient.request<{
      search: {
        nodes: Array<{
          id: string;
          name: string;
          description: string | null;
          isPrivate: boolean;
          isFork: boolean;
          owner: {
            login: string;
          };
        }>;
      };
    }>(`
      query SearchRepositories($searchQuery: String!, $first: Int!) {
        search(query: $searchQuery, type: REPOSITORY, first: $first) {
          nodes {
            ... on Repository {
              id
              name
              description
              isPrivate
              isFork
              owner {
                login
              }
            }
          }
        }
      }
    `, {
      searchQuery,
      first,
    });

    return search.nodes.map(node => ({
      id: node.id,
      name: node.name,
      description: node.description || '',
      visibility: node.isPrivate ? 'PRIVATE' as const : 'PUBLIC' as const,
      owner: node.owner,
      isFork: node.isFork,
    }));
  }

  async createRepository(input: CreateRepositoryInput): Promise<Repository> {
    const graphqlClient = await this.getGraphQLClient();
    
    // For organization repositories, we need to get the organization ID
    let ownerId: string | undefined;
    if (input.owner) {
      ownerId = await this.getOwnerId(input.owner, 'organization');
    }
    

    const response = await graphqlClient.request<{
      createRepository: {
        repository: {
          id: string;
          name: string;
          description: string | null;
          isPrivate: boolean;
          owner: {
            login: string;
          };
        };
      };
    }>(`
      mutation CreateRepository($input: CreateRepositoryInput!) {
        createRepository(input: $input) {
          repository {
            id
            name
            description
            isPrivate
            owner {
              login
            }
          }
        }
      }
    `, {
      input: {
        name: input.name,
        description: input.description || null,
        visibility: input.visibility,
        ...(ownerId && { ownerId }),
      },
    });


    const { createRepository } = response;
    
    const result: Repository = {
      id: createRepository.repository.id,
      name: createRepository.repository.name,
      description: createRepository.repository.description || '',
      visibility: createRepository.repository.isPrivate ? 'PRIVATE' as const : 'PUBLIC' as const,
      owner: createRepository.repository.owner,
    };
    
    return result;
  }

  async getOwnerId(login: string, type: 'user' | 'organization'): Promise<string> {
    const graphqlClient = await this.getGraphQLClient();
    
    if (type === 'user') {
      const { user } = await graphqlClient.request<{ user: { id: string } }>(`
        query GetUserId($login: String!) {
          user(login: $login) {
            id
          }
        }
      `, { login });
      
      return user.id;
    } else {
      const { organization } = await graphqlClient.request<{ organization: { id: string } }>(`
        query GetOrgId($login: String!) {
          organization(login: $login) {
            id
          }
        }
      `, { login });
      
      return organization.id;
    }
  }

  async listTeams(org: string): Promise<Team[]> {
    const graphqlClient = await this.getGraphQLClient();
    
    const { organization } = await graphqlClient.request<{
      organization: {
        teams: {
          nodes: Array<{
            id: string;
            name: string;
            slug: string;
          }>;
        };
      };
    }>(`
      query ListTeams($org: String!) {
        organization(login: $org) {
          teams(first: 100) {
            nodes {
              id
              name
              slug
            }
          }
        }
      }
    `, { org });

    return organization.teams.nodes;
  }

  async listTeamsWithRepositories(org: string): Promise<Array<Team & { repositories: Array<{ name: string; description?: string }> }>> {
    const graphqlClient = await this.getGraphQLClient();
    
    const { organization } = await graphqlClient.request<{
      organization: {
        teams: {
          nodes: Array<{
            id: string;
            name: string;
            slug: string;
            repositories: {
              nodes: Array<{
                name: string;
                description: string | null;
              }>;
            };
          }>;
        };
      };
    }>(`
      query ListTeamsWithRepos($org: String!) {
        organization(login: $org) {
          teams(first: 100) {
            nodes {
              id
              name
              slug
              repositories(first: 20) {
                nodes {
                  name
                  description
                }
              }
            }
          }
        }
      }
    `, { org });

    return organization.teams.nodes.map(team => ({
      id: team.id,
      name: team.name,
      slug: team.slug,
      repositories: team.repositories.nodes.map(repo => ({
        name: repo.name,
        description: repo.description || undefined,
      })),
    }));
  }

  async addRepositoryToTeams(repositoryId: string, teamIds: string[]): Promise<void> {
    const graphqlClient = await this.getGraphQLClient();
    
    // Use updateTeamsRepository mutation to add repository to multiple teams
    await graphqlClient.request(`
      mutation AddRepositoryToTeams($repositoryId: ID!, $teamIds: [ID!]!, $permission: RepositoryPermission!) {
        updateTeamsRepository(input: {
          repositoryId: $repositoryId,
          teamIds: $teamIds,
          permission: $permission
        }) {
          clientMutationId
        }
      }
    `, {
      repositoryId,
      teamIds,
      permission: 'WRITE', // Default permission
    });
  }
}