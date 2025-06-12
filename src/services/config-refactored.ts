import * as path from 'path';
import { Config } from '../types/index.js';
import { IFileSystem, IEnvironment } from '../interfaces/index.js';

export class ConfigService {
  private configPath: string;

  constructor(
    private fileSystem: IFileSystem,
    private environment: IEnvironment,
    configFileName: string = '.gh-usecases.json'
  ) {
    this.configPath = path.join(this.environment.homedir(), configFileName);
  }

  async load(): Promise<Config | null> {
    try {
      if (await this.fileSystem.pathExists(this.configPath)) {
        const data = await this.fileSystem.readJson(this.configPath);
        return data as Config;
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }
    return null;
  }

  async save(config: Config): Promise<void> {
    try {
      await this.fileSystem.ensureDir(path.dirname(this.configPath));
      await this.fileSystem.writeJson(this.configPath, config, { spaces: 2 });
    } catch (error) {
      console.error('Error saving config:', error);
      throw error;
    }
  }

  async getSelectedAccount(): Promise<Config['selectedAccount'] | null> {
    const config = await this.load();
    return config?.selectedAccount || null;
  }

  async setSelectedAccount(account: Config['selectedAccount']): Promise<void> {
    const config = await this.load() || { selectedAccount: account };
    config.selectedAccount = account;
    await this.save(config);
  }
}