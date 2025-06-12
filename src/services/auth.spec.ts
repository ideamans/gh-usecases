import test from 'ava';
import sinon from 'sinon';
import { AuthService } from './auth-refactored.js';
import { ICommandExecutor, IFileSystem, IGitHubCliConfig, IEnvironment } from '../interfaces/index.js';

const createMocks = () => {
  const commandExecutor: ICommandExecutor = {
    exec: sinon.stub(),
  };
  
  const fileSystem: IFileSystem = {
    pathExists: sinon.stub(),
    readFile: sinon.stub(),
    readJson: sinon.stub(),
    writeJson: sinon.stub(),
    ensureDir: sinon.stub(),
  };
  
  const ghConfig: IGitHubCliConfig = {
    getGhConfigPath: sinon.stub().returns('/home/user/.config/gh/hosts.yml'),
  };
  
  const environment: IEnvironment = {
    homedir: sinon.stub().returns('/home/user'),
  };
  
  return { commandExecutor, fileSystem, ghConfig, environment };
};

test('checkAuthStatus returns authenticated when gh auth status succeeds', async t => {
  const { commandExecutor, fileSystem, ghConfig, environment } = createMocks();
  const authService = new AuthService(commandExecutor, fileSystem, ghConfig, environment);
  
  (commandExecutor.exec as sinon.SinonStub).resolves({
    stdout: 'Logged in to github.com as user\nToken scopes: repo, read:org',
    stderr: '',
  });
  
  const result = await authService.checkAuthStatus();
  
  t.true(result.isAuthenticated);
  t.deepEqual(result.permissions, ['repo', 'read:org']);
  t.true((commandExecutor.exec as sinon.SinonStub).calledWith('gh auth status'));
});

test('checkAuthStatus returns not authenticated when gh auth status fails with not logged in', async t => {
  const { commandExecutor, fileSystem, ghConfig, environment } = createMocks();
  const authService = new AuthService(commandExecutor, fileSystem, ghConfig, environment);
  
  const error = new Error('not logged in to any GitHub hosts');
  (commandExecutor.exec as sinon.SinonStub).rejects(error);
  
  const result = await authService.checkAuthStatus();
  
  t.false(result.isAuthenticated);
  t.deepEqual(result.permissions, []);
});

test('checkAuthStatus throws error for other failures', async t => {
  const { commandExecutor, fileSystem, ghConfig, environment } = createMocks();
  const authService = new AuthService(commandExecutor, fileSystem, ghConfig, environment);
  
  const error = new Error('Network error');
  (commandExecutor.exec as sinon.SinonStub).rejects(error);
  
  await t.throwsAsync(authService.checkAuthStatus(), { message: 'Network error' });
});

test('getToken returns token when config file exists and contains token', async t => {
  const { commandExecutor, fileSystem, ghConfig, environment } = createMocks();
  const authService = new AuthService(commandExecutor, fileSystem, ghConfig, environment);
  
  (fileSystem.pathExists as sinon.SinonStub).resolves(true);
  (fileSystem.readFile as sinon.SinonStub).resolves(`github.com:
    oauth_token: gho_testtoken123
    user: testuser`);
  
  const token = await authService.getToken();
  
  t.is(token, 'gho_testtoken123');
  t.true((fileSystem.pathExists as sinon.SinonStub).calledWith('/home/user/.config/gh/hosts.yml'));
});

test('getToken returns undefined when config file does not exist', async t => {
  const { commandExecutor, fileSystem, ghConfig, environment } = createMocks();
  const authService = new AuthService(commandExecutor, fileSystem, ghConfig, environment);
  
  (fileSystem.pathExists as sinon.SinonStub).resolves(false);
  
  const token = await authService.getToken();
  
  t.is(token, undefined);
});

test('getToken returns undefined when config file has no token', async t => {
  const { commandExecutor, fileSystem, ghConfig, environment } = createMocks();
  const authService = new AuthService(commandExecutor, fileSystem, ghConfig, environment);
  
  (fileSystem.pathExists as sinon.SinonStub).resolves(true);
  (fileSystem.readFile as sinon.SinonStub).resolves(`github.com:
    user: testuser`);
  
  const token = await authService.getToken();
  
  t.is(token, undefined);
});

test('login executes gh auth login command', async t => {
  const { commandExecutor, fileSystem, ghConfig, environment } = createMocks();
  const authService = new AuthService(commandExecutor, fileSystem, ghConfig, environment);
  
  (commandExecutor.exec as sinon.SinonStub).resolves({ stdout: '', stderr: '' });
  
  await authService.login();
  
  t.true((commandExecutor.exec as sinon.SinonStub).calledWith('gh auth login'));
});

test('refreshPermissions executes gh auth refresh with correct scopes', async t => {
  const { commandExecutor, fileSystem, ghConfig, environment } = createMocks();
  const authService = new AuthService(commandExecutor, fileSystem, ghConfig, environment);
  
  (commandExecutor.exec as sinon.SinonStub).resolves({ stdout: '', stderr: '' });
  
  await authService.refreshPermissions(['repo', 'admin:org']);
  
  t.true((commandExecutor.exec as sinon.SinonStub).calledWith('gh auth refresh -s repo,admin:org'));
});

test('ensureScopes throws error when not authenticated', async t => {
  const { commandExecutor, fileSystem, ghConfig, environment } = createMocks();
  const authService = new AuthService(commandExecutor, fileSystem, ghConfig, environment);
  
  const error = new Error('not logged in to any GitHub hosts');
  (commandExecutor.exec as sinon.SinonStub).rejects(error);
  
  await t.throwsAsync(
    authService.ensureScopes(['repo']),
    { message: 'Not authenticated. Please run gh auth login first.' }
  );
});

test('ensureScopes refreshes permissions when scopes are missing', async t => {
  const { commandExecutor, fileSystem, ghConfig, environment } = createMocks();
  const authService = new AuthService(commandExecutor, fileSystem, ghConfig, environment);
  
  (commandExecutor.exec as sinon.SinonStub)
    .onFirstCall().resolves({
      stdout: 'Logged in to github.com as user\nToken scopes: repo',
      stderr: '',
    })
    .onSecondCall().resolves({ stdout: '', stderr: '' });
  
  await authService.ensureScopes(['repo', 'admin:org']);
  
  t.is((commandExecutor.exec as sinon.SinonStub).callCount, 2);
  t.true((commandExecutor.exec as sinon.SinonStub).secondCall.calledWith('gh auth refresh -s repo,admin:org'));
});

test('ensureScopes does not refresh when all scopes are present', async t => {
  const { commandExecutor, fileSystem, ghConfig, environment } = createMocks();
  const authService = new AuthService(commandExecutor, fileSystem, ghConfig, environment);
  
  (commandExecutor.exec as sinon.SinonStub).resolves({
    stdout: 'Logged in to github.com as user\nToken scopes: repo, admin:org',
    stderr: '',
  });
  
  await authService.ensureScopes(['repo', 'admin:org']);
  
  t.is((commandExecutor.exec as sinon.SinonStub).callCount, 1);
  t.true((commandExecutor.exec as sinon.SinonStub).calledWith('gh auth status'));
});