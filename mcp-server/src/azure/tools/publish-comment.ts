import { getAzureClient } from '../azure-client';

interface VaultManager {
  readNote(notePath: string): Promise<{ content: string; data: any }>;
  writeNote(notePath: string, content: string, data?: any): Promise<void>;
  exists(notePath: string): Promise<boolean>;
  listNotes(): Promise<string[]>;
}

/**
 * Tool: azure_publish_comment
 * Comando: >oo comment [id]
 * Publica un comentario de entrega en Azure DevOps y cambia el estado a Resolved
 */
export async function handleAzurePublishComment(
  azureId: number,
  vaultPath: string,
  vaultManager: VaultManager
): Promise<string> {
  try {
    const azureClient = getAzureClient();
    // 1. Buscar archivo de entrega en vault/entregas/
    const deliveryFiles = await vaultManager.listNotes();
    const matchingFile = deliveryFiles.find(f => 
      f.startsWith('entregas/') && f.includes(`${azureId}-`)
    );

    if (!matchingFile) {
      return `❌ No se encontró archivo de entrega para #${azureId}.\n` +
             `Usa primero: \`>oo review ${azureId}\` para preparar la entrega.`;
    }

    // 2. Leer el archivo de entrega
    const deliveryNote = await vaultManager.readNote(matchingFile);
    
    // 3. Extraer secciones relevantes del contenido
    const sections = extractSections(deliveryNote.content);
    
    // 4. Formatear comentario para Azure
    const comment = formatCommentForAzure(sections, azureId);

    // 5. Publicar comentario en Azure DevOps
    await azureClient.addComment(azureId, comment);

    // 6. Cambiar estado a Resolved
    await azureClient.updateWorkItemState(azureId, 'Resolved');

    // 7. Crear/actualizar nota de tracking
    const trackingPath = `tracking/${azureId}.md`;
    const trackingContent = `#${azureId} - Entregado\n\n` +
      `**Fecha de entrega:** ${new Date().toLocaleDateString('es-ES')}\n` +
      `**Estado:** Resolved\n` +
      `**Archivo de entrega:** ${matchingFile}\n\n` +
      `---\n` +
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
    output += `📝 **Estado cambiado a:** Resolved\n\n`;
    output += `🔗 **Ver en Azure DevOps:**\n`;
    output += `https://dev.azure.com/cinemarkintl/Core%20Backend/_workitems/edit/${azureId}\n\n`;
    output += `📋 **Resumen del comentario:**\n`;
    output += `- Contexto: ${sections.contexto ? '✅ Incluido' : '❌ No encontrado'}\n`;
    output += `- Implementación: ${sections.implementacion ? '✅ Incluido' : '❌ No encontrado'}\n`;
    output += `- Testing: ${sections.testing ? '✅ Incluido' : '❌ No encontrado'}\n`;

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
} {
  const sections = {
    contexto: '',
    implementacion: '',
    testing: '',
    notas: ''
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
 * Formatear comentario para Azure DevOps
 */
function formatCommentForAzure(
  sections: ReturnType<typeof extractSections>,
  azureId: number
): string {
  let comment = `## 🎉 Entrega de Desarrollo\n\n`;
  
  comment += `### Resumen\n`;
  comment += `Tarea #${azureId} completada y lista para revisión.\n\n`;

  if (sections.contexto) {
    comment += `### Contexto y Objetivo\n`;
    comment += sections.contexto.substring(0, 500); // Limitar a 500 chars
    if (sections.contexto.length > 500) {
      comment += '...';
    }
    comment += '\n\n';
  }

  if (sections.implementacion) {
    comment += `### Implementación\n`;
    comment += sections.implementacion.substring(0, 800);
    if (sections.implementacion.length > 800) {
      comment += '...';
    }
    comment += '\n\n';
  }

  if (sections.testing) {
    comment += `### Testing y Validación\n`;
    comment += sections.testing.substring(0, 600);
    if (sections.testing.length > 600) {
      comment += '...';
    }
    comment += '\n\n';
  }

  comment += `---\n`;
  comment += `🤖 *Entregado automáticamente via OpenCode Integration*\n`;
  comment += `📅 ${new Date().toLocaleDateString('es-ES')}`;

  return comment;
}
