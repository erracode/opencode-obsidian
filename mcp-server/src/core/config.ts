import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

const CONFIG_DIR = path.join(os.homedir(), '.config', 'opencode-obsidian');
const DATA_DIR = path.join(os.homedir(), '.local', 'share', 'opencode-obsidian');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

const LEGACY_CONFIG_FILE = path.join(os.homedir(), '.opencode-obsidian.config.json');

export interface AzureConfig {
  organization: string;
  project: string;
  patLast4?: string;
  patExpiresAt?: string;
}

export interface WorkspaceConfig {
  name: string;
  azure?: AzureConfig;
  default?: boolean;
}

export interface AppConfig {
  version: string;
  vault: {
    path: string;
    lastAccessed: string;
  };
  workspaces: WorkspaceConfig[];
}

async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

export async function loadConfig(): Promise<AppConfig | null> {
  // Intentar nueva ubicación
  if (await exists(CONFIG_FILE)) {
    const data = await fs.readFile(CONFIG_FILE, 'utf-8');
    const config = JSON.parse(data);
    
    // Migrar desde antigua estructura
    if (!config.workspaces) {
      const oldVaultPath = config.vault?.path || config.vault_path;
      const oldAzureOrg = process.env.AZURE_ORG || 'cinemarkintl';
      const oldAzureProject = process.env.AZURE_PROJECT || 'Core Backend';
      
      config.workspaces = [
        {
          name: 'sundevs',
          azure: {
            organization: oldAzureOrg,
            project: oldAzureProject,
            patLast4: process.env.AZURE_PAT?.slice(-4)
          },
          default: true
        },
        {
          name: 'personal'
        }
      ];
      config.vault.path = oldVaultPath;
      await saveConfig(config);
    }
    
    // Migrar si solo tiene azure object en workspace
    if (config.workspaces && config.workspaces.length > 0) {
      for (const ws of config.workspaces) {
        if ((ws as any).azure_org || (ws as any).azure_project) {
          ws.azure = {
            organization: (ws as any).azure_org,
            project: (ws as any).azure_project,
            patLast4: process.env.AZURE_PAT?.slice(-4)
          };
          delete (ws as any).azure_org;
          delete (ws as any).azure_project;
        }
      }
      await saveConfig(config);
    }
    
    // Actualizar lastAccessed
    if (config.vault) {
      config.vault.lastAccessed = new Date().toISOString();
    }
    return config;
  }
  
  // Intentar migrar desde legacy
  if (await exists(LEGACY_CONFIG_FILE)) {
    const legacy = await fs.readFile(LEGACY_CONFIG_FILE, 'utf-8');
    const legacyData = JSON.parse(legacy);
    
    const newConfig: AppConfig = {
      version: '2.0.0',
      vault: {
        path: legacyData.vault_path || '',
        lastAccessed: new Date().toISOString()
      },
      workspaces: [
        {
          name: 'sundevs',
          azure: {
            organization: process.env.AZURE_ORG || 'cinemarkintl',
            project: process.env.AZURE_PROJECT || 'Core Backend',
            patLast4: process.env.AZURE_PAT?.slice(-4)
          },
          default: true
        },
        {
          name: 'personal'
        }
      ]
    };
    
    await saveConfig(newConfig);
    await fs.rename(LEGACY_CONFIG_FILE, LEGACY_CONFIG_FILE + '.backup');
    
    return newConfig;
  }
  
  return null;
}

export async function addWorkspace(
  config: AppConfig,
  workspaceName: string,
  azureConfig?: AzureConfig
): Promise<AppConfig> {
  const exists = config.workspaces.some(w => w.name === workspaceName);
  if (exists) {
    throw new Error(`Workspace ${workspaceName} already exists`);
  }

  config.workspaces.push({
    name: workspaceName,
    azure: azureConfig,
    default: config.workspaces.length === 0
  });

  await saveConfig(config);
  return config;
}

export async function updateWorkspace(
  config: AppConfig,
  workspaceName: string,
  updates: Partial<WorkspaceConfig>
): Promise<AppConfig> {
  const index = config.workspaces.findIndex(w => w.name === workspaceName);
  if (index === -1) {
    throw new Error(`Workspace ${workspaceName} not found`);
  }

  config.workspaces[index] = {
    ...config.workspaces[index],
    ...updates,
    name: workspaceName
  };

  await saveConfig(config);
  return config;
}

export async function removeWorkspace(
  config: AppConfig,
  workspaceName: string
): Promise<AppConfig> {
  if (config.workspaces.length <= 1) {
    throw new Error('Cannot remove the last workspace');
  }

  config.workspaces = config.workspaces.filter(w => w.name !== workspaceName);
  await saveConfig(config);
  return config;
}

export async function saveConfig(config: AppConfig): Promise<void> {
  await fs.mkdir(CONFIG_DIR, { recursive: true });
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export function getDataPath(subpath: string): string {
  return path.join(DATA_DIR, subpath);
}

export function getConfigPath(): string {
  return CONFIG_FILE;
}

export function getDataDir(): string {
  return DATA_DIR;
}

export function getDefaultWorkspace(config: AppConfig): WorkspaceConfig | null {
  const defaultWs = config.workspaces.find(w => w.default);
  return defaultWs || config.workspaces[0] || null;
}

export function getActiveWorkspace(
  workspaces: WorkspaceConfig[]
): WorkspaceConfig {
  const defaultWs = workspaces.find(w => w.default);
  return defaultWs || workspaces[0] || { name: 'sundevs' };
}
