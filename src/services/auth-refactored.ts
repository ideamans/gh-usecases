import * as path from 'path';
import { AuthState } from '../types/index.js';
import { ICommandExecutor, IFileSystem, IGitHubCliConfig, IEnvironment } from '../interfaces/index.js';

export class AuthService {
  constructor(
    private commandExecutor: ICommandExecutor,
    private fileSystem: IFileSystem,
    private ghConfig: IGitHubCliConfig,
    private environment: IEnvironment
  ) {}

  async checkAuthStatus(): Promise<AuthState> {
    try {
      const { stdout } = await this.commandExecutor.exec('gh auth status');
      return {
        isAuthenticated: true,
        permissions: this.parsePermissions(stdout),
      };
    } catch (error: any) {
      if (error.message.includes('not logged in')) {
        return {
          isAuthenticated: false,
          permissions: [],
        };
      }
      throw error;
    }
  }

  async getToken(): Promise<string | undefined> {
    try {
      // Use GitHub CLI's `gh auth token` command to get the token
      // This works with keyring, file, or any other storage method
      const { stdout } = await this.commandExecutor.exec('gh auth token');
      const token = stdout.trim();
      
      if (token && token.startsWith('gho_')) {
        return token;
      } else {
        console.error('Could not retrieve valid token from GitHub CLI');
        console.error('Retrieved token:', token ? '(invalid format)' : '(empty)');
      }
    } catch (error) {
      console.error('GitHub CLI token retrieval error:', error);
      console.error('Solution: Run `gh auth login` to authenticate with GitHub');
      
      // Fallback: Try the traditional file-based method
      try {
        const configPath = path.join(
          this.environment.homedir(),
          '.config',
          'gh',
          'hosts.yml'
        );
        
        if (await this.fileSystem.pathExists(configPath)) {
          const configContent = await this.fileSystem.readFile(configPath, 'utf-8');
          const tokenMatch = configContent.match(/oauth_token:\s*(.+)/);
          if (tokenMatch) {
            console.log('Fallback: Retrieved token from hosts.yml file');
            return tokenMatch[1].trim();
          }
        }
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }
    }
    return undefined;
  }

  async login(): Promise<void> {
    await this.commandExecutor.exec('gh auth login');
  }

  async refreshPermissions(scopes: string[]): Promise<void> {
    const scopeString = scopes.join(',');
    await this.commandExecutor.exec(`gh auth refresh -s ${scopeString}`);
  }

  private parsePermissions(output: string): string[] {
    const permissions: string[] = [];
    const lines = output.split('\n');
    
    for (const line of lines) {
      if (line.includes('Token scopes:')) {
        const scopeMatch = line.match(/Token scopes:\s*(.+)/);
        if (scopeMatch) {
          permissions.push(...scopeMatch[1].split(',').map(s => s.trim()));
        }
      }
    }
    
    return permissions;
  }

  async ensureScopes(requiredScopes: string[]): Promise<void> {
    const authState = await this.checkAuthStatus();
    
    if (!authState.isAuthenticated) {
      throw new Error('Not authenticated. Please run `gh auth login` first to authenticate with GitHub.');
    }

    const missingScopes = requiredScopes.filter(
      scope => !authState.permissions.includes(scope)
    );

    if (missingScopes.length > 0) {
      await this.refreshPermissions(requiredScopes);
    }
  }
}