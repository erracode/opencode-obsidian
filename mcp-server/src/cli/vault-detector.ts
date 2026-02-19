import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

export interface DetectedVault {
  path: string;
  name: string;
  hasObsidian: boolean;
}

async function isVault(dirPath: string): Promise<boolean> {
  try {
    const obsidianPath = path.join(dirPath, '.obsidian');
    await fs.access(obsidianPath);
    return true;
  } catch {
    return false;
  }
}

export async function detectVaults(): Promise<DetectedVault[]> {
  const vaults: DetectedVault[] = [];
  const platform = os.platform();
  
  const obsidianJsonPath = platform === 'win32'
    ? path.join(process.env.APPDATA || '', 'obsidian', 'obsidian.json')
    : path.join(os.homedir(), '.config', 'obsidian', 'obsidian.json');
  
  try {
    const data = await fs.readFile(obsidianJsonPath, 'utf-8');
    const obsidianConfig = JSON.parse(data);
    
    if (obsidianConfig.vaults) {
      for (const [, vault] of Object.entries(obsidianConfig.vaults)) {
        const vaultPath = (vault as { path: string }).path;
        if (vaultPath && await isVault(vaultPath)) {
          vaults.push({
            path: vaultPath,
            name: path.basename(vaultPath),
            hasObsidian: true
          });
        }
      }
    }
  } catch {
    // No existe obsidian.json, continuar con búsqueda
  }
  
  const searchPaths = [
    path.join(os.homedir(), 'Documents'),
    path.join(os.homedir(), 'Desktop'),
    os.homedir()
  ];
  
  for (const searchPath of searchPaths) {
    try {
      const entries = await fs.readdir(searchPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        
        const fullPath = path.join(searchPath, entry.name);
        
        if (vaults.some(v => v.path === fullPath)) continue;
        
        if (await isVault(fullPath)) {
          vaults.push({
            path: fullPath,
            name: entry.name,
            hasObsidian: true
          });
        }
      }
    } catch {
      // Ignorar errores de permisos
    }
  }
  
  return vaults;
}
