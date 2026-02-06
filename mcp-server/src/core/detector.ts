export interface DetectedContent {
  azureIds: string[];
  versions: string[];
  repositories: string[];
  urls: string[];
  gitTags: Array<{ repo: string; tag: string; message: string }>;
  category: string;
  priority: 'high' | 'medium' | 'low';
}

export class ContentDetector {
  /**
   * Analiza el contenido y extrae toda la información relevante
   */
  analyze(content: string): DetectedContent {
    const lowerContent = content.toLowerCase();
    
    return {
      azureIds: this.extractAzureIds(content),
      versions: this.extractVersions(content),
      repositories: this.extractRepositories(content),
      urls: this.extractUrls(content),
      gitTags: this.extractGitTags(content),
      category: this.detectCategory(lowerContent),
      priority: this.detectPriority(lowerContent)
    };
  }

  /**
   * Extrae Azure IDs (formato: 28xxx)
   */
  extractAzureIds(content: string): string[] {
    const matches = content.match(/\b2\d{4,5}\b/g);
    return matches ? [...new Set(matches)] : [];
  }

  /**
   * Extrae versiones semánticas (vX.Y.Z)
   */
  extractVersions(content: string): string[] {
    const matches = content.match(/v\d+\.\d+\.\d+/g);
    return matches ? [...new Set(matches)] : [];
  }

  /**
   * Extrae nombres de repositorios (CKC-XXX o CKC_XXX)
   */
  extractRepositories(content: string): string[] {
    const matches = content.match(/CKC[_-][A-Z][A-Z0-9_-]*/gi);
    return matches ? [...new Set(matches.map(r => r.toUpperCase()))] : [];
  }

  /**
   * Extrae URLs
   */
  extractUrls(content: string): string[] {
    const matches = content.match(/https?:\/\/[^\s\)]+/g);
    return matches ? [...new Set(matches)] : [];
  }

  /**
   * Extrae tags de git con sus mensajes
   */
  extractGitTags(content: string): Array<{ repo: string; tag: string; message: string }> {
    const tags: Array<{ repo: string; tag: string; message: string }> = [];
    
    // Patrón: git tag -a vX.Y.Z -m "mensaje"
    const tagRegex = /git tag -a (v[\d\.]+) -m "([^"]+)"/gi;
    let match;
    
    while ((match = tagRegex.exec(content)) !== null) {
      // Buscar el repositorio antes del tag (línea que empieza con #)
      const lines = content.substring(0, match.index).split('\n');
      let repo = 'unknown';
      
      for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i].trim();
        if (line.startsWith('#')) {
          const repoMatch = line.match(/#\s*(CKC[_-][A-Z][A-Z0-9_-]*)/i);
          if (repoMatch) {
            repo = repoMatch[1].toUpperCase();
            break;
          }
        }
      }
      
      tags.push({
        repo,
        tag: match[1],
        message: match[2]
      });
    }
    
    return tags;
  }

  /**
   * Detecta la categoría del contenido
   */
  detectCategory(lowerContent: string): string {
    // Palabras clave para cada categoría
    const categories: Record<string, string[]> = {
      'bug': ['bug', 'error', 'fix', 'issue', 'problema', 'fallo', 'corregir'],
      'feature': ['feature', 'nueva', 'implementar', 'agregar', 'añadir', 'crear', 'desarrollar'],
      'refactor': ['refactor', 'mejorar', 'optimizar', 'limpiar', 'reorganizar'],
      'docs': ['documentar', 'wiki', 'documentación', 'readme', 'docs'],
      'deploy': ['deploy', 'release', 'tag', 'producción', 'prod'],
      'testing': ['test', 'testing', 'prueba', 'qa', 'validar'],
      'learning': ['aprender', 'estudiar', 'investigar', 'research', 'setup']
    };
    
    let bestCategory = 'note';
    let maxScore = 0;
    
    for (const [category, keywords] of Object.entries(categories)) {
      const score = keywords.filter(k => lowerContent.includes(k)).length;
      if (score > maxScore) {
        maxScore = score;
        bestCategory = category;
      }
    }
    
    return bestCategory;
  }

  /**
   * Detecta la prioridad del contenido
   */
  detectPriority(lowerContent: string): 'high' | 'medium' | 'low' {
    const highPriority = ['urgente', 'critical', 'blocker', 'bloqueante', 'hotfix', 'producción', 'incidente'];
    const mediumPriority = ['importante', 'prioridad', 'feature', 'mejora'];
    
    if (highPriority.some(w => lowerContent.includes(w))) {
      return 'high';
    }
    
    if (mediumPriority.some(w => lowerContent.includes(w))) {
      return 'medium';
    }
    
    return 'low';
  }

  /**
   * Detecta si el contenido es un comando técnico
   */
  isTechnicalCommand(content: string): boolean {
    const commandPatterns = [
      /^git\s+/,
      /^docker/,
      /^npm\s+/,
      /^yarn\s+/,
      /^bun\s+/,
      /^curl\s+/,
      /^ssh\s+/,
      /^kubectl/,
      /^terraform/
    ];
    
    return commandPatterns.some(pattern => pattern.test(content.trim()));
  }

  /**
   * Detecta si es una tarea de Azure
   */
  isAzureTask(content: string): boolean {
    return /\b2\d{4,5}\b/.test(content);
  }

  /**
   * Detecta si es un deploy
   */
  isDeploy(content: string): boolean {
    return /git tag -a/.test(content) || /deploy/i.test(content);
  }

  /**
   * Extrae el título o descripción corta
   */
  extractTitle(content: string): string {
    // Primera línea no vacía
    const lines = content.split('\n').filter(l => l.trim());
    if (lines.length === 0) return 'Sin título';
    
    const firstLine = lines[0].trim();
    
    // Limpiar caracteres de markdown
    return firstLine
      .replace(/^#+\s*/, '')
      .replace(/\*\*/g, '')
      .substring(0, 60);
  }

  /**
   * Genera un slug para el nombre de archivo
   */
  generateSlug(content: string): string {
    const title = this.extractTitle(content);
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 40);
  }
}
