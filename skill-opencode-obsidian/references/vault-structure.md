# Estructura Recomendada del Vault

## Organización por Propósito

```
vault/
├── 📁 inbox/              # CAPTURA RÁPIDA
│   └── Notas desordenadas, brain dump
│
├── 📁 entregas/           # DOCUMENTACIÓN FORMAL
│   ├── 28416-gateway-fix.md
│   ├── 28976-otp-bug.md
│   └── [ID]-[descripcion].md
│
├── 📁 tracking/           # SEGUIMIENTO
│   ├── 28416.md           # Un archivo por tarea
│   ├── 28976.md
│   └── [ID].md
│
├── 📁 daily/              # JOURNALING
│   ├── 2024-01-15.md
│   ├── 2024-01-16.md
│   └── [YYYY-MM-DD].md
│
├── 📁 recursos/           # CONOCIMIENTO
│   ├── comandos-git.md
│   ├── docker-snippets.md
│   ├── postgresql-tips.md
│   └── [tema]-[tipo].md
│
├── 📁 proyectos/          # CONTEXTO IA
│   ├── 28416-context.md
│   ├── 28976-context.md
│   └── [ID]-context.md
│
├── 📁 templates/          # TEMPLATES PERSONALIZADOS
│   ├── mi-template.md
│   └── [nombre].md
│
└── 📄 README.md           # ÍNDICE
```

## Convenciones de Nomenclatura

### Archivos con Azure ID
Formato: `[ID]-[slug].md`
Ejemplos:
- `28416-gateway-fix.md`
- `28976-otp-validation.md`
- `28248-notification-feature.md`

### Daily Notes
Formato: `[YYYY-MM-DD].md`
Ejemplos:
- `2024-01-15.md`
- `2024-01-16.md`

### Recursos
Formato: `[categoria]-[tipo].md`
Ejemplos:
- `git-commands.md`
- `docker-snippets.md`
- `postgresql-queries.md`

## Flujo de Datos

```
inbox/ (captura)
    ↓ (procesamiento automático)
    ├──→ entregas/ (si tiene Azure ID)
    ├──→ tracking/ (si tiene Azure ID)
    ├──→ recursos/ (si es comando/técnico)
    └──→ proyectos/ (contexto para IA)
```

## Frontmatter Recomendado

### Para Entregas
```yaml
---
azure_id: "28416"
template: "azure-delivery"
status: "draft" | "review" | "approved"
created_at: "2024-01-15T10:30:00Z"
---
```

### Para Tracking
```yaml
---
azure_id: "28416"
status: "🔴 LAB" | "🟡 STG" | "🟢 PROD"
tag_version: "v2.8.3"
created_at: "2024-01-15T10:30:00Z"
updated_at: "2024-01-16T14:20:00Z"
---
```

### Para Recursos
```yaml
---
category: "git" | "docker" | "database"
type: "command" | "snippet" | "guide"
tags: ["tag1", "tag2"]
created_at: "2024-01-15"
---
```

### Para Daily Notes
```yaml
---
date: "2024-01-15"
type: "daily"
---
```

## Mejores Prácticas

1. **Inbox = Temporal**: Las notas en inbox deben procesarse y moverse
2. **Un ID, un tracker**: Cada Azure ID tiene solo un archivo en tracking/
3. **Daily notes automáticos**: No crear manualmente, usar `obsidian_get_daily_summary`
4. **Tags consistentes**: Usar los mismos tags que en Azure (CKC-XXX)
5. **Enlaces bidireccionales**: Usar `[[nota-relacionada]]` para conectar ideas

## Personalización

Puedes ajustar esta estructura según tus necesidades:
- Añadir carpetas adicionales (ej: `archived/`, `meetings/`)
- Cambiar nombres (ej: `tickets/` en vez de `tracking/`)
- Crear subcarpetas (ej: `recursos/git/`, `recursos/docker/`)

El sistema MCP se adaptará automáticamente.
