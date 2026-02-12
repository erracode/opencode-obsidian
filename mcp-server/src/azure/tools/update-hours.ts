import { azureClient } from '../azure-client';

interface VaultManager {
  readNote(notePath: string): Promise<{ content: string; data: any }>;
  writeNote(notePath: string, content: string, data?: any): Promise<void>;
  exists(notePath: string): Promise<boolean>;
}

/**
 * Tool: azure_update_hours
 * Comando: >oo hours [id] [completed-hours]
 * Actualiza las horas completadas y calcula remaining automáticamente
 */
export async function handleAzureUpdateHours(
  azureId: number,
  completedHours: number,
  vaultPath: string,
  vaultManager: VaultManager
): Promise<string> {
  try {
    // 1. Obtener work item actual
    const workItem = await azureClient.getWorkItem(azureId);
    const effort = workItem.fields['Microsoft.VSTS.Scheduling.Effort'];
    
    if (!effort || effort === 0) {
      return `⚠️  La tarea #${azureId} no tiene estimación (Effort).\n` +
             `Por favor establece el Effort primero en Azure DevOps.`;
    }

    // 2. Validar que completed no sea mayor que effort
    if (completedHours > effort) {
      return `⚠️  Las horas completadas (${completedHours}h) no pueden ser mayores que el Effort (${effort}h).`;
    }

    // 3. Calcular remaining
    const remaining = effort - completedHours;

    // 4. Actualizar en Azure DevOps
    await azureClient.updateWorkHours(azureId, completedHours);

    // 5. Actualizar tracking en Obsidian (si existe)
    const trackingPath = `tracking/${azureId}.md`;
    let trackingUpdated = false;

    try {
      if (await vaultManager.exists(trackingPath)) {
        const trackingNote = await vaultManager.readNote(trackingPath);
        
        // Actualizar datos
        const updatedData = {
          ...trackingNote.data,
          effort: effort.toString(),
          completed: completedHours.toString(),
          remaining: remaining.toString(),
          updated_at: new Date().toISOString(),
        };

        await vaultManager.writeNote(
          trackingPath,
          trackingNote.content,
          updatedData
        );
        trackingUpdated = true;
      }
    } catch (e) {
      // No hay tracking, continuar sin error
    }

    // 6. Verificar si debería sugerir cambiar a Resolved
    const suggestResolved = completedHours >= effort;

    // 7. Retornar confirmación
    let output = `✅ **Horas actualizadas para #${azureId}**\n\n`;
    output += `📊 **Progreso:**\n`;
    output += `• Effort: ${effort}h\n`;
    output += `• Completado: ${completedHours}h\n`;
    output += `• Remaining: ${remaining}h\n`;
    
    const percentage = Math.round((completedHours / effort) * 100);
    output += `• Progreso: ${percentage}%\n\n`;

    if (trackingUpdated) {
      output += `📄 Tracking actualizado: ${trackingPath}\n\n`;
    }

    if (suggestResolved) {
      output += `🎯 **¡Tarea completada al 100%!**\n`;
      output += `¿Quieres marcarla como Resolved?\n`;
      output += `Usa: \`>oo comment ${azureId}\` para publicar la entrega.\n\n`;
    } else if (percentage >= 80) {
      output += `⚡ **Casi lista** - ${remaining}h restantes\n\n`;
    }

    output += `🔗 **Ver en Azure:**\n`;
    output += `https://dev.azure.com/cinemarkintl/Core%20Backend/_workitems/edit/${azureId}`;

    return output;

  } catch (error: any) {
    if (error.message.includes('AZURE_PAT')) {
      return `❌ ${error.message}`;
    }
    if (error.response?.status === 404) {
      return `❌ Work item #${azureId} no encontrado.`;
    }
    return `❌ Error al actualizar horas: ${error.message}`;
  }
}
