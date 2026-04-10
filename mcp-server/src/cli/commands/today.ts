import { getActiveWorkspace, loadConfig, AppConfig, WorkspaceConfig } from '../../core/config.js';
import { VaultManager } from '../../core/vault.js';
import { TemplateEngine } from '../../core/template-engine.js';
import { ContentDetector } from '../../core/detector.js';

/**
 * Comando: >oo today
 * Genera resumen del día (default: ayer)
 */
export async function handleToday(
  date?: string,
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

  // Parsear fecha
  const targetDate = date ? new Date(date) : new Date(Date.now() - 86400000);
  const dateStr = targetDate.toISOString().split('T')[0];
  const displayDate = targetDate.toLocaleDateString('es-ES', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // Escanear todas las notas
  const allNotes = await vaultManager.listNotes();
  
  const completedTasks: Array<{id: string; title: string; tag?: string}> = [];
  const inProgressTasks: Array<{id: string; title: string}> = [];
  const blockedTasks: Array<{id: string; title: string; reason: string}> = [];
  const deploys: Array<{repo: string; tag: string; message: string}> = [];

  for (const notePath of allNotes) {
    try {
      const note = await vaultManager.readNote(notePath);
      const noteDate = note.data.date || '';
      const updatedAt = note.data.updated_at || '';
      
      const isFromTargetDate = noteDate.includes(dateStr) || updatedAt.includes(dateStr);
      const noteContent = note.content;
      const lowerContent = noteContent.toLowerCase();

      if (isFromTargetDate || notePath.includes('daily')) {
        // Completadas
        if (lowerContent.includes('completado') || lowerContent.includes('done') || 
            lowerContent.includes('✅') || lowerContent.includes('🟢 prod') ||
            note.data.status === 'PROD' || note.data.status === 'completed') {
          completedTasks.push({
            id: note.data.azure_id || notePath.replace('.md', ''),
            title: detector.extractTitle(noteContent),
            tag: note.data.tag_version
          });
        }

        // En progreso
        if (lowerContent.includes('en progreso') || lowerContent.includes('in progress') || 
            lowerContent.includes('🔄') || note.data.status === 'in-progress') {
          inProgressTasks.push({
            id: note.data.azure_id || notePath.replace('.md', ''),
            title: detector.extractTitle(noteContent)
          });
        }

        // Bloqueadas
        if (lowerContent.includes('bloqueado') || lowerContent.includes('blocked') || 
            lowerContent.includes('🚧') || lowerContent.includes('issue')) {
          const lines = noteContent.split('\n');
          const blockReason = lines.find((l: string) => 
            l.toLowerCase().includes('bloque') || 
            l.toLowerCase().includes('issue') ||
            l.toLowerCase().includes('imped')
          ) || 'Sin razón especificada';
          
          blockedTasks.push({
            id: note.data.azure_id || notePath.replace('.md', ''),
            title: detector.extractTitle(noteContent),
            reason: blockReason.substring(0, 100)
          });
        }

        // Deploys
        if (lowerContent.includes('git tag') || note.data.type === 'deploy') {
          const gitTags = detector.extractGitTags(noteContent);
          gitTags.forEach((tag: any) => {
            deploys.push({
              repo: tag.repo,
              tag: tag.tag,
              message: tag.message
            });
          });
        }
      }
    } catch (e) {
      // Ignorar errores
    }
  }

  // Generar resumen
  const today = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  
  let summary = `# 📅 Daily Standup - ${today}\n\n`;
  summary += `**Resumen de:** ${displayDate}\n\n`;

  // Completadas
  summary += `## ✅ Completado\n`;
  if (completedTasks.length > 0) {
    completedTasks.forEach(task => {
      const tagInfo = task.tag ? ` [${task.tag}]` : '';
      summary += `- [${task.id}]${tagInfo} ${task.title}\n`;
    });
  } else {
    summary += `_Sin tareas completadas registradas_\n`;
  }

  // En progreso
  summary += `\n## 🔄 En Progreso\n`;
  if (inProgressTasks.length > 0) {
    inProgressTasks.forEach(task => {
      summary += `- [${task.id}] ${task.title}\n`;
    });
  } else {
    summary += `_Sin tareas en progreso_\n`;
  }

  // Bloqueos
  if (blockedTasks.length > 0) {
    summary += `\n## 🚧 Bloqueos/Impedimentos\n`;
    blockedTasks.forEach(task => {
      summary += `- [${task.id}] ${task.title}\n  → ${task.reason}\n`;
    });
  }

  // Deploys
  if (deploys.length > 0) {
    summary += `\n## 🚀 Deploys Realizados\n`;
    deploys.forEach(d => {
      summary += `- \`${d.repo}\` → ${d.tag}: ${d.message}\n`;
    });
  }

  // Plan para hoy
  summary += `\n## 📋 Plan para Hoy\n`;
  summary += `_¿Qué vas a trabajar hoy? (Añade manualmente)_\n`;

  summary += `\n---\n`;
  summary += `*Generado automáticamente por opencode-obsidian*\n`;

  return summary;
}
