---
name: opencode-obsidian
description: Intelligent Obsidian vault integration with automatic note detection, RAG search, and smart templates. Use when the user mentions Azure tasks, git tags, daily standups, tracking work, or writes any text containing Azure IDs, deploy commands, or task descriptions. Automatically detects and captures notes without explicit commands. Inspired by gemini-obsidian.
---

# opencode-obsidian

Sistema inteligente de gestión de conocimiento que transforma notas desordenadas en entregables estructurados - **sin necesidad de comandos explícitos**.

> **Nota:** Este proyecto está inspirado en [gemini-obsidian](https://github.com/thoreinstein/gemini-obsidian) de thoreinstein, adaptado y extendido para funcionar con Opencode.

## 🧠 Detección Inteligente (Automático)

**NO necesitas escribir comandos**. El sistema detecta automáticamente cuando escribes algo que debería guardarse:

### Patrones Detectados Automáticamente:

1. **Azure IDs** (28xxx)
   - Ej: "Tengo que revisar el bug 28416"
   - → Detecta automáticamente y pregunta si guardar

2. **Git Tags de Deploy**
   - Ej: "git tag -a v2.8.3 -m '28416 fix'"
   - → Valida que tenga Azure ID y actualiza tracker

3. **Comandos Técnicos**
   - Ej: "docker-compose up -d", "git rebase -i HEAD~3"
   - → Guarda en recursos/ automáticamente

4. **URLs de PRs/Wikis**
   - Ej: "https://dev.azure.com/.../pullrequest/12345"
   - → Extrae información y organiza

5. **Tareas Pendientes**
   - Ej: "Debo recordar configurar el pipeline", "Aprender sobre Redis"
   - → Detecta intención y sugiere guardar

### Comportamiento:

Cuando detecto uno de estos patrones en tu mensaje:

```
Tú: "Tengo que revisar el bug 28416 en el gateway"
Yo: "📝 Detecté una tarea de Azure (28416). ¿Quieres que la capture en tu vault?"
     [Sí] → Guarda automáticamente y genera templates
     [No] → Ignora y sigue conversación normal
```

## Capacidades Principales

### 1. Captura de Notas (Automática)
- Detecta Azure IDs (28xxx) y organiza automáticamente
- Identifica comandos técnicos y los guarda en recursos
- Genera múltiples templates según el contenido
- Soporte bilingüe (ES/EN)

### 2. Templates Predefinidos
- **azure-delivery**: Reporte formal para Azure DevOps
- **task-tracker**: Seguimiento compacto de tareas
- **ai-context**: Prompt estructurado para editores IA
- **daily-standup**: Resumen para daily meetings
- **bitbucket-pr-standard**: PR completo para features
- **bitbucket-pr-release**: PR simple para cherry-picks
- **confluence-release**: Documento de release

### 3. Gestión Inteligente
- Detecta git tags de deploy y actualiza trackers
- Genera daily summaries automáticos
- Búsqueda semántica en todas las notas
- Categorización automática (bug, feature, refactor, etc.)

## Estructura del Vault

```
vault/
├── inbox/           # Brain dump (captura inicial)
├── entregas/        # Templates Azure terminados
├── tracking/        # Seguimiento de tareas
├── daily/           # Daily notes
├── recursos/        # Comandos, snippets, aprendizajes
├── proyectos/       # Contextos para IA
└── templates/       # Templates personalizados
```

## Workflows Comunes

### Workflow 1: Capturar Pensamiento
```
Usuario: "Tengo que revisar el bug 28416 en el gateway"
→ MCP detecta Azure ID
→ Guarda en inbox/
→ Sugerencia: "¿Aplicar template de entrega?"
→ Usuario confirma
→ Genera entrega en entregas/28416-gateway-fix.md
```

### Workflow 2: Generar tracker
```
Usuario: "quiero hacer seguimiento de la tarea 28845"
→ MCP busca notas relacionadas
→ Genera tracker en tracking/28845.md
→ Links automáticos a entrega, PR, etc.
```

### Workflow 3: Contexto para IA
```
Usuario: "necesito contexto de la tarea 28248 para el editor"
→ MCP compila información de múltiples notas
→ Genera prompt en proyectos/28248-context.md
→ Listo para copiar al editor
```

## Uso de Templates

### Aplicar Template Existente
```
obsidian_apply_template
- note_path: "inbox/idea.md"
- template: "azure-delivery"
```

### Variables Automáticas
Los templates pueden usar:
- `{{azure_id}}`, `{{version}}`, `{{tag_version}}`
- `{{repositorio}}`, `{{rama}}`
- `{{pr_link}}`, `{{azure_link}}`, `{{wiki_link}}`
- `{{fecha}}`, `{{fecha_generacion}}`
- `{{titulo}}`, `{{titulo_corto}}`

## Configuración

### Variables de Entorno
```bash
export OBSIDIAN_VAULT_PATH="/path/to/vault"
```

### Configuración de MCP (opencode.json)
```json
{
  "mcp": {
    "opencode-obsidian": {
      "type": "local",
      "command": ["node", "/path/to/opencode-obsidian/mcp-server/dist/index.js"],
      "enabled": true
    }
  }
}
```

## Comandos Disponibles

### Ayuda
- `>oo help` - Mostrar ayuda y lista de comandos

### Captura y Gestión
- `>oo cap "texto"` - Capture - Capturar nota
  - Ej: `>oo cap "Tengo que revisar el bug 28416"`
  - Ej: `>oo cap -f meeting_notes.txt` (desde archivo)

- `>oo find "query"` - Find - Buscar en vault
  - Ej: `>oo find "comando docker"`

- `>oo read "ruta"` - Read - Leer nota específica
  - Ej: `>oo read "tracking/28416.md"`

- `>oo task 28416` - Task - Ver o actualizar tracker
  - Ej: `>oo task 28416` (muestra tracker)
  - Ej: `>oo task 28416 status "🟢 PROD" tag v2.8.3` (actualiza)

### Daily y Resúmenes
- `>oo daily` - Daily - Ver resumen de ayer
  - Ej: `>oo daily`
  - Ej: `>oo daily date "2024-02-01"` (fecha específica)

### Búsqueda y RAG
- `>oo idx` - Index - Indexar vault para búsqueda semántica
  - Ej: `>oo idx`

- `>oo ask "pregunta"` - Ask - Preguntar a tu vault
  - Ej: `>oo ask "¿cómo solucioné el error 403?"`
  - Ej: `>oo ask "qué comandos útiles tengo" limit 3`

### Deploys
- `>oo deploy "tags"` - Deploy - Registrar deploy tags
  - Ej: `>oo deploy "git tag -a v2.8.3 -m '28416 fix'"`

- `>oo deploys` - Deploys - Listar deploy tags registrados
  - Ej: `>oo deploys`

### Utilidades
- `>oo tpl` - Templates - Listar templates disponibles
  - Ej: `>oo tpl`

### Comandos Legacy (también disponibles)
- `obsidian_capture_note`
- `obsidian_list_templates`
- `obsidian_search_vault`
- `obsidian_get_daily_summary`
- `obsidian_update_task_progress`
- `obsidian_read_note`
- `obsidian_set_vault`

## Detección Automática

El sistema detecta automáticamente:
- **Azure IDs**: `28416`, `28976`, `2XXXX`
- **Versiones**: `v2.8.3`, `v21.5.7`
- **Repositorios**: `CKC-API-GATEWAY`, `CKC_WEBSITE`
- **URLs**: `https://dev.azure.com/...`, PRs
- **Git tags**: `git tag -a vX.Y.Z -m "mensaje"`

## Crear Templates Personalizados

1. Crear archivo en `vault/templates/mi-template.md`
2. Añadir frontmatter con metadatos
3. Escribir contenido con placeholders
4. Guardar - disponible inmediatamente

## Referencias

- [Guía de Templates](references/templates-guide.md)
- [Estructura del Vault](references/vault-structure.md)
