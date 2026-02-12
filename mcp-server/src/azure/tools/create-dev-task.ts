import { azureClient } from '../azure-client';

interface VaultManager {
  writeNote(notePath: string, content: string, data?: any): Promise<void>;
  exists(notePath: string): Promise<boolean>;
}

interface TemplateEngine {
  applyTemplate(templateName: string, variables: Record<string, string>): string;
}

/**
 * Tool: azure_create_dev_task
 * Comando: >oo subtask [parent-id] [--effort N]
 * Crea una tarea DEV hija de una HU en Azure DevOps
 */
export async function handleAzureCreateDevTask(
  parentId: number,
  effort: number | undefined,
  vaultPath: string,
  vaultManager: VaultManager,
  templateEngine: TemplateEngine
): Promise<string> {
  try {
    // 1. Obtener HU padre
    const parentWorkItem = await azureClient.getWorkItem(parentId);
    
    if (parentWorkItem.fields['System.WorkItemType'] !== 'User Story') {
      return `⚠️  #${parentId} no es una User Story.\n` +
             `Tipo detectado: ${parentWorkItem.fields['System.WorkItemType']}\n` +
             `Por favor usa el ID de una HU (User Story).`;
    }

    const parentTitle = parentWorkItem.fields['System.Title'];
    
    // 2. Preparar datos para la tarea
    const taskTitle = `Implementar ${parentTitle}`;
    const taskDescription = `Desarrollo de la funcionalidad descrita en la HU #${parentId}:\n\n${parentTitle}\n\n` +
      `**Criterios de aceptación:**\n` +
      `- Implementación completa según especificación\n` +
      `- Tests unitarios incluidos\n` +
      `- Code review aprobado\n` +
      `- Documentación actualizada (si aplica)`;

    // 3. Crear tarea en Azure DevOps
    const newTaskId = await azureClient.createChildTask(
      parentId,
      taskTitle,
      taskDescription,
      effort
    );

    // 4. Crear tracking en Obsidian
    const trackingContent = templateEngine.applyTemplate('task-tracker', {
      azure_id: newTaskId.toString(),
      titulo_corto: taskTitle.substring(0, 50),
      tipo_tarea: 'DEV',
      estado: 'New',
      estado_qa: 'Pendiente',
      cerrado: 'No',
      repositorio: '',
      rama: '',
      tag_version: '',
      fecha: new Date().toLocaleDateString('es-ES'),
      nota_resumen: `Tarea DEV creada desde HU #${parentId}`,
      historial: `- ${new Date().toLocaleDateString('es-ES')}: Tarea creada automáticamente`,
      deploy_tags: '',
      fecha_actualizacion: new Date().toISOString(),
    });

    await vaultManager.writeNote(
      `tracking/${newTaskId}.md`,
      trackingContent,
      {
        azure_id: newTaskId.toString(),
        parent_id: parentId.toString(),
        status: 'new',
        effort: effort?.toString() || '',
        completed: '0',
        remaining: effort?.toString() || '',
        created_at: new Date().toISOString(),
      }
    );

    // 5. Retornar confirmación
    let output = `✅ **Tarea DEV creada exitosamente**\n\n`;
    output += `🎫 **ID:** #${newTaskId}\n`;
    output += `📝 **Título:** ${taskTitle}\n`;
    output += `🔗 **HU Padre:** #${parentId} - ${parentTitle}\n`;
    output += `📊 **Estado:** New\n`;
    
    if (effort) {
      output += `⏱️  **Effort:** ${effort}h | Remaining: ${effort}h | Completed: 0h\n`;
    }
    
    output += `\n📄 **Tracking creado:** tracking/${newTaskId}.md\n\n`;
    output += `🔗 **Ver en Azure:**\n`;
    output += `https://dev.azure.com/cinemarkintl/Core%20Backend/_workitems/edit/${newTaskId}\n\n`;
    output += `💡 **Próximos pasos:**\n`;
    output += `1. Abre el tracking y completa los datos (rama, repo, etc.)\n`;
    output += `2. Cuando inicies el desarrollo, cambia el estado a Active\n`;
    output += `3. Usa \`>oo review ${newTaskId}\` para preparar la entrega`;

    return output;

  } catch (error: any) {
    if (error.message.includes('AZURE_PAT')) {
      return `❌ ${error.message}`;
    }
    if (error.response?.status === 404) {
      return `❌ HU #${parentId} no encontrada en Core Backend.`;
    }
    return `❌ Error al crear tarea: ${error.message}`;
  }
}
