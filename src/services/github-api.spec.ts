import test from 'ava';
import sinon from 'sinon';
import { GitHubAPI } from './github-api-refactored.js';
import { IGraphQLClient, IAuthTokenProvider } from '../interfaces/index.js';
import { Project, Team, CreateProjectInput } from '../types/index.js';

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
  
  await t.throwsAsync(api.getCurrentUser(), { message: 'No authentication token found' });
});

test('searchProjects returns projects with correct format', async t => {
  const { graphqlClient, graphqlClientFactory, authTokenProvider } = createMocks();
  const api = new GitHubAPI(graphqlClientFactory, authTokenProvider);
  
  (authTokenProvider.getToken as sinon.SinonStub).resolves('test-token');
  (graphqlClient.request as sinon.SinonStub).resolves({
    search: {
      nodes: [
        {
          id: 'proj1',
          title: 'Project 1',
          shortDescription: 'Description 1',
          public: true,
        },
        {
          id: 'proj2',
          title: 'Project 2',
          shortDescription: 'Description 2',
          public: false,
        },
      ],
    },
  });
  
  const results = await api.searchProjects('test', 'owner', 10);
  
  t.is(results.length, 2);
  t.deepEqual(results[0], {
    id: 'proj1',
    name: 'Project 1',
    description: 'Description 1',
    visibility: 'PUBLIC',
  });
  t.deepEqual(results[1], {
    id: 'proj2',
    name: 'Project 2',
    description: 'Description 2',
    visibility: 'PRIVATE',
  });
  
  const requestCall = (graphqlClient.request as sinon.SinonStub).firstCall;
  t.deepEqual(requestCall.args[1], { query: 'user:owner test', first: 10 });
});

test('createProject creates project with correct input', async t => {
  const { graphqlClient, graphqlClientFactory, authTokenProvider } = createMocks();
  const api = new GitHubAPI(graphqlClientFactory, authTokenProvider);
  
  const input: CreateProjectInput = {
    ownerId: 'owner-id',
    title: 'New Project',
    description: 'Project description',
    visibility: 'PUBLIC',
  };
  
  (authTokenProvider.getToken as sinon.SinonStub).resolves('test-token');
  (graphqlClient.request as sinon.SinonStub).resolves({
    createProjectV2: {
      projectV2: {
        id: 'created-id',
        title: 'New Project',
        shortDescription: 'Project description',
        public: true,
      },
    },
  });
  
  const result = await api.createProject(input);
  
  t.deepEqual(result, {
    id: 'created-id',
    name: 'New Project',
    description: 'Project description',
    visibility: 'PUBLIC',
  });
  
  const requestCall = (graphqlClient.request as sinon.SinonStub).firstCall;
  t.deepEqual(requestCall.args[1].input, {
    ownerId: 'owner-id',
    title: 'New Project',
    shortDescription: 'Project description',
    public: true,
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
  const requestCall = (graphqlClient.request as sinon.SinonStub).firstCall;
  t.true(requestCall.args[0].includes('user(login: $login)'));
  t.deepEqual(requestCall.args[1], { login: 'testuser' });
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
  const requestCall = (graphqlClient.request as sinon.SinonStub).firstCall;
  t.true(requestCall.args[0].includes('organization(login: $login)'));
  t.deepEqual(requestCall.args[1], { login: 'testorg' });
});

test('listTeams returns teams for organization', async t => {
  const { graphqlClient, graphqlClientFactory, authTokenProvider } = createMocks();
  const api = new GitHubAPI(graphqlClientFactory, authTokenProvider);
  
  const mockTeams: Team[] = [
    { id: 'team1', name: 'Team 1', slug: 'team-1' },
    { id: 'team2', name: 'Team 2', slug: 'team-2' },
  ];
  
  (authTokenProvider.getToken as sinon.SinonStub).resolves('test-token');
  (graphqlClient.request as sinon.SinonStub).resolves({
    organization: {
      teams: {
        nodes: mockTeams,
      },
    },
  });
  
  const result = await api.listTeams('testorg');
  
  t.deepEqual(result, mockTeams);
  const requestCall = (graphqlClient.request as sinon.SinonStub).firstCall;
  t.deepEqual(requestCall.args[1], { org: 'testorg' });
});

test('addProjectToTeams adds project to multiple teams', async t => {
  const { graphqlClient, graphqlClientFactory, authTokenProvider } = createMocks();
  const api = new GitHubAPI(graphqlClientFactory, authTokenProvider);
  
  (authTokenProvider.getToken as sinon.SinonStub).resolves('test-token');
  (graphqlClient.request as sinon.SinonStub).resolves({
    linkProjectV2ToTeam: {
      clientMutationId: 'mutation-id',
    },
  });
  
  await api.addProjectToTeams('project-123', ['team-1', 'team-2', 'team-3']);
  
  t.is((graphqlClient.request as sinon.SinonStub).callCount, 3);
  
  const calls = (graphqlClient.request as sinon.SinonStub).getCalls();
  t.deepEqual(calls[0].args[1], { projectId: 'project-123', teamId: 'team-1' });
  t.deepEqual(calls[1].args[1], { projectId: 'project-123', teamId: 'team-2' });
  t.deepEqual(calls[2].args[1], { projectId: 'project-123', teamId: 'team-3' });
});