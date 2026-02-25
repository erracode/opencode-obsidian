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

## Configuración

### Archivos de Configuración (XDG)

```
~/.config/opencode-obsidian/
├── config.json      # Configuración principal

~/.local/share/opencode-obsidian/
├── lancedb/         # Índice RAG

opencode-obsidian/mcp-server/
├── .env.local       # Azure PAT (IMPORTANTE)
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

### Azure PAT (.env.local)

El archivo `.env.local` debe estar en `mcp-server/.env.local`:

```bash
AZURE_PAT=tu_personal_access_token
AZURE_ORG=cinemarkintl
AZURE_PROJECT=Core Backend
```

## Comandos Disponibles

### Comandos Cortos (>oo)

| Comando | Descripción |
|---------|-------------|
| `>oo status` | Ver configuración y estado actual |
| `>oo help` | Mostrar ayuda completa |
| `>oo cap "texto"` | Capturar nota |
| `>oo find "query"` | Buscar en vault |
| `>oo task <id>` | Ver/actualizar tracker |
| `>oo read "path"` | Leer nota específica |
| `>oo daily` | Resumen de ayer |
| `>oo idx` | Indexar vault para RAG |
| `>oo ask "pregunta"` | Preguntar al vault (RAG) |
| `>oo tpl` | Listar templates |
| `>oo create <tpl> <id>` | Crear desde template |
| `>oo deploy "git tag..."` | Registrar deploy |
| `>oo deploys` | Listar deploys |

### Comandos Azure DevOps

| Comando | Descripción |
|---------|-------------|
| `>oo azure` | Ver mis tareas asignadas |
| `>oo deliver 28999` | Preparar documento de entrega |
| `>oo comment 28999` | Publicar comentario y resolver |
| `>oo subtask 28618` | Crear tarea DEV hija |
| `>oo hours 28999 4` | Actualizar horas trabajadas |

## Workflows Comunes

### Workflow 1: Tarea Azure Completa

```
1. >oo azure              → Ver tareas asignadas
2. >oo deliver 28999      → Preparar documento de entrega
3. (Editar documento en Obsidian)
4. >oo comment 28999      → Publicar y resolver
```

### Workflow 2: Capturar Pensamiento

```
Usuario: "Tengo que revisar el bug 28416 en el gateway"
→ Detecta Azure ID
→ Guarda en inbox/
→ Genera tracking/28416.md
```

### Workflow 3: Daily Summary

```
>oo daily
→ Busca tareas completadas
→ Detecta deploys del día anterior
→ Genera resumen formateado
```

### Workflow 4: Crear Subtarea

```
>oo subtask 28618
→ Crea tarea DEV hija
→ Hereda contexto de HU padre
→ Asigna automáticamente
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
4. Disponible inmediatamente

## Variables de Template

Los templates pueden usar:
- `{{azure_id}}`, `{{version}}`, `{{tag_version}}`
- `{{repositorio}}`, `{{rama}}`
- `{{pr_link}}`, `{{azure_link}}`, `{{wiki_link}}`
- `{{fecha}}`, `{{fecha_generacion}}`
- `{{titulo}}`, `{{titulo_corto}}`

## Troubleshooting

### Azure PAT no funciona

1. Verificar que `.env.local` existe en `mcp-server/`
2. Verificar que el PAT no ha expirado
3. Ejecutar `>oo status` para validar conexión

### RAG no funciona

1. Ejecutar `>oo idx` para indexar
2. Verificar que hay notas en el vault

### Comandos no aparecen

1. Reiniciar opencode
2. Verificar configuración en `~/.config/opencode/opencode.json`

## Referencias

- [Guía de Templates](references/templates-guide.md)
- [Estructura del Vault](references/vault-structure.md)
