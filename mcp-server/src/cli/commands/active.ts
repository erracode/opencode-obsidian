import { loadConfig, getActiveWorkspace, AppConfig, WorkspaceConfig } from '../../core/config.js';
import { VaultManager } from '../../core/vault.js';
import { ContentDetector } from '../../core/detector.js';

/**
 * Comando: >oo active
 * Lista tareas activas de todos los workspaces
 */
export async function handleActive(
  vaultPath?: string
): Promise<string> {
  const config = await loadConfig();
  if (!config) {
    return '❌ No hay configuración. Ejecuta `oo-setup setup` en terminal.';
  }

  const vp = vaultPath || config.vault.path;
  let output = '📊 **Tareas Activas**\n\n';
  
  for (const workspace of config.workspaces) {
    const vaultManager = new VaultManager(vp, workspace.name);
    const detector = new ContentDetector();
    const allNotes = await vaultManager.listNotes();
    
    let workspaceHasActive = false;
    
    output += `### ${workspace.name}\n`;
    
    for (const notePath of allNotes) {
      try {
        const note = await vaultManager.readNote(notePath);
        const lowerContent = note.content.toLowerCase();
        
        if (notePath.includes('tracking') && 
            (lowerContent.includes('en progreso') || 
             lowerContent.includes('in progress') || 
             lowerContent.includes('🔄') ||
             note.data.status === 'in-progress' ||
             note.data.status === '🟡 STG')) {
          
          const azureId = note.data.azure_id || notePath.replace('.md', '');
          const title = detector.extractTitle(note.content);
          
          output += `- [${azureId}] ${title}\n`;
          workspaceHasActive = true;
        }
      } catch (e) {
        // Ignorar
      }
    }
    
    if (!workspaceHasActive) {
      output += `_Sin tareas activas_\n`;
    }
    
    output += '\n';
  }
  
  return output;
}
