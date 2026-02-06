import * as fs from 'fs/promises';
import * as path from 'path';
import matter from 'gray-matter';

export interface TemplateDefinition {
  name: string;
  description: string;
  triggers: string[];
  language: 'es' | 'en';
  content: string;
}

export class TemplateEngine {
  private templatesPath: string;
  private templates: Map<string, TemplateDefinition> = new Map();

  constructor(vaultPath: string) {
    this.templatesPath = path.join(vaultPath, 'templates');
  }

  /**
   * Carga todos los templates disponibles
   */
  async loadTemplates(): Promise<void> {
    this.templates.clear();
    
    try {
      const files = await fs.readdir(this.templatesPath);
      const templateFiles = files.filter(f => f.endsWith('.md'));
      
      for (const file of templateFiles) {
        await this.loadTemplate(file);
      }
    } catch (e) {
      // Si no existe la carpeta templates, se ignora
    }
  }

  /**
   * Carga un template específico
   */
  private async loadTemplate(filename: string): Promise<void> {
    const filePath = path.join(this.templatesPath, filename);
    const content = await fs.readFile(filePath, 'utf-8');
    const parsed = matter(content);
    
    const template: TemplateDefinition = {
      name: parsed.data.name || filename.replace('.md', ''),
      description: parsed.data.description || '',
      triggers: parsed.data.triggers || [],
      language: parsed.data.language || 'es',
      content: parsed.content
    };
    
    this.templates.set(template.name, template);
  }

  /**
   * Aplica un template con variables
   */
  applyTemplate(templateName: string, variables: Record<string, string>): string {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Template "${templateName}" no encontrado`);
    }
    
    let result = template.content;
    
    // Reemplazar placeholders {{variable}}
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value || '');
    }
    
    // Limpiar placeholders no reemplazados
    result = result.replace(/{{[^{}]+}}/g, '');
    
    return result;
  }

  /**
   * Encuentra el mejor template según el contenido
   */
  findBestTemplate(content: string): TemplateDefinition | null {
    const lowerContent = content.toLowerCase();
    let bestMatch: TemplateDefinition | null = null;
    let maxScore = 0;
    
    for (const template of this.templates.values()) {
      let score = 0;
      
      // Verificar triggers
      for (const trigger of template.triggers) {
        if (lowerContent.includes(trigger.toLowerCase())) {
          score += 1;
        }
      }
      
      // Si hay Azure ID, priorizar ciertos templates
      if (this.hasAzureId(content)) {
        if (['azure-delivery', 'task-tracker'].includes(template.name)) {
          score += 2;
        }
      }
      
      // Si menciona PR, priorizar templates de PR
      if (lowerContent.includes('pr') || lowerContent.includes('pull request')) {
        if (template.name.includes('pr')) {
          score += 2;
        }
      }
      
      if (score > maxScore) {
        maxScore = score;
        bestMatch = template;
      }
    }
    
    return bestMatch;
  }

  /**
   * Extrae variables comunes del contenido
   */
  extractVariables(content: string): Record<string, string> {
    const variables: Record<string, string> = {};
    
    // Extraer Azure IDs (28xxx)
    const azureIds = this.extractAzureIds(content);
    if (azureIds.length > 0) {
      variables.azure_id = azureIds[0];
      variables.azure_ids = azureIds.join(', ');
    }
    
    // Extraer versiones (vX.Y.Z)
    const versions = this.extractVersions(content);
    if (versions.length > 0) {
      variables.version = versions[0];
      variables.tag_version = versions[0];
    }
    
    // Extraer repositorios (CKC-XXX)
    const repos = this.extractRepositories(content);
    if (repos.length > 0) {
      variables.repositorio = repos[0];
      variables.repositorios = repos.join(', ');
    }
    
    // Extraer URLs
    const urls = this.extractUrls(content);
    if (urls.length > 0) {
      variables.pr_link = urls.find(u => u.includes('pullrequest')) || urls[0];
      variables.azure_link = urls.find(u => u.includes('azure')) || '';
      variables.wiki_link = urls.find(u => u.includes('wiki')) || '';
    }
    
    // Fechas
    variables.fecha = new Date().toLocaleDateString('es-ES');
    variables.fecha_generacion = new Date().toISOString();
    
    // Título (primera línea o resumen)
    const firstLine = content.split('\n')[0].substring(0, 50);
    variables.titulo = firstLine;
    variables.titulo_corto = firstLine.substring(0, 30);
    
    return variables;
  }

  /**
   * Crea un nuevo template
   */
  async createTemplate(name: string, definition: Omit<TemplateDefinition, 'content'> & { content: string }): Promise<void> {
    const filename = `${name}.md`;
    const filePath = path.join(this.templatesPath, filename);
    
    await fs.mkdir(this.templatesPath, { recursive: true });
    
    const frontmatter = {
      name: definition.name,
      description: definition.description,
      triggers: definition.triggers,
      language: definition.language
    };
    
    const content = matter.stringify(definition.content, frontmatter);
    await fs.writeFile(filePath, content, 'utf-8');
    
    // Recargar templates
    await this.loadTemplate(filename);
  }

  /**
   * Lista todos los templates disponibles
   */
  listTemplates(): Array<{ name: string; description: string; language: string }> {
    return Array.from(this.templates.values()).map(t => ({
      name: t.name,
      description: t.description,
      language: t.language
    }));
  }

  /**
   * Verifica si existe un template
   */
  hasTemplate(name: string): boolean {
    return this.templates.has(name);
  }

  // Helpers privados
  private hasAzureId(content: string): boolean {
    return /\b2\d{4,5}\b/.test(content);
  }

  private extractAzureIds(content: string): string[] {
    const matches = content.match(/\b2\d{4,5}\b/g);
    return matches ? [...new Set(matches)] : [];
  }

  private extractVersions(content: string): string[] {
    const matches = content.match(/v\d+\.\d+\.\d+/g);
    return matches ? [...new Set(matches)] : [];
  }

  private extractRepositories(content: string): string[] {
    const matches = content.match(/CKC[_-][A-Z]+/gi);
    return matches ? [...new Set(matches)] : [];
  }

  private extractUrls(content: string): string[] {
    const matches = content.match(/https?:\/\/[^\s]+/g);
    return matches || [];
  }
}
