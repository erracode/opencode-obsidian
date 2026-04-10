import * as path from 'path';
import * as fs from 'fs/promises';

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

export interface WorkspaceContext {
  name: string;
  vaultPath: string;
  workspacePath: string;
  azure?: AzureConfig;
}

export class PathResolver {
  private workspacePath: string;

  constructor(workspacePath: string) {
    this.workspacePath = workspacePath;
  }

  private join(...parts: string[]): string {
    return path.join(this.workspacePath, ...parts);
  }

  inbox(file: string): string {
    return this.join('inbox', file);
  }

  entregas(file: string): string {
    return this.join('entregas', file);
  }

  tracking(id: string): string {
    return this.join('tracking', `${id}.md`);
  }

  daily(date: string): string {
    return this.join('daily', `${date}.md`);
  }

  recursos(file: string): string {
    return this.join('recursos', file);
  }

  proyectos(file: string): string {
    return this.join('proyectos', file);
  }

  templates(file: string): string {
    return this.join('templates', file);
  }

  shared(file: string): string {
    return this.join('shared', file);
  }

  getRoot(): string {
    return this.workspacePath;
  }

  async ensureStructure(): Promise<void> {
    const folders = ['inbox', 'entregas', 'tracking', 'daily', 'recursos', 'proyectos', 'templates', 'shared'];
    for (const folder of folders) {
      await fs.mkdir(this.join(folder), { recursive: true });
    }
  }
}

export function resolveWorkspacePath(vaultPath: string, workspaceName: string): string {
  return path.join(vaultPath, 'workspaces', workspaceName);
}

export function resolveVaultPath(basePath: string, workspacePath?: string): string {
  if (workspacePath) {
    return path.dirname(path.dirname(workspacePath));
  }
  return basePath;
}

export function getDefaultWorkspace(
  workspaces: WorkspaceConfig[]
): WorkspaceConfig | null {
  const defaultWs = workspaces.find(w => w.default);
  return defaultWs || workspaces[0] || null;
}

export function getActiveWorkspace(
  workspaces: WorkspaceConfig[]
): WorkspaceConfig {
  return getDefaultWorkspace(workspaces) || workspaces[0] || { name: 'sundevs' };
}

export function ensureVaultStructure(
  vaultPath: string,
  workspaces: WorkspaceConfig[]
): Promise<void> {
  const createStructure = async (workspaceName: string) => {
    const workspacePath = resolveWorkspacePath(vaultPath, workspaceName);
    const resolver = new PathResolver(workspacePath);
    await resolver.ensureStructure();
  };

  const promises = workspaces.map(ws => createStructure(ws.name));
  return Promise.all(promises).then(() => {});
}
