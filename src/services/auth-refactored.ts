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
          return tokenMatch[1].trim();
        } else {
          console.error('認証トークンが設定ファイル内に見つかりません');
          console.error('ファイルパス:', configPath);
        }
      } else {
        console.error('GitHub CLIの設定ファイルが存在しません');
        console.error('期待されるファイルパス:', configPath);
        console.error('解決方法: gh auth login コマンドを実行してGitHubにログインしてください');
      }
    } catch (error) {
      console.error('認証設定ファイルの読み込みエラー:', error);
      console.error('期待されるファイルパス:', configPath);
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
      throw new Error('認証されていません。まず `gh auth login` コマンドを実行してGitHubにログインしてください。');
    }

    const missingScopes = requiredScopes.filter(
      scope => !authState.permissions.includes(scope)
    );

    if (missingScopes.length > 0) {
      await this.refreshPermissions(requiredScopes);
    }
  }
}