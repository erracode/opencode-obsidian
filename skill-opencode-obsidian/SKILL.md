---
name: opencode-obsidian
description: Obsidian vault integration with RAG, note capture, templates, and Azure DevOps workflow. Use when working with vault notes, Azure tasks (28xxx IDs), daily standups, deploy tracking, or document generation. Triggers on mentions of vault, notes, templates, Azure tasks, daily standups, deploy tags, or >oo commands.
---

# opencode-obsidian

Sistema de gestión de conocimiento que transforma notas en entregables estructurados.

## Comandos Disponibles

### Estado y Ayuda
| Comando | Descripcion |
|---------|-------------|
| `>oo status` | Ver configuracion y estado actual |
| `>oo help` | Mostrar ayuda completa |

### Captura y Notas
| Comando | Descripcion |
|---------|-------------|
| `>oo cap "texto"` | Capturar nota (detecta Azure IDs, comandos, tags) |
| `>oo find "query"` | Buscar en vault por contenido |
| `>oo read "path"` | Leer nota especifica |
| `>oo task <id>` | Ver/actualizar tracker de tarea |

### Daily y RAG
| Comando | Descripcion |
|---------|-------------|
| `>oo daily` | Generar resumen para daily standup |
| `>oo idx` | Indexar vault para busqueda semantica |
| `>oo ask "pregunta"` | Preguntar al vault usando RAG |

### Templates y Deploys
| Comando | Descripcion |
|---------|-------------|
| `>oo tpl` | Listar templates disponibles |
| `>oo create <tpl> <id>` | Crear documento desde template |
| `>oo deploy "git tag..."` | Registrar deploy (requiere Azure ID en mensaje) |
| `>oo deploys` | Listar deploys registrados |

### Azure DevOps
| Comando | Descripcion |
|---------|-------------|
| `>oo azure` | Ver tareas asignadas |
| `>oo deliver <id>` | Preparar documento de entrega |
| `>oo comment <id>` | Publicar comentario y resolver tarea |
| `>oo subtask <parent_id>` | Crear tarea DEV hija |
| `>oo hours <id> <h>` | Actualizar horas trabajadas |

## Workflows Principales

### Workflow Azure Completo
```
1. >oo azure              # Ver tareas asignadas
2. >oo deliver 28999      # Generar documento de entrega
3. (Editar documento en Obsidian)
4. >oo comment 28999      # Publicar y resolver
```

### Captura Rapida
```
>oo cap "Implementar feature 28999 para exportar reportes"
```
Genera automaticamente:
- `entregas/28999-*.md` - Template de entrega
- `tracking/28999.md` - Tracker de tarea
- `proyectos/28999-context.md` - Contexto para IA

### Daily Standup
```
>oo daily
```
Genera resumen con: completados, en progreso, deploys, bloqueos.

### Deploy con Validacion
```
>oo deploy "git tag -a v2.8.3 -m '28416 fix OTP'"
```
Formato requerido: Azure ID en el mensaje del tag.

## Deteccion Automatica

El sistema detecta:
- **Azure IDs**: `28416`, `28976` (formato 2xxxx)
- **Git tags**: `git tag -a vX.Y.Z -m "mensaje"`
- **Repositorios**: `CKC-API-GATEWAY`, `CKC_WEBSITE`
- **Comandos tecnicos**: `docker`, `git`, `npm`, etc.

## Estructura del Vault

Ver [README principal](../README.md#vault-structure) para detalles de carpetas.

## Configuracion

### Archivos
```
~/.config/opencode-obsidian/config.json  # Configuracion principal
~/.local/share/opencode-obsidian/lancedb/ # Indice RAG
mcp-server/.env.local                     # Azure PAT
```

### Azure PAT (.env.local)
```bash
AZURE_PAT=tu_personal_access_token
AZURE_ORG=organization
AZURE_PROJECT=Project Name
```

### CLI Setup
```bash
oo-setup setup    # Wizard de configuracion
oo-setup status   # Ver estado actual
```

## Troubleshooting

### Comandos no aparecen
1. Reiniciar opencode
2. Verificar MCP en `~/.config/opencode/opencode.json`

### Azure PAT no funciona
1. Verificar `.env.local` en `mcp-server/`
2. Verificar que PAT no ha expirado
3. Verificar que tiene scopes: **Work Items** (Read, write, & manage) y **Project and Team** (Read)
4. Ejecutar `>oo status` para validar

### Error 401 al obtener tareas
El PAT necesita permisos de **Work Items: Read, write, & manage**.
Obtener token en: `https://dev.azure.com/{org}/_usersSettings/tokens`

### RAG no funciona
1. Ejecutar `>oo idx` para indexar
2. Verificar que hay notas en el vault

## Templates Personalizados

Crear en `vault/templates/mi-template.md`:
```yaml
---
name: mi-template
description: Descripcion del template
triggers: ["keyword1", "keyword2"]
language: es
---
```

Usar placeholders: `{{azure_id}}`, `{{version}}`, `{{fecha}}`, etc.
