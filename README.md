# opencode-obsidian

Multi-workspace Obsidian Vault integration with local RAG capabilities and Azure DevOps tracking for personal knowledge management.

## Features

- **Multi-workspace support**: Separate vault structures for work (sundevs) and personal projects
- **Local RAG**: Semantic search using LanceDB and transformers.js (local embeddings)
- **Azure DevOps integration**: Track work items, generate delivery documents
- **Custom templates**: Template engine for standardized documentation
- **Smart note capture**: Automatic categorization and organization
- **Daily standup**: Generate daily summaries automatically

## Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/erracode/opencode-obsidian.git
cd opencode-obsidian/mcp-server

# Install dependencies
npm install

# Build the project
npm run build
```

### Setup

Run the interactive setup wizard:

```bash
# Using npx
npx oo-setup setup

# Or using the compiled binary
npm run setup
```

The wizard will ask you:
1. Workspace name (sundevs, personal, or custom)
2. Vault path (where your Obsidian vault is located)
3. Azure DevOps configuration (optional)
4. Set as default workspace

### Configure in opencode

Add to your `~/.config/opencode/opencode.json`:

```json
{
  "mcp": {
    "opencode-obsidian": {
      "type": "local",
      "command": ["node", "ruta/al/proyecto/mcp-server/dist/index.js"],
      "enabled": true
    }
  }
}
```

## Available Commands

### Note Management
- `>oo cap "text"` - Capture a note (auto-categorizes)
- `>oo note "text"` - Save note linked to active task
- `>oo find "query"` - Search vault by content
- `>oo read "path"` - Read a specific note

### Daily & RAG
- `>oo daily` - Generate daily standup summary
- `>oo today` - Generate daily summary (default: yesterday)
- `>oo idx` - Index vault for semantic search
- `>oo ask "question"` - Ask vault using RAG

### Task Management
- `>oo task <id>` - View/update task tracker
- `>oo take <id>` - Take a task with context
- `>oo active` - List all active tasks
- `>oo deliver <id>` - Generate delivery summary

### Templates
- `>oo tpl` - List available templates
- `>oo create <template> <id>` - Generate from template

### Azure DevOps
- `>oo azure` - Get assigned work items
- `>oo deploy "git tag..."` - Register deploy

### Configuration
- `>oo status` - Show current configuration
- `>oo help` - Show help

## Vault Structure

Each workspace has its own complete structure:

```
vault/
├── workspaces/
│   ├── sundevs/
│   │   ├── inbox/           # New notes awaiting organization
│   │   ├── entregas/        # Delivery documents
│   │   ├── tracking/        # Task trackers (ID.md)
│   │   ├── daily/           # Daily notes (YYYY-MM-DD.md)
│   │   ├── recursos/        # Technical resources & learnings
│   │   ├── proyectos/       # Project context notes
│   │   ├── templates/       # Custom templates
│   │   └── shared/          # Cross-workspace notes
│   └── personal/
│       └── (same structure)
└── shared/                  # Shared resources
```

## Templates

### Azure Delivery Template

The `azure-delivery` template generates comprehensive delivery documentation:

```markdown
# 🎉 [Tipo: FEATURE / BUGFIX / REFACTOR] - [Título Breve y Específico]

## 1. Contexto y Objetivo 🎯
- **Problema Resuelto / Valor Agregado:** ...
- **Comportamiento Anterior:** ...
- **Comportamiento Esperado:** ...

## 2. Decisión de Diseño y Justificación 💡
> *Esta sección justifica la elección técnica*
- **Solución Técnica Clave:** ...
- **Trade-offs (Ventajas/Desventajas):**
    - ✅ **Ventaja Principal:** ...
    - ❌ **Riesgo/Impacto Aceptado:** ...

## 3. Implementación y Trazabilidad 🔧
- **Repositorio(s) Afectado(s):** ...
- **Rama Desarrollo:** `feature/XXXXX`
- **Pull Request (PR):** [LINK]
- **Archivos Clave Modificados:** ...

## 4. Testing y Validación QA 🧪
### Deploy de Laboratorio
- [LINK de Deploy/Lab]

### Pasos Críticos de Validación
- [ ] Caso 1: Flujo Éxito
- [ ] Caso 2: Backward Compatibility
- [ ] Caso 3: Error Controlado

## 5. Monitoreo y Tracking 📈
- [ ] Verificación de Ambiente
- [ ] Métricas de Éxito

## 6. Documentación y Release 🚀
### Estatus de Despliegue
- [ ] Desarrollo/Laboratorio (LAB)
- [ ] Staging/QA
- [ ] Producción (PROD)

### Trazabilidad del Release
- **Versión de Release (Tag):** `vX.X.X`
- **Fecha Estimada de Prod:** [FECHA]
- **Link/Tag del Deploy:** [LINK]

### Alcance y Notas
- **Wiki de Feature:** [LINK]
- **Criticidad:** 🟡 Media / 🟢 Low / 🔴 High
- **Backward Compatible:** Yes / No
```

### Compressed Tracker Template

For quick Azure comments, use this compact format:

```markdown
## [ID] - [Título Corto] #[Tipo-Tarea]
- **Estado:** [🔴 LAB / 🟡 STG / 🟢 PROD] | **QA:** [✅ Revisado / ⏳ Pendiente] | **Cerrado:** [🏁 Sí / 🚧 No]
- **Repo:** `[Nombre]` | **Rama:** `[Nombre]` | **Tag:** `[vX.X.X / Pending]`
- **Links:** [🎫 Azure](URL) | [🚀 PR](URL) | [📄 Docs](URL_WIKI)
- **Fecha:** [DD/MM/AAAA]
- **Nota:** [Resumen de 1 frase sobre el impacto del cambio]
```

## Configuration

### Config Location

Config is stored in: `~/.config/opencode-obsidian/config.json`

```json
{
  "version": "2.0.0",
  "vault": {
    "path": "/path/to/your/vault",
    "lastAccessed": "2024-01-01T00:00:00.000Z"
  },
  "workspaces": [
    {
      "name": "sundevs",
      "azure": {
        "organization": "cinemarkintl",
        "project": "Core Backend",
        "patLast4": "abcd"
      },
      "default": true
    },
    {
      "name": "personal"
    }
  ]
}
```

### Azure PAT

Set Azure PAT in `~/.config/opencode-obsidian/.env.local`:

```bash
AZURE_PAT=your_personal_access_token
AZURE_ORG=organization
AZURE_PROJECT=Project Name
```

## Troubleshooting

### RAG not working
1. Run `>oo idx` to index the vault
2. Ensure templates are in `vault/templates/`
3. Check that vault path is correct

### Azure PAT errors
1. Verify PAT has scopes: **Work Items** (Read, write, & manage) and **Project and Team** (Read)
2. Check PAT hasn't expired
3. Run `>oo status` to validate

### Commands not appearing
1. Restart opencode
2. Verify MCP config in `~/.config/opencode/opencode.json`

## Architecture

```
mcp-server/
├── src/cli/       # CLI commands
├── src/core/      # RAG, config, vault, workspace
├── src/azure/     # Azure DevOps integration
└── dist/          # Compiled output
```

Technologies: LanceDB, Transformers.js, MCP SDK

## License

ISC
