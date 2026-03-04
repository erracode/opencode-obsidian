import { getAzureClient } from '../azure-client';
import { marked } from 'marked';

interface VaultManager {
  readNote(notePath: string): Promise<{ content: string; data: any }>;
  writeNote(notePath: string, content: string, data?: any): Promise<void>;
  exists(notePath: string): Promise<boolean>;
  listNotes(): Promise<string[]>;
}

interface ExtraCommentParams {
  prLink?: string;
  deployUrl?: string;
  notes?: string;
  state?: string;
}

/**
 * Tool: azure_publish_comment
 * Comando: >oo comment [id]
 * Publica un comentario de entrega en Azure DevOps y cambia el estado
 */
export async function handleAzurePublishComment(
  azureId: number,
  vaultPath: string,
  vaultManager: VaultManager,
  extraParams?: ExtraCommentParams
): Promise<string> {
  try {
    const azureClient = getAzureClient();
    // 1. Buscar archivo de entrega en vault/entregas/
    const deliveryFiles = await vaultManager.listNotes();
    const azureIdStr = azureId.toString();
    
    // Normalizar paths para兼容 Windows y Linux
    const normalizedFiles = deliveryFiles.map(f => f.replace(/\\/g, '/'));
    
    const normalizedMatching = normalizedFiles.find(f => 
      f.startsWith('entregas/') && f.includes(`${azureIdStr}-`)
    );
    
    // Encontrar el path original (no normalizado) para leer el archivo
    const matchingFile = normalizedMatching 
      ? deliveryFiles[normalizedFiles.indexOf(normalizedMatching)]
      : undefined;

    if (!matchingFile) {
      // Buscar con cualquier coincidencia parcial
      const entregaFiles = deliveryFiles.filter(f => 
        f.toLowerCase().includes('entregas') && f.toLowerCase().includes(azureIdStr.toLowerCase())
      );
      
      let debugInfo = `Archivos en vault que coinciden con '${azureIdStr}': ${entregaFiles.length > 0 ? entregaFiles.join('; ') : 'ninguno'}\n`;
      debugInfo += `Total archivos: ${deliveryFiles.length}\n`;
      debugInfo += deliveryFiles.slice(0, 5).map(f => `Sample: ${f}`).join('\n');
      
      return `❌ No se encontró archivo de entrega para #${azureId}.\n` +
             debugInfo +
             `Usa primero: \`>oo review ${azureId}\` para preparar la entrega.`;
    }

    // 2. Leer el archivo de entrega
    const deliveryNote = await vaultManager.readNote(matchingFile);
    
    // 3. Extraer links del contenido
    const sections = extractSections(deliveryNote.content);
    
    // 4. Formatear comentario para Azure - usar contenido tal cual del template
    // Combinar: datos del archivo + parámetros extra del comando
    const extraData = {
      prLink: extraParams?.prLink || sections.prLink || deliveryNote.data?.pr_link || '',
      deployUrl: extraParams?.deployUrl || sections.deployUrl || deliveryNote.data?.deploy_url || '',
      notes: extraParams?.notes || deliveryNote.data?.notas || ''
    };
    const comment = formatCommentForAzure(deliveryNote.content, azureId, extraData);

    // 5. Publicar comentario en Azure DevOps
    await azureClient.addComment(azureId, comment);

    // 6. Cambiar estado según el tipo de work item o parámetro explícito
    let targetState: string;
    
    if (extraParams?.state) {
      // Si se pasó estado explícitamente, usarlo
      targetState = extraParams.state;
    } else {
      // Por defecto: Bugs -> Testing, Tasks -> Done
      const workItem = await azureClient.getWorkItem(azureId);
      const workItemType = workItem.fields['System.WorkItemType'];
      targetState = workItemType === 'Bug' ? 'Testing' : 'Done';
    }
    
    try {
      await azureClient.updateWorkItemState(azureId, targetState);
    } catch (stateError: any) {
      // Si falla, intentar con estado alternativo
      try {
        const altState = targetState === 'Testing' ? 'Done' : 'Closed';
        await azureClient.updateWorkItemState(azureId, altState);
        targetState = altState;
      } catch {
        console.log('No se pudo cambiar el estado');
      }
    }

    // 7. Crear/actualizar nota de tracking
    const trackingPath = `tracking/${azureId}.md`;
    const trackingContent = `#${azureId} - Entregado\n\n` +
      `**Fecha de entrega:** ${new Date().toLocaleDateString('es-ES')}\n` +
      `**Estado:** ${targetState}\n` +
      `**Archivo de entrega:** ${matchingFile}\n` +
      (extraData.prLink ? `**PR:** ${extraData.prLink}\n` : '') +
      (extraData.deployUrl ? `**Deploy:** ${extraData.deployUrl}\n` : '') +
      `\n---\n` +
      `*Entregado automáticamente via OpenCode*`;

    await vaultManager.writeNote(
      trackingPath,
      trackingContent,
      {
        azure_id: azureId.toString(),
        status: 'delivered',
        delivered_at: new Date().toISOString(),
        delivery_file: matchingFile,
      }
    );

    // 8. Retornar confirmación
    let output = `✅ **Comentario publicado en #${azureId}**\n\n`;
    output += `📄 **Archivo de entrega:** ${matchingFile}\n`;
    output += `📝 **Estado cambiado a:** ${targetState}\n\n`;
    output += `🔗 **Ver en Azure DevOps:**\n`;
    output += `https://dev.azure.com/cinemarkintl/Core%20Backend/_workitems/edit/${azureId}\n\n`;
    output += `📋 **Resumen del comentario:**\n`;
    output += `- Contexto: ${sections.contexto ? '✅ Incluido' : '❌ No encontrado'}\n`;
    output += `- Implementación: ${sections.implementacion ? '✅ Incluido' : '❌ No encontrado'}\n`;
    output += `- Testing: ${sections.testing ? '✅ Incluido' : '❌ No encontrado'}\n`;
    if (extraData.prLink) output += `- PR: ${extraData.prLink}\n`;
    if (extraData.deployUrl) output += `- Deploy: ${extraData.deployUrl}\n`;

    return output;

  } catch (error: any) {
    if (error.message.includes('AZURE_PAT')) {
      return `❌ ${error.message}`;
    }
    if (error.response?.status === 404) {
      return `❌ Work item #${azureId} no encontrado.`;
    }
    return `❌ Error al publicar comentario: ${error.message}`;
  }
}

/**
 * Extraer secciones del contenido del template
 */
function extractSections(content: string): {
  contexto: string;
  implementacion: string;
  testing: string;
  notas: string;
  prLink: string;
  deployUrl: string;
} {
  const sections = {
    contexto: '',
    implementacion: '',
    testing: '',
    notas: '',
    prLink: '',
    deployUrl: ''
  };

  // Buscar sección de Contexto y Objetivo
  const contextoMatch = content.match(/## 1\. Contexto y Objetivo[\s\S]*?(?=## 2\.|$)/i);
  if (contextoMatch) {
    sections.contexto = cleanSection(contextoMatch[0]);
  }

  // Buscar sección de Implementación
  const implementacionMatch = content.match(/## 3\. Implementación y Trazabilidad[\s\S]*?(?=## 4\.|$)/i);
  if (implementacionMatch) {
    sections.implementacion = cleanSection(implementacionMatch[0]);
  }

  // Buscar sección de Testing
  const testingMatch = content.match(/## 4\. Testing y Validación QA[\s\S]*?(?=## 5\.|$)/i);
  if (testingMatch) {
    sections.testing = cleanSection(testingMatch[0]);
  }

  // Buscar sección de Notas
  const notasMatch = content.match(/## 6\. Documentación y Release[\s\S]*?(?=---|$)/i);
  if (notasMatch) {
    sections.notas = cleanSection(notasMatch[0]);
  }

  // Extraer PR link desde el cuerpo del markdown
  const prMatch = content.match(/\*\*PR:?\*\*.*?(https?:\/\/[^\s\n]+)/i);
  if (prMatch) sections.prLink = prMatch[1];
  
  // Extraer Deploy link desde el cuerpo del markdown
  const deployMatch = content.match(/\*\*Deploy:\*\*.*?(https?:\/\/[^\s\n]+)/i);
  if (deployMatch) sections.deployUrl = deployMatch[1];
  
  // También buscar en frontmatter
  const frontmatterMatch = content.match(/^---([\s\S]*?)---/);
  if (frontmatterMatch) {
    const fm = frontmatterMatch[1];
    const fmPrMatch = fm.match(/pr_link:\s*(.+)/i);
    const fmDeployMatch = fm.match(/deploy_url:\s*(.+)/i);
    if (fmPrMatch && !sections.prLink) sections.prLink = fmPrMatch[1].trim();
    if (fmDeployMatch && !sections.deployUrl) sections.deployUrl = fmDeployMatch[1].trim();
  }

  return sections;
}

/**
 * Limpiar contenido de una sección
 */
function cleanSection(section: string): string {
  return section
    .replace(/## \d+\. [^\n]+\n*/, '') // Remover título
    .replace(/\*\*/g, '') // Remover negritas markdown
    .replace(/^\s*[\-\*]\s*/gm, '') // Remover bullets
    .replace(/\n{3,}/g, '\n\n') // Reducir múltiples saltos de línea
    .trim();
}

/**
 * Formatear comentario para Azure DevOps - convierte markdown a HTML
 */
function formatCommentForAzure(
  content: string,
  azureId: number,
  extraData?: { prLink?: string; deployUrl?: string; notes?: string }
): string {
  // Limpiar el contenido del frontmatter
  let cleanContent = content.replace(/^---[\s\S]*?---/, '').trim();
  
  // Agregar links adicionales al final si existen
  let additionalLinks = '';
  if (extraData?.prLink || extraData?.deployUrl || extraData?.notes) {
    additionalLinks += `---\n`;
    additionalLinks += `### 🔗 Links de Entrega\n`;
    if (extraData.prLink) additionalLinks += `- **PR:** ${extraData.prLink}\n`;
    if (extraData.deployUrl) additionalLinks += `- **Deploy:** ${extraData.deployUrl}\n`;
    if (extraData.notes) additionalLinks += `- **Notas:** ${extraData.notes}\n`;
  }

  const markdownContent = cleanContent + '\n\n' + additionalLinks;
  
  // Convertir markdown a HTML
  const htmlContent = marked.parse(markdownContent, { async: false }) as string;
  
  return htmlContent;
}
