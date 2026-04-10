import { loadConfig, getActiveWorkspace, WorkspaceConfig } from '../../core/config.js';
import { VaultManager } from '../../core/vault.js';
import { ContentDetector } from '../../core/detector.js';
import { TemplateEngine } from '../../core/template-engine.js';

/**
 * Comando: >oo take <id>
 * Tomar una tarea mostrando contexto y creando/actualizando tracker
 */
export async function handleTake(
  azureId: string,
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
  const templateEngine = new TemplateEngine(vp);
  await templateEngine.loadTemplates();

  const trackerPath = `workspaces/${workspace.name}/tracking/${azureId}.md`;
  
  // Verificar si ya existe tracker
  const exists = await vaultManager.exists(trackerPath);

  if (exists) {
    const note = await vaultManager.readNote(trackerPath);
    
    return `📋 **Tarea #${azureId}**\n\n`;
  } else {
    // Crear tracker nuevo
    let content = `# Task #${azureId}\n\n`;
    content += `**Estado:** 🔴 LAB | **QA:** ⏳ Pendiente | **Cerrado:** 🚧 No\n`;
    content += `**Repo:** ` + `N/A` + ` | **Rama:** ` + `N/A` + ` | **Tag:** ` + `Pending` + `\n`;
    content += `**Links:** [🎫 Azure](https://dev.azure.com/organization/project/_workitems/edit/${azureId}) | [🚀 PR](N/A) | [📄 Docs](N/A)\n`;
    content += `**Fecha:** ${new Date().toLocaleDateString('es-ES')}\n\n`;
    content += `## 🎯 Contexto\n\n`;
    content += `_Añade contexto de la tarea_\n\n`;
    content += `## 📝 Notas\n\n`;
    content += `_Añade notas aquí_\n\n`;

    await vaultManager.createTracker(azureId, content, {
      azure_id: azureId,
      status: 'in-progress',
      created_at: new Date().toISOString()
    });

    return `✅ **Tarea #${azureId} listada**\n\n`;
  }
}
