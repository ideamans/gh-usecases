import { AuthService as AuthServiceRefactored } from './auth-refactored.js';
import { DefaultCommandExecutor, DefaultFileSystem, DefaultGitHubCliConfig, DefaultEnvironment } from './default-implementations.js';
import { AuthState } from '../types/index.js';

// Singleton instance for backward compatibility
let authServiceInstance: AuthServiceRefactored | null = null;

function getAuthService(): AuthServiceRefactored {
  if (!authServiceInstance) {
    authServiceInstance = new AuthServiceRefactored(
      new DefaultCommandExecutor(),
      new DefaultFileSystem(),
      new DefaultGitHubCliConfig(),
      new DefaultEnvironment()
    );
  }
  return authServiceInstance;
}

export class AuthService {
  static async checkAuthStatus(): Promise<AuthState> {
    return getAuthService().checkAuthStatus();
  }

  static async getToken(): Promise<string | undefined> {
    return getAuthService().getToken();
  }

  static async login(): Promise<void> {
    return getAuthService().login();
  }

  static async refreshPermissions(scopes: string[]): Promise<void> {
    return getAuthService().refreshPermissions(scopes);
  }

  static async ensureScopes(requiredScopes: string[]): Promise<void> {
    return getAuthService().ensureScopes(requiredScopes);
  }
}