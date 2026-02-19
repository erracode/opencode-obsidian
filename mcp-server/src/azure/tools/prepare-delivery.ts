import { getAzureClient } from '../azure-client';
import * as fs from 'fs/promises';
import * as path from 'path';

interface VaultManager {
  readNote(notePath: string): Promise<{ content: string; data: any }>;
  writeNote(notePath: string, content: string, data?: any): Promise<void>;
  exists(notePath: string): Promise<boolean>;
  listNotes(): Promise<string[]>;
}

interface TemplateEngine {
  applyTemplate(templateName: string, variables: Record<string, string>): string;
  extractVariables(content: string): Record<string, string>;
}

/**
 * Tool: azure_prepare_delivery
 * Comando: >oo review [id]
 * Prepara un documento de entrega para un work item usando el template azure-delivery
 */
export async function handleAzurePrepareDelivery(
  azureId: number,
  vaultPath: string,
  vaultManager: VaultManager,
  templateEngine: TemplateEngine
): Promise<string> {
  try {
    const azureClient = getAzureClient();
    // 1. Obtener datos de Azure DevOps
    const workItem = await azureClient.getWorkItem(azureId);
    const parentWorkItem = await azureClient.getParentWorkItem(azureId);

    // 2. Buscar en Obsidian si hay datos previos
    const trackingPath = path.join('tracking', `${azureId}.md`);
    const deliveryPattern = path.join('entregas', `${azureId}-*.md`);
    
    let obsidianData: Record<string, string> = {};
    
    // Intentar leer tracking existente
    try {
      if (await vaultManager.exists(trackingPath)) {
        const trackingNote = await vaultManager.readNote(trackingPath);
        obsidianData = templateEngine.extractVariables(trackingNote.content);
        // También extraer del frontmatter
        if (trackingNote.data) {
          Object.assign(obsidianData, trackingNote.data);
        }
      }
    } catch (e) {
      // No hay tracking previo, continuar
    }

    // 3. Detectar información de git (fallback)
    const gitData = await detectGitInfo();

    // 4. Preparar variables para el template
    const variables: Record<string, string> = {
      // Datos de Azure
      azure_id: azureId.toString(),
      titulo: workItem.fields['System.Title'] || '',
      tipo: workItem.fields['System.WorkItemType'] || '',
      estado: workItem.fields['System.State'] || '',
      contexto: workItem.fields['System.Description'] || '',
      
      // Datos de HU padre (si existe)
      parent_id: parentWorkItem?.fields['System.Id']?.toString() || '',
      parent_title: parentWorkItem?.fields['System.Title'] || '',
      
      // Datos de Obsidian (prioridad alta) o Git (fallback)
      rama: obsidianData.rama || obsidianData.branch || gitData.branch || '',
      repositorio: obsidianData.repositorio || obsidianData.repo || gitData.repo || '',
      commit: obsidianData.commit || gitData.commit || '',
      pr_link: obsidianData.pr_link || obsidianData.pr || '',
      
      // Datos de esfuerzo
      effort: workItem.fields['Microsoft.VSTS.Scheduling.Effort']?.toString() || '',
      completed: (workItem.fields['Microsoft.VSTS.Scheduling.CompletedWork'] || 0).toString(),
      remaining: (workItem.fields['Microsoft.VSTS.Scheduling.RemainingWork'] || 0).toString(),
      
      // Fechas
      fecha: new Date().toLocaleDateString('es-ES'),
      fecha_generacion: new Date().toISOString(),
    };

    // 5. Aplicar template azure-delivery
    const templateContent = templateEngine.applyTemplate('azure-delivery', variables);

    // 6. Generar nombre de archivo
    const slugTitle = variables.titulo
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .substring(0, 50);
    const newFileName = `${azureId}-${slugTitle}.md`;
    const newFilePath = path.join('entregas', newFileName);

    // 7. Guardar archivo
    await vaultManager.writeNote(
      newFilePath,
      templateContent,
      {
        azure_id: azureId.toString(),
        template: 'azure-delivery',
        estado: 'draft',
        parent_id: variables.parent_id,
        rama: variables.rama,
        repositorio: variables.repositorio,
        created_at: new Date().toISOString(),
      }
    );

    // 8. Retornar resumen
    let output = `✅ **Entrega preparada para #${azureId}**\n\n`;
    output += `📄 **Archivo:** ${newFilePath}\n\n`;
    output += `🔍 **Datos detectados:**\n`;
    
    if (variables.parent_id) {
      output += `• HU Padre: #${variables.parent_id} - ${variables.parent_title}\n`;
    }
    
    if (variables.rama) {
      output += `• Rama: ${variables.rama}\n`;
    }
    
    if (variables.commit) {
      output += `• Último commit: ${variables.commit}\n`;
    }
    
    if (variables.pr_link) {
      output += `• PR: ${variables.pr_link}\n`;
    }

    output += `\n✏️  **Completa las siguientes secciones:**\n`;
    output += `- Testing y Validación QA\n`;
    output += `- Casos de prueba\n`;
    output += `- Notas adicionales\n\n`;
    output += `💡 Cuando termines, usa: \`>oo comment ${azureId}\``;

    return output;

  } catch (error: any) {
    if (error.message.includes('AZURE_PAT')) {
      return `❌ ${error.message}`;
    }
    if (error.response?.status === 404) {
      return `❌ Work item #${azureId} no encontrado en Core Backend.`;
    }
    return `❌ Error al preparar entrega: ${error.message}`;
  }
}

/**
 * Detectar información de git
 */
async function detectGitInfo(): Promise<{
  branch: string;
  commit: string;
  repo: string;
}> {
  const info = {
    branch: '',
    commit: '',
    repo: ''
  };

  try {
    // Importar child_process de forma dinámica
    const { execSync } = await import('child_process');
    
    // Detectar rama actual
    try {
      info.branch = execSync('git branch --show-current', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
    } catch (e) {
      // No estamos en un repo git
    }

    // Detectar último commit
    try {
      info.commit = execSync('git log -1 --pretty=format:"%h %s"', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
    } catch (e) {
      // No hay commits o no estamos en git
    }

    // Detectar nombre del repositorio
    try {
      const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
      // Extraer nombre del repo de la URL
      const match = remoteUrl.match(/\/([^\/]+?)(?:\.git)?$/);
      if (match) {
        info.repo = match[1];
      }
    } catch (e) {
      // No hay remote configurado
    }

  } catch (e) {
    // Error general, retornar vacío
  }

  return info;
}
