import * as path from 'path';
import * as fs from 'fs/promises';
import { glob } from 'glob';
import matter from 'gray-matter';
import * as lancedb from '@lancedb/lancedb';

// Usar transformers.js para embeddings locales
let embeddingPipeline: any = null;

export interface SearchResult {
  path: string;
  content: string;
  score: number;
  metadata: Record<string, any>;
}

interface NoteEmbedding {
  path: string;
  content_preview: string;
  vector: number[];
  metadata: string;
}

export class VaultSearch {
  private vaultPath: string;
  private dbPath: string;
  private isInitialized: boolean = false;
  private db: any = null;
  private table: any = null;

  constructor(vaultPath: string) {
    this.vaultPath = vaultPath;
    // Usar ruta centralizada como gemini-obsidian
    // En Windows: C:\Users\Usuario\.opencode-obsidian\lancedb
    // En Unix: ~/.opencode-obsidian/lancedb
    const homeDir = process.env.HOME || process.env.USERPROFILE || '.';
    this.dbPath = path.join(homeDir, '.opencode-obsidian', 'lancedb');
  }

  /**
   * Inicializa el sistema de búsqueda con LanceDB
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Crear directorio de la base de datos si no existe
      await fs.mkdir(this.dbPath, { recursive: true });
      
      // Inicializar embeddings
      const { pipeline } = await import('@xenova/transformers');
      embeddingPipeline = await pipeline(
        'feature-extraction',
        'Xenova/all-MiniLM-L6-v2',
        { quantized: true }
      );

      // Conectar a LanceDB
      this.db = await lancedb.connect(this.dbPath);
      
      // Verificar si la tabla existe
      const tableNames = await this.db.tableNames();
      if (tableNames.includes('vault_embeddings')) {
        this.table = await this.db.openTable('vault_embeddings');
        console.log('RAG: Conectado a tabla existente en LanceDB');
      }

      this.isInitialized = true;
      console.log('RAG: Sistema de búsqueda inicializado con LanceDB');
    } catch (e) {
      console.error('RAG: Error al inicializar:', e);
      this.isInitialized = false;
    }
  }

  /**
   * Genera embedding para un texto
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    if (!embeddingPipeline) {
      throw new Error('Sistema de embeddings no inicializado');
    }

    const output = await embeddingPipeline(text, {
      pooling: 'mean',
      normalize: true,
    });
    
    return Array.from(output.data);
  }

  /**
   * Indexa todas las notas del vault usando LanceDB
   */
  async indexVault(): Promise<{ indexed: number; errors: number }> {
    await this.initialize();
    
    const allNotes = await glob('**/*.md', { cwd: this.vaultPath });
    const data: NoteEmbedding[] = [];
    let errorCount = 0;

    console.log(`RAG: Indexando ${allNotes.length} notas en LanceDB...`);

    for (const notePath of allNotes) {
      try {
        const fullPath = path.join(this.vaultPath, notePath);
        const content = await fs.readFile(fullPath, 'utf-8');
        const parsed = matter(content);
        
        // Generar embedding
        const textToEmbed = `${parsed.content} ${JSON.stringify(parsed.data)}`.substring(0, 1000);
        const vector = await this.generateEmbedding(textToEmbed);
        
        data.push({
          path: notePath,
          content_preview: parsed.content.substring(0, 500),
          vector,
          metadata: JSON.stringify(parsed.data)
        });
      } catch (e) {
        errorCount++;
        console.error(`Error indexando ${notePath}:`, e);
      }
    }

    // Crear o recrear tabla en LanceDB
    try {
      // Eliminar tabla anterior si existe
      const tableNames = await this.db.tableNames();
      if (tableNames.includes('vault_embeddings')) {
        await this.db.dropTable('vault_embeddings');
      }
      
      // Crear nueva tabla
      this.table = await this.db.createTable('vault_embeddings', data);
      console.log(`RAG: Indexación completa. ${data.length} notas en LanceDB`);
    } catch (e) {
      console.error('RAG: Error creando tabla:', e);
      throw e;
    }
    
    return { indexed: data.length, errors: errorCount };
  }

  /**
   * Agrega una sola nota al índice (sin reindexar todo)
   */
  async addNoteToIndex(notePath: string): Promise<boolean> {
    await this.initialize();

    try {
      const fullPath = path.join(this.vaultPath, notePath);
      const content = await fs.readFile(fullPath, 'utf-8');
      const parsed = matter(content);

      // Generar embedding
      const textToEmbed = `${parsed.content} ${JSON.stringify(parsed.data)}`.substring(0, 1000);
      const vector = await this.generateEmbedding(textToEmbed);

      const newData: NoteEmbedding = {
        path: notePath,
        content_preview: parsed.content.substring(0, 500),
        vector,
        metadata: JSON.stringify(parsed.data)
      };

      // Si la tabla no existe, crearla
      if (!this.table) {
        const tableNames = await this.db.tableNames();
        if (tableNames.includes('vault_embeddings')) {
          this.table = await this.db.openTable('vault_embeddings');
        } else {
          this.table = await this.db.createTable('vault_embeddings', [newData]);
          return true;
        }
      }

      // Agregar a tabla existente
      await this.table.add([newData]);
      console.log(`RAG: Nota agregada al índice: ${notePath}`);
      return true;
    } catch (e) {
      console.error(`RAG: Error agregando nota ${notePath}:`, e);
      return false;
    }
  }

  /**
   * Busca notas semánticamente usando LanceDB
   */
  async search(query: string, limit: number = 5): Promise<SearchResult[]> {
    await this.initialize();

    if (!this.table) {
      // Intentar abrir tabla existente
      const tableNames = await this.db.tableNames();
      if (tableNames.includes('vault_embeddings')) {
        this.table = await this.db.openTable('vault_embeddings');
      } else {
        throw new Error('No hay índice. Ejecuta /index primero.');
      }
    }

    try {
      // Generar embedding de la query
      const queryEmbedding = await this.generateEmbedding(query);

      // Buscar en LanceDB usando similitud de vectores
      const results = await this.table
        .vectorSearch(queryEmbedding)
        .limit(limit)
        .execute();

      // Formatear resultados
      return results.map((row: any) => ({
        path: row.path,
        content: row.content_preview,
        score: row._distance ? 1 - row._distance : 0.5, // Convertir distancia a score
        metadata: JSON.parse(row.metadata || '{}')
      }));
    } catch (e) {
      console.error('RAG: Error en búsqueda:', e);
      // Fallback a búsqueda simple
      return this.fallbackSearch(query, limit);
    }
  }

  /**
   * Búsqueda fallback cuando RAG no está disponible
   */
  private async fallbackSearch(query: string, limit: number): Promise<SearchResult[]> {
    const allNotes = await glob('**/*.md', { cwd: this.vaultPath });
    const results: SearchResult[] = [];
    const lowerQuery = query.toLowerCase();
    
    for (const notePath of allNotes.slice(0, 50)) {
      try {
        const fullPath = path.join(this.vaultPath, notePath);
        const content = await fs.readFile(fullPath, 'utf-8');
        const parsed = matter(content);
        
        const text = (parsed.content + ' ' + JSON.stringify(parsed.data)).toLowerCase();
        
        // Calcular score simple
        const queryWords = lowerQuery.split(' ');
        let matches = 0;
        queryWords.forEach(word => {
          if (text.includes(word)) matches++;
        });
        
        const score = matches / queryWords.length;
        
        if (score > 0.3) {
          results.push({
            path: notePath,
            content: parsed.content.substring(0, 500),
            score,
            metadata: parsed.data
          });
        }
      } catch (e) {
        // Ignorar errores
      }
    }
    
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Verifica si el índice existe
   */
  async isIndexValid(): Promise<boolean> {
    try {
      const tableNames = await this.db.tableNames();
      return tableNames.includes('vault_embeddings');
    } catch {
      return false;
    }
  }
}
