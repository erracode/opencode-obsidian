import * as fs from 'fs/promises';
import * as path from 'path';
import matter from 'gray-matter';
import { PathResolver } from './workspace.js';

export interface NoteMetadata {
  [key: string]: any;
}

export interface Note {
  content: string;
  data: NoteMetadata;
  path: string;
}

export class VaultManager {
  private vaultPath: string;
  private resolver: PathResolver;

  constructor(vaultPath: string, workspaceName: string) {
    this.vaultPath = vaultPath;
    this.resolver = new PathResolver(path.join(vaultPath, 'workspaces', workspaceName));
  }

  /**
   * Lee una nota del vault
   */
  async readNote(relativePath: string): Promise<Note> {
    const fullPath = path.join(this.vaultPath, relativePath);
    const content = await fs.readFile(fullPath, 'utf-8');
    const parsed = matter(content);
    
    return {
      content: parsed.content,
      data: parsed.data,
      path: relativePath
    };
  }

  /**
   * Escribe una nota en el vault
   */
  async writeNote(relativePath: string, content: string, metadata?: NoteMetadata): Promise<void> {
    const fullPath = path.join(this.vaultPath, relativePath);
    
    // Crear directorios si no existen
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    
    // Si hay metadata, usar gray-matter para formatear
    let finalContent = content;
    if (metadata && Object.keys(metadata).length > 0) {
      finalContent = matter.stringify(content, metadata);
    }
    
    await fs.writeFile(fullPath, finalContent, 'utf-8');
  }

  /**
   * Actualiza el contenido de una nota existente
   */
  async updateNote(relativePath: string, updates: Partial<Note>): Promise<void> {
    const note = await this.readNote(relativePath);
    
    const newContent = updates.content !== undefined ? updates.content : note.content;
    const newData = updates.data ? { ...note.data, ...updates.data } : note.data;
    
    await this.writeNote(relativePath, newContent, newData);
  }

  /**
   * Añade contenido al final de una nota
   */
  async appendToNote(relativePath: string, content: string): Promise<void> {
    const fullPath = path.join(this.vaultPath, relativePath);
    await fs.appendFile(fullPath, '\n' + content, 'utf-8');
  }

  /**
   * Añade contenido bajo un heading específico
   */
  async appendUnderHeading(relativePath: string, heading: string, content: string): Promise<void> {
    const note = await this.readNote(relativePath);
    const lines = note.content.split('\n');
    
    // Buscar el heading
    let headingIndex = -1;
    let headingLevel = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(/^(#+)\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const title = match[2].trim();
        if (title.toLowerCase() === heading.toLowerCase()) {
          headingIndex = i;
          headingLevel = level;
          break;
        }
      }
    }
    
    if (headingIndex === -1) {
      // Heading no existe, añadir al final
      await this.appendToNote(relativePath, `\n## ${heading}\n${content}`);
      return;
    }
    
    // Encontrar dónde insertar (antes del siguiente heading del mismo nivel o superior)
    let insertIndex = headingIndex + 1;
    for (let i = headingIndex + 1; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(/^(#+)\s+/);
      if (match) {
        const level = match[1].length;
        if (level <= headingLevel) {
          break;
        }
      }
      insertIndex = i + 1;
    }
    
    // Insertar el contenido
    lines.splice(insertIndex, 0, content);
    const newContent = lines.join('\n');
    
    await this.writeNote(relativePath, newContent, note.data);
  }

  /**
   * Mueve una nota de una ubicación a otra
   */
  async moveNote(sourcePath: string, destPath: string): Promise<void> {
    const sourceFullPath = path.join(this.vaultPath, sourcePath);
    const destFullPath = path.join(this.vaultPath, destPath);
    
    await fs.mkdir(path.dirname(destFullPath), { recursive: true });
    await fs.rename(sourceFullPath, destFullPath);
  }

  /**
   * Lista todas las notas en una carpeta
   */
  async listNotes(subfolder?: string): Promise<string[]> {
    const searchPath = subfolder 
      ? path.join(this.vaultPath, subfolder)
      : this.vaultPath;
    
    try {
      const files = await fs.readdir(searchPath, { recursive: true });
      return files
        .filter(f => f.endsWith('.md'))
        .map(f => subfolder ? path.join(subfolder, f) : f);
    } catch (e) {
      return [];
    }
  }

  /**
   * Busca notas que contengan un texto
   */
  async searchNotes(query: string): Promise<string[]> {
    const allNotes = await this.listNotes();
    const matches: string[] = [];
    const lowerQuery = query.toLowerCase();
    
    for (const notePath of allNotes) {
      try {
        const note = await this.readNote(notePath);
        const text = (note.content + ' ' + JSON.stringify(note.data)).toLowerCase();
        
        if (text.includes(lowerQuery) || notePath.toLowerCase().includes(lowerQuery)) {
          matches.push(notePath);
        }
      } catch (e) {
        // Ignorar errores de lectura
      }
    }
    
    return matches;
  }

  /**
    * Obtiene o crea el daily note del día
    */
   async getDailyNote(date?: Date): Promise<{ path: string; content: string; data: NoteMetadata }> {
    const targetDate = date || new Date();
    const dateStr = targetDate.toISOString().split('T')[0];
    
    const relativePath = this.resolver.daily(dateStr);
    const fullPath = path.join(this.vaultPath, relativePath);
    
    try {
      // Intentar leer
      const note = await this.readNote(relativePath);
      return { path: relativePath, content: note.content, data: note.data };
    } catch (e) {
      // Crear nuevo daily note
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      
      const initialContent = `# ${dateStr}\n\n## ✅ Hecho\n\n## 🔄 En Progreso\n\n## 📝 Notas\n\n`;
      await this.writeNote(relativePath, initialContent, { 
        date: dateStr,
        type: 'daily'
      });
      
      return { path: relativePath, content: initialContent, data: { date: dateStr, type: 'daily' } };
    }
  }

  /**
    * Crea un tracker para una tarea Azure
    */
   async createTracker(azureId: string, content: string, metadata?: NoteMetadata): Promise<string> {
    const trackerPath = this.resolver.tracking(azureId);
    const fullPath = path.join(this.vaultPath, trackerPath);
    
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await this.writeNote(trackerPath, content, {
      azure_id: azureId,
      created_at: new Date().toISOString(),
      ...metadata
    });
    
    return trackerPath;
  }

  /**
    * Actualiza el tracker de una tarea
    */
   async updateTracker(azureId: string, updates: { content?: string; metadata?: NoteMetadata }): Promise<void> {
    const trackerPath = this.resolver.tracking(azureId);
    const note = await this.readNote(trackerPath);
    
    const newContent = updates.content !== undefined ? updates.content : note.content;
    const newData = updates.metadata ? { ...note.data, ...updates.metadata } : note.data;
    
    await this.writeNote(trackerPath, newContent, newData);
  }

  /**
   * Verifica si existe una nota
   */
  async exists(relativePath: string): Promise<boolean> {
    try {
      await fs.access(path.join(this.vaultPath, relativePath));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Obtiene el path completo del vault
   */
  getVaultPath(): string {
    return this.vaultPath;
  }

  /**
   * Obtiene el resolver de paths
   */
  getPathResolver(): PathResolver {
    return this.resolver;
  }
}
