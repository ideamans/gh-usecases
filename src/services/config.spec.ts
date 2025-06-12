import test from 'ava';
import sinon from 'sinon';
import { ConfigService } from './config-refactored.js';
import { IFileSystem, IEnvironment } from '../interfaces/index.js';
import { Config } from '../types/index.js';

test.beforeEach(() => {
  // Restore console.error if it's been stubbed
  if ((console.error as any).restore) {
    (console.error as any).restore();
  }
});

test.afterEach(() => {
  // Clean up any stubs
  sinon.restore();
});

const createMocks = () => {
  const fileSystem: IFileSystem = {
    pathExists: sinon.stub(),
    readFile: sinon.stub(),
    readJson: sinon.stub(),
    writeJson: sinon.stub(),
    ensureDir: sinon.stub(),
  };
  
  const environment: IEnvironment = {
    homedir: sinon.stub().returns('/home/user'),
  };
  
  return { fileSystem, environment };
};

test('load returns config when file exists', async t => {
  const { fileSystem, environment } = createMocks();
  const configService = new ConfigService(fileSystem, environment);
  
  const mockConfig: Config = {
    selectedAccount: {
      type: 'organization',
      login: 'test-org',
    },
    defaultTeams: {
      'test-org': ['team-1', 'team-2'],
    },
  };
  
  (fileSystem.pathExists as sinon.SinonStub).resolves(true);
  (fileSystem.readJson as sinon.SinonStub).resolves(mockConfig);
  
  const result = await configService.load();
  
  t.deepEqual(result, mockConfig);
  t.true((fileSystem.pathExists as sinon.SinonStub).calledWith('/home/user/.gh-usecases.json'));
});

test('load returns null when file does not exist', async t => {
  const { fileSystem, environment } = createMocks();
  const configService = new ConfigService(fileSystem, environment);
  
  (fileSystem.pathExists as sinon.SinonStub).resolves(false);
  
  const result = await configService.load();
  
  t.is(result, null);
});

test.serial('load returns null and logs error when read fails', async t => {
  const { fileSystem, environment } = createMocks();
  const configService = new ConfigService(fileSystem, environment);
  
  const consoleErrorStub = sinon.stub(console, 'error');
  
  (fileSystem.pathExists as sinon.SinonStub).resolves(true);
  (fileSystem.readJson as sinon.SinonStub).rejects(new Error('Read error'));
  
  const result = await configService.load();
  
  t.is(result, null);
  t.true(consoleErrorStub.called);
  
  consoleErrorStub.restore();
});

test('save writes config to file', async t => {
  const { fileSystem, environment } = createMocks();
  const configService = new ConfigService(fileSystem, environment);
  
  const mockConfig: Config = {
    selectedAccount: {
      type: 'personal',
      login: 'test-user',
    },
  };
  
  (fileSystem.ensureDir as sinon.SinonStub).resolves();
  (fileSystem.writeJson as sinon.SinonStub).resolves();
  
  await configService.save(mockConfig);
  
  t.true((fileSystem.ensureDir as sinon.SinonStub).calledWith('/home/user'));
  t.true((fileSystem.writeJson as sinon.SinonStub).calledWith(
    '/home/user/.gh-usecases.json',
    mockConfig,
    { spaces: 2 }
  ));
});

test.serial('save throws error when write fails', async t => {
  const { fileSystem, environment } = createMocks();
  const configService = new ConfigService(fileSystem, environment);
  
  const consoleErrorStub = sinon.stub(console, 'error');
  
  const mockConfig: Config = {
    selectedAccount: {
      type: 'personal',
      login: 'test-user',
    },
  };
  
  (fileSystem.ensureDir as sinon.SinonStub).resolves();
  (fileSystem.writeJson as sinon.SinonStub).rejects(new Error('Write error'));
  
  await t.throwsAsync(configService.save(mockConfig), { message: 'Write error' });
  t.true(consoleErrorStub.called);
  
  consoleErrorStub.restore();
});

test('getSelectedAccount returns account when config exists', async t => {
  const { fileSystem, environment } = createMocks();
  const configService = new ConfigService(fileSystem, environment);
  
  const mockConfig: Config = {
    selectedAccount: {
      type: 'organization',
      login: 'test-org',
    },
  };
  
  (fileSystem.pathExists as sinon.SinonStub).resolves(true);
  (fileSystem.readJson as sinon.SinonStub).resolves(mockConfig);
  
  const result = await configService.getSelectedAccount();
  
  t.deepEqual(result, mockConfig.selectedAccount);
});

test('getSelectedAccount returns null when no config', async t => {
  const { fileSystem, environment } = createMocks();
  const configService = new ConfigService(fileSystem, environment);
  
  (fileSystem.pathExists as sinon.SinonStub).resolves(false);
  
  const result = await configService.getSelectedAccount();
  
  t.is(result, null);
});

test('setSelectedAccount updates existing config', async t => {
  const { fileSystem, environment } = createMocks();
  const configService = new ConfigService(fileSystem, environment);
  
  const existingConfig: Config = {
    selectedAccount: {
      type: 'personal',
      login: 'old-user',
    },
    defaultTeams: {
      'some-org': ['team-a'],
    },
  };
  
  const newAccount = {
    type: 'organization' as const,
    login: 'new-org',
  };
  
  (fileSystem.pathExists as sinon.SinonStub).resolves(true);
  (fileSystem.readJson as sinon.SinonStub).resolves(existingConfig);
  (fileSystem.ensureDir as sinon.SinonStub).resolves();
  (fileSystem.writeJson as sinon.SinonStub).resolves();
  
  await configService.setSelectedAccount(newAccount);
  
  const savedConfig = (fileSystem.writeJson as sinon.SinonStub).firstCall.args[1];
  t.deepEqual(savedConfig.selectedAccount, newAccount);
  t.deepEqual(savedConfig.defaultTeams, existingConfig.defaultTeams);
});

test('setSelectedAccount creates new config when none exists', async t => {
  const { fileSystem, environment } = createMocks();
  const configService = new ConfigService(fileSystem, environment);
  
  const newAccount = {
    type: 'personal' as const,
    login: 'test-user',
  };
  
  (fileSystem.pathExists as sinon.SinonStub).resolves(false);
  (fileSystem.ensureDir as sinon.SinonStub).resolves();
  (fileSystem.writeJson as sinon.SinonStub).resolves();
  
  await configService.setSelectedAccount(newAccount);
  
  const savedConfig = (fileSystem.writeJson as sinon.SinonStub).firstCall.args[1];
  t.deepEqual(savedConfig, { selectedAccount: newAccount });
});

test('getDefaultTeams returns teams for organization', async t => {
  const { fileSystem, environment } = createMocks();
  const configService = new ConfigService(fileSystem, environment);
  
  const mockConfig: Config = {
    selectedAccount: {
      type: 'organization',
      login: 'test-org',
    },
    defaultTeams: {
      'test-org': ['team-1', 'team-2'],
      'other-org': ['team-3'],
    },
  };
  
  (fileSystem.pathExists as sinon.SinonStub).resolves(true);
  (fileSystem.readJson as sinon.SinonStub).resolves(mockConfig);
  
  const result = await configService.getDefaultTeams('test-org');
  
  t.deepEqual(result, ['team-1', 'team-2']);
});

test('getDefaultTeams returns empty array when no teams configured', async t => {
  const { fileSystem, environment } = createMocks();
  const configService = new ConfigService(fileSystem, environment);
  
  const mockConfig: Config = {
    selectedAccount: {
      type: 'organization',
      login: 'test-org',
    },
  };
  
  (fileSystem.pathExists as sinon.SinonStub).resolves(true);
  (fileSystem.readJson as sinon.SinonStub).resolves(mockConfig);
  
  const result = await configService.getDefaultTeams('test-org');
  
  t.deepEqual(result, []);
});

test('setDefaultTeams updates teams for organization', async t => {
  const { fileSystem, environment } = createMocks();
  const configService = new ConfigService(fileSystem, environment);
  
  const existingConfig: Config = {
    selectedAccount: {
      type: 'organization',
      login: 'test-org',
    },
    defaultTeams: {
      'other-org': ['team-a'],
    },
  };
  
  (fileSystem.pathExists as sinon.SinonStub).resolves(true);
  (fileSystem.readJson as sinon.SinonStub).resolves(existingConfig);
  (fileSystem.ensureDir as sinon.SinonStub).resolves();
  (fileSystem.writeJson as sinon.SinonStub).resolves();
  
  await configService.setDefaultTeams('test-org', ['team-1', 'team-2']);
  
  const savedConfig = (fileSystem.writeJson as sinon.SinonStub).firstCall.args[1];
  t.deepEqual(savedConfig.defaultTeams['test-org'], ['team-1', 'team-2']);
  t.deepEqual(savedConfig.defaultTeams['other-org'], ['team-a']);
});

test('setDefaultTeams creates defaultTeams when none exists', async t => {
  const { fileSystem, environment } = createMocks();
  const configService = new ConfigService(fileSystem, environment);
  
  const existingConfig: Config = {
    selectedAccount: {
      type: 'organization',
      login: 'test-org',
    },
  };
  
  (fileSystem.pathExists as sinon.SinonStub).resolves(true);
  (fileSystem.readJson as sinon.SinonStub).resolves(existingConfig);
  (fileSystem.ensureDir as sinon.SinonStub).resolves();
  (fileSystem.writeJson as sinon.SinonStub).resolves();
  
  await configService.setDefaultTeams('test-org', ['team-1']);
  
  const savedConfig = (fileSystem.writeJson as sinon.SinonStub).firstCall.args[1];
  t.deepEqual(savedConfig.defaultTeams, { 'test-org': ['team-1'] });
});