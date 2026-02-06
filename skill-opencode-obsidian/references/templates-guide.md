# Guía de Templates

## ¿Qué es un Template?

Un template es un archivo markdown con placeholders (variables) que se pueden reemplazar dinámicamente al aplicarse a una nota.

## Estructura de un Template

```markdown
---
name: nombre-del-template
description: Descripción de qué hace este template
triggers: ["keyword1", "keyword2", "keyword3"]
language: es
---

# Título del Documento

Contenido con {{variables}} que serán reemplazadas.

## Sección
{{contenido_seccion}}
```

## Campos del Frontmatter

- **name**: Nombre único del template (usado para aplicarlo)
- **description**: Descripción legible del propósito
- **triggers**: Array de palabras clave que activan la sugerencia automática
- **language**: Idioma principal ('es' o 'en')

## Variables Disponibles

### Automáticas (siempre disponibles)
- `{{fecha}}` - Fecha actual (formato local)
- `{{fecha_generacion}}` - Fecha/hora ISO
- `{{titulo}}` - Primera línea del contenido (60 chars)
- `{{titulo_corto}}` - Primera línea (30 chars)

### Detectadas del contenido
- `{{azure_id}}` - Primer ID de Azure encontrado
- `{{azure_ids}}` - Todos los IDs separados por coma
- `{{version}}` - Primera versión semántica (vX.Y.Z)
- `{{tag_version}}` - Alias de version
- `{{repositorio}}` - Primer repo CKC encontrado
- `{{repositorios}}` - Todos los repos separados por coma
- `{{pr_link}}` - URL de PR (detectada automáticamente)
- `{{azure_link}}` - URL de Azure DevOps
- `{{wiki_link}}` - URL de wiki/documentación

### Personalizadas
Puedes usar cualquier variable que definas al aplicar el template.

## Crear un Nuevo Template

### Opción 1: Manual (Archivo)
1. Crear archivo en `vault/templates/mi-template.md`
2. Añadir frontmatter con metadatos
3. Escribir contenido con placeholders
4. Guardar - disponible inmediatamente

### Opción 2: Vía Chat
Pedir a Claude: "Crear template para X" y describir:
- Nombre
- Propósito
- Secciones necesarias
- Variables especiales

## Ejemplo Práctico

Template para documentar comandos útiles:

```markdown
---
name: command-snippet
description: Documentar un comando técnico útil
triggers: ["comando", "command", "snippet", "terminal"]
language: es
---

# {{titulo}}

## Comando
```bash
{{comando}}
```

## Descripción
{{descripcion}}

## Uso
{{uso}}

## Contexto
- Fecha: {{fecha}}
- Tags: {{tags}}
```

Al aplicar:
```
obsidian_apply_template
- note_path: "inbox/comando-git.md"
- template: "command-snippet"
- variables: {
    "comando": "git rebase -i HEAD~3",
    "descripcion": "Rebase interactivo para los últimos 3 commits",
    "uso": "Cuando necesitas reorganizar commits antes de push",
    "tags": "git, rebase, workflow"
  }
```

## Tips

1. **Usa triggers descriptivos**: Ayudan al sistema a sugerir el template
2. **Variables opcionales**: Si una variable no existe, se deja vacía
3. **Markdown completo**: Puedes usar toda la sintaxis de markdown
4. **Secciones condicionales**: Usa comentarios HTML para secciones opcionales

## Templates del Sistema

Los 7 templates base no deben modificarse directamente. Para personalizar:
1. Copiar a `vault/templates/`
2. Renombrar (ej: `mi-azure-delivery.md`)
3. Modificar según necesidades
