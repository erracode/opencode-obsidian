import * as path from 'path';
import { loadConfig, getActiveWorkspace } from '../../core/config.js';
import { VaultManager } from '../../core/vault.js';
import { ContentDetector } from '../../core/detector.js';

/**
 * Comando: >oo note "texto"
 * Guarda nota vinculada a task si hay Azure ID
 */
export async function handleNote(
  text: string,
  vaultPath?: string
): Promise<string> {
  const config = await loadConfig();
  if (!config) {
    return '❌ No hay configuración. Ejecuta `oo-setup setup` en terminal.';
  }

  const workspace = getActiveWorkspace(config.workspaces);
  const vp = vaultPath || config.vault.path;
  
  const vaultManager = new VaultManager(vp, workspace.name);
  const detector = new ContentDetector();
  
  const detected = detector.analyze(text);
  const title = detector.generateSlug(text);
  
  // Determinar dónde guardar
  let targetFolder = 'inbox';
  let targetName = `${new Date().toISOString().split('T')[0]}-${title}.md`;
  
  if (detected.azureIds.length > 0) {
    targetFolder = `workspaces/${workspace.name}/proyectos`;
    targetName = `${detected.azureIds[0]}-${title}.md`;
  }
  
  const relativePath = path.join(targetFolder, targetName);
  await vaultManager.writeNote(relativePath, text, {
    date: new Date().toISOString(),
    detected_category: detected.category,
    azure_ids: detected.azureIds,
    tags: detected.repositories
  });
  
  return `✅ Nota guardada: ${relativePath}`;
}
