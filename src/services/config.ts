import { ConfigService as ConfigServiceRefactored } from './config-refactored.js';
import { DefaultFileSystem, DefaultEnvironment } from './default-implementations.js';
import { Config } from '../types/index.js';

// Singleton instance for backward compatibility
let configServiceInstance: ConfigServiceRefactored | null = null;

function getConfigService(): ConfigServiceRefactored {
  if (!configServiceInstance) {
    configServiceInstance = new ConfigServiceRefactored(
      new DefaultFileSystem(),
      new DefaultEnvironment()
    );
  }
  return configServiceInstance;
}

export class ConfigService {
  static async load(): Promise<Config | null> {
    return getConfigService().load();
  }

  static async save(config: Config): Promise<void> {
    return getConfigService().save(config);
  }

  static async getSelectedAccount(): Promise<Config['selectedAccount'] | null> {
    return getConfigService().getSelectedAccount();
  }

  static async setSelectedAccount(account: Config['selectedAccount']): Promise<void> {
    return getConfigService().setSelectedAccount(account);
  }
}