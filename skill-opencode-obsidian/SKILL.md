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
├── proyectos/       # Contextos de IA
└── templates/       # Templates personalizados
```

## Workflows Comunes

### Workflow 1: Capturar Pensamiento
```
Usuario: "Tengo que revisar el bug 28416 en el gateway"
→ MCP detecta Azure ID
→ Guarda en inbox/
→ Genera entrega/28416-gateway.md
→ Genera tracking/28416.md
```

### Workflow 2: Registrar Deploy
```
Usuario pega tags de git
→ MCP extrae repositorios y versiones
→ Actualiza tracking/XXXX.md con nuevo tag
→ Cambia estado a PROD
```

### Workflow 3: Daily Summary
```
Usuario: "Qué hice ayer?"
→ MCP busca tareas completadas
→ Detecta deploys del día anterior
→ Genera resumen formateado
```

### Workflow 4: Crear Template Personalizado
```
Usuario: "Crear template para incidentes post-mortem"
→ Pregunta: nombre, secciones, variables
→ Crea vault/templates/incident-postmortem.md
→ Disponible inmediatamente
```

### Workflow 5: Búsqueda Semántica (RAG)
```
Usuario: "-q \"cómo solucioné el error 403\""
→ Sistema busca semánticamente en todas las notas
→ Encuentra notas relacionadas con "error 403", "gateway", "OTP"
→ Muestra resultados ordenados por relevancia
```

### Workflow 6: Daily Summary Inteligente
```
Usuario: "/daily"
→ Sistema analiza todas las notas del día anterior
→ Detecta tareas completadas, deploys, aprendizajes
→ Genera resumen formateado para standup
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
      "command": "node",
      "args": ["/path/to/opencode-obsidian/mcp-server/dist/index.js"],
      "enabled": true
    }
  }
}
```

## Comandos Cortos (con prefijo -)

**Usa estos comandos para trabajar rápido:**

### Ayuda
- `-?` - Mostrar ayuda y lista de comandos disponibles

### Captura y Gestión
- `-c "texto"` - C)apture - Capturar nota rápidamente
  - Ej: `-c "Tengo que revisar el bug 28416"`

- `-f "query"` - F)ind - Buscar en vault
  - Ej: `-f "comando docker"`

- `-t 28416` - T)ask - Ver o actualizar tracker de tarea
  - Ej: `-t 28416` (muestra tracker)
  - Ej: `-t 28416 status:"🟢 PROD" tag:v2.8.3` (actualiza)

### Daily y Resúmenes
- `-d` - D)aily - Ver resumen de ayer
  - Ej: `-d`
  - Ej: `-d date:"2024-02-01"` (fecha específica)

### Búsqueda y RAG
- `-idx` - ID)X - Indexar vault para búsqueda semántica
  - Ej: `-idx`

- `-q "pregunta"` - Q)uestion - Preguntar a tu vault usando IA
  - Ej: `-q "¿cómo solucioné el error 403?"`
  - Ej: `-q "qué comandos útiles tengo" limit:3`

### Utilidades
- `-tpl` - TePLates - Listar templates disponibles
  - Ej: `-tpl`

## Comandos Completos (Alternativos)

- `obsidian_capture_note` - Capturar nota desordenada
- `obsidian_apply_template` - Aplicar template a nota
- `obsidian_search_vault` - Búsqueda semántica
- `obsidian_get_daily_summary` - Resumen del día anterior
- `obsidian_list_deploy_tags` - Listar tags de deploy
- `obsidian_update_task_progress` - Actualizar progreso de tarea
- `obsidian_list_templates` - Listar templates disponibles
- `obsidian_read_note` - Leer nota específica

## Detección Automática

El sistema detecta automáticamente:
- **Azure IDs**: `28416`, `28976` (formato 2xxxx)
- **Versiones**: `v1.62.0`, `v21.5.7`
- **Repositorios**: `CKC-API-GATEWAY`, `CKC_WEBSITE`
- **URLs**: PRs, Azure DevOps, wikis
- **Git tags**: `git tag -a vX.Y.Z -m "mensaje"`

## Crear Templates Personalizados

1. Crear archivo en `vault/templates/mi-template.md`
2. Frontmatter obligatorio:
   ```yaml
   ---
   name: mi-template
   description: Descripción del template
   triggers: ["keyword1", "keyword2"]
   language: es
   ---
   ```
3. Usar placeholders: `{{variable}}`
4. Disponible inmediatamente vía `obsidian_apply_template`

## Referencias

- [Guía de Templates](references/templates-guide.md)
- [Estructura del Vault](references/vault-structure.md)
