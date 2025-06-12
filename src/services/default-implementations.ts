import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs-extra';
import * as os from 'os';
import * as path from 'path';
import { ICommandExecutor, IFileSystem, IGitHubCliConfig, IEnvironment } from '../interfaces/index.js';

const execAsync = promisify(exec);

export class DefaultCommandExecutor implements ICommandExecutor {
  async exec(command: string): Promise<{ stdout: string; stderr: string }> {
    return execAsync(command);
  }
}

export class DefaultFileSystem implements IFileSystem {
  pathExists = fs.pathExists;
  readFile = async (path: string, encoding: string): Promise<string> => {
    return fs.readFile(path, encoding as BufferEncoding);
  };
  readJson = fs.readJson;
  writeJson = fs.writeJson;
  ensureDir = fs.ensureDir;
}

export class DefaultGitHubCliConfig implements IGitHubCliConfig {
  getGhConfigPath(): string {
    return path.join(os.homedir(), '.config', 'gh', 'hosts.yml');
  }
}

export class DefaultEnvironment implements IEnvironment {
  homedir = os.homedir;
}