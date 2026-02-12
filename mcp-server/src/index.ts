#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { VaultManager } from './core/vault.js';
import { TemplateEngine } from './core/template-engine.js';
import { ContentDetector } from './core/detector.js';
import { VaultSearch } from './core/rag.js';

// Configuración
let VAULT_PATH: string | null = process.env.OBSIDIAN_VAULT_PATH || null;
const CONFIG_PATH = path.join(os.homedir(), '.opencode-obsidian.config.json');

// Inicializar componentes
let vaultManager: VaultManager | null = null;
let templateEngine: TemplateEngine | null = null;
let vaultSearch: VaultSearch | null = null;
const detector = new ContentDetector();

/**
 * Carga la configuración guardada
 */
async function loadConfig(): Promise<string | null> {
  try {
    const data = await fs.readFile(CONFIG_PATH, 'utf-8');
    return JSON.parse(data).vault_path;
  } catch {
    return null;
  }
}

/**
 * Guarda la configuración
 */
async function saveConfig(vaultPath: string): Promise<void> {
  try {
    await fs.writeFile(CONFIG_PATH, JSON.stringify({ vault_path: vaultPath }, null, 2));
  } catch (e) {
    console.error('Failed to save config:', e);
  }
}

/**
 * Obtiene el path del vault (de config o variable de entorno)
 */
function getVaultPath(providedPath?: string): string {
  const p = providedPath || VAULT_PATH;
  if (!p) {
    throw new McpError(
      ErrorCode.InvalidParams,
      'Vault path is not set. Use obsidian_set_vault or provide vault_path argument.'
    );
  }
  return p;
}

/**
 * Inicializa los componentes del vault
 */
async function initializeVault(vaultPath: string): Promise<void> {
  vaultManager = new VaultManager(vaultPath);
  templateEngine = new TemplateEngine(vaultPath);
  vaultSearch = new VaultSearch(vaultPath);
  await templateEngine.loadTemplates();
  await vaultSearch.initialize();
}

/**
 * Captura una nota desordenada y la organiza
 */
async function captureNote(content: string, vaultPath?: string): Promise<string> {
  const vp = getVaultPath(vaultPath);
  if (!vaultManager || vaultManager.getVaultPath() !== vp) {
    await initializeVault(vp);
  }
  
  // Analizar el contenido
  const detected = detector.analyze(content);
  const title = detector.generateSlug(content);
  
  // Si hay deploy tags, validar que tengan Azure ID
  if (detected.gitTags.length > 0) {
    const tagsWithoutAzureId = detected.gitTags.filter(tag => {
      // Verificar si el mensaje del tag contiene un Azure ID
      const messageHasAzureId = /\b2\d{4,5}\b/.test(tag.message);
      return !messageHasAzureId;
    });
    
    if (tagsWithoutAzureId.length > 0) {
      const tagList = tagsWithoutAzureId.map(t => `${t.tag} (repo: ${t.repo})`).join(', ');
      return `⚠️  DEPLOY TAGS SIN AZURE ID DETECTADOS:

Los siguientes tags no tienen un ID de Azure en su mensaje:
${tagList}

⚠️  REQUERIDO: Usa formato: git tag -a vX.Y.Z -m "28416 descripción"

Por favor, incluye el ID de la tarea de Azure en el mensaje del tag.
Ejemplo: git tag -a v2.8.3 -m "28416 fix OTP validation"

No se guardó la nota. Corrige y vuelve a intentar.`;
    }
    
    // Si todos los tags tienen Azure ID, actualizar trackers
    let updatedTrackers = '';
    for (const tag of detected.gitTags) {
      const azureIdsInMessage = tag.message.match(/\b2\d{4,5}\b/g);
      if (azureIdsInMessage) {
        for (const azureId of azureIdsInMessage) {
          const trackerPath = path.join('tracking', `${azureId}.md`);
          if (await vaultManager!.exists(trackerPath)) {
            // Actualizar tracker existente
            const note = await vaultManager!.readNote(trackerPath);
            let newContent = note.content;
            
            // Actualizar tag
            newContent = newContent.replace(
              /\*\*Tag:\*\* `.+`/,
              `**Tag:** \`${tag.tag}\``
            );
            
            // Actualizar estado a PROD
            newContent = newContent.replace(
              /\*\*Estado:\*\* .+/,
              `**Estado:** 🟢 PROD`
            );
            
            // Añadir al historial
            const timestamp = new Date().toLocaleString('es-ES');
            newContent += `\n\n---\n**${timestamp}:** Deploy a PROD con tag ${tag.tag} (${tag.repo})`;
            
            await vaultManager!.updateNote(trackerPath, {
              content: newContent,
              data: {
                ...note.data,
                tag_version: tag.tag,
                status: 'PROD',
                updated_at: new Date().toISOString()
              }
            });
            
            updatedTrackers += `\n✅ Tracker ${azureId} actualizado con tag ${tag.tag}`;
          }
        }
      }
    }
    
    // Guardar la nota de deploy
    const deployPath = path.join('inbox', `${new Date().toISOString().split('T')[0]}-deploy.md`);
    await vaultManager!.writeNote(deployPath, content, {
      date: new Date().toISOString(),
      type: 'deploy',
      git_tags: detected.gitTags
    });
    
    return `🚀 Deploy registrado: ${deployPath}${updatedTrackers}`;
  }
  
  // Determinar dónde guardar según el tipo
  let targetFolder = 'inbox';
  let targetName = `${new Date().toISOString().split('T')[0]}-${title}.md`;
  
  if (detected.azureIds.length > 0) {
    targetFolder = 'proyectos';
    targetName = `${detected.azureIds[0]}-context.md`;
  } else if (detector.isTechnicalCommand(content)) {
    targetFolder = 'recursos';
    targetName = `${title}.md`;
  }
  
  // Guardar la nota
  const relativePath = path.join(targetFolder, targetName);
  await vaultManager!.writeNote(relativePath, content, {
    date: new Date().toISOString(),
    detected_category: detected.category,
    azure_ids: detected.azureIds,
    tags: detected.repositories
  });
  
  // Si hay Azure IDs, generar templates adicionales
  let additionalInfo = '';
  if (detected.azureIds.length > 0) {
    const variables = templateEngine!.extractVariables(content);
    variables.azure_id = detected.azureIds[0];
    
    // Generar entrega
    if (templateEngine!.hasTemplate('azure-delivery')) {
      const deliveryContent = templateEngine!.applyTemplate('azure-delivery', variables);
      const deliveryPath = path.join('entregas', `${detected.azureIds[0]}-${title}.md`);
      await vaultManager!.writeNote(deliveryPath, deliveryContent, {
        azure_id: detected.azureIds[0],
        template: 'azure-delivery',
        status: 'draft'
      });
      additionalInfo += `\n📄 Entrega creada: ${deliveryPath}`;
    }
    
    // Generar tracker
    if (templateEngine!.hasTemplate('task-tracker')) {
      const trackerContent = templateEngine!.applyTemplate('task-tracker', variables);
      const trackerPath = path.join('tracking', `${detected.azureIds[0]}.md`);
      if (!await vaultManager!.exists(trackerPath)) {
        await vaultManager!.writeNote(trackerPath, trackerContent, {
          azure_id: detected.azureIds[0],
          template: 'task-tracker',
          status: 'in-progress'
        });
        additionalInfo += `\n📊 Tracker creado: ${trackerPath}`;
      }
    }
  }
  
  // Indexar automáticamente la nota capturada (en background)
  if (vaultSearch) {
    vaultSearch.addNoteToIndex(relativePath).catch(e => {
      console.error('Error indexando nota automáticamente:', e);
    });
    
    // También indexar las notas adicionales si se crearon
    if (detected.azureIds.length > 0) {
      const deliveryPath = path.join('entregas', `${detected.azureIds[0]}-${title}.md`);
      const trackerPath = path.join('tracking', `${detected.azureIds[0]}.md`);
      
      vaultSearch.addNoteToIndex(deliveryPath).catch(() => {});
      vaultSearch.addNoteToIndex(trackerPath).catch(() => {});
    }
  }
  
  return `✅ Nota capturada: ${relativePath}${additionalInfo}`;
}

/**
 * Aplica un template a una nota
 */
async function applyTemplate(notePath: string, templateName: string, vaultPath?: string): Promise<string> {
  const vp = getVaultPath(vaultPath);
  if (!vaultManager || vaultManager.getVaultPath() !== vp) {
    await initializeVault(vp);
  }
  
  // Leer la nota original
  const note = await vaultManager!.readNote(notePath);
  
  // Extraer variables
  const variables = templateEngine!.extractVariables(note.content);
  
  // Aplicar template
  const newContent = templateEngine!.applyTemplate(templateName, variables);
  
  // Determinar nuevo path según el template
  let newPath = notePath;
  if (templateName === 'azure-delivery') {
    const azureId = variables.azure_id || 'unknown';
    newPath = path.join('entregas', `${azureId}-delivery.md`);
  } else if (templateName === 'task-tracker') {
    const azureId = variables.azure_id || 'unknown';
    newPath = path.join('tracking', `${azureId}.md`);
  }
  
  // Guardar la nota transformada
  await vaultManager!.writeNote(newPath, newContent, {
    ...note.data,
    template: templateName,
    original_path: notePath,
    generated_at: new Date().toISOString()
  });
  
  return `✅ Template "${templateName}" aplicado\n📄 Nueva nota: ${newPath}`;
}

/**
 * Obtiene el resumen del día anterior - Versión Mejorada
 */
async function getDailySummary(vaultPath?: string, targetDate?: Date): Promise<string> {
  const vp = getVaultPath(vaultPath);
  if (!vaultManager || vaultManager.getVaultPath() !== vp) {
    await initializeVault(vp);
  }
  
  // Obtener fecha objetivo (ayer por defecto)
  const summaryDate = targetDate || new Date(Date.now() - 86400000);
  const dateStr = summaryDate.toISOString().split('T')[0];
  const displayDate = summaryDate.toLocaleDateString('es-ES', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  // Buscar en todas las notas
  const allNotes = await vaultManager!.listNotes();
  
  const completedTasks: Array<{id: string, title: string, tag?: string}> = [];
  const inProgressTasks: Array<{id: string, title: string}> = [];
  const blockedTasks: Array<{id: string, title: string, reason: string}> = [];
  const learnings: string[] = [];
  const deploys: Array<{repo: string, tag: string, message: string}> = [];
  
  for (const notePath of allNotes) {
    try {
      const note = await vaultManager!.readNote(notePath);
      const noteDate = note.data.date || '';
      const updatedAt = note.data.updated_at || '';
      
      // Verificar si es de la fecha objetivo
      const isFromTargetDate = noteDate.includes(dateStr) || updatedAt.includes(dateStr);
      const noteContent = note.content;
      const lowerContent = noteContent.toLowerCase();
      
      if (isFromTargetDate || notePath.includes('daily')) {
        // Detectar tareas completadas
        if (lowerContent.includes('completado') || lowerContent.includes('done') || 
            lowerContent.includes('✅') || lowerContent.includes('🟢 prod') ||
            note.data.status === 'PROD' || note.data.status === 'completed') {
          completedTasks.push({
            id: note.data.azure_id || path.basename(notePath, '.md'),
            title: detector.extractTitle(noteContent),
            tag: note.data.tag_version
          });
        }
        
        // Detectar tareas en progreso
        if (lowerContent.includes('en progreso') || lowerContent.includes('in progress') || 
            lowerContent.includes('🔄') || note.data.status === 'in-progress') {
          inProgressTasks.push({
            id: note.data.azure_id || path.basename(notePath, '.md'),
            title: detector.extractTitle(noteContent)
          });
        }
        
        // Detectar tareas bloqueadas
        if (lowerContent.includes('bloqueado') || lowerContent.includes('blocked') || 
            lowerContent.includes('🚧') || lowerContent.includes('issue')) {
          const lines = noteContent.split('\n');
          const blockReason = lines.find(l => 
            l.toLowerCase().includes('bloque') || 
            l.toLowerCase().includes('issue')
          ) || 'Sin razón especificada';
          
          blockedTasks.push({
            id: note.data.azure_id || path.basename(notePath, '.md'),
            title: detector.extractTitle(noteContent),
            reason: blockReason.substring(0, 100)
          });
        }
        
        // Detectar aprendizajes
        if (notePath.includes('recursos') || 
            lowerContent.includes('aprendí') || 
            lowerContent.includes('comando útil') ||
            lowerContent.includes('tip:') ||
            lowerContent.includes('nota:')) {
          const lines = noteContent.split('\n');
          const learningLine = lines.find(l => 
            l.toLowerCase().includes('aprendí') || 
            l.toLowerCase().includes('comando') ||
            l.toLowerCase().includes('tip')
          );
          if (learningLine) {
            learnings.push(`- ${learningLine.substring(0, 80)}`);
          }
        }
        
        // Detectar deploys del día
        if (lowerContent.includes('git tag') || note.data.type === 'deploy') {
          const gitTags = detector.extractGitTags(noteContent);
          gitTags.forEach(tag => {
            deploys.push({
              repo: tag.repo,
              tag: tag.tag,
              message: tag.message
            });
          });
        }
      }
    } catch (e) {
      // Ignorar errores de lectura
    }
  }
  
  // Generar resumen formateado
  const today = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  
  let summary = `# 📅 Daily Standup - ${today}\n\n`;
  summary += `**Resumen de:** ${displayDate}\n\n`;
  
  // Tareas completadas
  summary += `## ✅ Completado\n`;
  if (completedTasks.length > 0) {
    completedTasks.forEach(task => {
      const tagInfo = task.tag ? ` [${task.tag}]` : '';
      summary += `- [${task.id}]${tagInfo} ${task.title}\n`;
    });
  } else {
    summary += `_Sin tareas completadas registradas_\n`;
  }
  
  // Tareas en progreso
  summary += `\n## 🔄 En Progreso\n`;
  if (inProgressTasks.length > 0) {
    inProgressTasks.forEach(task => {
      summary += `- [${task.id}] ${task.title}\n`;
    });
  } else {
    summary += `_Sin tareas en progreso_\n`;
  }
  
  // Deploys
  if (deploys.length > 0) {
    summary += `\n## 🚀 Deploys Realizados\n`;
    deploys.forEach(d => {
      summary += `- \`${d.repo}\` → ${d.tag}: ${d.message}\n`;
    });
  }
  
  // Bloqueos
  if (blockedTasks.length > 0) {
    summary += `\n## 🚧 Bloqueos/Impedimentos\n`;
    blockedTasks.forEach(task => {
      summary += `- [${task.id}] ${task.title}\n  → ${task.reason}\n`;
    });
  }
  
  // Aprendizajes
  if (learnings.length > 0) {
    summary += `\n## 💡 Aprendizajes del Día\n`;
    learnings.slice(0, 5).forEach(learning => {
      summary += `${learning}\n`;
    });
  }
  
  // Plan para hoy (placeholder)
  summary += `\n## 📋 Plan para Hoy\n`;
  summary += `_¿Qué vas a trabajar hoy? (Añade manualmente)_\n`;
  
  summary += `\n---\n`;
  summary += `*Generado automáticamente por opencode-obsidian*\n`;
  
  return summary;
}

/**
 * Lista todos los tags de deploy
 */
async function listDeployTags(vaultPath?: string): Promise<Array<{ repo: string; tag: string; message: string; date?: string }>> {
  const vp = getVaultPath(vaultPath);
  if (!vaultManager || vaultManager.getVaultPath() !== vp) {
    await initializeVault(vp);
  }
  
  // Buscar en daily notes y notas de recursos
  const allNotes = await vaultManager!.listNotes();
  const deploys: Array<{ repo: string; tag: string; message: string; date?: string }> = [];
  
  for (const notePath of allNotes) {
    try {
      const note = await vaultManager!.readNote(notePath);
      const tags = detector.extractGitTags(note.content);
      
      tags.forEach(tag => {
        deploys.push({
          ...tag,
          date: note.data.date
        });
      });
    } catch (e) {
      // Ignorar errores
    }
  }
  
  return deploys;
}

/**
 * Actualiza el progreso de una tarea
 */
async function updateTaskProgress(azureId: string, updates: { status?: string; tag?: string; notes?: string }, vaultPath?: string): Promise<string> {
  const vp = getVaultPath(vaultPath);
  if (!vaultManager || vaultManager.getVaultPath() !== vp) {
    await initializeVault(vp);
  }
  
  // Buscar el tracker de la tarea
  const trackerPath = path.join('tracking', `${azureId}.md`);
  
  if (!await vaultManager!.exists(trackerPath)) {
    // Crear tracker si no existe
    const variables = {
      azure_id: azureId,
      fecha: new Date().toLocaleDateString('es-ES'),
      estado: updates.status || '🟡 STG'
    };
    
    if (templateEngine!.hasTemplate('task-tracker')) {
      const content = templateEngine!.applyTemplate('task-tracker', variables);
      await vaultManager!.writeNote(trackerPath, content, {
        azure_id: azureId,
        status: updates.status || 'in-progress',
        created_at: new Date().toISOString()
      });
    }
  } else {
    // Actualizar tracker existente
    const note = await vaultManager!.readNote(trackerPath);
    let newContent = note.content;
    
    // Actualizar estado
    if (updates.status) {
      newContent = newContent.replace(
        /\*\*Estado:\*\* .+/,
        `**Estado:** ${updates.status}`
      );
    }
    
    // Actualizar tag
    if (updates.tag) {
      newContent = newContent.replace(
        /\*\*Tag:\*\* `.+`/,
        `**Tag:** \`${updates.tag}\``
      );
    }
    
    // Añadir nota al historial
    if (updates.notes) {
      const timestamp = new Date().toLocaleString('es-ES');
      newContent += `\n\n---\n**${timestamp}:** ${updates.notes}`;
    }
    
    await vaultManager!.updateNote(trackerPath, {
      content: newContent,
      data: {
        ...note.data,
        status: updates.status || note.data.status,
        updated_at: new Date().toISOString()
      }
    });
  }
  
  return `✅ Progreso actualizado para tarea ${azureId}\n📊 Tracker: ${trackerPath}`;
}

// Main
(async () => {
  // Cargar config si no hay variable de entorno
  if (!VAULT_PATH) {
    VAULT_PATH = await loadConfig();
  }

  // Crear servidor MCP
  const server = new Server(
    {
      name: 'opencode-obsidian',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Listar herramientas disponibles
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'obsidian_set_vault',
          description: 'Set the default Obsidian vault path',
          inputSchema: {
            type: 'object',
            properties: {
              path: { type: 'string', description: 'Absolute path to the Obsidian vault' }
            },
            required: ['path']
          }
        },
        {
          name: 'obsidian_capture_note',
          description: 'Capture a messy note and automatically organize it',
          inputSchema: {
            type: 'object',
            properties: {
              content: { type: 'string', description: 'The note content to capture' },
              vault_path: { type: 'string', description: 'Optional vault path override' }
            },
            required: ['content']
          }
        },
        {
          name: 'obsidian_apply_template',
          description: 'Apply a template to an existing note',
          inputSchema: {
            type: 'object',
            properties: {
              note_path: { type: 'string', description: 'Path to the note' },
              template: { type: 'string', description: 'Template name (azure-delivery, task-tracker, etc.)' },
              vault_path: { type: 'string', description: 'Optional vault path override' }
            },
            required: ['note_path', 'template']
          }
        },
        {
          name: 'obsidian_search_vault',
          description: 'Search notes by content or filename',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Search query' },
              vault_path: { type: 'string', description: 'Optional vault path override' }
            },
            required: ['query']
          }
        },
        {
          name: 'obsidian_get_daily_summary',
          description: 'Get summary of what was done yesterday',
          inputSchema: {
            type: 'object',
            properties: {
              vault_path: { type: 'string', description: 'Optional vault path override' }
            }
          }
        },
        {
          name: 'obsidian_list_deploy_tags',
          description: 'List all deploy tags found in the vault',
          inputSchema: {
            type: 'object',
            properties: {
              vault_path: { type: 'string', description: 'Optional vault path override' }
            }
          }
        },
        {
          name: 'obsidian_update_task_progress',
          description: 'Update progress for an Azure task',
          inputSchema: {
            type: 'object',
            properties: {
              azure_id: { type: 'string', description: 'Azure task ID (e.g., 28416)' },
              status: { type: 'string', description: 'New status (🔴 LAB / 🟡 STG / 🟢 PROD)' },
              tag: { type: 'string', description: 'Deploy tag version' },
              notes: { type: 'string', description: 'Additional notes' },
              vault_path: { type: 'string', description: 'Optional vault path override' }
            },
            required: ['azure_id']
          }
        },
        {
          name: 'obsidian_list_templates',
          description: 'List available templates',
          inputSchema: {
            type: 'object',
            properties: {}
          }
        },
        {
          name: 'obsidian_read_note',
          description: 'Read a specific note',
          inputSchema: {
            type: 'object',
            properties: {
              note_path: { type: 'string', description: 'Path to the note' },
              vault_path: { type: 'string', description: 'Optional vault path override' }
            },
            required: ['note_path']
          }
        },
        // COMANDOS CORTOS
        {
          name: '>oo_help',
          description: 'Show help - list all available >oo commands',
          inputSchema: {
            type: 'object',
            properties: {}
          }
        },
        {
          name: '>oo_create',
          description: 'Create - Generate template from existing note using task ID',
          inputSchema: {
            type: 'object',
            properties: {
              template: { type: 'string', description: 'Template name (bitbucket-pr-standard, azure-delivery, etc.)' },
              task_id: { type: 'string', description: 'Azure task ID (e.g., 28620)' }
            },
            required: ['template', 'task_id']
          }
        },
        {
          name: '>oo_cap',
          description: 'Capture - Quick capture shortcut (same as obsidian_capture_note)',
          inputSchema: {
            type: 'object',
            properties: {
              text: { type: 'string', description: 'Text to capture' },
              vault_path: { type: 'string', description: 'Optional vault path override' }
            },
            required: ['text']
          }
        },
        {
          name: '>oo_find',
          description: 'Find - Quick vault search (same as obsidian_search_vault)',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Search query' },
              vault_path: { type: 'string', description: 'Optional vault path override' }
            },
            required: ['query']
          }
        },
        {
          name: '>oo_task',
          description: 'Task - Quick tracker view/update for Azure task (same as obsidian_update_task_progress)',
          inputSchema: {
            type: 'object',
            properties: {
              azure_id: { type: 'string', description: 'Azure task ID (e.g., 28416)' },
              status: { type: 'string', description: 'Optional: Update status (🔴 LAB / 🟡 STG / 🟢 PROD)' },
              tag: { type: 'string', description: 'Optional: Deploy tag version' },
              vault_path: { type: 'string', description: 'Optional vault path override' }
            },
            required: ['azure_id']
          }
        },
        {
          name: '>oo_daily',
          description: 'Daily - Quick daily summary (same as obsidian_get_daily_summary)',
          inputSchema: {
            type: 'object',
            properties: {
              date: { type: 'string', description: 'Optional: Specific date (YYYY-MM-DD)' },
              vault_path: { type: 'string', description: 'Optional vault path override' }
            }
          }
        },
        {
          name: '>oo_tpl',
          description: 'Templates - Quick list templates (same as obsidian_list_templates)',
          inputSchema: {
            type: 'object',
            properties: {}
          }
        },
        {
          name: '>oo_idx',
          description: 'Index - Index vault for semantic search (RAG)',
          inputSchema: {
            type: 'object',
            properties: {
              vault_path: { type: 'string', description: 'Optional vault path override' }
            }
          }
        },
        {
          name: '>oo_ask',
          description: 'Ask - Ask a question using RAG semantic search',
          inputSchema: {
            type: 'object',
            properties: {
              question: { type: 'string', description: 'Question to ask your vault' },
              limit: { type: 'number', description: 'Number of results (default 5)' },
              vault_path: { type: 'string', description: 'Optional vault path override' }
            },
            required: ['question']
          }
        }
      ]
    };
  });

  // Manejar llamadas a herramientas
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    
    try {
      switch (name) {
        case 'obsidian_set_vault': {
          const vaultPath = String(args?.path);
          VAULT_PATH = vaultPath;
          await saveConfig(vaultPath);
          await initializeVault(vaultPath);
          return {
            content: [{ type: 'text', text: `Vault path set to: ${vaultPath}` }]
          };
        }

        case 'obsidian_capture_note': {
          const content = String(args?.content);
          const vaultPath = args?.vault_path as string | undefined;
          const result = await captureNote(content, vaultPath);
          return {
            content: [{ type: 'text', text: result }]
          };
        }

        case 'obsidian_apply_template': {
          const notePath = String(args?.note_path);
          const template = String(args?.template);
          const vaultPath = args?.vault_path as string | undefined;
          const result = await applyTemplate(notePath, template, vaultPath);
          return {
            content: [{ type: 'text', text: result }]
          };
        }

        case 'obsidian_search_vault': {
          const vp = getVaultPath(args?.vault_path as string);
          if (!vaultManager || vaultManager.getVaultPath() !== vp) {
            await initializeVault(vp);
          }
          const query = String(args?.query);
          const matches = await vaultManager!.searchNotes(query);
          return {
            content: [{ type: 'text', text: matches.join('\n') || 'No matches found' }]
          };
        }

        case 'obsidian_get_daily_summary': {
          const vaultPath = args?.vault_path as string | undefined;
          const summary = await getDailySummary(vaultPath);
          return {
            content: [{ type: 'text', text: summary }]
          };
        }

        case 'obsidian_list_deploy_tags': {
          const vaultPath = args?.vault_path as string | undefined;
          const deploys = await listDeployTags(vaultPath);
          const formatted = deploys.map(d => 
            `${d.repo}: ${d.tag} - ${d.message} (${d.date || 'no date'})`
          ).join('\n');
          return {
            content: [{ type: 'text', text: formatted || 'No deploy tags found' }]
          };
        }

        case 'obsidian_update_task_progress': {
          const azureId = String(args?.azure_id);
          const updates = {
            status: args?.status as string | undefined,
            tag: args?.tag as string | undefined,
            notes: args?.notes as string | undefined
          };
          const vaultPath = args?.vault_path as string | undefined;
          const result = await updateTaskProgress(azureId, updates, vaultPath);
          return {
            content: [{ type: 'text', text: result }]
          };
        }

        case 'obsidian_list_templates': {
          const vp = getVaultPath(args?.vault_path as string);
          if (!templateEngine || !vaultManager || vaultManager.getVaultPath() !== vp) {
            await initializeVault(vp);
          }
          const templates = templateEngine!.listTemplates();
          const formatted = templates.map(t => 
            `- ${t.name} (${t.language}): ${t.description}`
          ).join('\n');
          return {
            content: [{ type: 'text', text: formatted }]
          };
        }

        case 'obsidian_read_note': {
          const vp = getVaultPath(args?.vault_path as string);
          if (!vaultManager || vaultManager.getVaultPath() !== vp) {
            await initializeVault(vp);
          }
          const notePath = String(args?.note_path);
          const note = await vaultManager!.readNote(notePath);
          return {
            content: [{ type: 'text', text: note.content }]
          };
        }

        // COMANDOS CORTOS
        case '>oo_help': {
          const helpText = `📚 opencode-obsidian - Comandos Disponibles

Comandos Disponibles:
  >oo help            Muestra esta ayuda
  >oo cap <texto>     Capture - Capturar nota
  >oo cap -f <file>   Capture desde archivo
  >oo find <query>    Find - Buscar en vault
  >oo read <path>     Read - Leer nota específica
  >oo task <id>       Task - Ver/actualizar tarea
  >oo daily           Daily - Resumen del día
  >oo tpl             Templates - Listar templates
  >oo idx             Index - Indexar vault
  >oo ask <pregunta>  Ask - Preguntar al vault (RAG)
  >oo deploy <tags>   Deploy - Registrar deploy tags
  >oo deploys         Deploys - Listar deploy tags

Ejemplos:
  >oo help                                    # Mostrar esta ayuda
  >oo cap "Tengo que revisar bug 28416"       # Capturar nota con Azure ID
  >oo cap -f meeting_notes.txt                # Capturar desde archivo
  >oo find "error 403"                       # Buscar en vault
  >oo read "tracking/28416.md"               # Leer nota específica
  >oo task 28416                              # Ver estado tarea
  >oo task 28416 status "🟢 PROD"              # Actualizar tarea
  >oo daily                                   # Resumen de ayer
  >oo tpl                                     # Listar templates
  >oo idx                                     # Indexar vault (primera vez)
  >oo ask "cómo solucioné el error del OTP"    # Preguntar al vault con IA
  >oo deploy "git tag -a v2.8.3 -m '28416 fix'" # Registrar deploy
  >oo deploys                                 # Listar deploys realizados
  >oo create "bitbucket-pr-standard" 28620    # Crear template PR para tarea

💡 Tips:
- Usa Azure IDs (28xxx) para generar trackers automáticamente
- El sistema detecta git tags y valida Azure IDs
- Indexa con >oo idx antes de usar >oo ask
- Las notas se organizan automáticamente en carpetas
- Usa >oo create para generar templates rápidamente`;

          return {
            content: [{ type: 'text', text: helpText }]
          };
        }

                case '>oo_create': {
          const templateName = String(args?.template);
          const taskId = String(args?.task_id);
          
          try {
            // Buscar la nota de contexto de la tarea
            const contextPath = path.join('proyectos', `${taskId}-context.md`);
            const deliveryPath = path.join('entregas', `${taskId}-*.md`);
            
            // Determinar qué nota usar
            let notePath = contextPath;
            if (await vaultManager!.exists(deliveryPath.replace('.*', ''))) {
              // Encontrar el archivo de entrega exacto
              const deliveryFiles = await vaultManager!.listNotes();
              const exactDelivery = deliveryFiles.find(f => f.includes(`${taskId}-`));
              if (exactDelivery) {
                notePath = exactDelivery;
              }
            }
            
            if (!await vaultManager!.exists(notePath)) {
              return {
                content: [{ type: 'text', text: `❌ No se encontró información para la tarea ${taskId}. Usa >oo cap primero para capturar la tarea.` }]
              };
            }
            
            // Leer la nota original
            const note = await vaultManager!.readNote(notePath);
            
            // Extraer variables
            const variables = templateEngine!.extractVariables(note.content);
            variables.azure_id = taskId;
            
            // Aplicar template
            const newContent = templateEngine!.applyTemplate(templateName, variables);
            
            // Determinar nuevo path según el template
            let newPath = notePath;
            if (templateName === 'azure-delivery') {
              newPath = path.join('entregas', `${taskId}-delivery.md`);
            } else if (templateName === 'bitbucket-pr-standard' || templateName === 'bitbucket-pr-release') {
              newPath = path.join('entregas', `${taskId}-pr.md`);
            } else {
              newPath = path.join('entregas', `${taskId}-${templateName}.md`);
            }
            
            // Guardar la nota transformada
            await vaultManager!.writeNote(newPath, newContent, {
              ...note.data,
              template: templateName,
              original_path: notePath,
              generated_at: new Date().toISOString()
            });
            
            return {
              content: [{ type: 'text', text: `✅ Template "${templateName}" creado para tarea ${taskId}\n📄 Nuevo archivo: ${newPath}\n\n📋 Contenido:\n${newContent}` }]
            };
          } catch (error: any) {
            return {
              content: [{ type: 'text', text: `❌ Error al crear template: ${error.message}` }]
            };
          }
        }

        case '>oo_cap': {
          const text = String(args?.text);
          const vaultPath = args?.vault_path as string | undefined;
          const result = await captureNote(text, vaultPath);
          return {
            content: [{ type: 'text', text: result }]
          };
        }

        case '>oo_find': {
          const vp = getVaultPath(args?.vault_path as string);
          if (!vaultManager || vaultManager.getVaultPath() !== vp) {
            await initializeVault(vp);
          }
          const query = String(args?.query);
          const matches = await vaultManager!.searchNotes(query);
          return {
            content: [{ type: 'text', text: matches.join('\n') || 'No matches found' }]
          };
        }

        case '>oo_task': {
          const azureId = String(args?.azure_id);
          const updates = {
            status: args?.status as string | undefined,
            tag: args?.tag as string | undefined,
            notes: undefined
          };
          const vaultPath = args?.vault_path as string | undefined;
          const result = await updateTaskProgress(azureId, updates, vaultPath);
          return {
            content: [{ type: 'text', text: result }]
          };
        }

        case '>oo_daily': {
          const vaultPath = args?.vault_path as string | undefined;
          const targetDate = args?.date ? new Date(String(args?.date)) : undefined;
          const summary = await getDailySummary(vaultPath, targetDate);
          return {
            content: [{ type: 'text', text: summary }]
          };
        }

        case '>oo_tpl': {
          const vp = getVaultPath(args?.vault_path as string);
          if (!templateEngine || !vaultManager || vaultManager.getVaultPath() !== vp) {
            await initializeVault(vp);
          }
          const templates = templateEngine!.listTemplates();
          const formatted = templates.map(t =>
            `- ${t.name} (${t.language}): ${t.description}`
          ).join('\n');
          return {
            content: [{ type: 'text', text: formatted }]
          };
        }

        case '>oo_idx': {
          const vp = getVaultPath(args?.vault_path as string);
          if (!vaultSearch || !vaultManager || vaultManager.getVaultPath() !== vp) {
            await initializeVault(vp);
          }
          const result = await vaultSearch!.indexVault();
          return {
            content: [{ type: 'text', text: `✅ Indexación completa: ${result.indexed} notas indexadas, ${result.errors} errores` }]
          };
        }

        case '>oo_ask': {
          const vp = getVaultPath(args?.vault_path as string);
          if (!vaultSearch || !vaultManager || vaultManager.getVaultPath() !== vp) {
            await initializeVault(vp);
          }
          
          // Verificar si el índice existe
          const isValid = await vaultSearch!.isIndexValid();
          if (!isValid) {
            return {
              content: [{ type: 'text', text: '⚠️ El índice no existe o está desactualizado. Ejecuta `>oo idx` primero.' }]
            };
          }
          
          const question = String(args?.question);
          const limit = Number(args?.limit) || 5;
          const results = await vaultSearch!.search(question, limit);
          
          if (results.length === 0) {
            return {
              content: [{ type: 'text', text: '❌ No encontré información relevante en tu vault.\n💡 Intenta usar términos más específicos o ejecuta `>oo idx` para indexar más notas.' }]
            };
          }
          
          let response = `🔍 Resultados para: "${question}"\n\n`;
          results.forEach((r, i) => {
            response += `${i + 1}. **${r.path}** (relevancia: ${(r.score * 100).toFixed(1)}%)\n`;
            response += `${r.content.substring(0, 200)}...\n\n`;
          });
          
          response += `---\n📊 ${results.length} resultados mostrados de tu vault. Usa "limit:10" para más resultados.`;
          
          return {
            content: [{ type: 'text', text: response }]
          };
        }

        default:
          throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
      }
    } catch (error: any) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Error: ${error.message}` }]
      };
    }
  });

  // Iniciar servidor
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error('opencode-obsidian MCP server running on stdio');
})();
