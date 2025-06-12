import test from 'ava';
import sinon from 'sinon';
import { GitHubAPI } from './github-api-refactored.js';
import { IGraphQLClient, IAuthTokenProvider } from '../interfaces/index.js';
import { Repository, Team, CreateRepositoryInput } from '../types/index.js';

const createMocks = () => {
  const graphqlClient: IGraphQLClient = {
    request: sinon.stub(),
  };
  
  const graphqlClientFactory = sinon.stub().returns(graphqlClient);
  
  const authTokenProvider: IAuthTokenProvider = {
    getToken: sinon.stub(),
  };
  
  return { graphqlClient, graphqlClientFactory, authTokenProvider };
};

test('getCurrentUser returns user info and organizations', async t => {
  const { graphqlClient, graphqlClientFactory, authTokenProvider } = createMocks();
  const api = new GitHubAPI(graphqlClientFactory, authTokenProvider);
  
  (authTokenProvider.getToken as sinon.SinonStub).resolves('test-token');
  (graphqlClient.request as sinon.SinonStub).resolves({
    viewer: {
      login: 'testuser',
      organizations: {
        nodes: [
          { login: 'org1' },
          { login: 'org2' },
        ],
      },
    },
  });
  
  const result = await api.getCurrentUser();
  
  t.is(result.login, 'testuser');
  t.deepEqual(result.organizations, ['org1', 'org2']);
  t.true((graphqlClientFactory as sinon.SinonStub).calledWith('test-token'));
});

test('getCurrentUser throws when no token is available', async t => {
  const { graphqlClientFactory, authTokenProvider } = createMocks();
  const api = new GitHubAPI(graphqlClientFactory, authTokenProvider);
  
  (authTokenProvider.getToken as sinon.SinonStub).resolves(undefined);
  
  await t.throwsAsync(api.getCurrentUser(), { message: 'No GitHub authentication token found. Please check GitHub CLI authentication in ~/.config/gh/hosts.yml' });
});

test('searchRepositories returns repositories with correct format', async t => {
  const { graphqlClient, graphqlClientFactory, authTokenProvider } = createMocks();
  const api = new GitHubAPI(graphqlClientFactory, authTokenProvider);
  
  (authTokenProvider.getToken as sinon.SinonStub).resolves('test-token');
  (graphqlClient.request as sinon.SinonStub).resolves({
    search: {
      nodes: [
        {
          id: 'repo1',
          name: 'Repository 1',
          description: 'Description 1',
          isPrivate: false,
          owner: { login: 'testuser' },
        },
        {
          id: 'repo2', 
          name: 'Repository 2',
          description: 'Description 2',
          isPrivate: true,
          owner: { login: 'testuser' },
        },
      ],
    },
  });
  
  const results = await api.searchRepositories('test', 'testuser', 10);
  
  t.is(results.length, 2);
  t.deepEqual(results[0], {
    id: 'repo1',
    name: 'Repository 1',
    description: 'Description 1',
    visibility: 'PUBLIC',
    owner: { login: 'testuser' },
  });
  t.deepEqual(results[1], {
    id: 'repo2',
    name: 'Repository 2',
    description: 'Description 2',
    visibility: 'PRIVATE', 
    owner: { login: 'testuser' },
  });
  
  const requestCall = (graphqlClient.request as sinon.SinonStub).firstCall;
  t.deepEqual(requestCall.args[1], { searchQuery: 'user:testuser test in:name', first: 10 });
});

test('createRepository creates repository with correct input', async t => {
  const { graphqlClient, graphqlClientFactory, authTokenProvider } = createMocks();
  const api = new GitHubAPI(graphqlClientFactory, authTokenProvider);
  
  const input: CreateRepositoryInput = {
    name: 'new-repository',
    description: 'Repository description',
    visibility: 'PUBLIC',
  };
  
  (authTokenProvider.getToken as sinon.SinonStub).resolves('test-token');
  (graphqlClient.request as sinon.SinonStub).resolves({
    createRepository: {
      repository: {
        id: 'created-id',
        name: 'new-repository',
        description: 'Repository description',
        isPrivate: false,
        owner: { login: 'testuser' },
      },
    },
  });
  
  const result = await api.createRepository(input);
  
  t.deepEqual(result, {
    id: 'created-id',
    name: 'new-repository',
    description: 'Repository description',
    visibility: 'PUBLIC',
    owner: { login: 'testuser' },
  });
  
  const requestCall = (graphqlClient.request as sinon.SinonStub).firstCall;
  t.deepEqual(requestCall.args[1].input, {
    name: 'new-repository',
    description: 'Repository description',
    visibility: 'PUBLIC',
  });
});

test('getOwnerId returns user id', async t => {
  const { graphqlClient, graphqlClientFactory, authTokenProvider } = createMocks();
  const api = new GitHubAPI(graphqlClientFactory, authTokenProvider);
  
  (authTokenProvider.getToken as sinon.SinonStub).resolves('test-token');
  (graphqlClient.request as sinon.SinonStub).resolves({
    user: { id: 'user-123' },
  });
  
  const result = await api.getOwnerId('testuser', 'user');
  
  t.is(result, 'user-123');
});

test('getOwnerId returns organization id', async t => {
  const { graphqlClient, graphqlClientFactory, authTokenProvider } = createMocks();
  const api = new GitHubAPI(graphqlClientFactory, authTokenProvider);
  
  (authTokenProvider.getToken as sinon.SinonStub).resolves('test-token');
  (graphqlClient.request as sinon.SinonStub).resolves({
    organization: { id: 'org-456' },
  });
  
  const result = await api.getOwnerId('testorg', 'organization');
  
  t.is(result, 'org-456');
});

test('listTeams returns teams for organization', async t => {
  const { graphqlClient, graphqlClientFactory, authTokenProvider } = createMocks();
  const api = new GitHubAPI(graphqlClientFactory, authTokenProvider);
  
  (authTokenProvider.getToken as sinon.SinonStub).resolves('test-token');
  (graphqlClient.request as sinon.SinonStub).resolves({
    organization: {
      teams: {
        nodes: [
          { id: 'team1', name: 'Team 1', slug: 'team-1' },
          { id: 'team2', name: 'Team 2', slug: 'team-2' },
        ],
      },
    },
  });
  
  const result = await api.listTeams('testorg');
  
  t.is(result.length, 2);
  t.deepEqual(result[0], { id: 'team1', name: 'Team 1', slug: 'team-1' });
  t.deepEqual(result[1], { id: 'team2', name: 'Team 2', slug: 'team-2' });
});

test('addRepositoryToTeams adds repository to multiple teams', async t => {
  const { graphqlClient, graphqlClientFactory, authTokenProvider } = createMocks();
  const api = new GitHubAPI(graphqlClientFactory, authTokenProvider);
  
  (authTokenProvider.getToken as sinon.SinonStub).resolves('test-token');
  (graphqlClient.request as sinon.SinonStub).resolves({
    updateTeamsRepository: {
      clientMutationId: 'success',
    },
  });
  
  await api.addRepositoryToTeams('repository-id', ['team-1', 'team-2']);
  
  const requestCall = (graphqlClient.request as sinon.SinonStub).firstCall;
  t.deepEqual(requestCall.args[1], {
    repositoryId: 'repository-id',
    teamIds: ['team-1', 'team-2'],
    permission: 'WRITE',
  });
  
  t.true((graphqlClient.request as sinon.SinonStub).calledOnce);
});