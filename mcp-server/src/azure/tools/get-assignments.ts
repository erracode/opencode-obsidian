import { getAzureClient, WorkItem } from '../azure-client';

/**
 * Tool: azure_get_my_assignments
 * Comando: >oo azure
 * Obtiene los work items asignados al usuario actual en Core Backend
 */
export async function handleAzureGetAssignments(): Promise<string> {
  try {
    const azureClient = getAzureClient();
    const workItems = await azureClient.getMyWorkItems(['New', 'Active', 'Resolved']);

    if (workItems.length === 0) {
      return '✅ No tienes work items asignados actualmente en Core Backend.';
    }

    // Agrupar por estado
    const grouped = {
      blocked: [] as WorkItem[],
      active: [] as WorkItem[],
      resolved: [] as WorkItem[],
      new: [] as WorkItem[]
    };

    workItems.forEach((wi: WorkItem) => {
      const state = wi.fields['System.State'];
      if (state === 'Resolved') {
        grouped.resolved.push(wi);
      } else if (state === 'New') {
        grouped.new.push(wi);
      } else if (state === 'Active') {
        // Verificar si está bloqueado (podríamos detectar por etiquetas o comentarios)
        grouped.active.push(wi);
      }
    });

    let output = '📋 **Tus Asignaciones - Core Backend**\n\n';

    // Bloqueos (simulado - en realidad necesitaríamos detectar impedimentos)
    if (grouped.active.some((wi: WorkItem) => wi.fields['System.Tags']?.includes('blocked'))) {
      output += '## 🔴 Bloqueos\n';
      grouped.active
        .filter((wi: WorkItem) => wi.fields['System.Tags']?.includes('blocked'))
        .forEach((wi: WorkItem) => {
          output += formatWorkItemLine(wi);
        });
      output += '\n';
    }

    // En Progreso
    if (grouped.active.length > 0) {
      output += '## 🟡 En Progreso\n';
      grouped.active.forEach((wi: WorkItem) => {
        output += formatWorkItemLine(wi);
      });
      output += '\n';
    }

    // Nuevas
    if (grouped.new.length > 0) {
      output += '## 🆕 Nuevas\n';
      grouped.new.forEach((wi: WorkItem) => {
        output += formatWorkItemLine(wi);
      });
      output += '\n';
    }

    // Resueltas
    if (grouped.resolved.length > 0) {
      output += '## ✅ Resueltas\n';
      grouped.resolved.slice(0, 5).forEach((wi: WorkItem) => {
        output += formatWorkItemLine(wi);
      });
      if (grouped.resolved.length > 5) {
        output += `... y ${grouped.resolved.length - 5} más\n`;
      }
    }

    output += '\n💡 **Comandos disponibles:**\n';
    output += '- `>oo review [id]` - Preparar entrega\n';
    output += '- `>oo comment [id]` - Publicar comentario\n';
    output += '- `>oo subtask [hu-id]` - Crear tarea DEV\n';

    return output;

  } catch (error: any) {
    if (error.message.includes('AZURE_PAT')) {
      return `❌ ${error.message}`;
    }
    return `❌ Error al obtener asignaciones: ${error.message}`;
  }
}

function formatWorkItemLine(workItem: WorkItem): string {
  const id = workItem.fields['System.Id'];
  const title = workItem.fields['System.Title'];
  const type = workItem.fields['System.WorkItemType'];
  const effort = workItem.fields['Microsoft.VSTS.Scheduling.Effort'];
  const completed = workItem.fields['Microsoft.VSTS.Scheduling.CompletedWork'] || 0;
  const remaining = workItem.fields['Microsoft.VSTS.Scheduling.RemainingWork'];
  
  let line = `**#${id}** ${title}\n`;
  line += `   Tipo: ${type}`;
  
  if (effort !== undefined) {
    line += ` | ${completed}/${effort}h`;
    if (remaining !== undefined) {
      line += ` (${remaining}h rest.)`;
    }
  }
  
  line += '\n';
  return line;
}
