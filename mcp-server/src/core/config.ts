import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

const CONFIG_DIR = path.join(os.homedir(), '.config', 'opencode-obsidian');
const DATA_DIR = path.join(os.homedir(), '.local', 'share', 'opencode-obsidian');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

const LEGACY_CONFIG_FILE = path.join(os.homedir(), '.opencode-obsidian.config.json');

export interface AppConfig {
  version: string;
  vault: {
    path: string;
    lastAccessed: string;
  };
  azure: {
    organization: string;
    project: string;
    patLast4?: string;
    patExpiresAt?: string;
  };
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
    
    // Crear nueva estructura
    const newConfig: AppConfig = {
      version: '1.0.0',
      vault: {
        path: legacyData.vault_path || '',
        lastAccessed: new Date().toISOString()
      },
      azure: {
        organization: process.env.AZURE_ORG || 'cinemarkintl',
        project: process.env.AZURE_PROJECT || 'Core Backend'
      }
    };
    
    await saveConfig(newConfig);
    
    // Backup del archivo legacy
    await fs.rename(LEGACY_CONFIG_FILE, LEGACY_CONFIG_FILE + '.backup');
    
    return newConfig;
  }
  
  return null;
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
