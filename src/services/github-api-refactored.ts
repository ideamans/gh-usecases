import { Project, Team, CreateProjectInput } from '../types/index.js';
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

  async searchProjects(
    query: string,
    owner: string,
    first: number = 10
  ): Promise<Project[]> {
    const graphqlClient = await this.getGraphQLClient();
    
    const searchQuery = `user:${owner} ${query}`;
    
    const { search } = await graphqlClient.request<{
      search: {
        nodes: Array<{
          id: string;
          title: string;
          shortDescription: string | null;
          public: boolean;
        }>;
      };
    }>(`
      query SearchProjects($query: String!, $first: Int!) {
        search(query: $query, type: ISSUE, first: $first) {
          nodes {
            ... on ProjectV2 {
              id
              title
              shortDescription
              public
            }
          }
        }
      }
    `, {
      query: searchQuery,
      first,
    });

    return search.nodes.map(node => ({
      id: node.id,
      name: node.title,
      description: node.shortDescription || '',
      visibility: node.public ? 'PUBLIC' : 'PRIVATE',
    }));
  }

  async createProject(input: CreateProjectInput): Promise<Project> {
    const graphqlClient = await this.getGraphQLClient();
    
    // First create the project with just title and owner
    const { createProjectV2 } = await graphqlClient.request<{
      createProjectV2: {
        projectV2: {
          id: string;
          title: string;
        };
      };
    }>(`
      mutation CreateProject($input: CreateProjectV2Input!) {
        createProjectV2(input: $input) {
          projectV2 {
            id
            title
          }
        }
      }
    `, {
      input: {
        ownerId: input.ownerId,
        title: input.title,
      },
    });

    const projectId = createProjectV2.projectV2.id;
    
    // Update project with description and visibility
    if (input.description !== undefined || input.visibility !== undefined) {
      await graphqlClient.request(`
        mutation UpdateProject($projectId: ID!, $shortDescription: String, $public: Boolean) {
          updateProjectV2(input: {
            projectId: $projectId,
            shortDescription: $shortDescription,
            public: $public
          }) {
            projectV2 {
              id
            }
          }
        }
      `, {
        projectId,
        shortDescription: input.description || null,
        public: input.visibility === 'PUBLIC',
      });
    }
    
    return {
      id: projectId,
      name: createProjectV2.projectV2.title,
      description: input.description || '',
      visibility: input.visibility || 'PRIVATE',
    };
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

  async addProjectToTeams(projectId: string, teamIds: string[]): Promise<void> {
    const graphqlClient = await this.getGraphQLClient();
    
    for (const teamId of teamIds) {
      await graphqlClient.request(`
        mutation LinkProjectToTeam($projectId: ID!, $teamId: ID!) {
          linkProjectV2ToTeam(input: { projectId: $projectId, teamId: $teamId }) {
            clientMutationId
          }
        }
      `, {
        projectId,
        teamId,
      });
    }
  }
}