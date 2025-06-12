import test from 'ava';
import sinon from 'sinon';
import { GeminiService } from './gemini.js';
import { ConfigService } from './config.js';
import fs from 'fs-extra';

test.serial.beforeEach(() => {
  // Clear environment variables
  delete process.env.GEMINI_API_KEY;
  // Ensure a clean state
  sinon.restore();
});

test.serial.afterEach(() => {
  // Clean up after each test
  sinon.restore();
});

test.serial('isAvailable returns false when no API key is configured', async t => {
  const geminiService = new GeminiService();
  
  sinon.stub(ConfigService, 'load').resolves(null);
  
  const available = await geminiService.isAvailable();
  
  t.false(available);
});

test.serial('isAvailable returns true when environment variable is set', async t => {
  process.env.GEMINI_API_KEY = 'test-key';
  
  const geminiService = new GeminiService();
  const available = await geminiService.isAvailable();
  
  t.true(available);
});

test.serial('isAvailable returns true when config has API key', async t => {
  sinon.stub(ConfigService, 'load').resolves({
    selectedAccount: { type: 'personal', login: 'testuser' },
    geminiApiKey: 'config-key',
  });
  
  const geminiService = new GeminiService();
  const available = await geminiService.isAvailable();
  
  t.true(available);
});

test.serial('suggestRepositoryDetails returns null when AI is not available', async t => {
  const geminiService = new GeminiService();
  
  sinon.stub(ConfigService, 'load').resolves(null);
  
  const result = await geminiService.suggestRepositoryDetails('test context');
  
  t.is(result, null);
});

test.serial('suggestRepositoryDetails reads markdown files and suggests name and description', async t => {
  process.env.GEMINI_API_KEY = 'test-key';
  
  const geminiService = new GeminiService();
  
  // Mock file system operations
  const readdirStub = sinon.stub(fs, 'readdir').resolves(['README.md', 'CHANGELOG.md']);
  const statStub = sinon.stub(fs, 'stat').resolves({ isFile: () => true } as any);
  const readFileStub = sinon.stub(fs, 'readFile');
  readFileStub.withArgs(sinon.match(/README\.md/)).resolves('# Test Project\nThis is a test project.');
  readFileStub.withArgs(sinon.match(/CHANGELOG\.md/)).resolves('## v1.0.0\nInitial release.');
  
  // Mock Gemini API
  const mockResponse = {
    text: '{"name": "test-project", "description": "A test project"}'
  };
  
  const mockAI = {
    models: {
      generateContentStream: sinon.stub().resolves([mockResponse])
    }
  };
  
  // Replace the AI instance
  (geminiService as any).ai = mockAI;
  (geminiService as any).initialized = true;
  
  const result = await geminiService.suggestRepositoryDetails();
  
  t.deepEqual(result, {
    name: 'test-project',
    description: 'A test project'
  });
  
  t.true(readdirStub.called);
  t.true(readFileStub.called);
});

test.serial('suggestRepositoryDetails handles API errors gracefully', async t => {
  process.env.GEMINI_API_KEY = 'test-key';
  
  const geminiService = new GeminiService();
  
  // Mock file system operations
  sinon.stub(fs, 'readdir').resolves([]);
  
  // Mock Gemini API to throw error
  const mockAI = {
    models: {
      generateContentStream: sinon.stub().rejects(new Error('API Error'))
    }
  };
  
  // Replace the AI instance
  (geminiService as any).ai = mockAI;
  (geminiService as any).initialized = true;
  
  const result = await geminiService.suggestRepositoryDetails('test context');
  
  t.is(result, null);
});

test.serial('suggestTeams returns null when AI is not available', async t => {
  const geminiService = new GeminiService();
  
  sinon.stub(ConfigService, 'load').resolves(null);
  
  const result = await geminiService.suggestTeams('test-repo', []);
  
  t.is(result, null);
});

test.serial('suggestTeams returns filtered team suggestions', async t => {
  process.env.GEMINI_API_KEY = 'test-key';
  
  const geminiService = new GeminiService();
  
  const teamsWithRepos = [
    {
      id: 'team1',
      name: 'Frontend Team',
      slug: 'frontend',
      repositories: [{ name: 'react-app', description: 'React application' }]
    },
    {
      id: 'team2', 
      name: 'Backend Team',
      slug: 'backend',
      repositories: [{ name: 'api-server', description: 'API server' }]
    }
  ];
  
  // Mock Gemini API
  const mockResponse = {
    text: '["frontend", "backend", "invalid-team"]'
  };
  
  const mockAI = {
    models: {
      generateContentStream: sinon.stub().resolves([mockResponse])
    }
  };
  
  // Replace the AI instance
  (geminiService as any).ai = mockAI;
  (geminiService as any).initialized = true;
  
  const result = await geminiService.suggestTeams('frontend-app', teamsWithRepos);
  
  t.deepEqual(result, ['frontend', 'backend']);
});