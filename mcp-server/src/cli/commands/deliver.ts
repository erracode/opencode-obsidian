import { loadConfig, getActiveWorkspace } from '../../core/config.js';
import { VaultManager } from '../../core/vault.js';
import { TemplateEngine } from '../../core/template-engine.js';
import { ContentDetector } from '../../core/detector.js';

/**
 * Comando: >oo deliver <id>
 * Genera resumen de entrega limpio (formato MD)
 */
export async function handleDeliver(
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
  const templateEngine = new TemplateEngine(vp);
  const detector = new ContentDetector();
  
  await templateEngine.loadTemplates();
  
  // Buscar contexto de la tarea
  let contextContent = '';
  const contextPath = `workspaces/${workspace.name}/proyectos/${azureId}-context.md`;
  
  if (await vaultManager.exists(contextPath)) {
    const note = await vaultManager.readNote(contextPath);
    contextContent = note.content;
  } else {
    return `❌ No encontré información para la tarea #${azureId}. Usa >oo cap primero para capturar la tarea.`;
  }
  
  // Extraer variables del contenido
  const variables = templateEngine.extractVariables(contextContent);
  variables.azure_id = azureId;
  
  // Buscar template azure-delivery
  if (!templateEngine.hasTemplate('azure-delivery')) {
    return '❌ Template azure-delivery no encontrado. Asegúrate de tener el template configurado.';
  }
  
  // Aplicar template
  const deliveryContent = templateEngine.applyTemplate('azure-delivery', variables);
  
  // Guardar entrega
  const deliveryPath = `workspaces/${workspace.name}/entregas/${azureId}-delivery.md`;
  await vaultManager.writeNote(deliveryPath, deliveryContent, {
    azure_id: azureId,
    template: 'azure-delivery',
    status: 'draft',
    generated_at: new Date().toISOString()
  });
  
  return `✅ **Resumen de entrega generado**\n\n`;
}
