export interface ICommandExecutor {
  exec(command: string): Promise<{ stdout: string; stderr: string }>;
}

export interface IFileSystem {
  pathExists(path: string): Promise<boolean>;
  readFile(path: string, encoding: string): Promise<string>;
  readJson(path: string): Promise<any>;
  writeJson(path: string, data: any, options?: { spaces?: number }): Promise<void>;
  ensureDir(path: string): Promise<void>;
}

export interface IGitHubCliConfig {
  getGhConfigPath(): string;
}

export interface IEnvironment {
  homedir(): string;
}

export interface IGraphQLClient {
  request<T = any>(query: string, variables?: any): Promise<T>;
}

export interface IAuthTokenProvider {
  getToken(): Promise<string | undefined>;
}