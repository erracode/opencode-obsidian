---
name: opencode-obsidian
description: Comprehensive Obsidian vault integration with RAG, automatic organization, and custom templates. Use when working with an Obsidian vault for note-taking, task tracking, Azure DevOps integration, and document generation. Triggers on mentions of vault, notes, templates, Azure tasks, daily standups, and deploy tracking.
---

# opencode-obsidian

Sistema completo de gestión de conocimiento que transforma notas desordenadas en entregables estructurados.

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

## Configuración (XDG)

```
~/.config/opencode-obsidian/
├── config.json      # Configuración principal

~/.local/share/opencode-obsidian/
├── lancedb/         # Índice RAG
```

### CLI Setup

```bash
# Configurar con wizard interactivo
oo-setup setup

# Ver estado actual
oo-setup status

# Modificar configuración
oo-setup config --vault "C:/ruta/al/vault"
```

### Configuración de MCP (opencode.json)

```json
{
  "mcp": {
    "opencode-obsidian": {
      "command": ["node", "/path/to/opencode-obsidian/mcp-server/dist/index.js"],
      "enabled": true
    }
  }
}
```

## Comandos Disponibles

### Comandos Cortos (>oo)

| Comando | Descripción |
|---------|-------------|
| `>oo status` | Ver configuración y estado actual |
| `>oo cap` | Capturar nota |
| `>oo find` | Buscar en vault |
| `>oo task` | Ver/actualizar tarea |
| `>oo daily` | Resumen del día |
| `>oo tpl` | Listar templates |
| `>oo idx` | Indexar para RAG |
| `>oo ask` | Preguntar al vault (RAG) |
| `>oo help` | Mostrar ayuda |

### Comandos MCP Completos

- `obsidian_capture_note` - Capturar nota desordenada
- `obsidian_apply_template` - Aplicar template a nota
- `obsidian_search_vault` - Búsqueda semántica
- `obsidian_get_daily_summary` - Resumen del día anterior
- `obsidian_list_deploy_tags` - Listar tags de deploy
- `obsidian_update_task_progress` - Actualizar progreso de tarea
- `obsidian_list_templates` - Listar templates disponibles
- `obsidian_read_note` - Leer nota específica
- `obsidian_set_vault` - Configurar ruta del vault

### Comandos Azure DevOps

- `azure_get_my_assignments` - Ver tareas asignadas
- `azure_prepare_delivery` - Preparar documento de entrega
- `azure_publish_comment` - Publicar comentario y resolver
- `azure_create_dev_task` - Crear tarea DEV hija
- `azure_update_hours` - Actualizar horas de trabajo
- `azure_test_connection` - Validar conexión y PAT

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

### Workflow 4: Verificar Estado
```
Usuario: ">oo status"
→ Muestra vault configurado
→ Muestra estado de Azure PAT
→ Muestra estado de RAG
→ Muestra templates disponibles
```

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

## Variables de Template

Los templates pueden usar:
- `{{azure_id}}`, `{{version}}`, `{{tag_version}}`
- `{{repositorio}}`, `{{rama}}`
- `{{pr_link}}`, `{{azure_link}}`, `{{wiki_link}}`
- `{{fecha}}`, `{{fecha_generacion}}`
- `{{titulo}}`, `{{titulo_corto}}`

## Referencias

- [Guía de Templates](references/templates-guide.md)
- [Estructura del Vault](references/vault-structure.md)
